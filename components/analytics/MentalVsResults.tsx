import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  avg,
  mentalLabel,
  BUCKET_COLORS,
  AnalyticsMatch,
} from "@/constants/analytics";

const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";

// ─── Shared sub-components ────────────────────────────────────────────────────
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

const EmptyState = ({ message }: { message: string }) => (
  <View style={s.emptyState}>
    <Text style={s.emptyStateText}>{message}</Text>
  </View>
);

const ColumnHeaders = () => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 24,
      paddingRight: 2,
      marginBottom: 4,
    }}
  >
    <Text style={s.colHeader}>KILLS</Text>
    <Text style={s.colHeader}>PLACE</Text>
    <Text style={s.colHeader}>GAMES</Text>
  </View>
);

const BucketRow = ({ r, maxKills }: { r: any; maxKills: number }) => (
  <View style={{ gap: 6 }}>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={[s.mentalStateDot, { backgroundColor: r.color }]} />
      <Text style={[s.mentalTag, { color: r.color, marginLeft: 8, flex: 1 }]}>
        {r.label}
      </Text>
      <View style={{ flexDirection: "row", gap: 24, paddingRight: 2 }}>
        <Text style={s.colVal}>{r.avgKills.toFixed(1)}</Text>
        <Text style={s.colVal}>#{r.avgPlace.toFixed(0)}</Text>
        <Text style={s.colVal}>{r.count}</Text>
      </View>
    </View>
    <MiniBar value={r.avgKills} max={maxKills} color={r.color} />
  </View>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function MentalVsResults({
  matches,
}: {
  matches: AnalyticsMatch[];
}) {
  if (!matches.length) return <EmptyState message="No matches logged yet." />;

  const bucketOrder = ["TILTED", "NEUTRAL", "FOCUSED", "LOCKED IN"] as const;

  // ── Section 1: Avg performance per bucket ──
  const section1Rows = bucketOrder
    .map((label) => {
      const ms = matches.filter((m) => mentalLabel(m.mentalState) === label);
      return {
        label,
        color: BUCKET_COLORS[label],
        count: ms.length,
        avgKills: avg(ms.map((m) => m.kills)),
        avgPlace: avg(ms.map((m) => m.placement)),
      };
    })
    .filter((r) => r.count > 0);

  const maxS1Kills = Math.max(...section1Rows.map((r) => r.avgKills), 1);

  // ── Section 2: Momentum ──
  const sessionMap: Record<string, AnalyticsMatch[]> = {};
  matches.forEach((m) => {
    if (!m.sessionId) return;
    if (!sessionMap[m.sessionId]) sessionMap[m.sessionId] = [];
    sessionMap[m.sessionId].push(m);
  });

  const momentumBuckets: Record<
    string,
    { kills: number[]; placements: number[] }
  > = {
    TILTED: { kills: [], placements: [] },
    NEUTRAL: { kills: [], placements: [] },
    FOCUSED: { kills: [], placements: [] },
    "LOCKED IN": { kills: [], placements: [] },
  };

  Object.values(sessionMap).forEach((sessionMatches) => {
    const ordered = [...sessionMatches].reverse();
    for (let i = 0; i < ordered.length - 1; i++) {
      const bucket = mentalLabel(ordered[i].mentalState);
      momentumBuckets[bucket].kills.push(ordered[i + 1].kills);
      momentumBuckets[bucket].placements.push(ordered[i + 1].placement);
    }
  });

  const momentumRows = bucketOrder
    .map((label) => ({
      label,
      color: BUCKET_COLORS[label],
      avgKills: avg(momentumBuckets[label].kills),
      avgPlace: avg(momentumBuckets[label].placements),
      count: momentumBuckets[label].kills.length,
    }))
    .filter((r) => r.count > 0);

  const maxMomentumKills = Math.max(...momentumRows.map((r) => r.avgKills), 1);

  return (
    <View style={{ gap: 14 }}>
      <Text style={s.sectionLabel}>AVG PERFORMANCE BY MENTAL STATE</Text>
      <ColumnHeaders />
      {section1Rows.map((r) => (
        <BucketRow key={r.label} r={r} maxKills={maxS1Kills} />
      ))}

      <View style={s.cardDivider} />

      <Text style={s.sectionLabel}>MOMENTUM</Text>
      <Text style={s.momentumSub}>
        How your mental state at the end of a match affects your next game.
      </Text>
      {momentumRows.length < 2 ? (
        <EmptyState message="Play more matches in sessions to see momentum data." />
      ) : (
        <>
          <ColumnHeaders />
          {momentumRows.map((r) => (
            <BucketRow key={r.label} r={r} maxKills={maxMomentumKills} />
          ))}
          <View style={s.infoBox}>
            <Text style={s.infoText}>
              💡 Ending a game tilted tends to carry into the next. Try to end
              sessions on a high mental state.
            </Text>
          </View>
        </>
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
  miniBarTrack: {
    height: 4,
    backgroundColor: INNER_BG,
    borderRadius: 2,
    overflow: "hidden",
  },
  miniBarFill: { height: "100%", borderRadius: 2 },
  mentalStateDot: { width: 8, height: 8, borderRadius: 4 },
  mentalTag: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    minWidth: 16,
  },
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
  momentumSub: { color: "#444", fontSize: 10, lineHeight: 15, marginTop: -10 },
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
