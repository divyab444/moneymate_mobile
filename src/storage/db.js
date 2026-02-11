import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../screens/firebase";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteField,
} from "firebase/firestore";

const WALLET_KEY = "CURRENT_WALLET_ID";

const generateId = () => {
  return (
    "wallet_" +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 8)
  );
};

/* =============================
   INIT WALLET
============================= */
export const initWallet = async () => {
  let walletId = await AsyncStorage.getItem("CURRENT_WALLET_ID");

  if (!walletId) {
    walletId = generateId();
    await AsyncStorage.setItem("CURRENT_WALLET_ID", walletId);
  }

  const walletRef = doc(db, "wallets", walletId);
  const snap = await getDoc(walletRef);

  if (!snap.exists()) {
    await setDoc(walletRef, {
      months: {},
      createdAt: Date.now(),
    });
  }

  return walletId;
};

export const deleteMonthFromWallet = async (monthName) => {
  try {
    const walletRef = await getWalletRef();

    await updateDoc(walletRef, {
      [`months.${monthName}`]: deleteField(),
    });
  } catch (e) {
    console.log("deleteMonthFromWallet error:", e);
  }
};

export const updateWallet = async (updater) => {
  try {
    const walletRef = await getWalletRef();
    const snap = await getDoc(walletRef);

    const data = snap.exists() ? snap.data() : { months: {} };
    const updated = updater(data);

    await setDoc(walletRef, updated, { merge: true });
  } catch (e) {
    console.log("updateWallet error:", e);
  }
};

/* =============================
   GET WALLET REF
============================= */
export const getWalletRef = async () => {
  let walletId = await AsyncStorage.getItem(WALLET_KEY);

  if (!walletId) {
    walletId = await initWallet();
  }

  return doc(db, "wallets", walletId);
};

/* =============================
   GET DB (One Time Fetch)
============================= */
export const getDB = async () => {
  const walletRef = await getWalletRef();
  const snap = await getDoc(walletRef);

  if (!snap.exists()) {
    await setDoc(walletRef, { months: {} });
    return { months: {} };
  }

  return snap.data();
};

/* =============================
   SAVE DB (Safe Write)
============================= */
export const saveDB = async (data) => {
  try {
    const walletRef = await getWalletRef();
    await setDoc(walletRef, data, { merge: true });
  } catch (e) {
    console.log("saveDB error:", e);
  }
};

/* =============================
   REAL-TIME LISTENER
============================= */
export const listenToWallet = async (callback) => {
  const walletRef = await getWalletRef();

  return onSnapshot(walletRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() || { months: {} });
    }
  });
};
