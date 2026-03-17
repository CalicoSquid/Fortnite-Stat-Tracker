import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CARD_BG = "#0f0f1a";

export function EmptyTrophy({ label }: { label: string }) {
  return (
    <View style={s.card}>
      <Ionicons name="lock-closed-outline" size={22} color="#333" />
      <Text style={s.label}>{label}</Text>
      <Text style={s.val}>—</Text>
      <Text style={s.sub}>Not unlocked yet</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#16162a",
    padding: 14,
    gap: 6,
    overflow: "hidden",
    alignItems: "center",
    paddingVertical: 20,
    opacity: 0.5,
  },
  label: {
    color: "#444",
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  val: {
    color: "#333",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 6,
  },
  sub: {
    color: "#2a2a3a",
    fontSize: 9,
    letterSpacing: 0.5,
  },
});