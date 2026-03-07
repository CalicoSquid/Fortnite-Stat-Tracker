import { LinearGradient } from "expo-linear-gradient";
import { View, Text, StyleSheet } from "react-native";

const PURPLE = "#8b5cf6";

export default function MentalBar({ value }: { value: number }) {
  const fillPercent = (value / 10) * 100;
  
  return (
    <View style={styles.mentalWrap}>
      <View style={styles.mentalLabelRow}>
        <Text style={styles.mentalLabel}>MENTAL STATE</Text>
        <Text style={styles.mentalVal}>{value.toFixed(1)} / 10</Text>
      </View>
      <View style={styles.mentalTrack}>
        <LinearGradient
          colors={["#ef4444", "#f59e0b", "#22c55e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.mentalFill, { width: `${fillPercent}%` }]}
        />
      </View>
      <View style={styles.mentalEndLabels}>
        <Text style={styles.mentalEndLbl}>Tilted</Text>
        <Text style={styles.mentalEndLbl}>Locked In</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
   mentalWrap: { marginTop: 16 },
  mentalLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  mentalLabel: { color: "#555", fontSize: 10, letterSpacing: 2, fontWeight: "600" },
  mentalVal: { color: PURPLE, fontSize: 12, fontWeight: "700" },
  mentalTrack: {
    height: 5,
    backgroundColor: "#1a1a28",
    borderRadius: 3,
    overflow: "hidden",
  },
  mentalFill: {
    height: "100%",
    borderRadius: 3,
  },
  mentalEndLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  mentalEndLbl: { color: "#444", fontSize: 9, letterSpacing: 1 },
});
