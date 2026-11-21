/* Order operations. Data path: orders/{ID} ->
   { ID, CustomerID, CustomerName, CustomerEmail, Delivery, Items,
     Subtotal, Total, PaymentMethod, PaymentStatus, OrderStatus, CreatedAt }
   PaymentMethod: "Cash" | "Credit"
   PaymentStatus: "Pending" | "Paid"
   OrderStatus:   "Placed" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
   Api transparently uses Firestore REST when Firebase is enabled.
   Postman test: GET /orders, PATCH /orders/{id} with Authorization: Bearer {idToken} */
(function () {
  const base = 'orders';

  window.OrderService = {
    /* ── Read ── */
    async list() {
      return Api.list(await Api.get(base))
        .sort((a, b) => String(b.CreatedAt).localeCompare(String(a.CreatedAt)));
    },

    async get(id) {
      return Api.get(`${base}/${id}`);
    },

    async listByCustomer(customerId) {
      return (await this.list()).filter(o => o.CustomerID === customerId);
    },

    /* Returns orders whose CreatedAt falls within [fromDate, toDate] (inclusive).
       fromDate / toDate should be JS Date objects or ISO strings. */
    async listByDateRange(fromDate, toDate) {
      const from = fromDate ? new Date(fromDate).getTime() : 0;
      const to   = toDate   ? new Date(toDate).getTime()   : Infinity;
      return (await this.list()).filter(o => {
        const t = new Date(o.CreatedAt).getTime();
        return t >= from && t <= to;
      });
    },

    /* ── Status updates ── */

    /* Update order status (Placed | Processing | Shipped | Delivered | Cancelled).
       Postman PATCH /documents/orders/{id}
       Body: { "fields": { "OrderStatus": { "stringValue": "Shipped" } } } */
    async updateStatus(id, orderStatus) {
      const o = await this.get(id);
      if (!o) throw new Error('Order not found.');
      const valid = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
      if (!valid.includes(orderStatus)) throw new Error('Invalid order status.');
      return Api.patch(`${base}/${id}`, { OrderStatus: orderStatus });
    },

    /* Update payment status (Pending | Paid).
       Postman PATCH /documents/orders/{id}
       Body: { "fields": { "PaymentStatus": { "stringValue": "Paid" } } } */
    async updatePayment(id, paymentStatus) {
      const o = await this.get(id);
      if (!o) throw new Error('Order not found.');
      if (!['Pending', 'Paid'].includes(paymentStatus)) throw new Error('Invalid payment status.');
      return Api.patch(`${base}/${id}`, { PaymentStatus: paymentStatus });
    },

    /* ── Aggregation helpers (used by report pages) ── */

    /* Returns total revenue from an array of orders. */
    totalRevenue(orders) {
      return orders.reduce((s, o) => s + Number(o.Total || 0), 0);
    },

    /* Flattens all line items from an array of orders into a single array.
       Each element: { ID, Title, Quantity, Price, Revenue, Cat_ID, orderDate, paymentMethod } */
    lineItems(orders) {
      const rows = [];
      for (const o of orders) {
        for (const item of (o.Items || [])) {
          rows.push({
            ID:            item.ID,
            Title:         item.Title,
            Quantity:      Number(item.Quantity),
            Price:         Number(item.Price),
            Revenue:       Number(item.Price) * Number(item.Quantity),
            Cat_ID:        item.Cat_ID || '',
            orderDate:     o.CreatedAt,
            paymentMethod: o.PaymentMethod,
            orderId:       o.ID,
            customerName:  o.CustomerName,
            customerEmail: o.CustomerEmail,
            customerId:    o.CustomerID
          });
        }
      }
      return rows;
    },

    /* Top / Bottom N selling items by quantity within the given orders.
       Returns array sorted descending (top) or ascending (bottom). */
    topItems(orders, n = 10, bottom = false) {
      const items = this.lineItems(orders);
      const map = {};
      for (const i of items) {
        if (!map[i.ID]) map[i.ID] = { ID: i.ID, Title: i.Title, TotalQty: 0, TotalRevenue: 0 };
        map[i.ID].TotalQty     += i.Quantity;
        map[i.ID].TotalRevenue += i.Revenue;
      }
      const sorted = Object.values(map).sort((a, b) =>
        bottom ? a.TotalQty - b.TotalQty : b.TotalQty - a.TotalQty
      );
      return sorted.slice(0, n);
    },

    /* Groups orders by category (uses product catalog to map Cat_ID → category name).
       Returns array of { Cat_ID, CatName, OrderCount, Revenue } */
    async groupByCategory(orders) {
      const cats = await CategoryService.list();
      const catMap = Object.fromEntries(cats.map(c => [c.ID, c.Name]));
      const prods  = await ProductService.list();
      const prodMap = Object.fromEntries(prods.map(p => [p.ID, p.Cat_ID]));

      const map = {};
      for (const item of this.lineItems(orders)) {
        const catId   = prodMap[item.ID] || 'Unknown';
        const catName = catMap[catId]    || 'Unknown';
        if (!map[catId]) map[catId] = { Cat_ID: catId, CatName: catName, OrderCount: 0, Revenue: 0 };
        map[catId].OrderCount += item.Quantity;
        map[catId].Revenue    += item.Revenue;
      }
      return Object.values(map).sort((a, b) => b.Revenue - a.Revenue);
    },

    /* Groups orders by payment method.
       Returns { Cash: { orders, revenue }, Credit: { orders, revenue } } */
    groupByPayment(orders) {
      const result = { Cash: { orders: [], revenue: 0 }, Credit: { orders: [], revenue: 0 } };
      for (const o of orders) {
        const method = o.PaymentMethod === 'Credit' ? 'Credit' : 'Cash';
        result[method].orders.push(o);
        result[method].revenue += Number(o.Total || 0);
      }
      return result;
    },

    /* Outstanding credit (unpaid Credit orders) for a customer */
    async creditOutstanding(customerId) {
      const orders = await this.listByCustomer(customerId);
      return orders
        .filter(o => o.PaymentMethod === 'Credit' && o.PaymentStatus !== 'Paid')
        .reduce((s, o) => s + Number(o.Total || 0), 0);
    }
  };
})();
