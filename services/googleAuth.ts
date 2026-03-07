import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import {
  GoogleAuthProvider,
  linkWithCredential,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "./firebase";
import { markIntentionalSignOut } from "./authProvider";

export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: "445814891600-km7n29gavqfp16gm2geb7rh2i3h1k5tg.apps.googleusercontent.com",
  });
}

export type GoogleSignInResult =
  | { success: true }
  | { success: false; cancelled: boolean; error?: string };

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  let idToken: string | null = null; // ← declared outside try so catch can access it

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const signInResult = await GoogleSignin.signIn();
    idToken = signInResult.data?.idToken ?? null;

    if (!idToken) {
      return { success: false, cancelled: false, error: "No ID token returned" };
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const currentUser = auth.currentUser;

    if (currentUser?.isAnonymous) {
      await linkWithCredential(currentUser, credential);
    } else {
      await signInWithCredential(auth, credential);
    }

    return { success: true };

  } catch (err: any) {
    if (err.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false, cancelled: true };
    }
    if (err.code === statusCodes.IN_PROGRESS) {
      return { success: false, cancelled: false, error: "Sign in already in progress" };
    }
    // Google account already exists in Firebase — sign in directly instead of linking
    if (
      err.code === "auth/email-already-in-use" ||
      err.code === "auth/credential-already-in-use"
    ) {
      if (idToken) {
        try {
          const credential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, credential);
          return { success: true };
        } catch (fallbackErr: any) {
          console.error("[googleAuth] Fallback sign in failed:", fallbackErr);
          return { success: false, cancelled: false, error: fallbackErr.message };
        }
      }
    }

    console.error("[googleAuth] Sign in failed:", err);
    return { success: false, cancelled: false, error: err.message };
  }
}

export async function signOutGoogle(): Promise<void> {
  try {
    markIntentionalSignOut(); // ← set flag before signing out
    await GoogleSignin.signOut();
    await auth.signOut();
  } catch (err) {
    console.error("[googleAuth] Sign out failed:", err);
  }
}