import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { avg, AnalyticsMatch, AnalyticsSession } from "@/constants/analytics";
import { Timestamp } from "firebase/firestore";
import gradientColors from "@/constants/gradient";
import { stateLabel } from "@/constants/analytics";

interface MomentumPair {
  prevMental: number;
  match: AnalyticsMatch;
}

const INNER_BG = "#0a0a12";
const BORDER   = "#1e1e30";
const MIN_MATCHES_FOR_ROW = 3;

const STATE_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function toDate(d: string | Timestamp | Date): Date {
  if (d instanceof Date) return d;
  if (typeof d === "string") return new Date(d);
  return d.toDate();
}

function buildMomentumPairs(
  matches: AnalyticsMatch[],
  sessions: AnalyticsSession[],
): MomentumPair[] {
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const pairs: MomentumPair[] = [];

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
      pairs.push({ prevMental: Math.round(prevMental), match });
    });
  }

  return pairs;
}

// ── Mini bar ───────────────────────────────────────────────────────────────
const MiniBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <View style={s.miniBarTrack}>
    <View style={[s.miniBarFill, {
      width: (max > 0 ? `${Math.min(100, (value / max) * 100)}%` : "0%") as any,
      backgroundColor: color,
    }]} />
  </View>
);

// ── Col headers ────────────────────────────────────────────────────────────
const ColHeaders = () => (
  <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 16, paddingRight: 2, marginBottom: 2 }}>
    <Text style={s.colHeader}>KILLS</Text>
    <Text style={s.colHeader}>PLACE</Text>
    <Text style={s.colHeader}>WIN%</Text>
    <Text style={s.colHeader}>TOP10</Text>
  </View>
);

