App.init(async () => {
  const $ = (s) => document.querySelector(s), esc = App.esc, money = App.money;
  const [products, categories] = await Promise.all([ProductService.list(), CategoryService.list()]);
  const names = Object.fromEntries(categories.map((c) => [c.ID, c.Name]));
  const status = (p) => p.Active === false ? 'inactive' : (p.Quantity <= 0 ? 'out' : (p.Quantity < 15 ? 'low' : 'in'));
  const row = (p) => `<tr><td>${App.img(p.Image, p.Title)} ${esc(p.Title)}</td><td>${esc(p.ID)}</td><td>${esc(names[p.Cat_ID] || 'Unknown')}</td><td class="num">${p.Quantity}</td><td class="num">${money(p.Price)}</td><td><span class="badge ${status(p)}">${status(p)}</span></td></tr>`;
  const render = () => {
    const q = ($('#stock-search').value || '').toLowerCase(), cat = $('#stock-cat').value, filter = $('#stock-status').value;
    const list = products.filter((p) => (!q || `${p.ID} ${p.Title}`.toLowerCase().includes(q)) && (!cat || p.Cat_ID === cat) && (!filter || status(p) === filter));
    $('#all-stock-count').textContent = `${list.length} products`;
    $('#all-stock-body').innerHTML = list.map(row).join('') || '<tr><td colspan="6" class="state">No products found.</td></tr>';
  };
  $('#stock-cat').insertAdjacentHTML('beforeend', categories.map((c) => `<option value="${esc(c.ID)}">${esc(c.Name)}</option>`).join(''));
  $('#stock-search').addEventListener('input', render); $('#stock-cat').addEventListener('change', render); $('#stock-status').addEventListener('change', render);
  const high = products.filter((p) => p.Quantity > 100), low = products.filter((p) => p.Quantity > 0 && p.Quantity < 15);
  $('#inv-stats').innerHTML = `<div class="card stat"><div><b>${products.length}</b><span>Products</span></div></div><div class="card stat"><div><b>${products.reduce((s,p)=>s+p.Quantity,0)}</b><span>Total units</span></div></div><div class="card stat warn"><div><b>${high.length}</b><span>High stock</span></div></div><div class="card stat bad"><div><b>${low.length}</b><span>Low stock</span></div></div>`;
  $('#cat-wise-body').innerHTML = categories.map((c) => { const rows = products.filter((p) => p.Cat_ID === c.ID); return `<tr><td>${esc(c.Name)}</td><td class="num">${rows.length}</td><td class="num">${rows.reduce((s,p)=>s+p.Quantity,0)}</td><td class="num">${money(rows.reduce((s,p)=>s+p.Quantity*p.Price,0))}</td></tr>`; }).join('');
  $('#high-count').textContent = `${high.length} products`; $('#high-stock-body').innerHTML = high.map((p) => `<tr><td>${esc(p.Title)}</td><td>${esc(names[p.Cat_ID] || 'Unknown')}</td><td class="num">${p.Quantity}</td><td class="num">${money(p.Price)}</td></tr>`).join('') || '<tr><td colspan="4" class="state">None.</td></tr>';
  $('#low-count').textContent = `${low.length} products`; $('#low-stock-body').innerHTML = low.map((p) => `<tr><td>${esc(p.Title)}</td><td>${esc(names[p.Cat_ID] || 'Unknown')}</td><td class="num">${p.Quantity}</td><td class="num">${money(p.Price)}</td><td><span class="badge warn">Reorder</span></td></tr>`).join('') || '<tr><td colspan="5" class="state">None.</td></tr>';
  document.querySelectorAll('.rtab').forEach((b) => b.addEventListener('click', () => { document.querySelectorAll('.rtab').forEach((x) => x.classList.remove('active')); document.querySelectorAll('.report-panel').forEach((x) => x.classList.add('hidden')); b.classList.add('active'); document.getElementById('tab-' + b.dataset.tab).classList.remove('hidden'); }));
  render();
});
