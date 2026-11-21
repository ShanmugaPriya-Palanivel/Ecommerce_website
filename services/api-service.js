/* Shared data access layer.
   Local mode keeps the app fully testable without Firebase.
   Firebase mode uses Firestore REST and the current Firebase Auth ID token. */
(function () {
  const KEY = 'ecom_admin_db_v1';
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const wait = () => new Promise((resolve) => setTimeout(resolve, 40));
  const seg = (path) => String(path).split('/').filter(Boolean);
  const firebaseEnabled = () => {
    const c = window.FIREBASE_CONFIG;
    return !!(c && c.useFirebase && c.projectId && c.apiKey);
  };
  const authToken = () => {
    const session = (window.Auth && Auth.current && Auth.current()) ||
      (window.CustomerAuth && CustomerAuth.current && CustomerAuth.current());
    return session && session.idToken;
  };

  function save(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { throw new Error('Could not save data: browser storage is unavailable.'); }
  }
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* use seed below */ }
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { /* reseed corrupted data */ }
    }
    const db = clone(window.SEED_DATA || {});
    try { save(db); } catch (e) { /* retain the in-memory seed */ }
    return db;
  }

  function toFirestoreValue(value) {
    if (value === null) return { nullValue: null };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number') return Number.isInteger(value)
      ? { integerValue: String(value) } : { doubleValue: value };
    if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
    if (typeof value === 'object') {
      return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toFirestoreValue(v)])) } };
    }
    return { stringValue: String(value) };
  }
  function fromFirestoreValue(value) {
    if (!value) return null;
    if ('stringValue' in value) return value.stringValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return Number(value.doubleValue);
    if ('booleanValue' in value) return value.booleanValue;
    if ('nullValue' in value) return null;
    if (value.timestampValue) return value.timestampValue;
    if (value.arrayValue) return (value.arrayValue.values || []).map(fromFirestoreValue);
    if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, fromFirestoreValue(v)]));
    return null;
  }
  const fromDocument = (doc) => {
    const data = Object.fromEntries(Object.entries(doc.fields || {}).map(([k, v]) => [k, fromFirestoreValue(v)]));
    if (doc.name) data.ID = data.ID || doc.name.split('/').pop();
    return data;
  };
  function firestoreUrl(path) {
    return `${FIREBASE_CONFIG.firestoreEndpoint}/${seg(path).join('/')}`;
  }
  async function firebaseRequest(method, path, data) {
    const token = authToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const options = { method, headers };
    if (data !== undefined) options.body = JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, toFirestoreValue(v)])) });
    const response = await fetch(`${firestoreUrl(path)}?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`, options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload.error && payload.error.message;
      if (response.status === 403) {
        throw new Error(`Firebase permission denied: ${message || 'check Firestore rules and authentication.'}`);
      }
      throw new Error(message || `Firebase request failed (${response.status}).`);
    }
    return payload;
  }
  async function firebaseGet(path) {
    const parts = seg(path);
    const payload = await firebaseRequest('GET', path);
    if (payload.documents) {
      return Object.fromEntries(payload.documents.map((doc) => [doc.name.split('/').pop(), fromDocument(doc)]));
    }
    return payload.name ? fromDocument(payload) : null;
  }

  window.Api = {
    async get(path) {
      if (firebaseEnabled()) return firebaseGet(path);
      await wait();
      let node = load();
      for (const s of seg(path)) node = node == null ? undefined : node[s];
      return node === undefined ? null : clone(node);
    },
    async put(path, data) {
      if (firebaseEnabled()) {
        const parts = seg(path), id = parts.pop();
        return fromDocument(await firebaseRequest('PATCH', `${parts.join('/')}/${id}`, data));
      }
      await wait();
      const db = load(), parts = seg(path);
      let node = db;
      parts.slice(0, -1).forEach((k) => { node[k] = node[k] || {}; node = node[k]; });
      node[parts[parts.length - 1]] = data;
      save(db);
      return clone(data);
    },
    async patch(path, data) {
      if (firebaseEnabled()) {
        const current = await firebaseGet(path);
        return this.put(path, Object.assign(current || {}, data));
      }
      const current = (await this.get(path)) || {};
      return this.put(path, Object.assign(current, data));
    },
    async delete(path) {
      if (firebaseEnabled()) { await firebaseRequest('DELETE', path); return; }
      await wait();
      const db = load(), parts = seg(path);
      let node = db;
      for (const k of parts.slice(0, -1)) { node = node && node[k]; if (!node) return; }
      delete node[parts[parts.length - 1]];
      save(db);
    },
    async reset() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore local reset failures */ } load(); },
    list(obj) { return obj ? Object.values(obj) : []; },
    byId(a, b) { return String(a.ID).localeCompare(String(b.ID), undefined, { numeric: true }); }
  };
})();
