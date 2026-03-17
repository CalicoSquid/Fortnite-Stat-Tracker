import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import {
  avg,
  stateLabel,
  AnalyticsMatch,
  AnalyticsSession,
} from "@/constants/analytics";
import gradientColors from "@/constants/gradient";
import MentalStateNew from "./MentalStateOld";
import MomentumChart from "./MomentumChartOld";
import { Timestamp } from "firebase/firestore";

const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";
const MIN_CORRELATION_MATCHES = 10;

type ChartView = "mental" | "momentum";

function CardTitle({ label }: { label: string }) {
  return (
    <View style={s.cardTitleWrap}>
      <Text style={s.cardTitle}>{label}</Text>
      <View style={s.cardTitleDivider} />
    </View>
  );
}

function toDate(d: string | Timestamp | Date): Date {
  if (d instanceof Date) return d;
  if (typeof d === "string") return new Date(d);
  return d.toDate();
}

const EmptyState = ({ message }: { message: string }) => (
  <View style={s.emptyState}>
    <Text style={s.emptyStateText}>{message}</Text>
  </View>
);

function ChartToggle({ view, onChange }: { view: ChartView; onChange: (v: ChartView) => void }) {
  return (
    <View style={tog.wrap}>
      {(["mental", "momentum"] as ChartView[]).map((v, i) => {
        const active = view === v;
        const label  = v === "mental" ? "DURING GAME" : "CARRY-OVER";
        const sub    = v === "mental" ? "how you felt vs results" : "last game's feeling → next";
        return (
          <React.Fragment key={v}>
            {i > 0 && <View style={tog.divider} />}
            <Pressable
              onPress={() => onChange(v)}
              style={[tog.btn, active && tog.btnActive]}
            >
              {active && <View style={tog.activePill} />}
              <Text style={[tog.label, active && tog.labelActive]}>{label}</Text>
              <Text style={[tog.sub, active && tog.subActive]}>{sub}</Text>
            </Pressable>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const tog = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: INNER_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 3,
  },
  btnActive: {
    backgroundColor: "#0d0d1c",
  },
  activePill: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: "#4a4a88",
  },
  divider:     { width: 1, backgroundColor: BORDER },
  label:       { color: "#2a2a45", fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  labelActive: { color: "#cccccc" },
  sub:         { color: "#1a1a30", fontSize: 8, letterSpacing: 0.3 },
  subActive:   { color: "#444466" },
});

// ── Pearson correlation ────────────────────────────────────────────────────
function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = avg(xs);
  const my = avg(ys);
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
      ys.reduce((s, y) => s + (y - my) ** 2, 0),
  );
  return den === 0 ? 0 : num / den;
}

function buildCarryOverPairs(
  matches: AnalyticsMatch[],
  sessions: AnalyticsSession[],
): { mental: number; placement: number; kills: number }[] {
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const pairs: { mental: number; placement: number; kills: number }[] = [];

  const bySession = new Map<string, AnalyticsMatch[]>();
  for (const m of matches) {
    if (!m.sessionId) continue;
    const arr = bySession.get(m.sessionId) ?? [];
    arr.push(m);
    bySession.set(m.sessionId, arr);
  }

  for (const [sessionId, sessionMatches] of bySession) {
    const session = sessionMap.get(sessionId);
    const sorted = [...sessionMatches].sort(
      (a, b) => toDate(a.date).getTime() - toDate(b.date).getTime(),
    );
    sorted.forEach((match, i) => {
      let prevMental: number | null = null;
      if (i === 0) {
        prevMental = session?.startingMental ?? null;
      } else {
        prevMental = sorted[i - 1].mentalState;
      }
      if (prevMental === null) return;
      pairs.push({
        mental: Math.round(prevMental),
        placement: match.placement,
        kills: match.kills,
      });
    });
  }

  return pairs;
}

// ── Signal bar ─────────────────────────────────────────────────────────────
function SignalBar({ strength, color }: { strength: number; color: string }) {
  // strength is 0–1
  const TOTAL = 10;
  const filled = Math.round(strength * TOTAL);
  return (
    <View style={{ flexDirection: "row", gap: 3, alignItems: "center" }}>
      {Array.from({ length: TOTAL }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 14,
            height: 4,
            borderRadius: 2,
            backgroundColor:
              i < filled ? color + (i < filled * 0.5 ? "55" : "cc") : "#1a1a2e",
          }}
        />
      ))}
    </View>
  );
}

