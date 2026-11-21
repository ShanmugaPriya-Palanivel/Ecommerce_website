# MarketHub Technical Documentation

## 1. Project summary

MarketHub is a static ecommerce application built with:

- HTML5
- CSS3
- Vanilla JavaScript
- Firebase Authentication REST API
- Cloud Firestore REST API
- Postman
- Optional `http-server` static server

No Python backend or Firebase JavaScript SDK is used.

## 2. Run the application

Install the optional static server:

```bash
npm install
npm start
```

Open:

```text
http://localhost:8080
```

Important pages:

```text
Storefront: http://localhost:8080/customer/home.html
Admin:      http://localhost:8080/admin/login.html
Dashboard:  http://localhost:8080/admin/dashboard.html
```

Do not open the HTML files using `file://`; component loading and Firebase
requests require an HTTP origin.

## 3. Architecture

The browser sends REST requests to Firebase:

```text
Browser UI
  -> shared services/api-service.js
  -> Firebase Authentication or Firestore REST API
  -> Firestore collections
```

Firebase configuration:

- [services/firebase-config.js](services/firebase-config.js)

REST and local-storage adapter:

- [services/api-service.js](services/api-service.js)

Domain services:

- [services/category-service.js](services/category-service.js)
- [services/product-service.js](services/product-service.js)
- [services/customer-service.js](services/customer-service.js)
- [services/order-service.js](services/order-service.js)
- [services/auth-service.js](services/auth-service.js)
- [services/customer-auth-service.js](services/customer-auth-service.js)

Firestore mode is enabled through `FIREBASE_CONFIG.useFirebase`.

## 4. Firestore collections

Firestore does not have SQL-style `CREATE TABLE` statements. Collections are
created lazily when the first Firestore document is written.

| Collection | Purpose | Sample seed records | Live verified documents |
|---|---|---:|---:|
| `categories` | Product categories | 6 | 1 |
| `products` | Product catalogue and stock | 25 | 1 |
| `customers` | Customers and credit limits | 10 | 1 |
| `orders` | Purchases and payment/order status | 13 | 0 |
| `inventoryLog` | Inventory change history | 6 | 0 |
| `customerProfiles` | Customer delivery details | 0 | 0 |

Live counts were checked through an authenticated browser session on
2026-11-21. The live count does not include records that exist only in
`services/seed-data.js`.

Where seed data is defined:

- [services/seed-data.js](services/seed-data.js)

The seed file is used only by local-storage/demo mode. It does not
automatically seed Firestore. To populate all Firestore collections, use
Postman or add a deliberate Firebase seed-import routine.

## 5. Data schemas

### categories

```text
ID   string
Name string
```

Example:

```json
{
  "ID": "C01",
  "Name": "Electronics"
}
```

### products

```text
ID          string
Cat_ID      string
Title       string
Description string
Quantity    integer
Price       number
Image       string
Active      boolean
```

### customers

```text
ID          string
Name        string
Email       string
Mobile      string
CreditLimit integer
```

New customer default credit limit is `1000`.

### customerProfiles

```text
Address    string
City       string
State      string
PostalCode string
Country    string
```

### orders

```text
ID            string
CustomerID    string
CustomerName  string
CustomerEmail string
Delivery      map
Items         array
Subtotal      number
Total         number
PaymentMethod Cash | Credit
PaymentStatus Pending | Paid
OrderStatus   Placed | Processing | Shipped | Delivered | Cancelled
CreatedAt     ISO-8601 string
```

### inventoryLog

```text
id        string
action    string
productId string
title     string
detail    string
time      ISO-8601 string
```

## 6. REST API inventory

### Authentication APIs

| Operation | Method | Status |
|---|---|---|
| Sign up customer | `POST /accounts:signUp` | Implemented |
| Sign in | `POST /accounts:signInWithPassword` | Verified in app/Postman |
| Send password reset | `POST /accounts:sendOobCode` | Implemented |

Authentication base:

```text
https://identitytoolkit.googleapis.com/v1/accounts
```

### Category APIs

| Operation | Method | Result |
|---|---|---|
| List categories | `GET /categories` | Implemented |
| Get category | `GET /categories/{ID}` | Implemented |
| Create category | `POST /categories?documentId={ID}` | Implemented |
| Update category | `PATCH /categories/{ID}` | Implemented |
| Delete category | `DELETE /categories/{ID}` | Implemented |

Delete is blocked when a product is linked to the category.

### Product APIs

