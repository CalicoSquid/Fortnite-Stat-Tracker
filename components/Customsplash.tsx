// components/CustomSplash.tsx
import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  Easing,
  Dimensions,
  StyleSheet,
} from "react-native";

const { width, height } = Dimensions.get("window");

const PURPLE = "#8b5cf6";
const PURPLE_DARK = "#7c3aed";
const BG = "#0d0d14";

type Props = {
  onFinished: () => void;
};

export default function CustomSplash({ onFinished }: Props) {
  // Ring pulse anims
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const ring4 = useRef(new Animated.Value(0)).current;
  const coreScale = useRef(new Animated.Value(0)).current;
  const coreGlow = useRef(new Animated.Value(0)).current;

  // Text anims
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // Exit anim
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Rings expand in staggered
      Animated.stagger(120, [
        Animated.timing(ring1, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(ring2, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(ring3, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(ring4, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),

      // 2. Core pops in
      Animated.parallel([
        Animated.spring(coreScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(coreGlow, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),

      // 3. Title slides up
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),

      // 4. Tagline fades in
      Animated.timing(taglineOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),

      // 5. Hold for a moment
      Animated.delay(600),

      // 6. Fade out entire splash
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => onFinished());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>

      {/* ── Rings ── */}
      <View style={styles.ringsContainer}>

        <Animated.View style={[styles.ring, styles.ring1, {
          opacity: ring1,
          transform: [{ scale: ring1.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        }]} />

        <Animated.View style={[styles.ring, styles.ring2, {
          opacity: ring2,
          transform: [{ scale: ring2.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        }]} />

        <Animated.View style={[styles.ring, styles.ring3, {
          opacity: ring3,
          transform: [{ scale: ring3.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        }]} />

        <Animated.View style={[styles.ring, styles.ring4, {
          opacity: ring4,
          transform: [{ scale: ring4.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        }]} />

        {/* Core */}
        <Animated.View style={[styles.core, {
          transform: [{ scale: coreScale }],
          shadowOpacity: coreGlow,
        }]}>
          <Text style={styles.bolt}>⚡</Text>
        </Animated.View>

      </View>

      {/* ── Text ── */}
      <Animated.View style={[styles.textBlock, {
        opacity: titleOpacity,
        transform: [{ translateY: titleY }],
      }]}>
        <Text style={styles.title}>HIGH GROUND</Text>
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          TRACK · ANALYZE · DOMINATE
        </Animated.Text>
      </Animated.View>

    </Animated.View>
  );
}

const RING_BASE = Math.min(width * 0.78, 340);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    width,
    height,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    gap: 48,
  },

  ringsContainer: {
    width: RING_BASE,
    height: RING_BASE,
    alignItems: "center",
    justifyContent: "center",
  },

  ring: {
    position: "absolute",
    borderRadius: 999,
    borderStyle: "solid",
  },
  ring1: {
    width: RING_BASE,
    height: RING_BASE,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.12)",
  },
  ring2: {
    width: RING_BASE * 0.76,
    height: RING_BASE * 0.76,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
  },
  ring3: {
    width: RING_BASE * 0.54,
    height: RING_BASE * 0.54,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.38)",
  },
  ring4: {
    width: RING_BASE * 0.35,
    height: RING_BASE * 0.35,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.55)",
  },

  core: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: PURPLE_DARK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PURPLE,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  bolt: {
    fontSize: 34,
    lineHeight: 38,
  },

  textBlock: {
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontFamily: "BurbankBlack",
    fontSize: 48,
    color: "#ffffff",
    letterSpacing: 6,
    textAlign: "center",
  },
  tagline: {
    fontSize: 11,
    color: "#555",
    letterSpacing: 3,
    fontWeight: "600",
    textAlign: "center",
  },
});