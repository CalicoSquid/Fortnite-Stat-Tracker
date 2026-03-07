import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const PURPLE = "#8b5cf6";
const BLUE = "#3b82f6";
const AMBER = "#f59e0b";
const INNER_BG = "#0a0a12";

const MENTAL_GRADIENT = [
  "#ff3b3b","#ff6f3b","#ff993b","#ffcc3b","#ffff3b",
  "#ccff3b","#99ff3b","#66ff3b","#33ff3b","#00ff00",
];

interface Props {
  match: any;
  onPress: () => void;
}

export default function MatchListItem({ match, onPress }: Props) {
  const isWin = match.placement === 1;
  const mColor = MENTAL_GRADIENT[Math.min((match.mentalState ?? 5) - 1, 9)];
  const modeColor =
    match.mode === "OG" ? PURPLE : match.mode === "BR" ? BLUE : AMBER;

  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.modePill, { backgroundColor: modeColor + "22" }]}>
        <Text style={[s.modePillText, { color: modeColor }]}>{match.mode}</Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 10 }}>
        {!!match.notes
          ? <Text style={s.notes} numberOfLines={1}>{match.notes}</Text>
          : <Text style={s.noNotes}>No notes</Text>
        }
      </View>

      <View style={{ alignItems: "flex-end", gap: 2 }}>
        <Text style={[s.placement, isWin && { color: AMBER }]}>
          {isWin ? "👑 #1" : `#${match.placement}`}
        </Text>
        <Text style={s.kills}>{match.kills} kills</Text>
      </View>

      <View style={[s.mentalDot, { backgroundColor: mColor }]} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INNER_BG,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#16162a",
    gap: 8,
  },
  modePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  modePillText: { fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  notes: { color: "#666", fontSize: 10 },
  noNotes: { color: "#333", fontSize: 10, fontStyle: "italic" },
  placement: { color: "#fff", fontSize: 13, fontWeight: "700" },
  kills: { color: "#555", fontSize: 10, fontWeight: "600" },
  mentalDot: { width: 7, height: 7, borderRadius: 4 },
});