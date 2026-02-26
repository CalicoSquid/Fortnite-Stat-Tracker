// services/firebase.ts

import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
const firebaseConfig = {
  apiKey: "AIzaSyDzLmGquu7OjF9etnt6JYdY73PMrg25lf0",
  authDomain: "high-ground-2190e.firebaseapp.com",
  projectId: "high-ground-2190e",
  storageBucket: "high-ground-2190e.firebasestorage.app",
  messagingSenderId: "445814891600",
  appId: "1:445814891600:web:a8525a4ec1db04d48f1d55",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);
