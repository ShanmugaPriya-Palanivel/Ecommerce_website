# MarketHub Firebase API Testing in Postman

## Insert one complete seed record into every collection

In Firestore, a collection is created automatically when you create the first
document. You do not need to create a table before a collection.

Before starting:

1. Open Postman.
2. Select the **MarketHub Firebase** environment.
3. Run **Auth -> Admin Sign In**.
4. Confirm that `idToken` contains the token returned by Firebase.

If you use the URL directly instead of Postman variables, replace:

- `YOUR_API_KEY` with the `apiKey` in `services/firebase-config.js`
- `YOUR_ID_TOKEN` with the `idToken` returned by the Admin Sign In request

Every request below uses:

```text
Method: POST
Authorization: Bearer YOUR_ID_TOKEN
Content-Type: application/json
Body: raw -> JSON
```

Do not add the Authorization header to the Auth Sign In request.

### 1. Create category C01

Exact URL:

```text
https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/categories?documentId=C01&key=YOUR_API_KEY
```

Body:

```json
{
  "fields": {
    "ID": {
      "stringValue": "C01"
    },
    "Name": {
      "stringValue": "Electronics"
    }
  }
}
```

Send. Verify with:

```text
GET https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/categories/C01?key=YOUR_API_KEY
```

### 2. Create product P001

Exact URL:

```text
https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/products?documentId=P001&key=YOUR_API_KEY
```

Body:

```json
{
  "fields": {
    "ID": {
      "stringValue": "P001"
    },
    "Cat_ID": {
      "stringValue": "C01"
    },
    "Title": {
      "stringValue": "Wireless Noise-Cancelling Headphones"
    },
    "Description": {
      "stringValue": "Over-ear Bluetooth headphones with active noise cancellation."
    },
    "Quantity": {
      "integerValue": "45"
    },
    "Price": {
      "doubleValue": 129.99
    },
    "Image": {
      "stringValue": "assets/images/products/wireless-noise-cancelling-headphones.jpg"
    },
    "Active": {
      "booleanValue": true
    }
  }
}
```

Verify:

```text
GET https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/products/P001?key=YOUR_API_KEY
```

### 3. Create customer CU001

Exact URL:

```text
https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/customers?documentId=CU001&key=YOUR_API_KEY
```

Body:

```json
{
  "fields": {
    "ID": {
      "stringValue": "CU001"
    },
    "Name": {
      "stringValue": "Aarav Sharma"
    },
    "Email": {
      "stringValue": "aarav.sharma@example.com"
    },
    "Mobile": {
      "stringValue": "9876543210"
    },
    "CreditLimit": {
      "integerValue": "1000"
    }
  }
}
```

Verify:

```text
GET https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/customers/CU001?key=YOUR_API_KEY
```

### 4. Create customer profile for CU001

Exact URL:

```text
https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/customerProfiles?documentId=CU001&key=YOUR_API_KEY
```

Body:

```json
{
  "fields": {
    "Address": {
      "stringValue": "12 MG Road"
    },
    "City": {
      "stringValue": "Bengaluru"
    },
    "State": {
      "stringValue": "Karnataka"
    },
    "PostalCode": {
      "stringValue": "560001"
    },
    "Country": {
      "stringValue": "India"
    }
  }
}
```

Verify:

```text
GET https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/customerProfiles/CU001?key=YOUR_API_KEY
```

### 5. Create order ORD1700000001

Exact URL:

```text
https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/orders?documentId=ORD1700000001&key=YOUR_API_KEY
```

Body:

```json
{
  "fields": {
    "ID": {
      "stringValue": "ORD1700000001"
    },
    "CustomerID": {
      "stringValue": "CU001"
    },
    "CustomerName": {
      "stringValue": "Aarav Sharma"
    },
    "CustomerEmail": {
      "stringValue": "aarav.sharma@example.com"
    },
    "Delivery": {
      "mapValue": {
        "fields": {
          "address": { "stringValue": "12 MG Road" },
          "city": { "stringValue": "Bengaluru" },
          "state": { "stringValue": "Karnataka" },
          "postal": { "stringValue": "560001" },
          "country": { "stringValue": "India" }
        }
      }
    },
    "Items": {
      "arrayValue": {
        "values": [
          {
            "mapValue": {
              "fields": {
                "ID": { "stringValue": "P001" },
                "Title": { "stringValue": "Wireless Noise-Cancelling Headphones" },
                "Price": { "doubleValue": 129.99 },
                "Quantity": { "integerValue": "1" }
              }
            }
          }
        ]
      }
    },
    "Subtotal": {
      "doubleValue": 129.99
    },
    "Total": {
      "doubleValue": 129.99
    },
    "PaymentMethod": {
      "stringValue": "Cash"
    },
    "PaymentStatus": {
      "stringValue": "Pending"
    },
    "OrderStatus": {
      "stringValue": "Placed"
    },
    "CreatedAt": {
      "stringValue": "2026-11-20T08:30:00.000Z"
    }
  }
}
```

