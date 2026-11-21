# MarketHub E-commerce

A complete responsive ecommerce application using:

- HTML5
- CSS3
- Vanilla JavaScript
- Firebase Authentication REST API
- Cloud Firestore REST API
- Postman for API testing

No Python application or Python server is used. No Firebase JavaScript SDK is
required because the application uses REST URLs and `fetch()`.

## Run the website

### Recommended: VS Code Live Server

1. Install the **Live Server** extension in VS Code.
2. Open the `Ecommerce-Website` folder.
3. Right-click `index.html`.
4. Select **Open with Live Server**.
5. Open `http://localhost:5500` or the address shown by Live Server.

### Alternative: npm static server

```bash
npm install
npm start
```

Open:

```text
http://localhost:8080
```

Do not open `index.html` using `file://`.

## URLs

Website:

```text
http://localhost:8080
```

Admin login:

```text
http://localhost:8080/admin/login.html
```

Customer store:

```text
http://localhost:8080/customer/home.html
```

Firebase Authentication API used by Postman:

```text
https://identitytoolkit.googleapis.com/v1/accounts
```

Firestore API used by Postman:

```text
https://firestore.googleapis.com/v1/projects/ecommerce-3566b/databases/(default)/documents
```

Your localhost URL is for opening the HTML application. The `googleapis.com`
URLs are Firebase server APIs tested separately in Postman.

## Firebase configuration

The Web app values are stored in:

```text
services/firebase-config.js
```

The file already contains the project configuration with:

```text
Project ID: ecommerce-3566b
Project number: 828184004596
```

Before the application uses Firebase:

1. Enable Email/Password in Firebase Authentication.
2. Create the Firestore Database.
3. Publish temporary development rules for authenticated users.
4. Create the admin Firebase user.

Temporary development rules:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

These rules are not suitable for production.

## Default admin

Create this user in Firebase Authentication:

```text
Email: admin@example.com
Password: Admin@123
```

## Features

- Admin dashboard
- Categories CRUD
- Inventory CRUD
- Customer CRUD
- Credit limit management
- Order list
- Order status updates
- Payment status updates
- Customer report
- Inventory report
- Sales report
- Customer signup/login
- Forgot-password reset through Firebase
- Cart
- Checkout
- Cash/Credit payment selection
- Order history
- Printable invoice

New customer credit limit defaults to `1000`.

## Import seed data into Firebase

Sign in to the Admin dashboard, open the dashboard Quick actions, and click
**Import seed to Firebase**. This writes the existing `categories`, `products`,
`customers`, `orders`, and `inventoryLog` records from
`services/seed-data.js` into the configured Firebase project.

The importer requires an authenticated Firebase admin session. It does not
change the local browser seed data and does not require Postman for normal
seed import.

## New Firebase project setup

Read [FIREBASE_SETUP_FOR_FRIEND.md](FIREBASE_SETUP_FOR_FRIEND.md) before
configuring or running the project. It explains exactly where to find every
Firebase Web app value and how to configure Postman.

## Postman testing

Use the complete guide:

- [POSTMAN_TESTING.md](POSTMAN_TESTING.md)

Import:

- [postman/MarketHub.postman_collection.json](postman/MarketHub.postman_collection.json)
- [postman/MarketHub.postman_environment.json](postman/MarketHub.postman_environment.json)

Postman setup order:

1. Import the environment and collection.
2. Select the `MarketHub Firebase` environment.
3. Run **Auth → Admin Sign In**.
4. Confirm `idToken` is saved into the environment.
5. Run **Firestore → List Products**.
6. Run product, customer, category and order create/update/delete requests.

Postman tests Firebase directly. It does not run JavaScript from the website.
The browser application and Postman share the same Firebase project and data.

## Folder structure

```text
admin/          Admin pages
customer/       Customer store pages
components/     Shared admin HTML components
css/            Stylesheets
js/             Browser JavaScript
services/       REST/API and domain services
assets/         Images and icons
postman/        Postman collection and environment
POSTMAN_TESTING.md
requirements.txt
package.json
```
