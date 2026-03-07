import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useGoogleSignIn } from "../../hooks/useGoogleSignin";

const PURPLE = "#8b5cf6";
const AMBER = "#f59e0b";
const BG = "#0d0d14";
const CARD_BG = "#0f0f1a";
const BORDER = "#1e1e30";

type Props = {
  onSuccess?: () => void;
  onDismiss?: () => void;
};

export function ProUpgradeSheet({ onSuccess, onDismiss }: Props) {
  const { loading, error, signIn } = useGoogleSignIn();

  const handleUpgrade = async () => {
    const result = await signIn();
    if (result.success) onSuccess?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.topBorder} />

        <Text style={styles.label}>⚡ HIGH GROUND PRO</Text>
        <Text style={styles.heading}>Take Your Stats{"\n"}To The Cloud</Text>

        {/* Feature list */}
        <View style={styles.features}>
          {[
            "☁️  Stats backed up to the cloud",
            "📱  Access from any device",
            "🔒  Secured to your Google account",
            "📊  Advanced analytics (coming soon)",
          ].map((f) => (
            <Text key={f} style={styles.feature}>{f}</Text>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={styles.btn}
          onPress={handleUpgrade}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>SIGN IN WITH GOOGLE</Text>
          )}
        </Pressable>

        <Pressable onPress={onDismiss}>
          <Text style={styles.dismiss}>Maybe later</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 28,
    alignItems: "center",
    gap: 20,
    overflow: "hidden",
  },
  topBorder: {
    position: "absolute",
    top: 0, left: 40, right: 40,
    height: 2,
    backgroundColor: AMBER,
    opacity: 0.8,
  },
  label: {
    color: AMBER,
    fontFamily: "BurbankBlack",
    fontSize: 12,
    letterSpacing: 3,
  },
  heading: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 28,
    letterSpacing: 2,
    textAlign: "center",
    lineHeight: 36,
  },
  features: {
    alignSelf: "stretch",
    gap: 12,
  },
  feature: {
    color: "#888",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  error: {
    color: "#ef4444",
    fontSize: 12,
    textAlign: "center",
  },
  btn: {
    alignSelf: "stretch",
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 16,
    letterSpacing: 3,
  },
  dismiss: {
    color: "#444",
    fontSize: 12,
    letterSpacing: 1,
  },
});