Verify:

```text
GET https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/orders/ORD1700000001?key=YOUR_API_KEY
```

### 6. Create inventory log L1700000001

Exact URL:

```text
https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/inventoryLog?documentId=L1700000001&key=YOUR_API_KEY
```

Body:

```json
{
  "fields": {
    "id": {
      "stringValue": "L1700000001"
    },
    "action": {
      "stringValue": "Added"
    },
    "productId": {
      "stringValue": "P001"
    },
    "title": {
      "stringValue": "Wireless Noise-Cancelling Headphones"
    },
    "detail": {
      "stringValue": "Opening stock 45"
    },
    "time": {
      "stringValue": "2026-11-20T08:30:00.000Z"
    }
  }
}
```

Verify:

```text
GET https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/inventoryLog/L1700000001?key=YOUR_API_KEY
```

## Current project status

Verified:

- Admin authentication in the browser
- Category, customer and inventory Firestore updates
- Direct Postman login and Firestore document access
- Postman collection/environment JSON

Customer storefront status:

- The existing pages and flow are implemented.
- The public homepage currently requires public reads for `categories` and
  `products`; guest loading will return `403` until the guest-read rules in
  this guide are published.
- Customer signup/login, cart, credit-payment and checkout logic are present,
  but remain part of the browser-level testing checklist below.

This guide tests Firebase Authentication and Cloud Firestore REST APIs with Postman.

## The two important URLs

### 1. Browser application URL

The application uses a **local static server**:

```text
http://localhost:8080
```

Use this only to open the website:

```text
http://localhost:8080/admin/login.html
http://localhost:8080/customer/home.html
```

Localhost does not contain your Firebase data API.

### 2. Firebase REST API URL

Authentication and Firestore use Firebase's public HTTPS endpoints:

```text
https://identitytoolkit.googleapis.com/v1/
https://firestore.googleapis.com/v1/
```

Use these URLs inside Postman. Your project ID is `ecommerce-3566b`.

## Start the application

No Python is required.

### Option A: Live Server

1. Install **Live Server** in VS Code.
2. Open the project folder.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

### Option B: npm static server

```bash
npm install
npm start
```

Open `http://localhost:8080`.

## Import the prepared Postman files

Import:

```text
postman/MarketHub.postman_collection.json
postman/MarketHub.postman_environment.json
```

In Postman:

1. Select **Import**.
2. Import both files.
3. Select environment **MarketHub Firebase**.
4. Set `apiKey` to the Firebase Web API key.
5. Set `adminEmail` and `adminPassword` as needed.

## Authentication request

Request: **Auth -> Admin Sign In**

The request is:

```text
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={{apiKey}}
```

Raw JSON body:

```json
{
  "email": "{{adminEmail}}",
  "password": "{{adminPassword}}",
  "returnSecureToken": true
}
```

Click **Send**. A successful response contains `idToken`.

The collection test script automatically saves the response `idToken` into the
environment. You do not copy it manually for later requests.

## Firestore list request

Request: **Firestore -> List Products**

URL:

```text
GET {{firestoreUrl}}/products?key={{apiKey}}
```

Authorization header:

```text
Bearer {{idToken}}
```

If the product collection is empty, Postman returns an empty `documents`
array or no `documents` property.

## Read one exact product document

Use the document path returned by Firebase. A document path has this order:

```text
products / <DOCUMENT_ID>
```

For this exact document:

```text
products/IQ7A8HYb3athB98h99AG
```

The complete Postman URL is:

```text
GET https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/products/IQ7A8HYb3athB98h99AG?key=YOUR_API_KEY
```

For **all products**, remove the document ID:

```text
GET https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/products?key=YOUR_API_KEY
```

For **one product with a known ID such as P999**, replace only the final
document ID:

```text
GET https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents/products/P999?key=YOUR_API_KEY
```

