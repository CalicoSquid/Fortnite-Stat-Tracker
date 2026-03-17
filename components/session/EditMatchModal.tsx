import React, { useState, useEffect } from "react";
import {
  View, Text, Modal, Pressable, TouchableOpacity,
  TextInput, ActivityIndicator, StyleSheet, Alert,
  Keyboard, KeyboardEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import SkinPicker from "@/components/add-match/SkinPicker";
import { Skin } from "@/app/_layout";
import gradientColors from "@/constants/gradient";

const PURPLE   = "#8b5cf6";
const BLUE     = "#3b82f6";
const AMBER    = "#f59e0b";
const CARD_BG  = "#0f0f1a";
const INNER_BG = "#0a0a12";
const BORDER   = "#1e1e30";
const RED      = "#ef4444";

interface Props {
  match: any;
  sessionId: string;
  uid: string;
  matches: any[];
  skins: Skin[];
  onClose: () => void;
  onSaved: () => void;
}

function modeColor(mode: string) {
  return mode === "OG" ? PURPLE : mode === "BR" ? BLUE : AMBER;
}

function recalcSession(updatedMatches: any[]) {
  const totalMatches     = updatedMatches.length;
  const totalKills       = updatedMatches.reduce((s, m) => s + (m.kills ?? 0), 0);
  const averagePlacement = totalMatches
    ? updatedMatches.reduce((s, m) => s + (m.placement ?? 0), 0) / totalMatches : 0;
  const averageMental    = totalMatches
    ? updatedMatches.reduce((s, m) => s + (m.mentalState ?? 5), 0) / totalMatches : 0;
  const wins             = updatedMatches.filter((m) => m.placement === 1).length;
  const winPercentage    = totalMatches ? (wins / totalMatches) * 100 : 0;
  return { totalMatches, totalKills, averagePlacement, averageMental, wins, winPercentage };
}

export default function EditMatchModal({
  match, sessionId, uid, matches, skins, onClose, onSaved,
}: Props) {
  const [editKills,     setEditKills]     = useState(match?.kills?.toString() ?? "0");
  const [editPlacement, setEditPlacement] = useState(match?.placement?.toString() ?? "1");
  const [editNotes,     setEditNotes]     = useState(match?.notes ?? "");
  const [editMental,    setEditMental]    = useState(match?.mentalState ?? 5);
  const [editSkinId,    setEditSkinId]    = useState(match?.skinId ?? "");
  const [saving,        setSaving]        = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const accent = modeColor(match?.mode ?? "BR");

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleSave = async () => {
    if (!match?.id) return;
    setSaving(true);
    try {
      const matchRef = doc(db, "users", uid, "matches", match.id);
      await updateDoc(matchRef, {
        kills:       parseInt(editKills)     || 0,
        placement:   parseInt(editPlacement) || 1,
        notes:       editNotes,
        mentalState: editMental,
        skinId:      editSkinId,
      });

      const updatedMatches = matches.map((m) =>
        m.id === match.id
          ? { ...m, kills: parseInt(editKills) || 0, placement: parseInt(editPlacement) || 1, mentalState: editMental }
          : m,
      );
      await updateDoc(doc(db, "users", uid, "sessions", sessionId), recalcSession(updatedMatches));

      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save match:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Match",
      "This match will be permanently removed and your session stats will be recalculated. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!match?.id) return;
            setSaving(true);
            try {
              await deleteDoc(doc(db, "users", uid, "matches", match.id));
              const remaining = matches.filter((m) => m.id !== match.id);
              await updateDoc(
                doc(db, "users", uid, "sessions", sessionId),
                recalcSession(remaining),
              );
              onSaved();
              onClose();
            } catch (err) {
              console.error("Failed to delete match:", err);
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={!!match} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable
          style={[s.sheet, { marginBottom: keyboardHeight }]}
          onPress={() => Keyboard.dismiss()}
        >
          {/* Accent */}
          <View style={[s.topAccent, { backgroundColor: accent }]} />

          {/* Handle */}
          <View style={s.handle} />

          {/* Title + mode */}
          <View style={s.titleRow}>
            <Text style={s.title}>EDIT MATCH</Text>
            <View style={[s.modePill, { backgroundColor: accent + "22" }]}>
              <Text style={[s.modeText, { color: accent }]}>{match?.mode}</Text>
            </View>
          </View>

          {/* Skin */}
          <Text style={s.sectionLabel}>SKIN</Text>
          <SkinPicker skins={skins} value={editSkinId} onChange={setEditSkinId} />

          {/* Kills + Placement */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionLabel}>KILLS</Text>
              <TextInput
                style={s.input}
                value={editKills}
                onChangeText={setEditKills}
                keyboardType="number-pad"
                placeholderTextColor="#444"
                placeholder="0"
                maxLength={3}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionLabel}>PLACEMENT</Text>
              <TextInput
                style={s.input}
                value={editPlacement}
                onChangeText={setEditPlacement}
                keyboardType="number-pad"
                placeholderTextColor="#444"
                placeholder="1"
                maxLength={3}
              />
            </View>
          </View>

          {/* Mental */}
          <View style={s.mentalLabelRow}>
            <Text style={s.sectionLabel}>MENTAL STATE</Text>
            <Text style={[s.mentalVal, { color: gradientColors[editMental - 1] as string }]}>
              {editMental} / 10
            </Text>
          </View>
          <View style={s.sliderContainer}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <Pressable
                key={n}
                onPress={() => setEditMental(n)}
                style={[s.sliderStep, {
                  backgroundColor: n <= editMental
                    ? gradientColors[n - 1] as string
                    : "#1e1e2e",
                }]}
              />
            ))}
          </View>
          <View style={s.sliderLabels}>
            <Text style={s.sliderLbl}>Tilted</Text>
            <Text style={s.sliderLbl}>Locked In</Text>
          </View>

          {/* Notes */}
          <Text style={s.sectionLabel}>NOTES</Text>
          <TextInput
            style={s.notesInput}
            value={editNotes}
            onChangeText={setEditNotes}
            placeholder="Optional notes..."
            placeholderTextColor="#444"
            multiline
            maxLength={200}
            returnKeyType="done"
            blurOnSubmit={true}
          />

          {/* Save / Cancel */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <TouchableOpacity
              style={[s.btn, { flex: 1, borderWidth: 1, borderColor: BORDER }]}
              onPress={onClose}
            >
              <Text style={[s.btnText, { color: "#555" }]}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, { flex: 2, backgroundColor: PURPLE }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.btnText}>SAVE</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Delete */}
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={handleDelete}
            disabled={saving}
          >
            <Ionicons name="trash-outline" size={14} color={RED} style={{ opacity: 0.7 }} />
            <Text style={s.deleteBtnText}>DELETE MATCH</Text>
          </TouchableOpacity>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: BORDER,
    padding: 24,
    paddingBottom: 44,
    gap: 12,
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 60,
    right: 60,
    height: 2,
    opacity: 0.7,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: BORDER,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  title: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 18,
    letterSpacing: 3,
  },
  modePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  modeText:     { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  sectionLabel: { color: "#555", fontSize: 10, letterSpacing: 2, fontWeight: "600", marginBottom: 8 },

  input: {
    backgroundColor: INNER_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  notesInput: {
    backgroundColor: INNER_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 12,
    color: "#aaa",
    fontSize: 13,
    fontWeight: "400",
    minHeight: 60,
    textAlignVertical: "top",
  },

  mentalLabelRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mentalVal:        { fontSize: 13, fontWeight: "700" },
  sliderContainer:  { flexDirection: "row", gap: 4 },
  sliderStep:       { flex: 1, height: 22, borderRadius: 4 },
  sliderLabels:     { flexDirection: "row", justifyContent: "space-between" },
  sliderLbl:        { color: "#444", fontSize: 10, letterSpacing: 1 },

  btn: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 2 },

  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: RED + "30",
    borderRadius: 10,
    paddingVertical: 13,
  },
  deleteBtnText: { color: RED, fontSize: 12, fontWeight: "700", letterSpacing: 2, opacity: 0.7 },
});