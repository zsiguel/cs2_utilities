/* ============================================================
   firebase-config.js — Firebase app + Firestore initialisation
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
  getFirestore,
  collection, doc,
  getDoc, getDocs,
  setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCl973oWjlAZq86l1L7-gYr2ZEbNscxzDg",
  authDomain:        "cs2-utilities.firebaseapp.com",
  projectId:         "cs2-utilities",
  storageBucket:     "cs2-utilities.firebasestorage.app",
  messagingSenderId: "456437995552",
  appId:             "1:456437995552:web:f6d6fc3996522382a3c445",
  measurementId:     "G-KCXVTV5Y9K"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

export { db, collection, doc, getDoc, getDocs, setDoc, deleteDoc };
