import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../screens/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

const WALLET_KEY = "CURRENT_WALLET_ID";

/* =============================
   INIT WALLET
============================= */
export const initWallet = async () => {
  let walletId = await AsyncStorage.getItem(WALLET_KEY);

  if (!walletId) {
    walletId = uuidv4();

    await setDoc(doc(db, "wallets", walletId), {
      months: {},
      createdAt: Date.now(),
    });

    await AsyncStorage.setItem(WALLET_KEY, walletId);
  }

  return walletId;
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
  const walletRef = await getWalletRef();

  // setDoc with merge prevents crash
  await setDoc(walletRef, data, { merge: true });
};

/* =============================
   REAL-TIME LISTENER
============================= */
export const listenToWallet = async (callback) => {
  const walletRef = await getWalletRef();

  return onSnapshot(walletRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    }
  });
};
