App.init(async () => {
  const $ = (s) => document.querySelector(s), esc = App.esc, money = App.money;
  let all = await OrderService.list(), filtered = all;
  const apply = () => {
    const from = $('#date-from').value ? new Date($('#date-from').value).getTime() : 0;
    const to = $('#date-to').value ? new Date($('#date-to').value + 'T23:59:59').getTime() : Infinity;
    filtered = all.filter((o) => new Date(o.CreatedAt).getTime() >= from && new Date(o.CreatedAt).getTime() <= to);
    $('#sales-total').textContent = money(OrderService.totalRevenue(filtered));
    $('#sales-count').textContent = filtered.length;
    const rows = OrderService.topItems(filtered, 10);
    $('#sales-body').innerHTML = rows.map((r) => `<tr><td>${esc(r.ID)}</td><td>${esc(r.Title)}</td><td class="num">${r.TotalQty}</td><td class="num">${money(r.TotalRevenue)}</td></tr>`).join('') || '<tr><td colspan="4" class="state">No sales in this date range.</td></tr>';
    const payments = OrderService.groupByPayment(filtered);
    $('#payment-body').innerHTML = Object.entries(payments).map(([k, v]) => `<tr><td>${k}</td><td class="num">${v.orders.length}</td><td class="num">${money(v.revenue)}</td></tr>`).join('');
  };
  $('#apply-filter').onclick = apply; $('#clear-filter').onclick = () => { $('#date-from').value = ''; $('#date-to').value = ''; apply(); };
  await apply();
});
