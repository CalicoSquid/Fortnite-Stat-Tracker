import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { avg, getMatchDate, AnalyticsMatch } from "../../constants/analytics";
const BLUE = "#3b82f6";
const GREEN = "#22c55e";
const PURPLE = "#8b5cf6";
const AMBER = "#f59e0b";
const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";

// ─── 2-hour buckets covering full day ────────────────────────────────────────
const TIME_BUCKETS_2H = [
  { label: "12am–2am", hours: [0, 1], color: BLUE },
  { label: "2am–4am", hours: [2, 3], color: BLUE },
  { label: "4am–6am", hours: [4, 5], color: BLUE },
  { label: "6am–8am", hours: [6, 7], color: AMBER },
  { label: "8am–10am", hours: [8, 9], color: AMBER },
  { label: "10am–12pm", hours: [10, 11], color: AMBER },
  { label: "12pm–2pm", hours: [12, 13], color: "#ff993b" },
  { label: "2pm–4pm", hours: [14, 15], color: "#ff993b" },
  { label: "4pm–6pm", hours: [16, 17], color: "#ff993b" },
  { label: "6pm–8pm", hours: [18, 19], color: PURPLE },
  { label: "8pm–10pm", hours: [20, 21], color: PURPLE },
  { label: "10pm–12am", hours: [22, 23], color: PURPLE },
];

const EmptyState = ({ message }: { message: string }) => (
  <View style={s.emptyState}>
    <Text style={s.emptyStateText}>{message}</Text>
  </View>
);

const MiniBar = ({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) => (
  <View style={s.miniBarTrack}>
    <View
      style={[
        s.miniBarFill,
        {
          width: (max > 0
            ? `${Math.min(100, (value / max) * 100)}%`
            : "0%") as any,
          backgroundColor: color,
        },
      ]}
    />
  </View>
);

const ColHeaders = () => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 16,
      paddingRight: 2,
      marginBottom: 2,
    }}
  >
    <Text style={s.colHeader}>KILLS</Text>
    <Text style={s.colHeader}>PLACE</Text>
    <Text style={s.colHeader}>WIN%</Text>
    <Text style={s.colHeader}>TOP10</Text>
  </View>
);

