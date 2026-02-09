import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAH_j4-6PrfMRy7mGVTsBmCusZuA5pHD10",
  authDomain: "moneymate-d2644.firebaseapp.com",
  projectId: "moneymate-d2644",
  storageBucket: "moneymate-d2644.firebasestorage.app",
  messagingSenderId: "328156378699",
  appId: "1:328156378699:web:f65266221188530e283fce",
  measurementId: "G-EM9GGBK2T1"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
