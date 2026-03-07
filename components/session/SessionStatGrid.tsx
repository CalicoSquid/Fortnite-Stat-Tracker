import React from "react";
import { View, Text, StyleSheet } from "react-native";

const PURPLE = "#8b5cf6";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const INNER_BG = "#0a0a12";

interface Props {
  totalMatches: number;
  wins: number;
  winPercentage: number;
  totalKills: number;
  averagePlacement: number;
  totalKillsPerMatch: number;
}

export default function SessionStatGrid({
  totalMatches,
  wins,
  winPercentage,
  totalKills,
  averagePlacement,
  totalKillsPerMatch,
}: Props) {
  const stats = [
    { label: "MATCHES", value: totalMatches.toString(), color: "#fff" },
    { label: "WINS", value: wins.toString(), color: AMBER },
    { label: "WIN %", value: winPercentage.toFixed(1), color: AMBER },
    { label: "KILLS", value: totalKills.toString(), color: RED },
    { label: "AVG PLACE", value: averagePlacement.toFixed(1), color: PURPLE },
    { label: "K/D", value: totalKillsPerMatch.toFixed(2), color: RED },
  ];

  return (
    <View style={s.statGrid}>
      {stats.map((item) => (
        <View key={item.label} style={s.statBox}>
          <Text style={[s.statNum, { color: item.color }]}>{item.value}</Text>
          <Text style={s.statLbl}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: {
    flex: 1,
    minWidth: "28%",
    backgroundColor: INNER_BG,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#16162a",
  },
  statNum: { fontSize: 24, fontWeight: "700", lineHeight: 28, marginBottom: 4 },
  statLbl: { color: "#555", fontSize: 9, letterSpacing: 1.5, fontWeight: "600" },
});