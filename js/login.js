/* Admin login page (MOCK authentication, see services/auth-service.js). */
(function () {
  const $ = (s) => document.querySelector(s);
  if (Auth.isLoggedIn()) { location.replace('dashboard.html'); return; }
  const f = $('#login-form'), box = $('#login-error'), pw = f.elements.password;
  $('#toggle-pw').addEventListener('click', (e) => {
    const show = pw.type === 'password'; pw.type = show ? 'text' : 'password';
    e.target.textContent = show ? 'Hide' : 'Show'; e.target.setAttribute('aria-pressed', show);
  });
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); box.hidden = true;
    const errs = { email: V.required(f.elements.email.value, 'Email') || V.email(f.elements.email.value), password: V.required(pw.value, 'Password') };
    if (!V.showErrors(f, errs)) return;
    const b = f.querySelector('[type=submit]'); b.disabled = true; b.textContent = 'Signing in…';
    try { await Auth.login(f.elements.email.value, pw.value); location.href = 'dashboard.html'; }
    catch (err) { box.textContent = err.message; box.hidden = false; b.disabled = false; b.textContent = 'Log in'; }
  });
})();
