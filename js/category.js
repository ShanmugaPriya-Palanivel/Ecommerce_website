/* Category list + form pages. */
(function () {
  const $ = (s) => document.querySelector(s), esc = App.esc;

  if ($('#category-rows')) App.init(async () => {
    let cats = [], prods = [];
    const body = $('#category-rows'), search = $('#search');
    const count = (id) => prods.filter((p) => p.Cat_ID === id).length;
    function render() {
      const q = search.value.trim().toLowerCase();
      const rows = cats.filter((c) => !q || `${c.ID} ${c.Name}`.toLowerCase().includes(q));
      $('#result-count').textContent = `${rows.length} categor${rows.length === 1 ? 'y' : 'ies'}`;
      body.innerHTML = rows.length ? rows.map((c) => `<tr>
        <td>${App.catImg(c.ID, c.Name)}</td><td>${esc(c.ID)}</td><td><strong>${esc(c.Name)}</strong></td><td class="num">${count(c.ID)}</td>
        <td class="actions"><a class="btn btn-ghost btn-sm" href="category-form.html?id=${encodeURIComponent(c.ID)}">${App.icon('edit', 14)} Edit</a>
        <button class="btn btn-danger btn-sm" type="button" data-del="${esc(c.ID)}">${App.icon('trash', 14)} Delete</button></td></tr>`).join('')
        : `<tr><td colspan="5" class="state">${q ? 'No categories match your search.' : 'No categories yet. Add your first category.'}</td></tr>`;
    }
    async function load() {
      body.innerHTML = '<tr><td colspan="5" class="state">Loading…</td></tr>';
      try { [cats, prods] = await Promise.all([CategoryService.list(), ProductService.list()]); render(); }
      catch (e) { body.innerHTML = `<tr><td colspan="5" class="state error">${esc(e.message)}</td></tr>`; }
    }
    search.addEventListener('input', App.debounce(render, 150));
    body.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-del]'); if (!b) return;
      const c = cats.find((x) => x.ID === b.dataset.del), n = count(c.ID);
      if (n) { App.toast(`"${c.Name}" can't be deleted: ${n} product${n > 1 ? 's are' : ' is'} still assigned to it. Move or delete those products first.`, 'error'); return; }
      if (!await App.confirm('Delete category', `Delete "${c.Name}"? This cannot be undone.`)) return;
      try { await CategoryService.remove(c.ID); App.toast('Category deleted.'); await load(); } catch (err) { App.toast(err.message, 'error'); }
    });
    await load();
  });

  if ($('#category-form')) App.init(async () => {
    const f = $('#category-form'), el = f.elements, id = App.params.get('id');
    if (id) {
      const c = await CategoryService.get(id);
      if (!c) { f.hidden = true; $('#form-state').hidden = false; return; }
      el.ID.value = c.ID; el.Name.value = c.Name; $('#form-title').textContent = 'Edit category';
    } else el.ID.value = await CategoryService.nextId();
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = el.Name.value;
      const errs = { Name: V.required(name, 'Category name') || (name.trim().length > 40 ? 'Maximum 40 characters.' : '') };
      if (!V.showErrors(f, errs)) return;
      const b = f.querySelector('[type=submit]'); b.disabled = true;
      try {
        if (id) await CategoryService.update(id, { Name: name }); else await CategoryService.create({ Name: name });
        App.flash(id ? 'Category updated.' : 'Category added.'); location.href = 'category-list.html';
      } catch (err) { V.showErrors(f, { Name: err.message }); b.disabled = false; }
    });
  });
})();
