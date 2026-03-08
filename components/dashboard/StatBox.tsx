import { View, Text, StyleSheet } from "react-native";

const INNER_BG = "#0a0a12";
const PURPLE = "#8b5cf6";

type Props = {
  label: string;
  value: string;
  accent?: boolean;
};

export function StatBox({ label, value, accent }: Props) {
  return (
    <View style={[styles.statBox, accent && styles.statBoxAccent]}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statBox: {
    width: "47%",
    backgroundColor: INNER_BG,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#16162a",
  },
  statBoxAccent: {
    borderColor: "rgba(139,92,246,0.3)",
  },
  statValue: {
    fontFamily: "BurbankBlack",
    fontSize: 18,
    color: "#fff",
    marginBottom: 2,
  },
  statValueAccent: {
    color: "#a78bfa",
  },
  statLabel: {
    fontSize: 9,
    color: "#555",
    letterSpacing: 1.5,
    fontWeight: "600",
  },
});