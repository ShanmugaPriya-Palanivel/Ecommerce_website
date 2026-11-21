/* ================================================================
   Firebase Configuration — MarketHub Online Shopping
   ================================================================
   INSTRUCTIONS:
   1. Go to https://console.firebase.google.com
   2. Create / open your project
   3. Project Settings → General → Your apps → Web app → Config
   4. Copy the values below from your Firebase console
   5. Set useFirebase: true  when ready to use real Firebase
   ================================================================ */

window.FIREBASE_CONFIG = {
  /* Set to true once you have filled in the values below */
  useFirebase: true,

  /* ---- COPY FROM: Firebase Console → Project Settings → General ---- */
  apiKey:            "AIzaSyCPDwgYUi5YJvGSYwsMLWApNPj9XXlzWcM",
  authDomain:        "ecommerce-3566b.firebaseapp.com",
  projectId:         "ecommerce-3566b",
  storageBucket:     "ecommerce-3566b.firebasestorage.app",
  messagingSenderId: "828184004596",
  appId:             "1:828184004596:web:ff4c7a9c62699a23935ba1",

  /* ---- DERIVED URLS (auto-built from projectId — do not change) ---- */
  /* Firestore REST base:  https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents */
  /* Auth REST base:       https://identitytoolkit.googleapis.com/v1/accounts */

  /* Helper to get the Firestore documents base URL */
  get firestoreEndpoint() {
    if (!this.projectId) return "";
    return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  },

  /* Helper to get the Firebase Auth base URL */
  get authEndpoint() {
    return "https://identitytoolkit.googleapis.com/v1/accounts";
  }
};
