import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Stack, router } from "expo-router";
import { TouchableOpacity } from "react-native";
import { collection, query, orderBy, onSnapshot, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import { AuthContext } from "@/services/authProvider";
import { Ionicons } from "@expo/vector-icons";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PURPLE      = "#8b5cf6";
const PURPLE_DARK = "#7c3aed";
const AMBER       = "#f59e0b";
const GREEN       = "#22c55e";
const BLUE        = "#3b82f6";
const RED         = "#ef4444";
const BG          = "#0d0d14";
const CARD_BG     = "#0f0f1a";
const INNER_BG    = "#0a0a12";
const BORDER      = "#1e1e30";

// ─── Trophy tier colors ───────────────────────────────────────────────────────
const GOLD   = "#FFD700";
const SILVER = "#94a3b8";
const BRONZE = "#cd7f32";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Match {
  date: string | Timestamp;
  mode: string;
  placement: number;
  kills: number;
  skinId: string;
  mentalState: number;
  notes: string;
  sessionId: string;
}

interface Session {
  id: string;
  createdAt: Date;
  endedAt: Date | null;
  totalKills: number;
  totalMatches: number;
  averagePlacement: number;
  averageMental: number;
  wins: number;
  winPercentage: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const avg = (arr: number[]) =>
  arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

const toDate = (date: string | Timestamp): Date => {
  if (!date) return new Date();
  if (typeof date === "string") return new Date(date);
  return (date as Timestamp).toDate();
};

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const fmtDateShort = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ─── Animated Trophy Card ─────────────────────────────────────────────────────
function TrophyCard({
  icon,
  iconName,
  label,
  value,
  sub,
  color,
  delay = 0,
  tier = "bronze",
}: {
  icon?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sub: string;
  color: string;
  delay?: number;
  tier?: "gold" | "silver" | "bronze";
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
      delay,
    }).start();
  }, []);

  const tierColor = tier === "gold" ? GOLD : tier === "silver" ? SILVER : BRONZE;

  return (
    <Animated.View
      style={[
        s.trophyCard,
        {
          borderColor: color + "35",
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Top accent */}
      <View style={[s.trophyAccent, { backgroundColor: color }]} />

      {/* Tier dot */}
      <View style={[s.tierDot, { backgroundColor: tierColor }]} />

      {/* Icon */}
      <View style={[s.trophyIconWrap, { backgroundColor: color + "15" }]}>
        {iconName ? (
          <Ionicons name={iconName} size={22} color={color} />
        ) : (
          <Text style={s.trophyEmoji}>{icon}</Text>
        )}
      </View>

      {/* Content */}
      <Text style={s.trophyLabel}>{label}</Text>
      <Text style={[s.trophyValue, { color }]}>{value}</Text>
      <Text style={s.trophySub} numberOfLines={2}>{sub}</Text>
    </Animated.View>
  );
}

// ─── Empty Trophy Card ────────────────────────────────────────────────────────
function EmptyTrophy({ label }: { label: string }) {
  return (
    <View style={[s.trophyCard, s.trophyCardEmpty]}>
      <Ionicons name="lock-closed-outline" size={22} color="#333" />
      <Text style={s.trophyLabel}>{label}</Text>
      <Text style={s.emptyVal}>—</Text>
      <Text style={s.emptySub}>Not unlocked yet</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function TrophyCabinetScreen() {
  const user = useContext(AuthContext);
  const [matches, setMatches] = useState<Match[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
      delay: 100,
    }).start();
  }, []);

  // ── Matches listener ──
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "users", user.uid, "matches"),
      orderBy("date", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMatches(snap.docs.map((d) => d.data() as Match));
    });
    return () => unsub();
  }, [user?.uid]);

  // ── Sessions fetch ──
  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "users", user.uid, "sessions"), orderBy("createdAt", "desc"))
        );
        setSessions(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              createdAt: (data.createdAt as Timestamp).toDate(),
              endedAt: data.endedAt ? (data.endedAt as Timestamp).toDate() : null,
              totalKills: data.totalKills ?? 0,
              totalMatches: data.totalMatches ?? 0,
              averagePlacement: data.averagePlacement ?? 0,
              averageMental: data.averageMental ?? 0,
              wins: data.wins ?? 0,
              winPercentage: data.winPercentage ?? 0,
            };
          })
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={PURPLE} size="large" />
      </View>
    );
  }

  const ended = sessions.filter((s) => s.endedAt !== null);

  // ── Trophy calculations ──

  // 1. Most kills in a single match
  const bestKillMatch = matches.length
    ? matches.reduce((best, m) => (m.kills > best.kills ? m : best), matches[0])
    : null;

  // 2. Best win streak
  let bestStreak = 0;
  let currentStreak = 0;
  let streakStartIdx = 0;
  let bestStreakStartIdx = 0;
  const chronoMatches = [...matches].reverse();
  chronoMatches.forEach((m, i) => {
    if (m.placement === 1) {
      if (currentStreak === 0) streakStartIdx = i;
      currentStreak++;
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
        bestStreakStartIdx = streakStartIdx;
      }
    } else {
      currentStreak = 0;
    }
  });
  const streakStartMatch = chronoMatches[bestStreakStartIdx];
  const streakEndMatch   = chronoMatches[bestStreakStartIdx + bestStreak - 1];

  // 3. Highest win % session
  const bestWinPctSession = ended.length
    ? ended.reduce((best, s) => (s.winPercentage > best.winPercentage ? s : best), ended[0])
    : null;

  // 4. Best avg placement session (lowest avg placement)
  const bestPlacementSession = ended.length
    ? ended.reduce((best, s) =>
        s.averagePlacement < best.averagePlacement && s.totalMatches >= 3 ? s : best,
        ended[0]
      )
    : null;

  // 5. Peak mental session
  const bestMentalSession = ended.length
    ? ended.reduce((best, s) => (s.averageMental > best.averageMental ? s : best), ended[0])
    : null;

  // 6. Most kills in a session
  const bestKillSession = ended.length
    ? ended.reduce((best, s) => (s.totalKills > best.totalKills ? s : best), ended[0])
    : null;

  // 7. Longest session
  const longestSession = ended.length
    ? ended.reduce((best, s) => (s.totalMatches > best.totalMatches ? s : best), ended[0])
    : null;

  // 8. Best K/D session (kills per match)
  const bestKDSession = ended.length
    ? ended
        .filter((s) => s.totalMatches >= 3)
        .reduce(
          (best, s) => {
            const kd = s.totalKills / Math.max(1, s.totalMatches);
            const bestKD = best.totalKills / Math.max(1, best.totalMatches);
            return kd > bestKD ? s : best;
          },
          ended[0]
        )
    : null;

  // ── Summary counts ──
  const totalWins   = matches.filter((m) => m.placement === 1).length;
  const totalKills  = matches.reduce((a, m) => a + m.kills, 0);

  const trophies = [
    {
      label: "KILL RECORD",
      iconName: "skull-outline" as keyof typeof Ionicons.glyphMap,
      color: RED,
      tier: "gold" as const,
      value: bestKillMatch ? `${bestKillMatch.kills} kills` : null,
      sub: bestKillMatch
        ? `${bestKillMatch.mode} · ${fmtDate(toDate(bestKillMatch.date))}`
        : null,
    },
    {
      label: "WIN STREAK",
      iconName: "flame-outline" as keyof typeof Ionicons.glyphMap,
      color: AMBER,
      tier: "gold" as const,
      value: bestStreak > 0 ? `${bestStreak} in a row` : null,
      sub:
        bestStreak > 0 && streakStartMatch && streakEndMatch
          ? `${fmtDateShort(toDate(streakStartMatch.date))} – ${fmtDateShort(toDate(streakEndMatch.date))}`
          : null,
    },
    {
      label: "BEST WIN % SESSION",
      iconName: "trophy-outline" as keyof typeof Ionicons.glyphMap,
      color: GOLD,
      tier: "gold" as const,
      value: bestWinPctSession ? `${bestWinPctSession.winPercentage.toFixed(0)}%` : null,
      sub: bestWinPctSession
        ? `${bestWinPctSession.wins}W / ${bestWinPctSession.totalMatches} matches · ${fmtDate(bestWinPctSession.createdAt)}`
        : null,
    },
    {
      label: "BEST PLACEMENT SESSION",
      iconName: "podium-outline" as keyof typeof Ionicons.glyphMap,
      color: GREEN,
      tier: "silver" as const,
      value: bestPlacementSession ? `#${bestPlacementSession.averagePlacement.toFixed(1)} avg` : null,
      sub: bestPlacementSession
        ? `${bestPlacementSession.totalMatches} matches · ${fmtDate(bestPlacementSession.createdAt)}`
        : null,
    },
    {
      label: "PEAK MENTAL SESSION",
      iconName: "pulse-outline" as keyof typeof Ionicons.glyphMap,
      color: PURPLE,
      tier: "silver" as const,
      value: bestMentalSession ? `${bestMentalSession.averageMental.toFixed(1)} / 10` : null,
      sub: bestMentalSession
        ? `${bestMentalSession.totalMatches} matches · ${fmtDate(bestMentalSession.createdAt)}`
        : null,
    },
    {
      label: "MOST KILLS SESSION",
      iconName: "flash-outline" as keyof typeof Ionicons.glyphMap,
      color: RED,
      tier: "silver" as const,
      value: bestKillSession ? `${bestKillSession.totalKills} kills` : null,
      sub: bestKillSession
        ? `${bestKillSession.totalMatches} matches · ${fmtDate(bestKillSession.createdAt)}`
        : null,
    },
    {
      label: "LONGEST SESSION",
      iconName: "time-outline" as keyof typeof Ionicons.glyphMap,
      color: BLUE,
      tier: "bronze" as const,
      value: longestSession ? `${longestSession.totalMatches} matches` : null,
      sub: longestSession
        ? `${longestSession.wins} wins · ${fmtDate(longestSession.createdAt)}`
        : null,
    },
    {
      label: "BEST K/D SESSION",
      iconName: "stats-chart-outline" as keyof typeof Ionicons.glyphMap,
      color: AMBER,
      tier: "bronze" as const,
      value: bestKDSession
        ? `${(bestKDSession.totalKills / Math.max(1, bestKDSession.totalMatches)).toFixed(2)}`
        : null,
      sub: bestKDSession
        ? `${bestKDSession.totalKills} kills · ${fmtDate(bestKDSession.createdAt)}`
        : null,
    },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={s.scroll}>

        {/* ── Header ── */}
        <Animated.View
          style={[
            s.header,
            {
              opacity: headerAnim,
              transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
            },
          ]}
        >
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={s.screenTitle}>TROPHY CABINET</Text>
          </View>
          <View style={s.spacer} />
        </Animated.View>

        {/* ── Summary strip ── */}
        <View style={s.summaryStrip}>
          {[
            { label: "MATCHES", value: matches.length.toString(),  color: PURPLE },
            { label: "TOTAL WINS",  value: totalWins.toString(),   color: AMBER },
            { label: "TOTAL KILLS", value: totalKills.toLocaleString(), color: RED },
            { label: "SESSIONS",    value: ended.length.toString(), color: BLUE },
          ].map((item, i, arr) => (
            <View
              key={item.label}
              style={[s.summaryItem, i < arr.length - 1 && { borderRightWidth: 1, borderColor: BORDER }]}
            >
              <Text style={[s.summaryVal, { color: item.color }]}>{item.value}</Text>
              <Text style={s.summaryLbl}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Section label ── */}
        <Text style={s.sectionLabel}>PERSONAL RECORDS</Text>

        {/* ── Trophy grid ── */}
        <View style={s.grid}>
          {trophies.map((t, i) =>
            t.value ? (
              <TrophyCard
                key={t.label}
                iconName={t.iconName}
                label={t.label}
                value={t.value}
                sub={t.sub ?? ""}
                color={t.color}
                tier={t.tier}
                delay={i * 60}
              />
            ) : (
              <EmptyTrophy key={t.label} label={t.label} />
            )
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: BG,
    padding: 20,
    paddingTop: 34,
    gap: 12,
  },
  centered: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER,
    alignItems: "center", justifyContent: "center",
  },
  spacer: { width: 36, height: 36 },
  screenTitle: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 18,
    letterSpacing: 3,
  },

  // Summary strip
  summaryStrip: {
    flexDirection: "row",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    marginBottom: 4,
  },
  summaryItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  summaryVal: { fontSize: 18, fontWeight: "700", marginBottom: 2 },
  summaryLbl: { color: "#444", fontSize: 7, letterSpacing: 1.5, fontWeight: "600" },

  // Section label
  sectionLabel: {
    color: "#333",
    fontSize: 9,
    letterSpacing: 2.5,
    fontWeight: "700",
    marginBottom: 4,
    marginLeft: 2,
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  // Trophy card
  trophyCard: {
    width: "48%",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 6,
    overflow: "hidden",
    alignItems: "flex-start",
  },
  trophyCardEmpty: {
    borderColor: "#16162a",
    opacity: 0.5,
    alignItems: "center",
    paddingVertical: 20,
  },
  trophyAccent: {
    position: "absolute",
    top: 0, left: 20, right: 20,
    height: 1.5,
    opacity: 0.6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  tierDot: {
    position: "absolute",
    top: 10, right: 10,
    width: 6, height: 6,
    borderRadius: 3,
    opacity: 0.8,
  },
  trophyIconWrap: {
    width: 40, height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  trophyEmoji: { fontSize: 20 },
  trophyLabel: {
    color: "#444",
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  trophyValue: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "BurbankBlack",
    letterSpacing: 0.5,
  },
  trophySub: {
    color: "#555",
    fontSize: 9,
    lineHeight: 13,
  },
  emptyVal: {
    color: "#333",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 6,
  },
  emptySub: {
    color: "#2a2a3a",
    fontSize: 9,
    letterSpacing: 0.5,
  },
});