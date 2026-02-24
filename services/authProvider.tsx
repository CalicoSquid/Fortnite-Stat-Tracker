// services/AuthProvider.tsx
import React, { createContext, useEffect, useState, ReactNode } from "react";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, User } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext<User | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const autoLogin = async () => {
      try {
        // Try to read stored credentials
        const email = await AsyncStorage.getItem("email");
        const password = await AsyncStorage.getItem("password");

        if (email && password) {
          // Attempt Firebase sign-in
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          setUser(userCredential.user);
          console.log("Auto-login successful:", userCredential.user.email);
        }
      } catch (err) {
        console.log("Auto-login failed:", err);
      } finally {
        setLoading(false);
      }
    };

    autoLogin();
  }, []);

  // Optional logout function
  const logout = async () => {
    await auth.signOut();
    await AsyncStorage.removeItem("email");
    await AsyncStorage.removeItem("password");
    setUser(null);
  };

  if (loading) return null; // you can replace with a spinner if you like

  return (
    <AuthContext.Provider value={user}>
      {children}
    </AuthContext.Provider>
  );
}
