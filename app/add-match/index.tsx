import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useState, useContext, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { AuthContext } from "../../services/authProvider";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  getDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import gradientColors from "@/constants/gradient";
import { SkinsContext } from "../_layout";
import SkinPicker from "./skin-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

// ─── Constants ────────────────────────────────────────────────────────────────
const PURPLE = "#8b5cf6";
const BG = "#0d0d14";
const CARD_BG = "#0f0f1a";
const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";

export default function AddMatchScreen() {
  const user = useContext(AuthContext);
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { skins, skinLoading } = useContext(SkinsContext);

  const [mode, setMode] = useState("OG");
  const [skin, setSkin] = useState("aura");
  const [placement, setPlacement] = useState<number | null>(null);
  const [kills, setKills] = useState<number | null>(null);
  const [mentalState, setMentalState] = useState(5);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const killsRef = useRef<TextInput>(null);

  if (!user)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );

  if (!sessionId)
    return (
      <View style={styles.centered}>
        <Text style={styles.dimText}>No session ID provided.</Text>
      </View>
    );

  const handlePlacementChange = (t: string) => {
    const value = t.replace(/[^0-9]/g, "");
    if (value === "") return setPlacement(null);
    let num = Number(value);
    num = Math.max(1, Math.min(100, num));
    setPlacement(num);
  };

  const handleKillsChange = (t: string) => {
    const value = t.replace(/[^0-9]/g, "");
    if (value === "") return setKills(null);
    let num = Number(value);
    num = Math.max(0, Math.min(50, num));
    setKills(num);
  };

  const handleSubmit = async () => {
    if (loading || placement === null || kills === null) return;
    setLoading(true);

    const newMatch = {
      sessionId,
      date: serverTimestamp(),
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

      const sessionRef = doc(db, "users", user.uid, "sessions", sessionId);
      const sessionSnap = await getDoc(sessionRef);
      const sessionData = sessionSnap.data();

      if (sessionData) {
        const prevMatches = sessionData.totalMatches ?? 0;
        const newTotalMatches = prevMatches + 1;
        const newTotalKills = (sessionData.totalKills ?? 0) + kills;
        const newTotalPlacement = (sessionData.totalPlacement ?? 0) + placement;
        const newTotalMental = (sessionData.totalMental ?? 0) + mentalState;
        const isWin = placement === 1;

        await updateDoc(sessionRef, {
          totalMatches: newTotalMatches,
          totalKills: newTotalKills,
          totalPlacement: newTotalPlacement,
          totalMental: newTotalMental,
          averagePlacement: newTotalPlacement / newTotalMatches,
          averageMental: newTotalMental / newTotalMatches,
          wins: increment(isWin ? 1 : 0),
          winPercentage: isWin
            ? ((sessionData.wins ?? 0) + 1) / newTotalMatches * 100
            : (sessionData.wins ?? 0) / newTotalMatches * 100,
        });
      }

      setPlacement(null);
      setKills(null);
      setMentalState(5);
      setNotes("");
      router.replace({
        pathname: "/session",
        params: { sessionId },
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error logging match");
    } finally {
      setLoading(false);
    }
  };

  const isValid = placement !== null && kills !== null;

  return (
    <KeyboardAwareScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraScrollHeight={20}
      showsVerticalScrollIndicator={false}
    >
      {/* ── In-screen header ── */}
      <View style={styles.screenHeader}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.replace({ pathname: "/session", params: { sessionId } })}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.screenTitle}>ADD MATCH</Text>
        <View style={styles.spacer} /> 
      </View>

      {/* ── Mode ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>MODE</Text>
        <View style={styles.segmentedRow}>
          {["OG", "BR", "Reload"].map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[
                styles.segmentBtn,
                mode === m ? styles.segmentBtnActive : styles.segmentBtnInactive,
              ]}
            >
              <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>
                {m}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Skin ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>SKIN</Text>
        {skinLoading ? (
          <ActivityIndicator color={PURPLE} />
        ) : (
          <SkinPicker skins={skins} value={skin} onChange={setSkin} />
        )}
      </View>

      {/* ── Placement + Kills ── */}
      <View style={styles.card}>
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.sectionLabel}>PLACEMENT</Text>
            <TextInput
              keyboardType="numeric"
              style={styles.input}
              value={placement?.toString() || ""}
              onChangeText={handlePlacementChange}
              onSubmitEditing={() => killsRef.current?.focus()}
              placeholder="1–100"
              placeholderTextColor="#444"
              returnKeyType="next"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.sectionLabel}>KILLS</Text>
            <TextInput
              ref={killsRef}
              keyboardType="numeric"
              style={styles.input}
              value={kills?.toString() || ""}
              onChangeText={handleKillsChange}
              placeholder="0"
              placeholderTextColor="#444"
            />
          </View>
        </View>
      </View>

      {/* ── Mental State ── */}
      <View style={styles.card}>
        <View style={styles.mentalLabelRow}>
          <Text style={styles.sectionLabel}>MENTAL STATE</Text>
          <Text style={styles.mentalVal}>{mentalState} / 10</Text>
        </View>
        <View style={styles.sliderContainer}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((i) => (
            <Pressable
              key={i}
              onPress={() => setMentalState(i)}
              style={[
                styles.sliderStep,
                { backgroundColor: i <= mentalState ? gradientColors[i - 1] : "#1e1e2e" },
              ]}
            />
          ))}
        </View>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLbl}>Tilted</Text>
          <Text style={styles.sliderLbl}>Locked In</Text>
        </View>
      </View>

      {/* ── Notes ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>NOTES</Text>
        <TextInput
          style={styles.textArea}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes..."
          placeholderTextColor="#444"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* ── Submit ── */}
      <Pressable
        style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!isValid || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>LOG MATCH</Text>
        )}
      </Pressable>
    </KeyboardAwareScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 54,
    paddingBottom: 40,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG,
  },
  dimText: {
    color: "#555",
    fontSize: 13,
  },

  // ── In-screen header ──
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: {
    width: 36,
    height: 36,
  },
  backArrow: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 20,
  },
  screenTitle: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 20,
    letterSpacing: 3,
  },

  // ── Cards ──
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionLabel: {
    color: "#555",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 12,
  },

  // ── Mode segmented ──
  segmentedRow: {
    flexDirection: "row",
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  segmentBtnActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  segmentBtnInactive: {
    backgroundColor: INNER_BG,
    borderColor: "#1e1e2e",
  },
  segmentText: {
    color: "#555",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  segmentTextActive: {
    color: "#fff",
  },

  // ── Inputs ──
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  input: {
    backgroundColor: INNER_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  textArea: {
    backgroundColor: INNER_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },

  // ── Mental state ──
  mentalLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  mentalVal: {
    color: PURPLE,
    fontSize: 13,
    fontWeight: "700",
  },
  sliderContainer: {
    flexDirection: "row",
    gap: 4,
  },
  sliderStep: {
    flex: 1,
    height: 22,
    borderRadius: 4,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sliderLbl: {
    color: "#444",
    fontSize: 10,
    letterSpacing: 1,
  },

  // ── Submit ──
  submitBtn: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    shadowColor: PURPLE,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 18,
    letterSpacing: 3,
  },
});