| Operation | Method | Result |
|---|---|---|
| List products | `GET /products` | Verified |
| Get product | `GET /products/{ID}` | Implemented |
| Create product | `POST /products?documentId={ID}` | Verified |
| Update product | `PATCH /products/{ID}` | Implemented |
| Delete product | `DELETE /products/{ID}` | Implemented |
| Activate/deactivate | `PATCH /products/{ID}` | Implemented |

### Customer APIs

| Operation | Method | Result |
|---|---|---|
| List customers | `GET /customers` | Verified |
| Get customer | `GET /customers/{ID}` | Implemented |
| Create customer | `POST /customers?documentId={ID}` | Implemented |
| Update customer | `PATCH /customers/{ID}` | Implemented |
| Delete customer | `DELETE /customers/{ID}` | Implemented |
| Update credit limit | `PATCH /customers/{ID}` | Implemented |

### Order APIs

| Operation | Method | Result |
|---|---|---|
| List orders | `GET /orders` | Implemented |
| Get order | `GET /orders/{ID}` | Implemented |
| Create order | `POST /orders?documentId={ID}` | Implemented |
| Update order status | `PATCH /orders/{ID}` | Implemented |
| Update payment status | `PATCH /orders/{ID}` | Implemented |

Postman collection:

- [postman/MarketHub.postman_collection.json](postman/MarketHub.postman_collection.json)

Postman guide:

- [POSTMAN_TESTING.md](POSTMAN_TESTING.md)

## 7. Firestore REST rules

The rules file is:

- [firestore.rules](firestore.rules)

Deployment configuration is:

- [firebase.json](firebase.json)
- [.firebaserc](.firebaserc)

Temporary behavior:

- Guests may read `categories` and `products`.
- Authenticated users may read/write protected collections.

Admin role and customer-ownership checks are not yet implemented.
Do not treat the current authenticated-only rules as production authorization.

Deployment command:

```bash
firebase login
firebase deploy --only firestore:rules
```

The deployment account must have Owner or Editor access to project
`ecommerce-3566b`.

## 8. Customer-side status

| Feature | Implementation | Verification |
|---|---|---|
| Homepage | Implemented | Blocked until guest product/category rules deploy |
| Product listing/details | Implemented | Code complete; needs live data and public-read rules |
| Categories | Implemented | Code complete; needs live data and public-read rules |
| Signup | Implemented | Needs end-to-end browser test |
| Login | Implemented | Needs end-to-end browser test |
| Forgot password | Implemented | Requires Firebase email setup |
| Cart | Implemented | Needs browser test |
| Checkout | Implemented | Needs browser test |
| Cash/Credit payment | Implemented | Needs browser test |
| Order history | Implemented | Needs live order test |
| Invoice | Implemented | Needs live order test |

The observed `403 Missing or insufficient permissions` is caused by the old
Firestore rules denying guest reads of `categories` and `products`. Deploying
the prepared rules fixes public catalogue reads.

## 9. Verified end-to-end customer flow

The following browser flow passed on 2026-11-21:

1. Customer signup with Firebase Authentication.
2. UID collision-safe customer document creation.
3. Customer profile creation.
4. Account page showing correct name and `$1,000` credit limit.
5. Authenticated product catalogue loading.
6. P001 added to cart.
7. Cart showed `1` item and a `$129.99` total.
8. Checkout displayed the customer details and order summary.
9. Cash payment selection.
10. Order `ORD1795202774650` created successfully.
11. P001 stock changed from `45` to `44`.
12. Order history displayed the created order.
13. Printable invoice displayed the customer, item, total and payment status.

Remaining guest catalogue issue:

- Logged-in customers can read categories and products.
- Logged-out users remain blocked until the rules in `firestore.rules`
  are published.
- No application-code fallback is used for permission denial.

## 10. Verification performed

- JavaScript syntax checks passed.
- Static server returned HTTP 200.
- Admin login and dashboard loaded.
- Live authenticated Firestore checks returned:
  - categories: 200, 1 document
  - products: 200, 1 document
  - customers: 200, 1 document
  - customerProfiles: 200, 0 documents
  - orders: 200, 0 documents
  - inventoryLog: 200, 0 documents
- Postman collection and environment JSON validated.
- Customer signup page loaded.
- Customer homepage returned 403 until guest-read rules are deployed.

## 11. Remaining production work

- Deploy the prepared Firestore rules.
- Import or create complete seed collections in Firestore.
- Complete end-to-end customer signup/login/cart/checkout tests.
- Add secure Admin custom claims.
- Add customer-owned order/profile security rules.
- Make stock updates and order creation transactional.
- Replace demo login/storage behavior with production authentication.
