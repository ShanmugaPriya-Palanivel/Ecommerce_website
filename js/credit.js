/* Credit limit management. Reads/writes the same customer records as Customer Management. */
App.init(async () => {
  const $ = (s) => document.querySelector(s), esc = App.esc;
  let list = [], selected = App.params.get('id') || null;
  const body = $('#credit-rows'), search = $('#search'), form = $('#credit-form'), hint = $('#pick-hint');
  function panel() {
    const c = list.find((x) => x.ID === selected);
    form.hidden = !c; hint.hidden = !!c;
    if (!c) return;
    $('#sel-name').textContent = `${c.Name} (${c.ID})`;
    $('#sel-current').textContent = App.money(c.CreditLimit);
    form.elements.CreditLimit.value = c.CreditLimit;
    V.showErrors(form, {});
  }
  function render() {
    const q = search.value.trim().toLowerCase();
    const rows = list.filter((c) => !q || `${c.ID} ${c.Name} ${c.Email}`.toLowerCase().includes(q));
    body.innerHTML = rows.length ? rows.map((c) => `<tr class="${c.ID === selected ? 'sel-row' : ''}"><td>${esc(c.ID)}</td><td><strong>${esc(c.Name)}</strong></td><td>${esc(c.Email)}</td><td class="num">${App.money(c.CreditLimit)}</td>
      <td class="actions"><button class="btn ${c.ID === selected ? 'btn-primary' : 'btn-ghost'} btn-sm" type="button" data-pick="${esc(c.ID)}">${c.ID === selected ? 'Selected' : 'Select'}</button></td></tr>`).join('')
      : `<tr><td colspan="5" class="state">${q ? 'No customers match your search.' : 'No customers yet.'}</td></tr>`;
  }
  async function load() {
    body.innerHTML = '<tr><td colspan="5" class="state">Loading…</td></tr>';
    try { list = await CustomerService.list(); } catch (e) { body.innerHTML = `<tr><td colspan="5" class="state error">${esc(e.message)}</td></tr>`; return; }
    if (selected && !list.some((c) => c.ID === selected)) selected = null;
    render(); panel();
  }
  search.addEventListener('input', App.debounce(render, 150));
  body.addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (!b) return; selected = b.dataset.pick; render(); panel(); form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = form.elements.CreditLimit.value;
    if (!V.showErrors(form, { CreditLimit: V.num(v, 'Credit limit') })) return;
    const b = form.querySelector('[type=submit]'); b.disabled = true;
    try { const r = await CustomerService.updateCreditLimit(selected, v); App.toast(`Credit limit for ${r.Name} updated to ${App.money(r.CreditLimit)}.`); await load(); }
    catch (err) { App.toast(err.message, 'error'); }
    b.disabled = false;
  });
  await load();
});
