import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from "firebase/firestore";
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

const app = initializeApp(firebaseConfig);

let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch {
  db = initializeFirestore(app, {});
}

const auth = getAuth(app);

export { db, auth };
