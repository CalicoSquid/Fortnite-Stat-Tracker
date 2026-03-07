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
};

// ── Context ────────────────────────────────────────────────────────────────

const DEFAULT: AuthState = {
  user: null,
  isPro: false,
  isAnonymous: true,
  loading: true,
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setState({
          user: firebaseUser,
          isPro: !firebaseUser.isAnonymous,
          isAnonymous: firebaseUser.isAnonymous,
          loading: false,
        });
      } else {
        if (intentionalSignOut) {
          // Pro user logged out deliberately — show login screen
          intentionalSignOut = false;
          setState({ user: null, isPro: false, isAnonymous: true, loading: false });
        } else {
          // Cold start — auto sign in anonymously
          try {
            await signInAnonymously(auth);
            // onAuthStateChanged fires again with the new anonymous user
          } catch (err) {
            console.error("Anonymous sign-in failed:", err);
            setState({ user: null, isPro: false, isAnonymous: true, loading: false });
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (state.loading) return null;

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}