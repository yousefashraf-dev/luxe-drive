// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // بنستورد قاعدة البيانات
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

// بنجهز الـ DB عشان نستخدمها في أي مكان في الموقع
export const db = getFirestore(app);
const auth = getAuth(app);
export { db, auth };