import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Public Firebase web config. The apiKey here is an identifier, not a secret -
// access is governed by Auth + Firestore security rules, so it's safe to ship.
const firebaseConfig = {
  apiKey: "AIzaSyAvdBz6rZmTVz-HHoosy9bgpmJQR4j7SMI",
  authDomain: "dynasty-tracker-9ead0.firebaseapp.com",
  projectId: "dynasty-tracker-9ead0",
  storageBucket: "dynasty-tracker-9ead0.firebasestorage.app",
  messagingSenderId: "691222619607",
  appId: "1:691222619607:web:b68e6328b07c42efb69792",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// In local dev, talk to the Firebase emulators instead of the real project so
// tests never touch production data. (No effect in the built/deployed app.)
if (import.meta.env.DEV && location.hostname === "localhost") {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
}
