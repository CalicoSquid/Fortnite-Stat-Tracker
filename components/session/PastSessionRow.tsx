import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Session } from "@/types/session";

const CARD_BG = "#0f0f1a";
const BORDER = "#1e1e30";

function formatDate(date: Date) {
  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
}

export default function PastSessionRow({ session }: { session: Session }) {
  return (
    <Pressable
      style={s.row}
      onPress={() =>
        router.push({
          pathname: "/session/[sessionId]",
          params: { sessionId: session.id as string },
        })
      }
    >
      <View>
        <Text style={s.date}>{formatDate(session.createdAt)}</Text>
        <Text style={s.matches}>{session.totalMatches} matches</Text>
      </View>
      <View style={s.stats}>
        <View style={s.stat}>
          <Text style={s.statVal}>{session.totalKills}</Text>
          <Text style={s.statLbl}>KILLS</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statVal}>{session.averagePlacement.toFixed(1)}</Text>
          <Text style={s.statLbl}>AVG</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.statVal}>{session.wins ?? 0}</Text>
          <Text style={s.statLbl}>WINS</Text>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    backgroundColor: CARD_BG,
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a1a28",
  },
  date: { color: "#888", fontSize: 12, letterSpacing: 1, marginBottom: 3 },
  matches: { color: "#444", fontSize: 10, letterSpacing: 0.5 },
  stats: { flexDirection: "row", gap: 16 },
  stat: { alignItems: "flex-end" },
  statVal: { color: "#fff", fontSize: 15, fontWeight: "700" },
  statLbl: { color: "#444", fontSize: 9, letterSpacing: 1.5, fontWeight: "600" },
});