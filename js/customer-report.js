/* customer-report.js — Customer Report page logic.
   Tabs: All Customers | Top 10 by Credit | Cash Purchases | Credit Purchases
   Filtered by date range (applies only to order-based tabs: Cash & Credit).
   Firebase phase: OrderService and CustomerService will call Firestore REST endpoints. */
App.init(async () => {
  const esc = App.esc, money = App.money;
  const $ = s => document.querySelector(s);

  /* ── Load data ── */
  let customers = [], allOrders = [], filteredOrders = [];
  async function loadData() {
    [customers, allOrders] = await Promise.all([CustomerService.list(), OrderService.list()]);
    filteredOrders = allOrders;
  }

  /* ── Date filter ── */
  const applyDateFilter = () => {
    const from = $('#date-from').value, to = $('#date-to').value;
    if (!from && !to) { filteredOrders = allOrders; return; }
    const f = from ? new Date(from).getTime() : 0;
    const t = to   ? new Date(to + 'T23:59:59').getTime() : Infinity;
    filteredOrders = allOrders.filter(o => {
      const d = new Date(o.CreatedAt).getTime();
      return d >= f && d <= t;
    });
  };

  /* ── Tab switching ── */
  document.querySelectorAll('.rtab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rtab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.report-panel').forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
    });
  });

  /* ── Render: All Customers ── */
  const renderAll = () => {
    $('#all-count').textContent = `${customers.length} customers`;
    $('#all-body').innerHTML = customers.length
      ? customers.map(c => `<tr>
          <td>${esc(c.ID)}</td>
          <td><strong>${esc(c.Name)}</strong></td>
          <td>${esc(c.Email)}</td>
          <td>${esc(c.Mobile)}</td>
          <td class="num">${money(c.CreditLimit)}</td>
        </tr>`).join('')
      : `<tr><td colspan="5" class="state">No customers found.</td></tr>`;
  };

  /* ── Render: Top 10 by Credit Limit (from date filter — not date-dependent, always all) ── */
  const renderTop10 = () => {
    const top = [...customers].sort((a, b) => b.CreditLimit - a.CreditLimit).slice(0, 10);
    $('#top10-body').innerHTML = top.length
      ? top.map((c, i) => `<tr>
          <td><b>#${i + 1}</b></td>
          <td>${esc(c.ID)}</td>
          <td><strong>${esc(c.Name)}</strong></td>
          <td>${esc(c.Email)}</td>
          <td class="num">${money(c.CreditLimit)}</td>
        </tr>`).join('')
      : `<tr><td colspan="5" class="state">No customers found.</td></tr>`;
  };

  /* ── Render: Cash Purchase orders ── */
  const renderCash = () => {
    const cashOrders = filteredOrders.filter(o => o.PaymentMethod === 'Cash');
    const total = cashOrders.reduce((s, o) => s + Number(o.Total || 0), 0);
    $('#cash-total').textContent = `Total: ${money(total)}`;
    $('#cash-body').innerHTML = cashOrders.length
      ? cashOrders.map(o => `<tr>
          <td><b>${esc(o.ID)}</b></td>
          <td>${esc(o.CustomerName)}<small>${esc(o.CustomerEmail)}</small></td>
          <td>${new Date(o.CreatedAt).toLocaleDateString()}</td>
          <td class="num">${(o.Items || []).reduce((n, i) => n + Number(i.Quantity), 0)}</td>
          <td class="num">${money(o.Total)}</td>
          <td><span class="badge blue">${esc(o.OrderStatus)}</span></td>
        </tr>`).join('')
      : `<tr><td colspan="6" class="state">No cash orders in this date range.</td></tr>`;
  };

  /* ── Render: Credit Purchase orders ── */
  const renderCredit = () => {
    const creditOrders = filteredOrders.filter(o => o.PaymentMethod === 'Credit');
    const total = creditOrders.reduce((s, o) => s + Number(o.Total || 0), 0);
    $('#credit-total').textContent = `Total: ${money(total)}`;
    $('#credit-body').innerHTML = creditOrders.length
      ? creditOrders.map(o => `<tr>
          <td><b>${esc(o.ID)}</b></td>
          <td>${esc(o.CustomerName)}<small>${esc(o.CustomerEmail)}</small></td>
          <td>${new Date(o.CreatedAt).toLocaleDateString()}</td>
          <td class="num">${(o.Items || []).reduce((n, i) => n + Number(i.Quantity), 0)}</td>
          <td class="num">${money(o.Total)}</td>
          <td><span class="${o.PaymentStatus === 'Paid' ? 'badge in' : 'badge warn'}">${esc(o.PaymentStatus)}</span></td>
          <td><span class="badge blue">${esc(o.OrderStatus)}</span></td>
        </tr>`).join('')
      : `<tr><td colspan="7" class="state">No credit orders in this date range.</td></tr>`;
  };

  const renderAll4 = () => { renderAll(); renderTop10(); renderCash(); renderCredit(); };

  /* ── Filter button handlers ── */
  $('#apply-filter').addEventListener('click', () => { applyDateFilter(); renderAll4(); });
  $('#clear-filter').addEventListener('click', () => {
    $('#date-from').value = ''; $('#date-to').value = '';
    filteredOrders = allOrders; renderAll4();
  });

  /* ── Init ── */
  await loadData();
  renderAll4();
});