export default function TimeAnalysis({
  matches,
}: {
  matches: AnalyticsMatch[];
}) {
  if (matches.length < 5)
    return (
      <EmptyState message="Log at least 5 matches to see time analysis." />
    );

  // ── 2-hour buckets ──
  const timeBucketData = TIME_BUCKETS_2H.map(({ label, hours, color }) => {
    const ms = matches.filter((m) => {
      const d = getMatchDate(m.date);
      return d ? hours.includes(d.getHours()) : false;
    });
    return {
      label,
      color,
      count: ms.length,
      avgKills: avg(ms.map((m) => m.kills)),
      avgPlace: avg(ms.map((m) => m.placement)),
      winPct: ms.length
        ? (ms.filter((m) => m.placement === 1).length / ms.length) * 100
        : 0,
      top10Pct: ms.length
        ? (ms.filter((m) => m.placement <= 10).length / ms.length) * 100
        : 0,
    };
  }).filter((b) => b.count > 0);

  const maxKills = Math.max(...timeBucketData.map((b) => b.avgKills), 1);

  // ── Weekday vs Weekend ──
  const weekdayMatches = matches.filter((m) => {
    const d = getMatchDate(m.date);
    if (!d) return false;
    const day = d.getDay();
    return day >= 1 && day <= 5;
  });
  const weekendMatches = matches.filter((m) => {
    const d = getMatchDate(m.date);
    if (!d) return false;
    const day = d.getDay();
    return day === 0 || day === 6;
  });

  const weekdayVsWeekend = [
    { label: "WEEKDAY", color: BLUE, ms: weekdayMatches },
    { label: "WEEKEND", color: GREEN, ms: weekendMatches },
  ]
    .map(({ label, color, ms }) => ({
      label,
      color,
      count: ms.length,
      avgKills: avg(ms.map((m) => m.kills)),
      avgPlace: avg(ms.map((m) => m.placement)),
      winPct: ms.length
        ? (ms.filter((m) => m.placement === 1).length / ms.length) * 100
        : 0,
      top10Pct: ms.length
        ? (ms.filter((m) => m.placement <= 10).length / ms.length) * 100
        : 0,
    }))
    .filter((b) => b.count > 0);

  const maxWeekKills = Math.max(...weekdayVsWeekend.map((b) => b.avgKills), 1);

  const bestTime = [...timeBucketData].sort(
    (a, b) =>
      b.avgKills * 0.4 +
      (100 - b.avgPlace) * 0.4 +
      b.winPct * 0.2 -
      (a.avgKills * 0.4 + (100 - a.avgPlace) * 0.4 + a.winPct * 0.2),
  )[0];

  return (
    <View style={{ gap: 14 }}>
      {/* ── Time of day ── */}
      <Text style={s.sectionLabel}>PERFORMANCE BY TIME OF DAY</Text>
      <ColHeaders />
      <View style={{ gap: 10 }}>
        {timeBucketData.map((b) => (
          <View key={b.label} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[s.dot, { backgroundColor: b.color }]} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[s.label, { color: b.color }]}>{b.label}</Text>
                <Text style={s.subLabel}>{b.count} matches</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <Text style={s.colVal}>{b.avgKills.toFixed(1)}</Text>
                <Text style={s.colVal}>#{b.avgPlace.toFixed(0)}</Text>
                <Text style={s.colVal}>{b.winPct.toFixed(0)}%</Text>
                <Text style={s.colVal}>{b.top10Pct.toFixed(0)}%</Text>
              </View>
            </View>
            <MiniBar value={b.avgKills} max={maxKills} color={b.color} />
          </View>
        ))}
      </View>

      <View style={s.cardDivider} />

      {/* ── Weekday vs Weekend ── */}
      <Text style={s.sectionLabel}>WEEKDAY VS WEEKEND</Text>
      <ColHeaders />
      <View style={{ gap: 10 }}>
        {weekdayVsWeekend.map((b) => (
          <View key={b.label} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={[s.dot, { backgroundColor: b.color }]} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[s.label, { color: b.color }]}>{b.label}</Text>
                <Text style={s.subLabel}>{b.count} matches</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <Text style={s.colVal}>{b.avgKills.toFixed(1)}</Text>
                <Text style={s.colVal}>#{b.avgPlace.toFixed(0)}</Text>
                <Text style={s.colVal}>{b.winPct.toFixed(0)}%</Text>
                <Text style={s.colVal}>{b.top10Pct.toFixed(0)}%</Text>
              </View>
            </View>
            <MiniBar value={b.avgKills} max={maxWeekKills} color={b.color} />
          </View>
        ))}
      </View>

      {/* ── Recommendation ── */}
      {bestTime && (
        <View style={s.infoBox}>
          <Text style={s.infoText}>
            💡 Your best time to play is{" "}
            <Text style={{ color: bestTime.color, fontWeight: "700" }}>
              {bestTime.label}
            </Text>{" "}
            — {bestTime.avgKills.toFixed(1)} avg kills and #
            {bestTime.avgPlace.toFixed(0)} avg placement.
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  sectionLabel: {
    color: "#444",
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  subLabel: { color: "#444", fontSize: 9, letterSpacing: 0.5 },
  colHeader: {
    color: "#444",
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "600",
    minWidth: 36,
    textAlign: "right",
  },
  colVal: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "600",
    minWidth: 36,
    textAlign: "right",
  },
  miniBarTrack: {
    height: 4,
    backgroundColor: INNER_BG,
    borderRadius: 2,
    overflow: "hidden",
  },
  miniBarFill: { height: "100%", borderRadius: 2 },
  infoBox: {
    backgroundColor: INNER_BG,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#16162a",
    marginTop: 4,
  },
  infoText: { color: "#666", fontSize: 11, lineHeight: 16 },
  emptyState: { paddingVertical: 20, alignItems: "center" },
  emptyStateText: { color: "#444", fontSize: 12, letterSpacing: 0.5 },
});
