import { View, Text, StyleSheet } from "react-native";
import { usePro } from "../../hooks/usePro";

const AMBER = "#f59e0b";
const BORDER = "#1e1e30";

export function ProBadge() {
  const { isPro } = usePro();
  if (!isPro) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>⚡ PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AMBER,
    backgroundColor: "rgba(245,158,11,0.1)",
  },
  text: {
    color: AMBER,
    fontSize: 10,
    fontFamily: "BurbankBlack",
    letterSpacing: 1.5,
  },
});