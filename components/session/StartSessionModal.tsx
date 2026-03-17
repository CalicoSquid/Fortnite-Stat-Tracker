import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SessionGoal, SessionMode } from "@/types/session";
import { SessionSetup } from "@/hooks/useSessionsData";
import gradientColors from "@/constants/gradient";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PURPLE = "#8b5cf6";
const AMBER = "#f59e0b";
const BLUE = "#3b82f6";
const BG = "#0d0d14";
const CARD_BG = "#0f0f1a";
const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";

// ─── Mode config ──────────────────────────────────────────────────────────────
const MODES: { label: SessionMode; color: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "OG", color: PURPLE, icon: "planet-outline" },
  { label: "BR", color: BLUE, icon: "compass-outline" },
  { label: "Reload", color: AMBER, icon: "refresh-circle-outline" },
];

// ─── Goal config ─────────────────────────────────────────────────────────────
const GOALS: { label: SessionGoal; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Just vibing", icon: "happy-outline" },
  { label: "Win hunting", icon: "trophy-outline" },
  { label: "Kill farming", icon: "skull-outline" },
  { label: "Ranked grind", icon: "trending-up-outline" },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  onClose: () => void;
  onStart: (setup: SessionSetup) => void;
}

export function StartSessionModal({ visible, onClose, onStart }: Props) {
  const [mode, setMode] = useState<SessionMode>("OG");
  const [mental, setMental] = useState(7);
  const [goal, setGoal] = useState<SessionGoal>("Just vibing");

  const handleStart = () => {
    onStart({ mode, startingMental: mental, goal });
    setMode("OG");
    setMental(7);
    setGoal("Just vibing");
  };

  const selectedModeColor = MODES.find((m) => m.label === mode)?.color ?? PURPLE;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>

          {/* ── Top accent bar ── */}
          <View style={[s.topAccent, { backgroundColor: selectedModeColor }]} />

          {/* ── Handle ── */}
          <View style={s.handle} />

          {/* ── Title ── */}
          <Text style={s.title}>NEW SESSION</Text>

          {/* ── Mode ── */}
          <Text style={s.sectionLabel}>MODE</Text>
          <View style={s.modeRow}>
            {MODES.map((m) => {
              const active = mode === m.label;
              return (
                <Pressable
                  key={m.label}
                  style={[
                    s.modeBtn,
                    active && {
                      backgroundColor: m.color + "18",
                      borderColor: m.color + "80",
                    },
                  ]}
                  onPress={() => setMode(m.label)}
                >
                  <Ionicons
                    name={m.icon}
                    size={18}
                    color={active ? m.color : "#444"}
                  />
                  <Text
                    style={[
                      s.modeBtnText,
                      { color: active ? m.color : "#444" },
                    ]}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Starting mental ── */}
          <View style={s.mentalLabelRow}>
            <Text style={s.sectionLabel}>STARTING MENTAL</Text>
            <Text style={[s.mentalVal, { color: gradientColors[mental - 1] }]}>
              {mental} / 10
            </Text>
          </View>
          <View style={s.sliderContainer}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <Pressable
                key={n}
                onPress={() => setMental(n)}
                style={[
                  s.sliderStep,
                  { backgroundColor: n <= mental ? gradientColors[n - 1] : "#1e1e2e" },
                ]}
              />
            ))}
          </View>
          <View style={s.sliderLabels}>
            <Text style={s.sliderLbl}>Tilted</Text>
            <Text style={s.sliderLbl}>Locked In</Text>
          </View>

          {/* ── Goal ── */}
          <Text style={[s.sectionLabel, { marginTop: 4 }]}>SESSION GOAL</Text>
          <View style={s.goalGrid}>
            {GOALS.map((g) => {
              const active = goal === g.label;
              return (
                <Pressable
                  key={g.label}
                  style={[
                    s.goalChip,
                    active && {
                      backgroundColor: PURPLE + "18",
                      borderColor: PURPLE + "80",
                    },
                  ]}
                  onPress={() => setGoal(g.label)}
                >
                  <Ionicons
                    name={g.icon}
                    size={16}
                    color={active ? PURPLE : "#444"}
                  />
                  <Text
                    style={[
                      s.goalChipText,
                      { color: active ? "#fff" : "#555" },
                    ]}
                  >
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Drop In button ── */}
          <Pressable style={s.startBtn} onPress={handleStart}>
            <View style={s.startIconWrap}>
              <Ionicons name="play" size={18} color={PURPLE} />
            </View>
            <Text style={s.startBtnText}>DROP IN</Text>
            <Ionicons name="chevron-forward" size={18} color="#ffffff30" />
          </Pressable>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    overflow: "hidden",
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
  title: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 18,
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 4,
  },
  sectionLabel: {
    color: "#555",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 8,
  },

  // ── Mode ──
  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: INNER_BG,
  },
  modeBtnText: {
    fontFamily: "BurbankBlack",
    fontSize: 13,
    letterSpacing: 1,
  },

  // ── Mental slider ──
  mentalLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mentalVal: {
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
    marginTop: 6,
  },
  sliderLbl: {
    color: "#444",
    fontSize: 10,
    letterSpacing: 1,
  },

  // ── Goal grid ──
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  goalChip: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: INNER_BG,
  },
  goalChipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Drop In button ──
  startBtn: {
    backgroundColor: "#1a1228",
    borderRadius: 14,
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: PURPLE + "80",
    overflow: "hidden",
    marginTop: 4,
  },
  startIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PURPLE + "18",
    borderWidth: 1,
    borderColor: PURPLE + "30",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "BurbankBlack",
    letterSpacing: 3,
    flex: 1,
  },
});