function CorrelationBanner({
  matches,
  sessions,
}: {
  matches: AnalyticsMatch[];
  sessions: AnalyticsSession[];
}) {
  if (matches.length < MIN_CORRELATION_MATCHES) return null;

  // ── Signal A: post-game mental state vs that game's results ──
  const postMental = matches.map((m) => m.mentalState);
  const postPlacements = matches.map((m) => m.placement);
  const postKills = matches.map((m) => m.kills);
  const rPostPlace = pearson(postMental, postPlacements); // negative = good
  const rPostKills = pearson(postMental, postKills); // positive = good

  // ── Signal B: previous game's mental state vs next game's results ──
  const carryPairs = buildCarryOverPairs(matches, sessions);
  const hasCarry = carryPairs.length >= 5;
  const rCarryPlace = hasCarry
    ? pearson(
        carryPairs.map((p) => p.mental),
        carryPairs.map((p) => p.placement),
      )
    : 0;
  const rCarryKills = hasCarry
    ? pearson(
        carryPairs.map((p) => p.mental),
        carryPairs.map((p) => p.kills),
      )
    : 0;

  // ── Combine: post-game weighted more heavily (more direct signal) ──
  // Flip placement correlations so positive = better performance
  const postSignal = -rPostPlace * 0.65 + rPostKills * 0.35;
  const carrySignal = -rCarryPlace * 0.65 + rCarryKills * 0.35;

  const combined = hasCarry ? postSignal * 0.6 + carrySignal * 0.4 : postSignal;

  const dataPoints = matches.length + (hasCarry ? carryPairs.length : 0);

  // ── Tier ──
  type Tier =
    | "strong_positive"
    | "weak_positive"
    | "neutral"
    | "weak_negative"
    | "strong_negative";
  const tier: Tier =
    combined > 0.35
      ? "strong_positive"
      : combined > 0.12
        ? "weak_positive"
        : combined < -0.35
          ? "strong_negative"
          : combined < -0.12
            ? "weak_negative"
            : "neutral";

  // ── Signal strength 0–1 for the bar ──
  // Map combined from [-1,1] to [0,1], then apply a curve to make
  // the bar feel honest — weak signals should look weak
  const rawStrength = (combined + 1) / 2;
  const barStrength = Math.pow(rawStrength, 1.4); // gentle curve

  // ── Strength label ──
  const absC = Math.abs(combined);
  const strengthLabel =
    absC > 0.55
      ? "STRONG"
      : absC > 0.35
        ? "MODERATE"
        : absC > 0.12
          ? "MILD"
          : "WEAK";

  // ── Accent color ──
  const accentColor =
    tier === "strong_positive"
      ? (gradientColors[8] as string)
      : tier === "weak_positive"
        ? (gradientColors[6] as string)
        : tier === "neutral"
          ? "#f59e0b"
          : tier === "weak_negative"
            ? (gradientColors[2] as string)
            : (gradientColors[0] as string);

  const headline: Record<Tier, string> = {
    strong_positive: "Mental state strongly predicts your results",
    weak_positive: "Higher mental states tend to improve your results",
    neutral: "Mental state has little effect on your results",
    weak_negative: "Higher mental states show a slight drop in results",
    strong_negative: "Higher mental states are linked to worse results",
  };

  const body: Record<Tier, string> = {
    strong_positive:
      "When you feel better, you play noticeably better — there's a clear and consistent pattern across both your in-game mood and how your last game's feeling carried forward.",
    weak_positive:
      "There's a mild trend — better mental states generally accompany better placements and more kills, though it's not consistent every game.",
    neutral:
      "How you feel doesn't strongly predict how you finish. Other factors seem to drive your results more than mood, based on both your in-game ratings and carry-over data.",
    weak_negative:
      "Slightly counterintuitively, higher mental states don't seem to produce better results yet. This can happen when you're still building consistency.",
    strong_negative:
      "Your data shows an unexpected pattern — higher mental states correlate with worse results. This might reflect overconfidence, or how you tend to rate mood after good or bad games.",
  };

  return (
    <View style={[s.card, { borderColor: accentColor + "33" }]}>
      <CardTitle label="MENTAL CORRELATION" />

      <Text style={[s.correlationHeadline, { color: accentColor }]}>
        {headline[tier]}
      </Text>
      <Text style={s.correlationBody}>{body[tier]}</Text>

      {/* ── Signal bar ── */}
      <View style={s.signalWrap}>
        <SignalBar strength={barStrength} color={accentColor} />
        <View style={s.signalLabelRow}>
          <Text style={s.signalLeft}>WEAK</Text>
          <Text style={[s.signalStrength, { color: accentColor }]}>
            {strengthLabel}
          </Text>
          <Text style={s.signalRight}>STRONG</Text>
        </View>
      </View>

      <Text style={s.correlationMetaText}>
        {dataPoints} data points · post-game + carry-over
        {hasCarry ? "" : " (carry-over pending more sessions)"}
      </Text>
    </View>
  );
}

export default function MentalVsResults({
  matches,
  sessions = [],
}: {
  matches: AnalyticsMatch[];
  sessions?: AnalyticsSession[];
}) {
  const [chartView, setChartView] = useState<ChartView>("mental");

  if (!matches.length) return <EmptyState message="No matches logged yet." />;

  return (
    <View style={{ gap: 14 }}>
      {/* ── CORRELATION BANNER ── */}
      {/*<CorrelationBanner matches={matches} sessions={sessions} />*/}

      {/* ── CHART TOGGLE ── */}
      <ChartToggle view={chartView} onChange={setChartView} />

      {/* ── CHART ── */}
      {chartView === "mental" ? (
        <MentalStateNew matches={matches} />
      ) : (
        <MomentumChart matches={matches} sessions={sessions} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: INNER_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 0,
  },
  cardTitleWrap: { marginBottom: 14 },
  cardTitle: {
    color: "#555",
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 10,
  },
  cardTitleDivider: { height: 1, backgroundColor: "#1a1a2e" },

  correlationMeta: { marginTop: 10, flexDirection: "row" },

  emptyState: { paddingVertical: 20, alignItems: "center" },
  emptyStateText: { color: "#444", fontSize: 12, letterSpacing: 0.5 },
  correlationHeadline: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 20,
    marginBottom: 8,
  },
  correlationBody: {
    color: "#555",
    fontSize: 11,
    lineHeight: 17,
    letterSpacing: 0.2,
    marginBottom: 14,
  },

  signalWrap: { gap: 6, marginBottom: 10 },
  signalLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 1,
  },
  signalLeft: {
    color: "#2a2a3a",
    fontSize: 7,
    letterSpacing: 1.2,
    fontWeight: "600",
  },
  signalRight: {
    color: "#2a2a3a",
    fontSize: 7,
    letterSpacing: 1.2,
    fontWeight: "600",
  },
  signalStrength: { fontSize: 8, fontWeight: "800", letterSpacing: 2 },

  correlationMetaText: { color: "#2e2e44", fontSize: 8, letterSpacing: 0.8 },
});
