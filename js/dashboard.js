/* Dashboard: every figure is calculated from the stored records. */
App.init(async () => {
  const $ = (s) => document.querySelector(s), esc = App.esc;
  const [cats, prods, custs, log, orders] = await Promise.all([
    CategoryService.list(), ProductService.list(), CustomerService.list(),
    ProductService.activity(6), OrderService.list()
  ]);

  /* ── Inventory stats ── */
  const qty    = prods.reduce((s, p) => s + p.Quantity, 0);
  const out    = prods.filter((p) => p.Quantity <= 0).length;
  const low    = prods.filter((p) => p.Quantity > 0 && p.Quantity <= App.config.lowStock).length;
  const inStock = prods.length - out - low;

  /* ── Order stats ── */
  const totalOrders   = orders.length;
  const totalRevenue  = orders.reduce((s, o) => s + Number(o.Total || 0), 0);
  const pendingCredit = orders.filter(o => o.PaymentMethod === 'Credit' && o.PaymentStatus !== 'Paid')
                              .reduce((s, o) => s + Number(o.Total || 0), 0);

  /* ── Stat cards ── */
  const card = (cls, icon, n, label) =>
    `<div class="card stat ${cls}"><div class="ic">${App.icon(icon, 22)}</div><div><b>${n}</b><span>${label}</span></div></div>`;
  $('#stats').innerHTML =
    card('', 'box',    prods.length,                        'Total products') +
    card('', 'tag',    cats.length,                         'Total categories') +
    card('', 'users',  custs.length,                        'Total customers') +
    card('', 'layers', qty.toLocaleString(),                'Total inventory qty') +
    card('', 'layers', totalOrders,                         'Total orders') +
    card('ok','card',  App.money(totalRevenue),             'Total revenue') +
    card('warn','alert', low,                               'Low-stock products') +
    card('bad','x',    out,                                 'Out-of-stock products') +
    card('warn','card', App.money(pendingCredit),           'Pending credit payments');

  /* ── Stock by category bar chart ── */
  const per = cats.map((c) => ({ name: c.Name, q: prods.filter((p) => p.Cat_ID === c.ID).reduce((s, p) => s + p.Quantity, 0) }));
  const max = Math.max(1, ...per.map((x) => x.q));
  $('#cat-chart').innerHTML = per.length
    ? per.map((x) => `<div class="bar-row"><span>${esc(x.name)}</span><div class="bar"><i style="width:${(x.q / max) * 100}%"></i></div><b>${x.q}</b></div>`).join('')
    : '<p class="state">No categories yet.</p>';

  /* ── Donut chart ── */
  const t = Math.max(1, prods.length), a = (inStock / t) * 100, b = a + (low / t) * 100;
  const d = $('#donut'); d.dataset.total = prods.length;
  d.style.background = `conic-gradient(#16a34a 0 ${a}%, #f59e0b ${a}% ${b}%, #ef4444 ${b}% 100%)`;
  $('#legend').innerHTML =
    `<li><i style="background:#16a34a"></i>In stock: <b>${inStock}</b></li>` +
    `<li><i style="background:#f59e0b"></i>Low stock (≤${App.config.lowStock}): <b>${low}</b></li>` +
    `<li><i style="background:#ef4444"></i>Out of stock: <b>${out}</b></li>`;

  /* ── Recent products table ── */
  const names = Object.fromEntries(cats.map((c) => [c.ID, c.Name]));
  $('#recent-products').innerHTML = prods.slice().sort((x, y) => Api.byId(y, x)).slice(0, 5).map((p) => {
    const s = App.stockStatus(p.Quantity);
    return `<tr><td><div class="cell">${App.img(p.Image, p.Title)}<div>${esc(p.Title)}<small>${esc(p.ID)}</small></div></div></td>
      <td>${esc(names[p.Cat_ID] || '—')}</td><td class="num">${p.Quantity}</td>
      <td class="num">${App.money(p.Price)}</td><td><span class="badge ${s.key}">${s.label}</span></td></tr>`;
  }).join('') || '<tr><td colspan="5" class="state">No products yet.</td></tr>';

  /* ── Recent customers ── */
  $('#recent-customers').innerHTML = custs.slice().sort((x, y) => Api.byId(y, x)).slice(0, 5)
    .map((c) => `<li><span>${esc(c.Name)}<small>${esc(c.Email)}</small></span><b>${App.money(c.CreditLimit)}</b></li>`).join('')
    || '<li class="state">No customers yet.</li>';

  /* ── Recent orders ── */
  $('#recent-orders').innerHTML = orders.slice(0, 5).map(o =>
    `<li><span>${esc(o.ID)}<small>${esc(o.CustomerName)} · ${new Date(o.CreatedAt).toLocaleDateString()}</small></span><b>${App.money(o.Total)}</b></li>`
  ).join('') || '<li class="state">No orders yet.</li>';

  /* ── Inventory activity log ── */
  $('#activity').innerHTML = log.map((l) =>
    `<li><span>${esc(l.action)}: ${esc(l.title)}<small>${esc(l.detail)}</small></span><small>${App.fmtDate(l.time)}</small></li>`
  ).join('') || '<li class="state">No activity yet.</li>';

  /* ── Reset data ── */
  $('#reset-data').addEventListener('click', async () => {
    if (!await App.confirm('Reset sample data', 'This replaces all categories, products, customers, orders and activity with the original sample data.', 'Reset')) return;
    await Api.reset(); App.flash('Sample data has been reset.'); location.reload();
  });

  $('#import-firebase-data').addEventListener('click', async () => {
    if (!await App.confirm(
      'Import seed data',
      'This imports categories, products, customers, orders and inventory activity into the configured Firebase project.',
      'Import'
    )) return;
    try {
      const result = await FirebaseSeedService.importAll();
      const total = Object.values(result).reduce((sum, count) => sum + count, 0);
      App.toast(`Imported ${total} Firestore documents.`);
      location.reload();
    } catch (error) {
      App.toast(error.message, 'error');
    }
  });
});
