/* Customer authentication. Local demo mode is used while Firebase config is blank. */
(function () {
  const ACCOUNT_KEY = 'markethub_customer_accounts_v1';
  const SESSION_KEY = 'markethub_customer_session_v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}'); } catch (e) { return {}; } };
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
  function saveSession(data, customerId) {
    const session = { email: data.email, customerId, localId: data.localId, idToken: data.idToken, refreshToken: data.refreshToken, mode: firebase() ? 'firebase' : 'mock' };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }
  window.CustomerAuth = {
    async register(email, password, customerId) {
      if (!firebase()) {
        const accounts = read(), key = String(email).trim().toLowerCase();
        if (accounts[key]) throw new Error('An account with this email already exists.');
        accounts[key] = { password, customerId };
        localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
        return saveSession({ email: key }, customerId);
      }
      return saveSession(await firebaseAuth('signUp', { email, password, returnSecureToken: true }), customerId);
    },
    setCustomerId(customerId) {
      const current = this.current();
      if (!current) throw new Error('Customer session is not available.');
      current.customerId = customerId;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(current));
      return current;
    },
    async login(email, password) {
      if (!firebase()) {
        const key = String(email).trim().toLowerCase(), account = read()[key];
        if (!account || account.password !== password) throw new Error('Invalid email or password.');
        return saveSession({ email: key }, account.customerId);
      }
      const data = await firebaseAuth('signInWithPassword', { email, password, returnSecureToken: true });
      saveSession(data);
      const customer = (await CustomerService.list()).find((c) => c.Email.toLowerCase() === data.email.toLowerCase());
      if (!customer) {
        sessionStorage.removeItem(SESSION_KEY);
        throw new Error('No MarketHub customer profile exists for this Firebase account.');
      }
      return saveSession(data, customer.ID);
    },
    async sendPasswordReset(email) {
      if (!firebase()) return { demo: true, email };
      return firebaseAuth('sendOobCode', { requestType: 'PASSWORD_RESET', email });
    },
    current() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; } },
    isLoggedIn() { return !!this.current(); },
    logout() { sessionStorage.removeItem(SESSION_KEY); }
  };
})();
