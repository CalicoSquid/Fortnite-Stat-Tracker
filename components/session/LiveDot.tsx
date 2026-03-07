import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";

const GREEN = "#22c55e";

export default function LiveDot() {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.2, duration: 750, useNativeDriver: true, easing: Easing.ease }),
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true, easing: Easing.ease }),
      ])
    ).start();
  }, []);

  return (
    <View style={s.liveBadge}>
      <Animated.View style={[s.liveDot, { opacity: anim }]} />
      <Text style={s.liveText}>LIVE SESSION</Text>
    </View>
  );
}

const s = StyleSheet.create({
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  liveText: { color: GREEN, fontSize: 11, letterSpacing: 3, fontWeight: "700" },
});