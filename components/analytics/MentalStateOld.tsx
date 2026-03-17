import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { avg, stateLabel, AnalyticsMatch } from "@/constants/analytics";
import gradientColors from "@/constants/gradient";

const INNER_BG  = "#0a0a12";
const BORDER    = "#1e1e30";
const MIN_MATCHES_FOR_ROW = 3;

const STATE_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

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
function PerformanceInsight({ matches }: { matches: AnalyticsMatch[] }) {
  const stateStats = STATE_KEYS.map((n) => {
    const ms = matches.filter((m) => Math.round(m.mentalState) === n);
    if (ms.length < MIN_MATCHES_FOR_ROW) return null;
    const placements = ms.map((m) => m.placement);
    const kills      = ms.map((m) => m.kills);
    return {
      state:    n,
      count:    ms.length,
      avgPlace: avg(placements),
      avgKills: avg(kills),
      winPct:   (ms.filter((m) => m.placement === 1).length / ms.length) * 100,
      top10Pct: (ms.filter((m) => m.placement <= 10).length / ms.length) * 100,
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

  if (maxPlace - minPlace < 1.5 && maxKills - minKills < 1) {
    return (
      <View style={s.infoBox}>
        <Text style={s.infoText}>
          💡 Performance is consistent across all mental states — no strong pattern detected yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={[s.infoBox, { borderColor: bestColor + "25" }]}>
      <Text style={s.infoText}>
        💡 You perform best when feeling{" "}
        <Text style={{ color: bestColor, fontWeight: "700" }}>
          {stateLabel(best.state)}
        </Text>
        {" "}— {best.avgKills.toFixed(1)} avg kills, #{best.avgPlace.toFixed(1)} avg placement
        {wins > 0
          ? ` and ${wins} win${wins !== 1 ? "s" : ""} across ${best.count} matches.`
          : ` across ${best.count} matches.`
        }
      </Text>
    </View>
  );
}

// ── Row ────────────────────────────────────────────────────────────────────
const StateRow = ({ r, maxKills }: {
  r: {
    state: number; color: string; count: number;
    avgPlace: number; avgKills: number; winPct: number; top10Pct: number;
  };
  maxKills: number;
}) => (
  <View style={{ gap: 6 }}>
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

// ── Main ───────────────────────────────────────────────────────────────────
export default function MentalStateNew({ matches }: { matches: AnalyticsMatch[] }) {
  const allStateRows = STATE_KEYS.map((n) => {
    const ms = matches.filter((m) => Math.round(m.mentalState) === n);
    if (!ms.length) return null;
    const placements = ms.map((m) => m.placement);
    const kills      = ms.map((m) => m.kills);
    return {
      state:     n,
      color:     gradientColors[n - 1] as string,
      count:     ms.length,
      avgPlace:  avg(placements),
      avgKills:  avg(kills),
      winPct:    (ms.filter((m) => m.placement === 1).length / ms.length) * 100,
      top10Pct:  (ms.filter((m) => m.placement <= 10).length / ms.length) * 100,
      qualified: ms.length >= MIN_MATCHES_FOR_ROW,
    };
  }).filter(Boolean) as {
    state: number; color: string; count: number; avgPlace: number;
    avgKills: number; winPct: number; top10Pct: number; qualified: boolean;
  }[];

  const qualifiedRows   = allStateRows.filter((r) => r.qualified);
  const unqualifiedRows = allStateRows.filter((r) => !r.qualified);
  const maxKills        = Math.max(...(qualifiedRows.length ? qualifiedRows : allStateRows).map((r) => r.avgKills), 1);

  return (
    <View style={{ gap: 14 }}>

      {/* ── Header ── */}
      <View style={s.headerWrap}>
        <View style={s.titleRow}>
          <Text style={s.sectionLabel}>MENTAL STATE VS RESULTS</Text>
          <Text style={s.titleSub}>post-game rating</Text>
        </View>
        <Text style={s.explainer}>
          Each row shows your average stats across all matches where you recorded that mental state{" "}
          <Text style={s.explainerEmphasis}>at the end of the game.</Text>
         
        </Text>
      </View>

      {/* ── Qualified rows ── */}
      <ColHeaders />
      <View style={{ gap: 10 }}>
        {qualifiedRows.map((r) => (
          <StateRow key={r.state} r={r} maxKills={maxKills} />
        ))}
      </View>

      {/* ── Unqualified rows ── */}
      {unqualifiedRows.length > 0 && (
        <>
          <View style={s.cardDivider} />
          <Text style={s.dimLabel}>FEWER THAN {MIN_MATCHES_FOR_ROW} MATCHES — NOT YET RELIABLE</Text>
          <View style={{ gap: 10, opacity: 0.35 }}>
            {unqualifiedRows.map((r) => (
              <StateRow key={r.state} r={r} maxKills={maxKills} />
            ))}
          </View>
        </>
      )}

      {/* ── Insight ── */}
      <PerformanceInsight matches={matches} />

    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  headerWrap:        { gap: 6 },
  titleRow:          { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  sectionLabel:      { color: "#444", fontSize: 9, letterSpacing: 2, fontWeight: "600" },
  titleSub:          { color: "#2e2e44", fontSize: 8, letterSpacing: 0.5 },
  explainer:         { color: "#3a3a55", fontSize: 10, lineHeight: 16, letterSpacing: 0.3 },
  explainerEmphasis: { color: "#4a4a6a", fontWeight: "700" },

  dot:      { width: 8, height: 8, borderRadius: 4 },
  label:    { fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  subLabel: { color: "#444", fontSize: 9, letterSpacing: 0.5 },

  colHeader:   { color: "#444", fontSize: 8, letterSpacing: 1.5, fontWeight: "600", minWidth: 36, textAlign: "right" },
  colVal:      { color: "#aaa", fontSize: 11, fontWeight: "600", minWidth: 36, textAlign: "right" },

  cardDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },
  dimLabel:    { color: "#2a2a3a", fontSize: 8, letterSpacing: 1.5, fontWeight: "600" },

  miniBarTrack: { height: 4, backgroundColor: INNER_BG, borderRadius: 2, overflow: "hidden" },
  miniBarFill:  { height: "100%", borderRadius: 2 },

  infoBox:  { backgroundColor: INNER_BG, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#16162a", marginTop: 4 },
  infoText: { color: "#666", fontSize: 11, lineHeight: 16 },
});