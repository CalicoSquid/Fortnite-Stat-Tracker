import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";

const PURPLE = "#8b5cf6";
const PURPLE_DARK = "#7c3aed";

export default function StormEye() {
  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const ring3 = useRef(new Animated.Value(1)).current;

  const pulseRing = (anim: Animated.Value, delay: number) =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1.06, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );

  useEffect(() => {
    pulseRing(ring1, 0).start();
    pulseRing(ring2, 400).start();
    pulseRing(ring3, 800).start();
  }, []);

  return (
    <View style={s.container}>
      <Animated.View style={[s.ring, s.ring1, { transform: [{ scale: ring1 }] }]} />
      <Animated.View style={[s.ring, s.ring2, { transform: [{ scale: ring2 }] }]} />
      <Animated.View style={[s.ring, s.ring3, { transform: [{ scale: ring3 }] }]} />
      <View style={s.core}>
        <Text style={s.emoji}>⚡</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: 130,
    height: 130,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  ring: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 1,
  },
  ring1: { width: 130, height: 130, borderColor: "rgba(139,92,246,0.12)" },
  ring2: { width: 94, height: 94, borderColor: "rgba(139,92,246,0.22)" },
  ring3: { width: 62, height: 62, borderColor: "rgba(139,92,246,0.38)" },
  core: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PURPLE_DARK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PURPLE,
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  emoji: { fontSize: 17 },
});