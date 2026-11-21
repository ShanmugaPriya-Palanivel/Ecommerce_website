/* admin-orders.js — Order list with detail view, status update, payment mark-paid.
   Firebase phase: replace Api calls with OrderService (which wraps Firestore REST).
   Postman: PATCH /documents/orders/{id} with Bearer token + updated fields. */
(function () {
  App.init(async () => {
    const esc = App.esc, money = App.money;
    const body    = document.getElementById('orders-body');
    const search  = document.getElementById('order-search');
    const statusF = document.getElementById('order-status');
    const payF    = document.getElementById('order-payment');

    /* ── Render table ── */
    const render = async () => {
      const list = await OrderService.list();
      const q  = search.value.trim().toLowerCase();
      const st = statusF.value;
      const py = payF ? payF.value : '';
      const filtered = list.filter(o =>
        (!q  || `${o.ID} ${o.CustomerName} ${o.CustomerEmail}`.toLowerCase().includes(q)) &&
        (!st || o.OrderStatus    === st) &&
        (!py || o.PaymentMethod  === py)
      );
      body.innerHTML = filtered.length ? filtered.map(o => `
        <tr>
          <td><b>${esc(o.ID)}</b></td>
          <td>${esc(o.CustomerName)}<small>${esc(o.CustomerEmail)}</small></td>
          <td>${new Date(o.CreatedAt).toLocaleString()}</td>
          <td>${(o.Items || []).reduce((n, i) => n + Number(i.Quantity), 0)}</td>
          <td class="num">${money(o.Total)}</td>
          <td>${esc(o.PaymentMethod)}<small class="${o.PaymentStatus === 'Paid' ? 'text-ok' : 'text-warn'}">${esc(o.PaymentStatus)}</small></td>
          <td>
            <select class="status-sel" data-id="${esc(o.ID)}" data-type="order" aria-label="Order status">
              ${['Placed','Processing','Shipped','Delivered','Cancelled'].map(s =>
                `<option${s === o.OrderStatus ? ' selected' : ''}>${s}</option>`).join('')}
            </select>
          </td>
          <td class="actions">
            ${o.PaymentMethod === 'Credit' && o.PaymentStatus !== 'Paid'
              ? `<button class="btn btn-ghost btn-sm" data-pay="${esc(o.ID)}">Mark Paid</button>` : ''}
            <button class="btn btn-primary btn-sm" data-view="${esc(o.ID)}">${App.icon('eye',14)} View</button>
          </td>
        </tr>`).join('')
        : `<tr><td colspan="8" class="state">No orders found.</td></tr>`;
    };

    /* ── Detail modal ── */
    const viewOrder = async (id) => {
      const o = await OrderService.get(id);
      if (!o) { App.toast('Order not found.', 'error'); return; }
      const d = o.Delivery || {};
      const itemsHtml = (o.Items || []).map(i =>
        `<tr><td>${esc(i.Title)} <small>${esc(i.ID)}</small></td>
         <td class="num">${i.Quantity}</td>
         <td class="num">${money(i.Price)}</td>
         <td class="num">${money(i.Price * i.Quantity)}</td></tr>`
      ).join('');
      App.modal(`
        <h3>Order — ${esc(o.ID)}</h3>
        <dl class="detail">
          <dt>Customer</dt><dd>${esc(o.CustomerName)} (${esc(o.CustomerEmail)})</dd>
          <dt>Date</dt><dd>${new Date(o.CreatedAt).toLocaleString()}</dd>
          <dt>Delivery</dt><dd>${esc(d.address || '')}, ${esc(d.city || '')}, ${esc(d.state || '')} ${esc(d.postal || '')}, ${esc(d.country || '')}</dd>
          <dt>Payment</dt><dd>${esc(o.PaymentMethod)} — <b class="${o.PaymentStatus === 'Paid' ? 'text-ok' : 'text-warn'}">${esc(o.PaymentStatus)}</b></dd>
          <dt>Order Status</dt><dd><span class="badge blue">${esc(o.OrderStatus)}</span></dd>
        </dl>
        <div class="table-wrap" style="margin-top:1rem">
          <table>
            <thead><tr><th>Product</th><th class="num">Qty</th><th class="num">Unit Price</th><th class="num">Total</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr><td colspan="3"><b>Grand Total</b></td><td class="num"><b>${money(o.Total)}</b></td></tr>
            </tfoot>
          </table>
        </div>
        <div class="actions" style="margin-top:1rem">
          <button class="btn btn-ghost" data-close>Close</button>
        </div>`);
    };

    /* ── Event listeners ── */
    search.addEventListener('input', render);
    statusF.addEventListener('change', render);
    if (payF) payF.addEventListener('change', render);

    /* Status dropdown change */
    body.addEventListener('change', async (e) => {
      const sel = e.target.closest('.status-sel[data-type="order"]');
      if (!sel) return;
      try {
        await OrderService.updateStatus(sel.dataset.id, sel.value);
        App.toast(`Order status updated to "${sel.value}".`);
        await render();
      } catch (err) { App.toast(err.message, 'error'); await render(); }
    });

    /* Mark Paid + View buttons */
    body.addEventListener('click', async (e) => {
      const pay  = e.target.closest('[data-pay]');
      const view = e.target.closest('[data-view]');
      if (pay) {
        if (!await App.confirm('Mark as Paid', `Mark order ${pay.dataset.pay} credit payment as Paid?`, 'Mark Paid')) return;
        try {
          await OrderService.updatePayment(pay.dataset.pay, 'Paid');
          App.toast('Payment marked as Paid.');
          await render();
        } catch (err) { App.toast(err.message, 'error'); }
      } else if (view) {
        await viewOrder(view.dataset.view);
      }
    });

    await render();
  });
})();