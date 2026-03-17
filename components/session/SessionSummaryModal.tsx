import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Session } from "@/types/session";
import { mentalLabel, BUCKET_COLORS } from "@/constants/analytics";
import gradientColors from "@/constants/gradient";
import { stateLabel } from "@/constants/analytics";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PURPLE = "#8b5cf6";
const AMBER = "#f59e0b";
const GREEN = "#22c55e";
const RED = "#ef4444";
const CARD_BG = "#0f0f1a";
const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDuration(start: Date, end: Date) {
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function mentalTrend(start: number, end: number) {
  const diff = end - start;
  if (Math.abs(diff) < 1)
    return {
      label: "held steady",
      color: AMBER,
      icon: "remove-outline" as const,
    };
  if (diff > 0)
    return {
      label: `up ${diff.toFixed(1)} pts`,
      color: GREEN,
      icon: "trending-up-outline" as const,
    };
  return {
    label: `down ${Math.abs(diff).toFixed(1)} pts`,
    color: RED,
    icon: "trending-down-outline" as const,
  };
}

// ─── Goal icons ───────────────────────────────────────────────────────────────
const GOAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "Just vibing": "happy-outline",
  "Win hunting": "trophy-outline",
  "Kill farming": "skull-outline",
  "Ranked grind": "trending-up-outline",
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  session: Session | null;
  endingMental: number;
  onDismiss: () => void;
}

