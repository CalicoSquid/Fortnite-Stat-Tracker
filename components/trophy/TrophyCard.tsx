import React, { useRef, useEffect } from "react";
import { Animated, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CARD_BG = "#0f0f1a";
const BORDER = "#1e1e30";
const GOLD = "#FFD700";
const SILVER = "#94a3b8";
const BRONZE = "#cd7f32";

interface TrophyCardProps {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sub: string;
  color: string;
  delay?: number;
  tier?: "gold" | "silver" | "bronze";
}

export function TrophyCard({
  iconName,
  label,
  value,
  sub,
  color,
  delay = 0,
  tier = "bronze",
}: TrophyCardProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
      delay,
    }).start();
  }, []);

  const tierColor =
    tier === "gold" ? GOLD : tier === "silver" ? SILVER : BRONZE;

  return (
    <Animated.View
      style={[
        s.card,
        {
          borderColor: color + "35",
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[s.accent, { backgroundColor: color }]} />
      <View style={[s.tierDot, { backgroundColor: tierColor }]} />

      <View style={[s.iconWrap, { backgroundColor: color + "15" }]}>
        <Ionicons name={iconName} size={22} color={color} />
      </View>

      <Text style={s.label}>{label}</Text>
      <Text style={[s.value, { color }]}>{value}</Text>
      <Text style={s.sub} numberOfLines={2}>
        {sub}
      </Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    overflow: "hidden",
    alignItems: "flex-start",
  },
  accent: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1.5,
    opacity: 0.6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  tierDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  label: {
    color: "#444",
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "BurbankBlack",
    letterSpacing: 0.5,
  },
  sub: {
    color: "#555",
    fontSize: 9,
    lineHeight: 13,
  },
});