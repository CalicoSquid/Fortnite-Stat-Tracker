import { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  ActivityIndicator,
  StyleSheet,
  Easing,
} from "react-native";
import { useGoogleSignIn } from "../hooks/useGoogleSignin";

const PURPLE = "#8b5cf6";
const PURPLE_DARK = "#7c3aed";
const BG = "#0d0d14";
const CARD_BG = "#0f0f1a";
const BORDER = "#1e1e30";

export default function LoginScreen() {
  const { signIn, googleLoading, error } = useGoogleSignIn();

  const btnScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(32)).current;
  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const ring3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(80),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.delay(80),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.5, duration: 1400, useNativeDriver: true }),
      ])
    ).start();

    const pulseRing = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1.06, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      );
    pulseRing(ring1, 0).start();
    pulseRing(ring2, 400).start();
    pulseRing(ring3, 800).start();
  }, []);

  return (
    <View style={styles.container}>

      {/* ── Rings ── */}
      <View style={styles.ringsContainer}>
        <Animated.View style={[styles.ring, styles.ring1, { transform: [{ scale: ring1 }] }]} />
        <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: ring2 }] }]} />
        <Animated.View style={[styles.ring, styles.ring3, { transform: [{ scale: ring3 }] }]} />
        <View style={styles.ringCore}>
          <Text style={styles.ringCoreEmoji}>⚡</Text>
        </View>
      </View>

      {/* ── Title ── */}
      <Animated.View style={[styles.titleBlock, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
        <Text style={styles.appName}>HIGH GROUND</Text>
        <Text style={styles.tagline}>Track. Analyze. Dominate.</Text>
      </Animated.View>

      {/* ── Card ── */}
      <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
        <View style={styles.cardTopBorder} />

        <Text style={styles.cardTitle}>WELCOME BACK</Text>
        <Text style={styles.cardSub}>Sign in to access your stats.</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Animated.View style={{
          shadowOpacity: glowOpacity,
          shadowColor: PURPLE,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
          alignSelf: "stretch",
        }}>
          <Pressable
            style={styles.googleBtn}
            onPress={signIn}
            onPressIn={() => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start()}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleBtnText}>SIGN IN WITH GOOGLE</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        <Text style={styles.disclaimer}>Pro account · Stats backed up to cloud</Text>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 32,
  },
  ringsContainer: {
    width: 180, height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
  },
  ring1: { width: 180, height: 180, borderColor: "rgba(139,92,246,0.1)" },
  ring2: { width: 130, height: 130, borderColor: "rgba(139,92,246,0.2)" },
  ring3: { width: 86, height: 86, borderColor: "rgba(139,92,246,0.35)" },
  ringCore: {
    width: 52, height: 52,
    borderRadius: 26,
    backgroundColor: PURPLE_DARK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PURPLE,
    shadowOpacity: 0.8,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  ringCoreEmoji: { fontSize: 24 },
  titleBlock: {
    alignItems: "center",
    gap: 6,
  },
  appName: {
    fontFamily: "BurbankBlack",
    fontSize: 42,
    color: "#fff",
    letterSpacing: 4,
    textAlign: "center",
  },
  tagline: {
    color: "#555",
    fontSize: 13,
    letterSpacing: 2,
    textAlign: "center",
    fontWeight: "600",
  },
  card: {
    width: "100%",
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    alignItems: "center",
    gap: 16,
    overflow: "hidden",
  },
  cardTopBorder: {
    position: "absolute",
    top: 0, left: 40, right: 40,
    height: 2,
    backgroundColor: PURPLE,
    opacity: 0.7,
  },
  cardTitle: {
    fontFamily: "BurbankBlack",
    fontSize: 22,
    color: "#fff",
    letterSpacing: 3,
    textAlign: "center",
  },
  cardSub: {
    color: "#555",
    fontSize: 12,
    letterSpacing: 1,
    textAlign: "center",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  googleBtn: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleIcon: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
  },
  googleBtnText: {
    fontFamily: "BurbankBlack",
    fontSize: 18,
    color: "#fff",
    letterSpacing: 3,
  },
  disclaimer: {
    color: "#333",
    fontSize: 11,
    letterSpacing: 1,
    textAlign: "center",
  },
});