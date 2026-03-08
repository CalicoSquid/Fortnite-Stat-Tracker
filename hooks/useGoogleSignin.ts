import { useState } from "react";
import { signInWithGoogle, GoogleSignInResult } from "../services/googleAuth";
import { FLAGS } from "../constants/flags";

type SignInState = {
  googleLoading: boolean;
  error: string | null;
};

export function useGoogleSignIn() {
  const [state, setState] = useState<SignInState>({
    googleLoading: false,
    error: null,
  });

  const signIn = async (): Promise<GoogleSignInResult> => {
    if (!FLAGS.PRO_ENABLED) {
      return { success: false, cancelled: false, error: "Pro not enabled yet" };
    }

    setState({ googleLoading: true, error: null });

    const result = await signInWithGoogle();

    if (!result.success && !result.cancelled) {
      setState({
        googleLoading: false,
        error: result.error ?? "Sign in failed",
      });
    } else {
      setState({ googleLoading: false, error: null });
    }

    return result;
  };

  const clearError = () => setState((s) => ({ ...s, error: null }));

  return { ...state, signIn, clearError };
}
