import { useAuth } from "../services/authProvider";
import { FLAGS } from "../constants/flags";

export function usePro() {
  const { user, isPro, isAnonymous } = useAuth();

  return {
    isPro: FLAGS.PRO_ENABLED && isPro,
    isAnonymous,
    isSignedIn: !!user && !isAnonymous,
    // Use this to gate Pro UI — returns false until flag is flipped
    canAccessPro: FLAGS.PRO_ENABLED && isPro,
  };
}