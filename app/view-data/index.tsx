import React, { useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Stack, router } from "expo-router";
import { AuthContext } from "@/services/authProvider";
import { Ionicons } from "@expo/vector-icons";
import { useViewData } from "@/hooks/useViewData";
import AnalyticsCard from "@/components/analytics/AnalyticsCard";
import MentalVsResults from "@/components/analytics/MentalVsResults";
import MatchHistory from "@/components/analytics/MatchHistory";
import SessionTracker from "@/components/analytics/SessionTracker";
import SkinStats from "@/components/analytics/SkinStats";
import TimeAnalysis from "@/components/analytics/TimeAnalysis";
import ModeBreakdown from "@/components/analytics/ModeBreakdown";
import { avg } from "@/constants/analytics";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PURPLE = "#8b5cf6";
const BLUE = "#3b82f6";
const AMBER = "#f59e0b";
const GREEN = "#22c55e";
const RED = "#ef4444";
const BG = "#0d0d14";
const CARD_BG = "#0f0f1a";
const BORDER = "#1e1e30";

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ViewDataScreen() {
  const user = useContext(AuthContext);
  const { matches, sessions, loading } = useViewData(user?.uid);

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={PURPLE} size="large" />
      </View>
    );
  }

  const totalWins = matches.filter((m) => m.placement === 1).length;
  const avgKills = matches.length
    ? avg(matches.map((m) => m.kills)).toFixed(1)
    : "—";
  const sessCount = sessions.filter((s) => s.endedAt).length;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: BG }}
        contentContainerStyle={s.scroll}
      >
        {/* ── Header ── */}
        <View style={s.screenHeader}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.screenTitle}>ANALYTICS</Text>
          <View style={s.spacer} />
        </View>

        {/* ── Summary strip ── */}
        <View style={s.summaryStrip}>
          {[
            {
              label: "MATCHES",
              value: matches.length.toString(),
              color: PURPLE,
            },
            { label: "WINS", value: totalWins.toString(), color: AMBER },
            { label: "AVG K", value: avgKills, color: RED },
            { label: "SESSIONS", value: sessCount.toString(), color: BLUE },
          ].map((item, i, arr) => (
            <View
              key={item.label}
              style={[
                s.summaryItem,
                i === arr.length - 1 && { borderRightWidth: 0 },
              ]}
            >
              <Text style={[s.summaryVal, { color: item.color }]}>
                {item.value}
              </Text>
              <Text style={s.summaryLbl}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Analytics Cards ── */}
        <AnalyticsCard
          icon={<Ionicons name="pulse-outline" size={17} color={PURPLE} />}
          title="Mental vs Results"
          subtitle="Headspace vs performance"
          accentColor={GREEN}
          defaultOpen
        >
          <MentalVsResults matches={matches} />
        </AnalyticsCard>

        <AnalyticsCard
          icon={<Ionicons name="list-outline" size={17} color={PURPLE} />}
          title="Match History"
          subtitle={`${matches.length} matches logged`}
          accentColor={PURPLE}
        >
          <MatchHistory matches={matches} />
        </AnalyticsCard>

        <AnalyticsCard
          icon={
            <Ionicons name="stats-chart-outline" size={17} color={PURPLE} />
          }
          title="Session Tracker"
          subtitle={`${sessCount} completed sessions`}
          accentColor={BLUE}
        >
          <SessionTracker sessions={sessions} />
        </AnalyticsCard>

        <AnalyticsCard
          icon={<Ionicons name="person-outline" size={17} color={PURPLE} />}
          title="Skin Stats"
          subtitle="Best and worst performing skins"
          accentColor={AMBER}
        >
          <SkinStats matches={matches} />
        </AnalyticsCard>

        <AnalyticsCard
          icon={<Ionicons name="time-outline" size={17} color={PURPLE} />}
          title="Time Analysis"
          subtitle="When do you play your best?"
          accentColor={PURPLE}
        >
          <TimeAnalysis matches={matches} />
        </AnalyticsCard>

        <AnalyticsCard
          icon={<Ionicons name="grid-outline" size={17} color={PURPLE} />}
          title="Mode Breakdown"
          subtitle="OG · BR · Reload"
          accentColor={PURPLE}
        >
          <ModeBreakdown matches={matches} />
        </AnalyticsCard>

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
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 10,
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
  backArrow: { color: "#fff", fontSize: 22, lineHeight: 24 },
  spacer: { width: 36, height: 36 },
  screenTitle: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 18,
    letterSpacing: 3,
  },
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
    paddingVertical: 14,
    alignItems: "center",
    borderRightWidth: 1,
    borderColor: BORDER,
  },
  summaryVal: { fontSize: 20, fontWeight: "700", marginBottom: 2 },
  summaryLbl: {
    color: "#555",
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
});
