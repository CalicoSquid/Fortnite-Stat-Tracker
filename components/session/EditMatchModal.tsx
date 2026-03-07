import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import SkinPicker from "@/components/add-match/SkinPicker";
import { Skin } from "@/app/_layout";

const PURPLE = "#8b5cf6";
const BLUE = "#3b82f6";
const AMBER = "#f59e0b";
const CARD_BG = "#0f0f1a";
const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";
const RED = "#ef4444";

const MENTAL_GRADIENT = [
  "#ff3b3b",
  "#ff6f3b",
  "#ff993b",
  "#ffcc3b",
  "#ffff3b",
  "#ccff3b",
  "#99ff3b",
  "#66ff3b",
  "#33ff3b",
  "#00ff00",
];

interface Props {
  match: any;
  sessionId: string;
  uid: string;
  matches: any[];
  skins: Skin[];
  onClose: () => void;
  onSaved: () => void;
}

export default function EditMatchModal({
  match,
  sessionId,
  uid,
  matches,
  skins,
  onClose,
  onSaved,
}: Props) {
  const [editKills, setEditKills] = useState(match?.kills?.toString() ?? "0");
  const [editPlacement, setEditPlacement] = useState(
    match?.placement?.toString() ?? "1",
  );
  const [editNotes, setEditNotes] = useState(match?.notes ?? "");
  const [editMental, setEditMental] = useState(match?.mentalState ?? 5);
  const [editSkinId, setEditSkinId] = useState(match?.skinId ?? "");
  const [saving, setSaving] = useState(false);

  const modeColor =
    match?.mode === "OG" ? PURPLE : match?.mode === "BR" ? BLUE : AMBER;

  const handleSave = async () => {
    if (!match) return;
    setSaving(true);
    try {
      const matchesRef = collection(db, "users", uid, "matches");
      const q = query(
        matchesRef,
        where("sessionId", "==", sessionId),
        where("date", "==", match.date),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          kills: parseInt(editKills) || 0,
          placement: parseInt(editPlacement) || 1,
          notes: editNotes,
          mentalState: editMental,
          skinId: editSkinId,
        });
      }

      // ── Recalculate session stats ──
      const updatedMatches = matches.map((m) =>
        m.date === match.date
          ? {
              ...m,
              kills: parseInt(editKills) || 0,
              placement: parseInt(editPlacement) || 1,
              mentalState: editMental,
            }
          : m,
      );

      const totalMatches = updatedMatches.length;
      const totalKills = updatedMatches.reduce((s, m) => s + (m.kills ?? 0), 0);
      const averagePlacement = totalMatches
        ? updatedMatches.reduce((s, m) => s + (m.placement ?? 0), 0) /
          totalMatches
        : 0;
      const averageMental = totalMatches
        ? updatedMatches.reduce((s, m) => s + (m.mentalState ?? 5), 0) /
          totalMatches
        : 0;
      const wins = updatedMatches.filter((m) => m.placement === 1).length;
      const winPercentage = totalMatches ? (wins / totalMatches) * 100 : 0;

      await updateDoc(doc(db, "users", uid, "sessions", sessionId), {
        totalKills,
        totalMatches,
        averagePlacement,
        averageMental,
        wins,
        winPercentage,
      });

      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save match:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
  if (!match) return;
  setSaving(true);
  try {
    const matchesRef = collection(db, "users", uid, "matches");
    const q = query(
      matchesRef,
      where("sessionId", "==", sessionId),
      where("date", "==", match.date),
    );
    const snap = await getDocs(q);
    if (!snap.empty) await deleteDoc(snap.docs[0].ref);

    // ── Recalculate session stats without the deleted match ──
    const remainingMatches = matches.filter((m) => m.date !== match.date);
    const totalMatches = remainingMatches.length;
    const totalKills = remainingMatches.reduce((s, m) => s + (m.kills ?? 0), 0);
    const averagePlacement = totalMatches
      ? remainingMatches.reduce((s, m) => s + (m.placement ?? 0), 0) / totalMatches
      : 0;
    const averageMental = totalMatches
      ? remainingMatches.reduce((s, m) => s + (m.mentalState ?? 5), 0) / totalMatches
      : 0;
    const wins = remainingMatches.filter((m) => m.placement === 1).length;
    const winPercentage = totalMatches ? (wins / totalMatches) * 100 : 0;

    await updateDoc(doc(db, "users", uid, "sessions", sessionId), {
      totalKills,
      totalMatches,
      averagePlacement,
      averageMental,
      wins,
      winPercentage,
    });

    onSaved();
    onClose();
  } catch (err) {
    console.error("Failed to delete match:", err);
  } finally {
    setSaving(false);
  }
};

  return (
    <Modal visible={!!match} transparent animationType="fade">
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.card} onPress={() => {}}>
          <View style={s.accent} />
          <Text style={s.title}>EDIT MATCH</Text>

          <View style={[s.modePill, { backgroundColor: modeColor + "22" }]}>
            <Text style={[s.modeText, { color: modeColor }]}>
              {match?.mode}
            </Text>
          </View>
          <Text style={s.fieldLabel}>SKIN</Text>
          <SkinPicker
            skins={skins}
            value={editSkinId}
            onChange={(id) => setEditSkinId(id)}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>KILLS</Text>
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
              <Text style={s.fieldLabel}>PLACEMENT</Text>
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

          <Text style={s.fieldLabel}>MENTAL STATE — {editMental}/10</Text>
          <View style={s.mentalTrack}>
            {MENTAL_GRADIENT.map((color, i) => (
              <TouchableOpacity
                key={i}
                style={{
                  flex: 1,
                  height: "100%",
                  backgroundColor: color,
                  opacity: i + 1 <= editMental ? 1 : 0.15,
                }}
                onPress={() => setEditMental(i + 1)}
              />
            ))}
          </View>

          <Text style={s.fieldLabel}>NOTES</Text>
          <TextInput
            style={[s.input, { minHeight: 60, textAlignVertical: "top" }]}
            value={editNotes}
            onChangeText={setEditNotes}
            placeholder="Optional notes..."
            placeholderTextColor="#444"
            multiline
            maxLength={200}
          />

          <View style={{ flexDirection: "row", gap: 10 }}>
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

<TouchableOpacity
  style={[s.btn, { borderWidth: 1, borderColor: RED + "40" }]}
  onPress={handleDelete}
  disabled={saving}
>
  <Text style={[s.btnText, { color: RED, opacity: 0.7 }]}>DELETE MATCH</Text>
</TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    gap: 12,
    overflow: "hidden",
  },
  accent: {
    position: "absolute",
    top: 0,
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: PURPLE,
    opacity: 0.7,
  },
  title: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 16,
    letterSpacing: 3,
    textAlign: "center",
  },
  modePill: {
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
  },
  modeText: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  fieldLabel: {
    color: "#444",
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
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
  mentalTrack: {
    height: 10,
    backgroundColor: "#1a1a28",
    borderRadius: 3,
    overflow: "hidden",
    flexDirection: "row",
  },
  btn: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 2 },
});
