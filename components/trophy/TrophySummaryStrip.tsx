import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TrophySummary } from "@/hooks/useTrophyStats";

const CARD_BG = "#0f0f1a";
const BORDER = "#1e1e30";
const PURPLE = "#8b5cf6";
const AMBER = "#f59e0b";
const BLUE = "#3b82f6";
const RED = "#ef4444";

interface TrophySummaryStripProps {
  summary: TrophySummary;
}

export function TrophySummaryStrip({ summary }: TrophySummaryStripProps) {
  const items = [
    { label: "MATCHES", value: summary.totalMatches.toString(), color: PURPLE },
    { label: "TOTAL WINS", value: summary.totalWins.toString(), color: AMBER },
    {
      label: "TOTAL KILLS",
      value: summary.totalKills.toLocaleString(),
      color: RED,
    },
    {
      label: "SESSIONS",
      value: summary.endedSessions.toString(),
      color: BLUE,
    },
  ];

  return (
    <View style={s.strip}>
      {items.map((item, i) => (
        <View
          key={item.label}
          style={[
            s.item,
            i < items.length - 1 && { borderRightWidth: 1, borderColor: BORDER },
          ]}
        >
          <Text style={[s.val, { color: item.color }]}>{item.value}</Text>
          <Text style={s.lbl}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  strip: {
    flexDirection: "row",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    marginBottom: 4,
  },
  item: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  val: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  lbl: {
    color: "#444",
    fontSize: 7,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
});