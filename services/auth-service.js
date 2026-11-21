/* Admin authentication. Mock mode is the default until Firebase config is supplied. */
(function () {
  const KEY = 'ecom_admin_session';
  const MOCK = { email: 'admin@example.com', password: 'Admin@123' };
  const firebase = () => window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.useFirebase &&
    window.FIREBASE_CONFIG.apiKey;
  async function firebaseAuth(endpoint, body) {
    const r = await fetch(`${FIREBASE_CONFIG.authEndpoint}:${endpoint}?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error && data.error.message || 'Firebase authentication failed.');
    return data;
  }
  window.Auth = {
    MODE: firebase() ? 'firebase' : 'mock',
    MOCK_HINT: MOCK,
    async login(email, password) {
      if (!firebase()) {
        await new Promise((r) => setTimeout(r, 250));
        if (String(email).trim().toLowerCase() !== MOCK.email || password !== MOCK.password) throw new Error('Invalid email or password.');
        const session = { email: MOCK.email, mode: 'mock', at: Date.now() };
        sessionStorage.setItem(KEY, JSON.stringify(session));
        return session;
      }
      const data = await firebaseAuth('signInWithPassword', { email, password, returnSecureToken: true });
      const session = { email: data.email, localId: data.localId, idToken: data.idToken, refreshToken: data.refreshToken, mode: 'firebase', at: Date.now() };
      sessionStorage.setItem(KEY, JSON.stringify(session));
      return session;
    },
    logout() { sessionStorage.removeItem(KEY); },
    current() { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; } },
    isLoggedIn() { return !!this.current(); }
  };
})();
