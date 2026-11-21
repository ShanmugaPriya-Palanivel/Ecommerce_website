/* Category operations. Data path: categories/<ID> -> { ID, Name } */
(function () {
  const base = 'categories';
  const dup = async (name, exceptId) => (await CategoryService.list())
    .some((c) => c.ID !== exceptId && c.Name.toLowerCase() === name.trim().toLowerCase());
  window.CategoryService = {
    async list() { return Api.list(await Api.get(base)).sort(Api.byId); },
    get(id) { return Api.get(`${base}/${id}`); },
    async nextId() {
      const n = Math.max(0, ...(await this.list()).map((c) => parseInt(c.ID.replace(/\D/g, ''), 10) || 0)) + 1;
      return 'C' + String(n).padStart(2, '0');
    },
    async create({ Name }) {
      if (await dup(Name)) throw new Error('A category with this name already exists.');
      const ID = await this.nextId();
      return Api.put(`${base}/${ID}`, { ID, Name: Name.trim() });
    },
    async update(id, { Name }) {
      if (!(await this.get(id))) throw new Error('Category not found.');
      if (await dup(Name, id)) throw new Error('A category with this name already exists.');
      return Api.put(`${base}/${id}`, { ID: id, Name: Name.trim() });
    },
    async remove(id) {
      const used = (await ProductService.list()).filter((p) => p.Cat_ID === id).length;
      if (used) throw new Error(`Cannot delete: ${used} product(s) still use this category. Move or delete them first.`);
      await Api.delete(`${base}/${id}`);
    }
  };
})();