// ── Insight ────────────────────────────────────────────────────────────────
function MomentumInsight({ pairs }: { pairs: MomentumPair[] }) {
  const stateStats = STATE_KEYS.map((n) => {
    const bucket = pairs.filter((p) => p.prevMental === n);
    if (bucket.length < MIN_MATCHES_FOR_ROW) return null;
    const placements = bucket.map((p) => p.match.placement);
    const kills      = bucket.map((p) => p.match.kills);
    return {
      state:    n,
      count:    bucket.length,
      avgPlace: avg(placements),
      avgKills: avg(kills),
      winPct:   (bucket.filter((p) => p.match.placement === 1).length / bucket.length) * 100,
      top10Pct: (bucket.filter((p) => p.match.placement <= 10).length / bucket.length) * 100,
    };
  }).filter(Boolean) as {
    state: number; count: number; avgPlace: number;
    avgKills: number; winPct: number; top10Pct: number;
  }[];

  if (stateStats.length < 2) return null;

  const maxPlace = Math.max(...stateStats.map((s) => s.avgPlace));
  const minPlace = Math.min(...stateStats.map((s) => s.avgPlace));
  const maxKills = Math.max(...stateStats.map((s) => s.avgKills));
  const minKills = Math.min(...stateStats.map((s) => s.avgKills));
  const maxTop10 = Math.max(...stateStats.map((s) => s.top10Pct));
  const minTop10 = Math.min(...stateStats.map((s) => s.top10Pct));
  const maxWin   = Math.max(...stateStats.map((s) => s.winPct));
  const minWin   = Math.min(...stateStats.map((s) => s.winPct));

  function norm(val: number, min: number, max: number) {
    return max === min ? 0.5 : (val - min) / (max - min);
  }

  const scored = stateStats.map((s) => ({
    ...s,
    score:
      norm(maxPlace - s.avgPlace + minPlace, minPlace, maxPlace) * 0.40 +
      norm(s.avgKills, minKills, maxKills)                        * 0.25 +
      norm(s.top10Pct, minTop10, maxTop10)                        * 0.20 +
      norm(s.winPct,   minWin,   maxWin)                          * 0.15,
  }));

  const best      = [...scored].sort((a, b) => b.score - a.score)[0];
  const bestColor = gradientColors[best.state - 1] as string;
  const wins      = Math.round((best.winPct / 100) * best.count);

  const spread = maxPlace - minPlace;
  if (spread < 1.5 && maxKills - minKills < 1) {
    return (
      <View style={s.infoBox}>
        <Text style={s.infoText}>
          💡 Mental carry-over has little effect on your results — performance is consistent regardless of how your last game felt.
        </Text>
      </View>
    );
  }

  return (
    <View style={[s.infoBox, { borderColor: bestColor + "25" }]}>
      <Text style={s.infoText}>
        💡 You play best after feeling{" "}
        <Text style={{ color: bestColor, fontWeight: "700" }}>
          {stateLabel(best.state)}
        </Text>
        {" "}in your previous match — {best.avgKills.toFixed(1)} avg kills, #
        {best.avgPlace.toFixed(1)} avg placement
        {wins > 0
          ? ` and ${wins} win${wins !== 1 ? "s" : ""} across ${best.count} matches.`
          : ` across ${best.count} matches.`
        }
      </Text>
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function MomentumChart({
  matches,
  sessions,
}: {
  matches: AnalyticsMatch[];
  sessions: AnalyticsSession[];
}) {
  const pairs = buildMomentumPairs(matches, sessions);

  if (!pairs.length) {
    return (
      <View style={s.emptyState}>
        <Text style={s.emptyText}>Complete more sessions to see carry-over data.</Text>
      </View>
    );
  }

  const allStateRows = STATE_KEYS.map((n) => {
    const bucket = pairs.filter((p) => p.prevMental === n);
    if (!bucket.length) return null;
    const placements = bucket.map((p) => p.match.placement);
    const kills      = bucket.map((p) => p.match.kills);
    return {
      state:     n,
      color:     gradientColors[n - 1] as string,
      count:     bucket.length,
      avgPlace:  avg(placements),
      avgKills:  avg(kills),
      winPct:    (bucket.filter((p) => p.match.placement === 1).length / bucket.length) * 100,
      top10Pct:  (bucket.filter((p) => p.match.placement <= 10).length / bucket.length) * 100,
      qualified: bucket.length >= MIN_MATCHES_FOR_ROW,
    };
  }).filter(Boolean) as {
    state: number; color: string; count: number; avgPlace: number;
    avgKills: number; winPct: number; top10Pct: number; qualified: boolean;
  }[];

  const qualifiedRows   = allStateRows.filter((r) => r.qualified);
  const unqualifiedRows = allStateRows.filter((r) => !r.qualified);
  const maxKills        = Math.max(...qualifiedRows.map((r) => r.avgKills), 1);
  const baselineSessions = sessions.filter((s) => s.startingMental != null).length;

  const renderRow = (r: typeof allStateRows[0], dimmed = false) => (
    <View key={r.state} style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={[s.dot, { backgroundColor: r.color }]} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[s.label, { color: r.color }]}>
            { r.state} <Text style={{ color: "gray" }}>-</Text> {stateLabel(r.state)}
          </Text>
          <Text style={s.subLabel}>{r.count} match{r.count !== 1 ? "es" : ""}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Text style={s.colVal}>{r.avgKills.toFixed(1)}</Text>
          <Text style={s.colVal}>#{r.avgPlace.toFixed(1)}</Text>
          <Text style={s.colVal}>{r.winPct.toFixed(0)}%</Text>
          <Text style={s.colVal}>{r.top10Pct.toFixed(0)}%</Text>
        </View>
      </View>
      <MiniBar value={r.avgKills} max={maxKills} color={r.color} />
    </View>
  );

  return (
    <View style={{ gap: 14 }}>

      {/* ── Header ── */}
      <View style={s.headerWrap}>
        <View style={s.titleRow}>
          <Text style={s.sectionLabel}>CARRY-OVER EFFECT</Text>
          <Text style={s.titleSub}>next game impact</Text>
        </View>
         <Text style={s.explainer}>
            Each row shows your average stats in the match immediately{" "}
            <Text style={s.explainerEmphasis}>after</Text> recording that mental state — not during it.
          </Text>
      </View>

      {/* ── Qualified rows ── */}
      <ColHeaders />
      <View style={{ gap: 10 }}>
        {qualifiedRows.map((r) => renderRow(r))}
      </View>

      {/* ── Unqualified rows ── */}
      {unqualifiedRows.length > 0 && (
        <>
          <View style={s.cardDivider} />
          <Text style={s.dimLabel}>FEWER THAN {MIN_MATCHES_FOR_ROW} MATCHES — NOT YET RELIABLE</Text>
          <View style={{ gap: 10, opacity: 0.35 }}>
            {unqualifiedRows.map((r) => renderRow(r, true))}
          </View>
        </>
      )}

      {/* ── Insight ── */}
      <MomentumInsight pairs={pairs} />

      {/* ── Footnote ── */}
      <Text style={s.footnote}>
        {pairs.length} match pairs · {baselineSessions} session{baselineSessions !== 1 ? "s" : ""} with baseline
      </Text>

    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  headerWrap:  { gap: 6 },
  titleRow:    { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  sectionLabel:{ color: "#444", fontSize: 9, letterSpacing: 2, fontWeight: "600" },
  titleSub:    { color: "#2e2e44", fontSize: 8, letterSpacing: 0.5 },
  explainer:   { color: "#3a3a55", fontSize: 10, lineHeight: 16, letterSpacing: 0.3 },
  explainerEmphasis: { color: "#4a4a6a", fontWeight: "700" },

  dot:      { width: 8, height: 8, borderRadius: 4 },
  label:    { fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  subLabel: { color: "#444", fontSize: 9, letterSpacing: 0.5 },

  colHeader: { color: "#444", fontSize: 8, letterSpacing: 1.5, fontWeight: "600", minWidth: 36, textAlign: "right" },
  colVal:    { color: "#aaa", fontSize: 11, fontWeight: "600", minWidth: 36, textAlign: "right" },

  cardDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },
  dimLabel:    { color: "#2a2a3a", fontSize: 8, letterSpacing: 1.5, fontWeight: "600" },

  miniBarTrack: { height: 4, backgroundColor: INNER_BG, borderRadius: 2, overflow: "hidden" },
  miniBarFill:  { height: "100%", borderRadius: 2 },

  infoBox:  { backgroundColor: INNER_BG, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#16162a", marginTop: 4 },
  infoText: { color: "#666", fontSize: 11, lineHeight: 16 },

  footnote:  { color: "#2e2e44", fontSize: 8, letterSpacing: 0.8, textAlign: "center" },
  emptyState:{ paddingVertical: 20, alignItems: "center" },
  emptyText: { color: "#444", fontSize: 12, letterSpacing: 0.5, textAlign: "center" },
});