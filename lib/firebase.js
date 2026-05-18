// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
const firebaseConfig = {
  apiKey: "AIzaSyBDUMJRbzFB1sqJxwFycIefTKuQ1U2meMM",
  authDomain: "luxe-drive-db.firebaseapp.com",
  projectId: "luxe-drive-db",
  storageBucket: "luxe-drive-db.firebasestorage.app",
  messagingSenderId: "828335145810",
  appId: "1:828335145810:web:17ff2610d03dee6151f08b",
  measurementId: "G-5CLK53L5X4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);
// Enable offline persistence (caches data on device for instant reloads)
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence not supported in this browser');
    }
  });
}

const auth = getAuth(app);
export { db, auth };