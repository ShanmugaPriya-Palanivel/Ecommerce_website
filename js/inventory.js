/* Inventory list + product form pages. */
(function () {
  const $ = (s) => document.querySelector(s), esc = App.esc;

  if ($('#product-rows')) App.init(async () => {
    const st = { q: '', cat: '', status: '', sort: 'id', page: 1 };
    let prods = [], cats = [], names = {};
    const body = $('#product-rows');
    const sorters = {
      id: Api.byId, 'title-asc': (a, b) => a.Title.localeCompare(b.Title), 'title-desc': (a, b) => b.Title.localeCompare(a.Title),
      'price-asc': (a, b) => a.Price - b.Price, 'price-desc': (a, b) => b.Price - a.Price,
      'qty-asc': (a, b) => a.Quantity - b.Quantity, 'qty-desc': (a, b) => b.Quantity - a.Quantity
    };
    const matchStatus = (p) => !st.status || (st.status === 'inactive' ? !p.Active : App.stockStatus(p.Quantity).key === st.status);
    function render() {
      const q = st.q.toLowerCase();
      const rows = prods.filter((p) => (!st.cat || p.Cat_ID === st.cat) && matchStatus(p)
        && (!q || `${p.ID} ${p.Title} ${p.Description} ${names[p.Cat_ID] || ''}`.toLowerCase().includes(q))).sort(sorters[st.sort]);
      const size = App.config.pageSize, pages = Math.max(1, Math.ceil(rows.length / size));
      st.page = Math.min(st.page, pages);
      const start = (st.page - 1) * size, view = rows.slice(start, start + size);
      body.innerHTML = view.length ? view.map((p) => {
        const s = App.stockStatus(p.Quantity);
        return `<tr class="${p.Active ? '' : 'dim'}">
          <td><div class="cell">${App.img(p.Image, p.Title)}<div><strong>${esc(p.Title)}</strong>${p.Active ? '' : ' <span class="badge off">Inactive</span>'}<small>${esc(p.ID)}</small></div></div></td>
          <td>${esc(names[p.Cat_ID] || p.Cat_ID)}</td><td class="num">${p.Quantity}</td><td class="num">${App.money(p.Price)}</td>
          <td><span class="badge ${s.key}">${s.label}</span></td>
          <td><label class="switch" title="Active"><input type="checkbox" data-toggle="${esc(p.ID)}" ${p.Active ? 'checked' : ''} aria-label="Active"><span></span></label></td>
          <td class="actions"><button class="btn btn-ghost btn-sm" type="button" data-view="${esc(p.ID)}">${App.icon('eye', 14)} View</button>
          <a class="btn btn-ghost btn-sm" href="product-form.html?id=${encodeURIComponent(p.ID)}">${App.icon('edit', 14)} Edit</a>
          <button class="btn btn-danger btn-sm" type="button" data-del="${esc(p.ID)}">${App.icon('trash', 14)} Delete</button></td></tr>`;
      }).join('') : `<tr><td colspan="7" class="state">${prods.length ? 'No products match your filters.' : 'No products yet. Add your first product.'}</td></tr>`;
      App.pager($('#pager'), { page: st.page, pages, total: rows.length, from: start + 1, to: start + view.length }, (p) => { st.page = p; render(); });
    }
    async function load() {
      body.innerHTML = '<tr><td colspan="7" class="state">Loading…</td></tr>';
      try { [prods, cats] = await Promise.all([ProductService.list(), CategoryService.list()]); names = Object.fromEntries(cats.map((c) => [c.ID, c.Name])); render(); }
      catch (e) { body.innerHTML = `<tr><td colspan="7" class="state error">${esc(e.message)}</td></tr>`; }
    }
    await load();
    $('#cat-filter').innerHTML = '<option value="">All categories</option>' + cats.map((c) => `<option value="${esc(c.ID)}">${esc(c.Name)}</option>`).join('');
    const on = (sel, key) => $(sel).addEventListener('input', (e) => { st[key] = e.target.value; st.page = 1; render(); });
    on('#cat-filter', 'cat'); on('#status-filter', 'status'); on('#sort', 'sort');
    $('#search').addEventListener('input', App.debounce((e) => { st.q = e.target.value.trim(); st.page = 1; render(); }, 150));

    body.addEventListener('change', async (e) => {
      const t = e.target.closest('[data-toggle]'); if (!t) return;
      try { const r = await ProductService.setActive(t.dataset.toggle, t.checked); Object.assign(prods.find((p) => p.ID === r.ID), r); App.toast(`${r.Title} ${r.Active ? 'activated' : 'deactivated'}.`); render(); }
      catch (err) { t.checked = !t.checked; App.toast(err.message, 'error'); }
    });
    body.addEventListener('click', async (e) => {
      const v = e.target.closest('[data-view]'), d = e.target.closest('[data-del]');
      if (v) {
        const p = prods.find((x) => x.ID === v.dataset.view), s = App.stockStatus(p.Quantity);
        App.modal(`${App.img(p.Image, p.Title, 'view-img')}<h3>${esc(p.Title)}</h3><dl class="detail">
          <dt>ID</dt><dd>${esc(p.ID)}</dd><dt>Category</dt><dd>${esc(names[p.Cat_ID] || p.Cat_ID)} (${esc(p.Cat_ID)})</dd>
          <dt>Description</dt><dd>${esc(p.Description) || '—'}</dd><dt>Quantity</dt><dd>${p.Quantity} <span class="badge ${s.key}">${s.label}</span></dd>
          <dt>Price</dt><dd>${App.money(p.Price)}</dd><dt>Status</dt><dd>${p.Active ? 'Active' : 'Inactive'}</dd><dt>Image</dt><dd>${esc(p.Image)}</dd></dl>
          <div class="actions"><button class="btn btn-ghost" data-close>Close</button><a class="btn btn-primary" href="product-form.html?id=${encodeURIComponent(p.ID)}">Edit</a></div>`);
      } else if (d) {
        const p = prods.find((x) => x.ID === d.dataset.del);
        if (!await App.confirm('Delete product', `Delete "${p.Title}"? This cannot be undone.`)) return;
        try { await ProductService.remove(p.ID); App.toast('Product deleted.'); await load(); } catch (err) { App.toast(err.message, 'error'); }
      }
    });
  });

  if ($('#product-form')) App.init(async () => {
    const f = $('#product-form'), el = f.elements, id = App.params.get('id'), prev = $('#img-preview');
    const cats = await CategoryService.list();
    el.Cat_ID.innerHTML = '<option value="">Select a category</option>' + cats.map((c) => `<option value="${esc(c.ID)}">${esc(c.Name)}</option>`).join('');
    if (!cats.length) { $('#no-cats').hidden = false; f.querySelector('[type=submit]').disabled = true; }
    const setPrev = () => { prev.onerror = () => App.imgFallback(prev); prev.src = App.root + (el.Image.value.trim() || ProductService.DEFAULT_IMG); };
    let touched = false;
    if (id) {
      const p = await ProductService.get(id);
      if (!p) { f.hidden = true; $('#form-state').hidden = false; return; }
      $('#form-title').textContent = 'Edit product'; touched = true;
      el.ID.value = p.ID; el.Cat_ID.value = p.Cat_ID; el.Title.value = p.Title; el.Description.value = p.Description;
      el.Quantity.value = p.Quantity; el.Price.value = p.Price; el.Image.value = p.Image; el.Active.checked = p.Active;
    } else { el.ID.value = await ProductService.nextId(); el.Image.value = ProductService.DEFAULT_IMG; }
    setPrev();
    el.Title.addEventListener('input', () => { if (!touched) { el.Image.value = el.Title.value.trim() ? `assets/images/products/${App.slug(el.Title.value)}.jpg` : ProductService.DEFAULT_IMG; setPrev(); } });
    el.Image.addEventListener('input', () => { touched = true; setPrev(); });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errs = {
        Cat_ID: V.required(el.Cat_ID.value, 'Category'),
        Title: V.required(el.Title.value, 'Title') || (el.Title.value.trim().length > 80 ? 'Maximum 80 characters.' : ''),
        Description: el.Description.value.length > 500 ? 'Maximum 500 characters.' : '',
        Quantity: V.num(el.Quantity.value, 'Quantity', { int: true }),
        Price: V.num(el.Price.value, 'Price', { exclusive: true }),
        Image: V.localPath(el.Image.value)
      };
      if (!V.showErrors(f, errs)) return;
      const data = { Cat_ID: el.Cat_ID.value, Title: el.Title.value, Description: el.Description.value, Quantity: el.Quantity.value, Price: el.Price.value, Image: el.Image.value.trim(), Active: el.Active.checked };
      const b = f.querySelector('[type=submit]'); b.disabled = true;
      try {
        if (id) await ProductService.update(id, data); else await ProductService.create(data);
        App.flash(id ? 'Product updated.' : 'Product added.'); location.href = 'inventory-list.html';
      } catch (err) { App.toast(err.message, 'error'); b.disabled = false; }
    });
  });
})();
