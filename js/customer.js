/* Customer list + form pages. */
(function () {
  const $ = (s) => document.querySelector(s), esc = App.esc;

  if ($('#customer-rows')) App.init(async () => {
    let list = [];
    const body = $('#customer-rows'), search = $('#search');
    function render() {
      const q = search.value.trim().toLowerCase();
      const rows = list.filter((c) => !q || `${c.ID} ${c.Name} ${c.Email} ${c.Mobile}`.toLowerCase().includes(q));
      $('#result-count').textContent = `${rows.length} customer${rows.length === 1 ? '' : 's'}`;
      body.innerHTML = rows.length ? rows.map((c) => `<tr><td>${esc(c.ID)}</td><td><strong>${esc(c.Name)}</strong></td><td>${esc(c.Email)}</td><td>${esc(c.Mobile)}</td><td class="num">${App.money(c.CreditLimit)}</td>
        <td class="actions"><button class="btn btn-ghost btn-sm" type="button" data-view="${esc(c.ID)}">${App.icon('eye', 14)} View</button>
        <a class="btn btn-ghost btn-sm" href="customer-form.html?id=${encodeURIComponent(c.ID)}">${App.icon('edit', 14)} Edit</a>
        <button class="btn btn-danger btn-sm" type="button" data-del="${esc(c.ID)}">${App.icon('trash', 14)} Delete</button></td></tr>`).join('')
        : `<tr><td colspan="6" class="state">${q ? 'No customers match your search.' : 'No customers yet. Add your first customer.'}</td></tr>`;
    }
    async function load() {
      body.innerHTML = '<tr><td colspan="6" class="state">Loading…</td></tr>';
      try { list = await CustomerService.list(); render(); } catch (e) { body.innerHTML = `<tr><td colspan="6" class="state error">${esc(e.message)}</td></tr>`; }
    }
    search.addEventListener('input', App.debounce(render, 150));
    body.addEventListener('click', async (e) => {
      const v = e.target.closest('[data-view]'), d = e.target.closest('[data-del]');
      if (v) {
        const c = list.find((x) => x.ID === v.dataset.view);
        App.modal(`<h3>${esc(c.Name)}</h3><dl class="detail"><dt>ID</dt><dd>${esc(c.ID)}</dd><dt>Email</dt><dd>${esc(c.Email)}</dd><dt>Mobile</dt><dd>${esc(c.Mobile)}</dd><dt>Credit limit</dt><dd>${App.money(c.CreditLimit)}</dd></dl>
          <div class="actions"><button class="btn btn-ghost" data-close>Close</button><a class="btn btn-ghost" href="../credit/credit-management.html?id=${encodeURIComponent(c.ID)}">Manage credit</a><a class="btn btn-primary" href="customer-form.html?id=${encodeURIComponent(c.ID)}">Edit</a></div>`);
      } else if (d) {
        const c = list.find((x) => x.ID === d.dataset.del);
        if (!await App.confirm('Delete customer', `Delete ${c.Name} (${c.ID})? This cannot be undone.`)) return;
        try { await CustomerService.remove(c.ID); App.toast('Customer deleted.'); await load(); } catch (err) { App.toast(err.message, 'error'); }
      }
    });
    await load();
  });

  if ($('#customer-form')) App.init(async () => {
    const f = $('#customer-form'), el = f.elements, id = App.params.get('id');
    if (id) {
      const c = await CustomerService.get(id);
      if (!c) { f.hidden = true; $('#form-state').hidden = false; return; }
      $('#form-title').textContent = 'Edit customer';
      el.ID.value = c.ID; el.Name.value = c.Name; el.Email.value = c.Email; el.Mobile.value = c.Mobile; el.CreditLimit.value = c.CreditLimit;
    } else { el.ID.value = await CustomerService.nextId(); el.CreditLimit.value = 0; }
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errs = {
        Name: V.required(el.Name.value, 'Name') || (el.Name.value.trim().length < 2 ? 'Name must be at least 2 characters.' : ''),
        Email: V.required(el.Email.value, 'Email') || V.email(el.Email.value),
        Mobile: V.required(el.Mobile.value, 'Mobile') || V.mobile(el.Mobile.value),
        CreditLimit: V.num(el.CreditLimit.value, 'Credit limit')
      };
      if (!V.showErrors(f, errs)) return;
      const data = { Name: el.Name.value, Email: el.Email.value, Mobile: el.Mobile.value, CreditLimit: el.CreditLimit.value };
      const b = f.querySelector('[type=submit]'); b.disabled = true;
      try {
        if (id) await CustomerService.update(id, data); else await CustomerService.create(data);
        App.flash(id ? 'Customer updated.' : 'Customer added.'); location.href = 'customer-list.html';
      } catch (err) { V.showErrors(f, { Email: err.message }); b.disabled = false; }
    });
  });
})();
