import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";

const PURPLE = "#8b5cf6";
const CARD_BG = "#0f0f1a";
const BORDER = "#1e1e30";

interface Props {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accentColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function AnalyticsCard({
  icon,
  title,
  subtitle,
  accentColor = PURPLE,
  children,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const anim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    setOpen(!open);
    Animated.spring(anim, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={[s.card, open && { borderColor: accentColor + "40" }]}>
      <TouchableOpacity style={s.cardHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={s.cardIconWrap}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{title}</Text>
          <Text style={s.cardSubtitle}>{subtitle}</Text>
        </View>
        <Animated.Text style={[s.chevron, { transform: [{ rotate }] }]}>
          ›
        </Animated.Text>
      </TouchableOpacity>
      {open && (
        <Animated.View style={{ opacity: anim }}>
          <View style={[s.cardAccentLine, { backgroundColor: accentColor }]} />
          <View style={s.cardDivider} />
          <View style={s.cardBody}>{children}</View>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ffffff08",
    borderWidth: 1,
    borderColor: "#ffffff0a",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardSubtitle: { color: "#555", fontSize: 10, letterSpacing: 0.5 },
  chevron: { color: "#555", fontSize: 24, fontWeight: "300" },
  cardDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },
  cardBody: { padding: 16 },
  cardAccentLine: {
    height: 2,
    marginHorizontal: 40,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    opacity: 0.6,
  },
});