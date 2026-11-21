/* Product operations. Data path: products/<ID> ->
   { ID, Cat_ID, Title, Description, Quantity, Price, Image, Active }
   (Image and Active are the two approved extra fields.) Activity log path: inventoryLog/<id>. */
(function () {
  const base = 'products', DEFAULT_IMG = 'assets/images/products/default.jpg';
  const clean = (ID, p) => ({
    ID, Cat_ID: p.Cat_ID, Title: String(p.Title).trim(), Description: String(p.Description || '').trim(),
    Quantity: Number(p.Quantity), Price: Math.round(Number(p.Price) * 100) / 100,
    Image: p.Image || DEFAULT_IMG, Active: p.Active !== false
  });
  async function checkCat(id) { if (!(await CategoryService.get(id))) throw new Error('Selected category does not exist.'); }
  async function log(action, p, detail) {
    const id = 'L' + Date.now() + Math.random().toString(36).slice(2, 6);
    await Api.put(`inventoryLog/${id}`, { id, action, productId: p.ID, title: p.Title, detail: detail || '', time: new Date().toISOString() });
  }
  window.ProductService = {
    DEFAULT_IMG,
    async list() { return Api.list(await Api.get(base)).sort(Api.byId); },
    get(id) { return Api.get(`${base}/${id}`); },
    async nextId() {
      const n = Math.max(0, ...(await this.list()).map((p) => parseInt(p.ID.replace(/\D/g, ''), 10) || 0)) + 1;
      return 'P' + String(n).padStart(3, '0');
    },
    async create(p) {
      await checkCat(p.Cat_ID);
      const rec = clean(await this.nextId(), p);
      await Api.put(`${base}/${rec.ID}`, rec);
      await log('Added', rec, `Opening stock ${rec.Quantity}`);
      return rec;
    },
    async update(id, p) {
      const old = await this.get(id);
      if (!old) throw new Error('Product not found.');
      await checkCat(p.Cat_ID);
      const rec = clean(id, p);
      await Api.put(`${base}/${id}`, rec);
      await log(old.Quantity !== rec.Quantity ? 'Stock updated' : 'Updated', rec,
        old.Quantity !== rec.Quantity ? `Quantity ${old.Quantity} → ${rec.Quantity}` : 'Details edited');
      return rec;
    },
    async remove(id) {
      const old = await this.get(id);
      if (!old) throw new Error('Product not found.');
      await Api.delete(`${base}/${id}`);
      await log('Removed', old, 'Product deleted');
    },
    async setActive(id, flag) {
      const old = await this.get(id);
      if (!old) throw new Error('Product not found.');
      const rec = await Api.patch(`${base}/${id}`, { Active: !!flag });
      await log(flag ? 'Activated' : 'Deactivated', rec, '');
      return rec;
    },
    async activity(limit = 6) {
      return Api.list(await Api.get('inventoryLog')).sort((a, b) => b.time.localeCompare(a.time)).slice(0, limit);
    }
  };
})();
