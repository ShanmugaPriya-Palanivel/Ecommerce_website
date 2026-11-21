/* Imports the existing seed data into Firestore. Run only in Firebase mode. */
(function () {
  window.FirebaseSeedService = {
    async importAll() {
      if (!window.FIREBASE_CONFIG || !FIREBASE_CONFIG.useFirebase) {
        throw new Error('Enable Firebase in services/firebase-config.js before importing seed data.');
      }
      if (!(Auth.current() && Auth.current().idToken)) {
        throw new Error('Sign in as Firebase admin before importing seed data.');
      }
      const seed = window.SEED_DATA || {};
      const collections = ['categories', 'products', 'customers', 'orders', 'inventoryLog'];
      const result = {};
      for (const collection of collections) {
        const records = seed[collection] || {};
        let count = 0;
        for (const [id, record] of Object.entries(records)) {
          if (!(await Api.get(`${collection}/${id}`))) {
            await Api.put(`${collection}/${id}`, record);
            count++;
          }
        }
        result[collection] = count;
      }
      return result;
    }
  };
})();
