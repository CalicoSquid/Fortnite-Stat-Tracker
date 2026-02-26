// services/AuthProvider.tsx
import React, { createContext, useEffect, useState, ReactNode } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";

export const AuthContext = createContext<User | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state — fires immediately with current user or null
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Already signed in (anonymous or otherwise)
        setUser(firebaseUser);
      } else {
        // No user — sign in anonymously automatically
        try {
          const { user: anonUser } = await signInAnonymously(auth);
          setUser(anonUser);
        } catch (err) {
          console.error("Anonymous sign-in failed:", err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <AuthContext.Provider value={user}>
      {children}
    </AuthContext.Provider>
  );
}