export function SessionSummaryModal({
  visible,
  session,
  endingMental,
  onDismiss,
}: Props) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(60);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!session) return null;

  const endedAt = session.endedAt ?? new Date();
  const duration = fmtDuration(session.createdAt, endedAt);
  const winPct =
    session.totalMatches > 0
      ? ((session.wins / session.totalMatches) * 100).toFixed(0)
      : "0";
  const kd =
    session.totalMatches - session.wins > 0
      ? (session.totalKills / (session.totalMatches - session.wins)).toFixed(2)
      : session.totalKills.toString();

  const trend =
    session.startingMental != null
      ? mentalTrend(session.startingMental, endingMental)
      : null;

  const endingMentalColor =
    gradientColors[Math.round(endingMental) - 1] ?? PURPLE;
  const startingMentalColor =
    session.startingMental != null
      ? (gradientColors[Math.round(session.startingMental) - 1] ?? PURPLE)
      : null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={s.backdrop} onPress={onDismiss}>
        <Animated.View
          style={[
            s.sheet,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* ── Top accent — outside overflow:hidden so it renders as one bar ── */}
          <View style={s.topAccent} />

          {/* ── Handle ── */}
          <View style={s.handle} />

          {/* ── Title + duration ── */}
          <View style={s.titleRow}>
            <Text style={s.title}>SESSION WRAPPED</Text>
            <View style={s.durationBadge}>
              <Ionicons name="time-outline" size={12} color="#555" />
              <Text style={s.durationText}>{duration}</Text>
            </View>
          </View>

          {/* ── Goal + mode row ── */}
          {(session.goal || session.mode) && (
            <View style={s.goalRow}>
              {session.goal && (
                <>
                  <Ionicons
                    name={GOAL_ICONS[session.goal] ?? "flag-outline"}
                    size={13}
                    color="#444"
                  />
                  <Text style={s.goalText}>{session.goal}</Text>
                </>
              )}
              {session.goal && session.mode && <View style={s.goalDot} />}
              {session.mode && <Text style={s.goalText}>{session.mode}</Text>}
            </View>
          )}

          {/* ── Main stats strip ── */}
          <View style={s.statsStrip}>
            {[
              {
                label: "MATCHES",
                value: session.totalMatches.toString(),
                color: PURPLE,
              },
              {
                label: "KILLS",
                value: session.totalKills.toString(),
                color: RED,
              },
              { label: "WINS", value: session.wins.toString(), color: AMBER },
              { label: "WIN %", value: `${winPct}%`, color: GREEN },
            ].map((item, i, arr) => (
              <View
                key={item.label}
                style={[
                  s.stripItem,
                  i < arr.length - 1 && {
                    borderRightWidth: 1,
                    borderColor: BORDER,
                  },
                ]}
              >
                <Text style={[s.stripVal, { color: item.color }]}>
                  {item.value}
                </Text>
                <Text style={s.stripLbl}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Secondary stats ── */}
          <View style={s.secondaryRow}>
            <View style={[s.secondaryCard, { borderColor: PURPLE + "33" }]}>
              <Text style={s.secondaryLbl}>AVG PLACEMENT</Text>
              <Text style={[s.secondaryVal, { color: PURPLE }]}>
                #{session.averagePlacement.toFixed(1)}
              </Text>
            </View>
            <View style={[s.secondaryCard, { borderColor: AMBER + "33" }]}>
              <Text style={s.secondaryLbl}>K/D</Text>
              <Text style={[s.secondaryVal, { color: AMBER }]}>{kd}</Text>
            </View>
          </View>

          {/* ── Mental journey ── */}
          {session.startingMental != null && trend && (
            <View style={s.mentalCard}>
              <Text style={s.sectionLabel}>MENTAL JOURNEY</Text>

              <View style={s.mentalRow}>
                {/* Starting */}
                <View style={s.mentalSide}>
                  <Text style={s.mentalStepLbl}>STARTED</Text>
                  <Text
                    style={[s.mentalStepVal, { color: startingMentalColor! }]}
                  >
                    {session.startingMental.toFixed(1)}
                  </Text>
                  <Text
                    style={[s.mentalBucket, { color: startingMentalColor! }]}
                  >
                    {stateLabel(Math.round(session.startingMental))}
                  </Text>
                </View>

                {/* Trend */}
                <View style={s.mentalTrendWrap}>
                  <Ionicons name={trend.icon} size={22} color={trend.color} />
                  <Text style={[s.mentalTrendText, { color: trend.color }]}>
                    {trend.label}
                  </Text>
                </View>

                {/* Ending */}
                <View style={[s.mentalSide, { alignItems: "flex-end" }]}>
                  <Text style={s.mentalStepLbl}>ENDED</Text>
                  <Text style={[s.mentalStepVal, { color: endingMentalColor }]}>
                    {endingMental.toFixed(1)}
                  </Text>
                  <Text style={[s.mentalBucket, { color: endingMentalColor }]}>
                    {stateLabel(Math.round(session.startingMental))}{" "}
                  </Text>
                </View>
              </View>

              {/* Mental bar */}
              <View style={s.mentalBarRow}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <View
                    key={n}
                    style={[
                      s.mentalBarStep,
                      {
                        backgroundColor:
                          n <= Math.round(endingMental)
                            ? gradientColors[n - 1]
                            : "#1e1e2e",
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Dismiss ── */}
          <Pressable style={s.dismissBtn} onPress={onDismiss}>
            <Text style={s.dismissText}>Take a break 👋</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
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
    // ── No overflow:hidden — lets topAccent render as one clean bar ──
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 60,
    right: 60,
    height: 2,
    backgroundColor: PURPLE,
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

  // ── Title row ──
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 18,
    letterSpacing: 3,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: INNER_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  durationText: {
    color: "#555",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // ── Goal row ──
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  goalText: {
    color: "#444",
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "600",
  },
  goalDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#333",
  },

  // ── Stats strip ──
  statsStrip: {
    flexDirection: "row",
    backgroundColor: INNER_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  stripItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  stripVal: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  stripLbl: {
    color: "#444",
    fontSize: 7,
    letterSpacing: 1.5,
    fontWeight: "600",
  },

  // ── Secondary row ──
  secondaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: INNER_BG,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
  },
  secondaryLbl: {
    color: "#444",
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  secondaryVal: {
    fontSize: 18,
    fontWeight: "700",
  },

  // ── Mental journey ──
  mentalCard: {
    backgroundColor: INNER_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 12,
  },
  sectionLabel: {
    color: "#555",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "600",
  },
  mentalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mentalSide: {
    alignItems: "flex-start",
    gap: 2,
  },
  mentalStepLbl: {
    color: "#444",
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  mentalStepVal: {
    fontSize: 26,
    fontWeight: "700",
  },
  mentalBucket: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },
  mentalTrendWrap: {
    alignItems: "center",
    gap: 4,
  },
  mentalTrendText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  mentalBarRow: {
    flexDirection: "row",
    gap: 4,
  },
  mentalBarStep: {
    flex: 1,
    height: 18,
    borderRadius: 3,
  },

  // ── Dismiss ──
  dismissBtn: {
    backgroundColor: INNER_BG,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: PURPLE + "60",
    marginTop: 4,
  },
  dismissText: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 16,
    letterSpacing: 4,
  },
});
