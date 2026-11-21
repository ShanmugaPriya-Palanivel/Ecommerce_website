/* Customer + credit-limit operations. Data path: customers/<ID> ->
   { ID, Name, Email, Mobile, CreditLimit }.
   Credit default is 1000 (admin can update at any time via credit management page).
   Firebase phase: replace Api calls with Firestore REST fetch() calls.
   Postman test: GET /documents/customers, POST /documents/customers */
(function () {
  const base = 'customers';
  const DEFAULT_CREDIT = 1000; /* Default credit limit for new customers */
  const emailTaken = async (email, exceptId) => (await CustomerService.list())
    .some((c) => c.ID !== exceptId && c.Email.toLowerCase() === email.trim().toLowerCase());
  const clean = (ID, c, limit) => ({
    ID, Name: String(c.Name).trim(), Email: String(c.Email).trim().toLowerCase(),
    Mobile: String(c.Mobile).replace(/[\s-]/g, ''), CreditLimit: Number(limit)
  });
  const checkLimit = (v) => { if (!Number.isFinite(Number(v)) || Number(v) < 0) throw new Error('Credit limit must be 0 or more.'); };
  window.CustomerService = {
    DEFAULT_CREDIT,
    async list() { return Api.list(await Api.get(base)).sort(Api.byId); },
    get(id) { return Api.get(`${base}/${id}`); },
    async nextId() {
      const n = Math.max(0, ...(await this.list()).map((c) => parseInt(c.ID.replace(/\D/g, ''), 10) || 0)) + 1;
      return 'CU' + String(n).padStart(3, '0');
    },
    async create(c) {
      /* Credit limit: use provided value, or fall back to DEFAULT_CREDIT (1000) */
      const limit = (c.CreditLimit === undefined || c.CreditLimit === '') ? DEFAULT_CREDIT : c.CreditLimit;
      checkLimit(limit);
      if (await emailTaken(c.Email)) throw new Error('A customer with this email already exists.');
      const id = c.ID || await this.nextId();
      if (await this.get(id)) throw new Error('A customer with this ID already exists.');
      const rec = clean(id, c, limit);
      return Api.put(`${base}/${rec.ID}`, rec);
    },
    async update(id, c) {
      if (!(await this.get(id))) throw new Error('Customer not found.');
      checkLimit(c.CreditLimit);
      if (await emailTaken(c.Email, id)) throw new Error('A customer with this email already exists.');
      return Api.put(`${base}/${id}`, clean(id, c, c.CreditLimit));
    },
    async remove(id) {
      if (!(await this.get(id))) throw new Error('Customer not found.');
      await Api.delete(`${base}/${id}`);
    },
    async updateCreditLimit(id, limit) {
      checkLimit(limit);
      if (!(await this.get(id))) throw new Error('Customer not found.');
      return Api.patch(`${base}/${id}`, { CreditLimit: Number(limit) });
    }
  };
})();
