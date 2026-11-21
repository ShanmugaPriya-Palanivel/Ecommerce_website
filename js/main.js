/* Shared helpers + page bootstrap (auth guard, component loading, toasts, modals). */
(function () {
  const App = (window.App = {});
  App.root = document.body.dataset.root || './';
  App.config = { currency: '$', lowStock: 10, pageSize: 8 };
  App.params = new URLSearchParams(location.search);

  const P = {
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    card: '<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
    x: '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>',
    layers: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/>'
  };
  App.icon = (n, s = 18) => `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
  App.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  App.money = (n) => App.config.currency + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  App.fmtDate = (iso) => new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  App.slug = (t) => String(t).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  App.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  App.stockStatus = (q) => (q <= 0 ? { key: 'out', label: 'Out of stock' } : q <= App.config.lowStock ? { key: 'low', label: 'Low stock' } : { key: 'in', label: 'In stock' });

  /* Images are always local paths relative to the project root. A neutral inline SVG is the last-resort fallback. */
  App.imgFallback = (el) => {
    el.onerror = null;
    el.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" fill="#6b7280" font-family="sans-serif" font-size="20" text-anchor="middle">No image</text></svg>');
  };
  App.img = (path, alt, cls = 'thumb') => `<img class="${cls}" src="${App.root}${App.esc(path || 'assets/images/products/default.jpg')}" alt="${App.esc(alt)}" loading="lazy" onerror="App.imgFallback(this)">`;
  App.catImg = (id, name, cls = 'thumb') => App.img(`assets/images/categories/${id}.jpg`, name, cls);

  App.toast = (msg, type = 'success') => {
    let w = document.getElementById('toasts');
    if (!w) { w = document.createElement('div'); w.id = 'toasts'; w.setAttribute('role', 'status'); document.body.append(w); }
    const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; w.append(t);
    setTimeout(() => t.remove(), 4000);
  };
  App.flash = (m, t = 'success') => sessionStorage.setItem('flash', JSON.stringify({ m, t }));

  App.modal = (html) => {
    const o = document.createElement('div'); o.className = 'modal-overlay';
    o.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    document.body.append(o);
    const api = { el: o.firstChild, close: () => o.remove() };
    o.addEventListener('click', (e) => { if (e.target === o || e.target.closest('[data-close]')) api.close(); });
    return api;
  };
  App.confirm = (title, msg, ok = 'Delete') => new Promise((res) => {
    const m = App.modal(`<h3>${App.esc(title)}</h3><p>${App.esc(msg)}</p><div class="actions"><button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-danger" data-ok>${App.esc(ok)}</button></div>`);
    m.el.querySelector('[data-ok]').onclick = () => { m.close(); res(true); };
    m.el.parentNode.addEventListener('click', (e) => { if (e.target === m.el.parentNode || e.target.closest('[data-close]')) res(false); });
  });

  App.loadComponents = async () => {
    const slots = [...document.querySelectorAll('[data-component]')];
    await Promise.all(slots.map(async (s) => {
      const r = await fetch(`${App.root}components/${s.dataset.component}.html`);
      if (!r.ok) throw new Error('Component load failed: ' + r.status);
      s.innerHTML = (await r.text()).split('{{root}}').join(App.root);
    }));
    document.querySelectorAll('[data-icon]').forEach((i) => (i.innerHTML = App.icon(i.dataset.icon)));
    document.querySelectorAll('.nav a[data-page]').forEach((a) => a.classList.toggle('active', a.dataset.page === document.body.dataset.page));
    const t = document.getElementById('page-title'); if (t) t.textContent = document.body.dataset.title || '';
    const u = document.getElementById('admin-email'); if (u) u.textContent = (Auth.current() || {}).email || '';
    document.querySelectorAll('[data-logout]').forEach((b) => (b.onclick = () => { Auth.logout(); location.href = App.root + 'admin/login.html'; }));
  };

  /* Every admin page runs through App.init: auth guard -> components -> flash message -> page code. */
  App.init = async (fn) => {
    if (!Auth.isLoggedIn()) { location.replace(App.root + 'admin/login.html'); return; }
    try { await App.loadComponents(); }
    catch (e) {
      document.body.insertAdjacentHTML('afterbegin', '<div class="server-warning">Shared components could not be loaded. Run the project through a local server (see README) instead of opening the files directly.</div>');
      return;
    }
    const f = sessionStorage.getItem('flash');
    if (f) { sessionStorage.removeItem('flash'); const x = JSON.parse(f); App.toast(x.m, x.t); }
    try { await fn(); } catch (e) { console.error(e); App.toast(e.message || 'Something went wrong.', 'error'); }
  };

  /* Pagination footer shared by list pages. */
  App.pager = (el, { page, pages, total, from, to }, onGo) => {
    const btn = (p, label, dis, on) => `<button type="button" data-go="${p}" ${dis ? 'disabled' : ''} class="${on ? 'on' : ''}">${label}</button>`;
    let nums = '';
    for (let i = 1; i <= pages; i++) nums += btn(i, i, false, i === page);
    el.innerHTML = total ? `<span>Showing ${from}–${to} of ${total}</span><div class="pages">${btn(page - 1, 'Prev', page <= 1)}${nums}${btn(page + 1, 'Next', page >= pages)}</div>` : '';
    el.onclick = (e) => { const b = e.target.closest('[data-go]'); if (b && !b.disabled) onGo(Number(b.dataset.go)); };
  };
})();
