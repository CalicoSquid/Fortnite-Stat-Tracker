import React from "react";
import { View, Text, StyleSheet } from "react-native";

const MENTAL_GRADIENT = [
  "#ff3b3b","#ff6f3b","#ff993b","#ffcc3b","#ffff3b",
  "#ccff3b","#99ff3b","#66ff3b","#33ff3b","#00ff00",
];

const mentalLabel = (val: number) => {
  if (val <= 3) return "TILTED";
  if (val <= 6) return "NEUTRAL";
  if (val <= 8) return "FOCUSED";
  return "LOCKED IN";
};

interface Props {
  averageMental: number;
}

export default function SessionMentalBar({ averageMental }: Props) {
  const mentalColor =
    MENTAL_GRADIENT[Math.min(Math.round(averageMental) - 1, 9)] ?? "#8b5cf6";

  return (
    <View style={s.mentalWrap}>
      <View style={s.mentalLabelRow}>
        <Text style={s.mentalLabel}>MENTAL STATE</Text>
        <Text style={[s.mentalVal, { color: mentalColor }]}>
          {averageMental.toFixed(1)} · {mentalLabel(Math.round(averageMental))}
        </Text>
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
        <Text style={s.mentalEndLbl}>TILTED</Text>
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
    marginBottom: 8,
  },
  mentalLabel: { color: "#555", fontSize: 10, letterSpacing: 2, fontWeight: "600" },
  mentalVal: { fontSize: 12, fontWeight: "700" },
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