Add this header to every GET request:

```text
Authorization: Bearer YOUR_ID_TOKEN
```

Replace `YOUR_API_KEY` with the `apiKey` value in
`services/firebase-config.js`. Replace `YOUR_ID_TOKEN` with the `idToken`
returned by **Auth -> Admin Sign In**.

## Create a product with a custom ID

Request: **Firestore -> Create Product P999**

URL:

```text
POST {{firestoreUrl}}/products?documentId=P999&key={{apiKey}}
```

Authorization header:

```text
Bearer {{idToken}}
```

Body is already configured in the collection. Send it once to create
`products/P999`.

## Create a category

Request: **Firestore -> Create Category C99**

URL:

```text
POST {{firestoreUrl}}/categories?documentId=C99&key={{apiKey}}
```

Body:

```json
{
  "fields": {
    "ID": { "stringValue": "C99" },
    "Name": { "stringValue": "Postman Test Category" }
  }
}
```

## Create a customer

Request: **Firestore -> Create Customer CU999**

URL:

```text
POST {{firestoreUrl}}/customers?documentId=CU999&key={{apiKey}}
```

Body:

```json
{
  "fields": {
    "ID": { "stringValue": "CU999" },
    "Name": { "stringValue": "Postman Customer" },
    "Email": { "stringValue": "postman.customer@example.com" },
    "Mobile": { "stringValue": "9876543210" },
    "CreditLimit": { "integerValue": "1000" }
  }
}
```

## Get, update and delete a product

Get:

```text
GET {{firestoreUrl}}/products/P999?key={{apiKey}}
```

Update:

```text
PATCH {{firestoreUrl}}/products/P999?key={{apiKey}}
```

Update body:

```json
{
  "fields": {
    "Quantity": { "integerValue": "30" },
    "Price": { "doubleValue": 109.99 }
  }
}
```

Delete:

```text
DELETE {{firestoreUrl}}/products/P999?key={{apiKey}}
```

For every Firestore request, use:

```text
Authorization: Bearer {{idToken}}
```

## Create an order

Request: **Firestore -> Create Order ORD999**

URL:

```text
POST {{firestoreUrl}}/orders?documentId=ORD999&key={{apiKey}}
```

The body contains customer, delivery, items and payment fields.

## Update order status

Request: **Firestore -> Update Order Status**

URL:

```text
PATCH {{firestoreUrl}}/orders/ORD999?key={{apiKey}}
```

Body:

```json
{
  "fields": {
    "OrderStatus": { "stringValue": "Shipped" }
  }
}
```

Valid values:

```text
Placed
Processing
Shipped
Delivered
Cancelled
```

## Update payment status

Request: **Firestore -> Mark Order Paid**

URL:

```text
PATCH {{firestoreUrl}}/orders/ORD999?key={{apiKey}}
```

Body:

```json
{
  "fields": {
    "PaymentStatus": { "stringValue": "Paid" }
  }
}
```

## Password reset

Request: **Auth -> Send Password Reset**

URL:

```text
POST https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={{apiKey}}
```

Body:

```json
{
  "requestType": "PASSWORD_RESET",
  "email": "customer@example.com"
}
```

## Customer sign-up

Request: **Auth -> Customer Sign Up**

URL:

```text
POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={{apiKey}}
```

Body:

```json
{
  "email": "customer@example.com",
  "password": "Customer@123",
  "returnSecureToken": true
}
```

## Troubleshooting

### 400 Bad Request

The request body or URL is malformed. For Firestore typed values:

- Text: `{ "stringValue": "text" }`
- Whole number: `{ "integerValue": "25" }`
- Decimal: `{ "doubleValue": 99.99 }`
- Boolean: `{ "booleanValue": true }`

Do not use normal JSON numbers inside `integerValue`. It must be a string.

### 403 Missing or insufficient permissions

Publish temporary development rules:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /categories/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /orders/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /customers/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /customerProfiles/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /inventoryLog/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This temporary setup allows guests to view categories and products while
keeping customers, orders and inventory protected by Authentication.
It is still not production-safe; replace it with Admin role checks and
customer-owned order/profile rules before deployment.

Then run **Auth -> Admin Sign In** again.

### 404 Not Found

Check that Firestore is created and that the project ID is `ecommerce-3566b`.

### 401 Unauthorized

Run the sign-in request again and allow the collection test script to refresh
`idToken`.
