import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";

// ── Types ──────────────────────────────────────────────────────────────────

export type AuthState = {
  user: User | null;
  isPro: boolean;
  isAnonymous: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

// ── Context ────────────────────────────────────────────────────────────────

const DEFAULT: AuthState = {
  user: null,
  isPro: false,
  isAnonymous: true,
  loading: true,
  refreshUser: async () => {},
};

export const AuthContext = createContext<AuthState>(DEFAULT);

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

// ── Intentional sign out flag ──────────────────────────────────────────────

let intentionalSignOut = false;

export function markIntentionalSignOut() {
  intentionalSignOut = true;
}

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(DEFAULT);

  const refreshUser = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    await firebaseUser.reload();
    setState((prev) => ({
      ...prev,
      user: firebaseUser,
      isPro: !firebaseUser.isAnonymous,
      isAnonymous: firebaseUser.isAnonymous,
      loading: false,
    }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log(
          "AUTH STATE:",
          firebaseUser.uid,
          "isAnonymous:",
          firebaseUser.isAnonymous,
        );
        setState({
          user: firebaseUser,
          isPro: !firebaseUser.isAnonymous,
          isAnonymous: firebaseUser.isAnonymous,
          loading: false,
          refreshUser,
        });
      } else {
        if (intentionalSignOut) {
          intentionalSignOut = false;
          setState({
            user: null,
            isPro: false,
            isAnonymous: true,
            loading: false,
            refreshUser,
          });
        } else {
          try {
            await signInAnonymously(auth);
          } catch (err) {
            console.error("Anonymous sign-in failed:", err);
            setState({
              user: null,
              isPro: false,
              isAnonymous: true,
              loading: false,
              refreshUser,
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (state.loading) return null;

  return (
    <AuthContext.Provider value={{ ...state, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}