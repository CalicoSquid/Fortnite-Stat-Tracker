import { View, Text, ScrollView, StyleSheet } from "react-native";
import { globalStyles as styles } from "../constants/styles";
import { Stack } from "expo-router";

// Placeholder graph component
export default function GraphsScreen() {
  return (
    <ScrollView contentContainerStyle={screenStyles.container}>
            <Stack.Screen options={{ title: "Graphs" } } />
      <Text style={styles.title}>Graphs</Text>

      <Text style={screenStyles.subtitle}>Match Performance Over Time</Text>
      <View style={screenStyles.graphPlaceholder}>
        <Text style={screenStyles.graphText}>[Graph placeholder]</Text>
      </View>

      <Text style={screenStyles.subtitle}>Kills Per Mode</Text>
      <View style={screenStyles.graphPlaceholder}>
        <Text style={screenStyles.graphText}>[Graph placeholder]</Text>
      </View>

      <Text style={screenStyles.subtitle}>Average Mental State</Text>
      <View style={screenStyles.graphPlaceholder}>
        <Text style={screenStyles.graphText}>[Graph placeholder]</Text>
      </View>
    </ScrollView>
  );
}

const screenStyles = StyleSheet.create(     {
  container: {
    flexGrow: 1,
    backgroundColor: "#111",
    alignItems: "center" as const,
    padding: 20,
  },
  subtitle: {
    color: "#fff",
    fontSize: 18,
    marginVertical: 15,
    alignSelf: "flex-start" as const,
  },
  graphPlaceholder: {
    width: "100%",
    height: 150,
    backgroundColor: "#222",
    borderRadius: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 20,
  },
  graphText: {
    color: "#aaa",
  },
});
