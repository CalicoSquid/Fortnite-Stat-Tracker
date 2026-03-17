import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { stateLabel } from "@/constants/analytics";

const MENTAL_GRADIENT = [
  "#ff3b3b","#ff6f3b","#ff993b","#ffcc3b","#ffff3b",
  "#ccff3b","#99ff3b","#66ff3b","#33ff3b","#00ff00",
];

interface Props {
  averageMental: number;
}

export default function SessionMentalBar({ averageMental }: Props) {
  const rounded = Math.min(Math.round(averageMental) - 1, 9);
  const mentalColor = MENTAL_GRADIENT[rounded] ?? "#8b5cf6";

  return (
    <View style={s.mentalWrap}>
      <View style={s.mentalLabelRow}>
        <Text style={s.mentalLabel}>MENTAL STATE</Text>
        <View style={s.mentalValRow}>
          
          <Text style={[s.mentalWordLabel, { color: mentalColor }]}>
            {stateLabel(Math.round(averageMental))}
          </Text>
        </View>
      </View>
      <View style={s.mentalTrack}>
        {MENTAL_GRADIENT.map((color, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              backgroundColor: color,
              opacity: (i + 1) / 10 <= averageMental / 10 ? 1 : 0.12,
            }}
          />
        ))}
      </View>
      <View style={s.mentalEndLabels}>
        <Text style={s.mentalEndLbl}>BROKEN</Text>
        <Text style={s.mentalEndLbl}>LOCKED IN</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  mentalWrap: { marginTop: 18 },
  mentalLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  mentalLabel: { color: "#555", fontSize: 10, letterSpacing: 2, fontWeight: "600" },
  mentalValRow: { alignItems: "flex-end", gap: 1 },
  mentalNum: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  mentalWordLabel: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  mentalTrack: {
    height: 10,
    backgroundColor: "#1a1a28",
    borderRadius: 3,
    overflow: "hidden",
    flexDirection: "row",
  },
  mentalEndLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  mentalEndLbl: { color: "#444", fontSize: 9, letterSpacing: 1 },
});