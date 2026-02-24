import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useState, useContext } from "react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { AuthContext } from "../services/authProvider";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../services/firebase";
import { globalStyles as styles } from "../constants/styles";
import gradientColors from "@/constants/gradient";

export default function AddMatchScreen() {
  const user = useContext(AuthContext);
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [mode, setMode] = useState("Solo");
  const [skin, setSkin] = useState("aura");
  const [placement, setPlacement] = useState<number | null>(null);
  const [kills, setKills] = useState<number | null>(null);
  const [mentalState, setMentalState] = useState(5);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);


  if (!user)
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Authenticating...</Text>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );

  if (!sessionId)
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No session ID provided.</Text>
      </View>
    );

  const handleSubmit = async () => {
    if (placement === null || kills === null) {
      Alert.alert("Please fill Placement and Kills!");
      return;
    }

    setLoading(true);

    const newMatch = {
      sessionId, // important!
      date: new Date(),
      mode,
      placement,
      kills,
      skinId: skin,
      mentalState,
      notes,
    };

    try {
      const matchesRef = collection(db, "users", user.uid, "matches");
      await addDoc(matchesRef, newMatch);

      Alert.alert("Match logged!");
      setPlacement(null);
      setKills(null);
      setMentalState(5);
      setNotes("");

      // Go back to session screen (will now update in real-time)
      router.replace({ pathname: "/session/[sessionId]", params: { sessionId } });
    } catch (error) {
      console.error("Failed to log match:", error);
      Alert.alert("Error logging match");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        backgroundColor: "#111",
        alignItems: "stretch",
      }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: "Add Match" }} />

      {/* Mode Picker */}
      <Text style={styles.subtitle}>Mode</Text>
      <View style={formStyles.pickerContainer}>
        <Picker
          selectedValue={mode}
          onValueChange={setMode}
          style={formStyles.picker}
        >
          <Picker.Item label="Solo" value="Solo" />
          <Picker.Item label="Duo" value="Duo" />
          <Picker.Item label="Squad" value="Squad" />
        </Picker>
      </View>

      {/* Skin Picker */}
      <Text style={styles.subtitle}>Skin</Text>
      <View style={formStyles.pickerContainer}>
        <Picker
          selectedValue={skin}
          onValueChange={setSkin}
          style={formStyles.picker}
        >
          <Picker.Item label="Aura" value="aura" />
          <Picker.Item label="Ragnarok" value="ragnarok" />
          <Picker.Item label="Drift" value="drift" />
        </Picker>
      </View>

      {/* Placement */}
      <Text style={styles.subtitle}>Placement</Text>
      <TextInput
        keyboardType="numeric"
        style={formStyles.input}
        value={placement?.toString() || ""}
        onChangeText={(t) => setPlacement(Number(t))}
        placeholder="1-100"
        placeholderTextColor="#888"
      />

      {/* Kills */}
      <Text style={styles.subtitle}>Kills</Text>
      <TextInput
        keyboardType="numeric"
        style={formStyles.input}
        value={kills?.toString() || ""}
        onChangeText={(t) => setKills(Number(t))}
        placeholder="0"
        placeholderTextColor="#888"
      />

      {/* Mental State */}
      <Text style={styles.subtitle}>Mental State: {mentalState}</Text>
      <View style={formStyles.sliderContainer}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((i) => (
          <Pressable
            key={i}
            onPress={() => setMentalState(i)}
            style={[
              formStyles.sliderStep,
              {
                backgroundColor:
                  i <= mentalState ? gradientColors[i - 1] : "#555",
              },
            ]}
          />
        ))}
      </View>

      {/* Notes */}
      <Text style={styles.subtitle}>Notes</Text>
      <TextInput
        style={formStyles.textArea}
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional notes"
        placeholderTextColor="#888"
        multiline
      />

      {/* Submit */}
      <Pressable
        style={formStyles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log Match</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const formStyles = StyleSheet.create({
  pickerContainer: {
    borderColor: "#8b5cf6",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    overflow: "hidden",
  },
  picker: { color: "white", backgroundColor: "#222" },
  input: {
    borderColor: "#8b5cf6",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: "white",
    backgroundColor: "#222",
    marginBottom: 15,
  },
  textArea: {
    borderColor: "#8b5cf6",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: "white",
    backgroundColor: "#222",
    height: 80,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  sliderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  sliderStep: { flex: 1, height: 20, marginHorizontal: 2, borderRadius: 4 },
});
