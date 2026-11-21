# Firebase Setup for a New Friend or Developer

This is the only setup guide needed to run this project with a different
Firebase account and project.

## 1. Create a Firebase project

1. Open https://console.firebase.google.com/
2. Click **Create a project**.
3. Enter a project name.
4. Complete the setup.
5. Open **Project settings** from the gear icon beside **Project overview**.
6. Note the **Project ID** in the General tab.

The Project ID is a small public identifier such as:

```text
your-project-name-12345
```

Do not use the numeric Project number. The application needs the Project ID.

## 2. Register the Web app

In **Firebase Console → Project settings → General**:

1. Scroll to **Your apps**.
2. Click **Add app → Web**.
3. Enter an app nickname.
4. You do not need Firebase Hosting for this project.
5. Click **Register app**.
6. Firebase shows a JavaScript configuration object.

Copy the values into:

```text
services/firebase-config.js
```

Replace the blank values:

```javascript
window.FIREBASE_CONFIG = {
  useFirebase: true,

  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_AUTH_DOMAIN",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_STORAGE_BUCKET",
  messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
  appId: "PASTE_APP_ID",

  get firestoreEndpoint() {
    if (!this.projectId) return "";
    return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  },

  get authEndpoint() {
    return "https://identitytoolkit.googleapis.com/v1/accounts";
  }
};
```

Example field locations:

| Firebase config field | Where Firebase shows it |
|---|---|
| `apiKey` | Web app SDK configuration |
| `authDomain` | Web app SDK configuration |
| `projectId` | Web app SDK configuration and Project settings |
| `storageBucket` | Web app SDK configuration |
| `messagingSenderId` | Web app SDK configuration |
| `appId` | Web app SDK configuration |
| `useFirebase` | Set to `true` after filling the values |

The API key is a Firebase Web API key. It is not a service-account private key.
Never add a downloaded JSON service-account private key to this project.

## 3. Enable Authentication

In Firebase Console:

```text
Build → Authentication → Get started
```

Open:

```text
Sign-in method → Email/Password
```

Enable Email/Password and save.

Create the admin user:

```text
Authentication → Users → Add user
```

Use a unique admin email and password. For example:

```text
Email:    admin@example.com
Password: Admin@123
```

Use the same email and password in the application and Postman.

## 4. Create Firestore

In Firebase Console:

```text
Build → Firestore Database → Create database
```

Choose a region when prompted. The database mode can be:

- Production mode for a real application
- Test mode for a short local assignment

For the provided development rules, open **Firestore Database → Rules** and
publish:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /categories/{documentId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /products/{documentId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /customers/{documentId} {
      allow read, write: if request.auth != null;
    }

    match /customerProfiles/{documentId} {
      allow read, write: if request.auth != null;
    }

    match /orders/{documentId} {
      allow read, write: if request.auth != null;
    }

    match /inventoryLog/{documentId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

These rules provide public product/category reads for the customer storefront.
They are for testing and learning. Add Admin roles and customer ownership
checks before production.

## 5. Configure the Postman environment

Import:

```text
postman/MarketHub.postman_collection.json
postman/MarketHub.postman_environment.json
```

Open:

```text
Environments → MarketHub Firebase
```

Set these values:

| Variable | Value |
|---|---|
| `apiKey` | Web app Firebase API key |
| `projectId` | The new Firebase Project ID |
| `firestoreUrl` | `https://firestore.googleapis.com/v1/projects/PROJECT_ID/databases/(default)/documents` |
| `authUrl` | `https://identitytoolkit.googleapis.com/v1/accounts` |
| `adminEmail` | Admin email created in Firebase Authentication |
| `adminPassword` | Admin password |
| `idToken` | Leave blank; login request fills it |

Select **MarketHub Firebase** from the Postman environment dropdown.

## 6. Deploying rules is optional

Firebase CLI deployment is not needed to run the Live Server demo. If
Firestore is enabled later, deploy the rules using a Firebase CLI setup
approved for that environment.

The included `firebase.json` connects the rules file automatically:

```text
firestore.rules
```

## 7. Run the website

Open the project in VS Code, right-click `index.html`, and select
**Open with Live Server**.

Open the Live Server address shown by VS Code, normally:

```text
http://127.0.0.1:5500
```

## 8. Verify the setup

### Browser

Open:

```text
http://127.0.0.1:5500/admin/login.html
```

Log in with the Firebase admin user. Open Inventory or Categories. Create one
record and confirm it appears in Firebase Console under Firestore.

### Postman

Run:

```text
Auth → Admin Sign In
```

Then run:

```text
Firestore → List Products
```

A successful login proves Authentication is configured. A successful product
list proves Firestore REST access and rules are working.

Complete beginner seed instructions are in:

- [POSTMAN_TESTING.md](POSTMAN_TESTING.md)

The complete technical description is in:

- [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md)

## 9. Do not share or zip these values

There is no need to share:

- Firebase service-account private key JSON
- Firebase Admin SDK private key
- Password
- Firebase refresh token
- Postman `idToken`

Do not commit real API credentials or passwords to a public repository.
Firebase Web API keys are public-facing identifiers, but the project should
still use API restrictions and secure security rules.
