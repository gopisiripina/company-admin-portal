// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBN3lNOyRE8CvryHEugiK0yPvmMnLEKASc",
  authDomain: "admin-portal-d653d.firebaseapp.com",
  projectId: "admin-portal-d653d",
  storageBucket: "admin-portal-d653d.firebasestorage.app",
  messagingSenderId: "74369448585",
  appId: "1:74369448585:web:26a267a156b9b8d8b36458"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;