import { View, Text, FlatList } from "react-native";
import { globalStyles as styles } from "../constants/styles";
import { Stack } from "expo-router";

interface Match {
  date: string;
  mode: string;
  placement: number;
  kills: number;
  skinId: string;
  mentalState: number;
  notes: string;
}

// Placeholder data
const dummyMatches: Match[] = [
  {
    date: "2026-02-15",
    mode: "Solo",
    placement: 1,
    kills: 5,
    skinId: "Aura",
    mentalState: 8,
    notes: "Felt good!",
  },
  {
    date: "2026-02-14",
    mode: "Duo",
    placement: 3,
    kills: 7,
    skinId: "Ragnarok",
    mentalState: 6,
    notes: "Crazy lobby!",
  },
  {
    date: "2026-02-13",
    mode: "Squad",
    placement: 2,
    kills: 10,
    skinId: "Drift",
    mentalState: 9,
    notes: "We carried!",
  },
];

export default function ViewDataScreen() {
  return (
    <View style={screenStyles.container}>
      <Stack.Screen options={{ title: "Your Data" }} />
      <Text style={styles.title}>View Matches</Text>

      <FlatList
        data={dummyMatches}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={screenStyles.matchCard}>
            <Text style={screenStyles.matchText}>
              {item.date} | {item.mode} | Placement: {item.placement} | Kills:{" "}
              {item.kills}
            </Text>
            <Text style={screenStyles.matchText}>
              Skin: {item.skinId} | Mental: {item.mentalState} | Notes:{" "}
              {item.notes}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const screenStyles = {
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 20,
  },
  matchCard: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  matchText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Georgia",
  },
};
