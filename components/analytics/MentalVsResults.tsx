import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import {
  avg,
  mentalLabel,
  BUCKET_COLORS,
  AnalyticsMatch,
} from "@/constants/analytics";

const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";

const BUCKET_ORDER = ["TILTED", "NEUTRAL", "FOCUSED", "LOCKED IN"] as const;
type Bucket = (typeof BUCKET_ORDER)[number];

const EmptyState = ({ message }: { message: string }) => (
  <View style={s.emptyState}>
    <Text style={s.emptyStateText}>{message}</Text>
  </View>
);

export default function MentalVsResults({
  matches,
}: {
  matches: AnalyticsMatch[];
}) {
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);

  if (!matches.length) return <EmptyState message="No matches logged yet." />;

  const bucketData = BUCKET_ORDER.map((label) => {
    const ms = matches.filter((m) => mentalLabel(m.mentalState) === label);
    return {
      label,
      color: BUCKET_COLORS[label],
      count: ms.length,
      avgKills: avg(ms.map((m) => m.kills)),
      avgPlace: avg(ms.map((m) => m.placement)),
      winPct: ms.length
        ? (ms.filter((m) => m.placement === 1).length / ms.length) * 100
        : 0,
    };
  });

  const filledBuckets = bucketData.filter((b) => b.count > 0);
  const totalMatches = matches.length;

  const tilted = bucketData.find((b) => b.label === "TILTED");
  const lockedIn = bucketData.find((b) => b.label === "LOCKED IN");
  const focused = bucketData.find((b) => b.label === "FOCUSED");
  const bestBucket = [...filledBuckets].sort(
    (a, b) => a.avgPlace - b.avgPlace,
  )[0];
  const worstBucket = [...filledBuckets].sort(
    (a, b) => b.avgPlace - a.avgPlace,
  )[0];

  const placementDiff =
    tilted && lockedIn && tilted.count > 0 && lockedIn.count > 0
      ? tilted.avgPlace - lockedIn.avgPlace
      : bestBucket && worstBucket && bestBucket.label !== worstBucket.label
        ? worstBucket.avgPlace - bestBucket.avgPlace
        : null;

  const sessionMap: Record<string, AnalyticsMatch[]> = {};
  matches.forEach((m) => {
    if (!m.sessionId) return;
    if (!sessionMap[m.sessionId]) sessionMap[m.sessionId] = [];
    sessionMap[m.sessionId].push(m);
  });

  const momentumData = BUCKET_ORDER.map((label) => {
    const nextPlacements: number[] = [];
    Object.values(sessionMap).forEach((sessionMatches) => {
      const ordered = [...sessionMatches].reverse();
      for (let i = 0; i < ordered.length - 1; i++) {
        if (mentalLabel(ordered[i].mentalState) === label) {
          nextPlacements.push(ordered[i + 1].placement);
        }
      }
    });
    return {
      label,
      color: BUCKET_COLORS[label],
      avgNextPlace: avg(nextPlacements),
      count: nextPlacements.length,
    };
  }).filter((m) => m.count > 0);

  const tiltedMomentum = momentumData.find((m) => m.label === "TILTED");
  const lockedMomentum = momentumData.find((m) => m.label === "LOCKED IN");
  const hasMomentum = momentumData.length >= 2;

  const selected = selectedBucket
    ? bucketData.find((b) => b.label === selectedBucket)
    : null;

  const visibleBuckets = bucketData.filter((b) =>
    totalMatches > 0 ? b.count / totalMatches > 0 : false,
  );

  return (
    <View style={{ gap: 14 }}>
      {/* ── BIG INSIGHT ── */}
      {(() => {
        const avgMental = avg(matches.map((m) => m.mentalState));
        const aboveAvg = matches.filter((m) => m.mentalState >= avgMental);
        const belowAvg = matches.filter((m) => m.mentalState < avgMental);

        if (aboveAvg.length < 3 || belowAvg.length < 3) return null;

        const aboveAvgPlace = avg(aboveAvg.map((m) => m.placement));
        const belowAvgPlace = avg(belowAvg.map((m) => m.placement));
        const diff = belowAvgPlace - aboveAvgPlace;

        if (diff <= 0) return null;

        const insightColor = BUCKET_COLORS["FOCUSED"];

        return (
          <View style={[s.insightCard, { borderColor: insightColor + "33" }]}>
           
            <Text style={s.sectionLabel}>YOUR MENTAL EDGE</Text>
            <Text style={[s.insightValue, { color: insightColor }]}>
              {diff.toFixed(0)} places higher
            </Text>
            <Text style={s.insightSub}>
              on better mental days · based on {matches.length} matches
            </Text>
          </View>
        );
      })()}

      {/* ── SPECTRUM ── */}
      <Text style={s.sectionLabel}>MENTAL STATE SPECTRUM</Text>

      {/* Spectrum bar */}
      <View style={s.spectrumRow}>
        {visibleBuckets.map((b, index) => {
          const pct = totalMatches > 0 ? b.count / totalMatches : 0;
          const isSelected = selectedBucket === b.label;
          const isFirst = index === 0;
          const isLast = index === visibleBuckets.length - 1;
          return (
            <Pressable
              key={b.label}
              onPress={() =>
                setSelectedBucket(isSelected ? null : (b.label as Bucket))
              }
              style={[
                s.spectrumSegment,
                {
                  flex: pct,
                  backgroundColor: isSelected ? b.color + "40" : b.color + "18",
                  borderColor: isSelected ? b.color : b.color + "60",
                  borderTopLeftRadius: isFirst ? 8 : 0,
                  borderBottomLeftRadius: isFirst ? 8 : 0,
                  borderTopRightRadius: isLast ? 8 : 0,
                  borderBottomRightRadius: isLast ? 8 : 0,
                },
              ]}
            >
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  backgroundColor: b.color,
                  opacity: isSelected ? 0.25 : 0.22,
                  transform: [{ skewX: "-20deg" }, { scaleX: 1.5 }],
                }}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Labels */}
      <View style={s.spectrumLabels}>
        {filledBuckets.map((b) => (
          <Pressable
            key={b.label}
            onPress={() =>
              setSelectedBucket(
                selectedBucket === b.label ? null : (b.label as Bucket),
              )
            }
            style={s.spectrumLabelCol}
          >
            <Text
              style={[
                s.spectrumLabelText,
                { color: selectedBucket === b.label ? b.color : "#444" },
              ]}
            >
              {b.label}
            </Text>
            <Text
              style={[
                s.spectrumCount,
                { color: selectedBucket === b.label ? b.color : "#333" },
              ]}
            >
              {b.count} games
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Selected detail — mirrors overview strip */}
      {selected ? (
        <View style={[s.detailStrip, { borderColor: selected.color + "33" }]}>
          {[
            { label: "AVG PLACE", value: `#${selected.avgPlace.toFixed(1)}` },
            { label: "AVG KILLS", value: selected.avgKills.toFixed(1) },
            { label: "WIN %", value: `${selected.winPct.toFixed(1)}%` },
          ].map((item, i, arr) => (
            <View
              key={item.label}
              style={[
                s.detailItem,
                i < arr.length - 1 && {
                  borderRightWidth: 1,
                  borderColor: selected.color + "33",
                },
              ]}
            >
              <Text style={[s.detailValue, { color: selected.color }]}>
                {item.value}
              </Text>
              <Text style={s.detailLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={s.spectrumHint}>Tap a segment to see stats</Text>
      )}

      <View style={s.cardDivider} />

      {/* ── CARRY EFFECT ── */}
      {hasMomentum && (
        <>
          <Text style={s.sectionLabel}>THE CARRY EFFECT</Text>
          <Text style={s.subText}>
            How your mental state at the end of a match affects your next game.
          </Text>

          {/* Tilted vs Locked In — mirrors overview strip */}
          {tiltedMomentum && lockedMomentum && (
            <View style={s.carryStrip}>
              {[tiltedMomentum, lockedMomentum].map((m, i) => (
                <View
                  key={m.label}
                  style={[
                    s.carryItem,
                    i === 0 && {
                      borderRightWidth: 1,
                      borderColor: BORDER,
                    },
                  ]}
                >
                  <Text style={s.carryLabel}>AFTER {m.label}</Text>
                  <Text style={[s.carryValue, { color: m.color }]}>
                    #{m.avgNextPlace.toFixed(0)}
                  </Text>
                  <Text style={s.subText}>avg next placement</Text>
                </View>
              ))}
            </View>
          )}

          {/* All momentum rows */}
          <View style={{ gap: 8 }}>
            {momentumData.map((m) => (
              <View
                key={m.label}
                style={[s.momentumRow, { borderColor: m.color + "33" }]}
              >
                <View
                  style={[s.momentumColorBar, { backgroundColor: m.color }]}
                />
                <Text style={[s.momentumLabel, { color: m.color }]}>
                  {m.label}
                </Text>
                <Text style={s.momentumCount}>{m.count} transitions</Text>
                <Text style={[s.momentumPlace, { color: m.color }]}>
                  #{m.avgNextPlace.toFixed(1)}
                </Text>
              </View>
            ))}
          </View>

          <View style={s.infoBox}>
            <Text style={s.infoText}>
              💡 Ending a game tilted tends to carry into the next. Try taking a
              short break when you feel the tilt creeping in.
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  // ── Insight card ──
  insightCard: {
    backgroundColor: INNER_BG,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
    overflow: "hidden",
  },
  insightAccent: {
    position: "absolute",
    top: 0,
    left: 40,
    right: 40,
    height: 2,
    opacity: 0.8,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  insightSub: {
    color: "#444",
    fontSize: 10,
    letterSpacing: 0.5,
  },

  // ── Spectrum ──
  spectrumRow: {
    flexDirection: "row",
    height: 36,
    gap: 2,
  },
  spectrumSegment: {
    height: "100%",
    borderWidth: 1,
    overflow: "hidden",
    elevation: 4,
  },
  spectrumLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
  },
  spectrumLabelCol: {
    alignItems: "center",
    flex: 1,
  },
  spectrumLabelText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },
  spectrumCount: {
    fontSize: 8,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  spectrumHint: {
    color: "#2a2a3a",
    fontSize: 10,
    textAlign: "center",
    letterSpacing: 0.5,
  },

  // ── Detail strip — mirrors overview strip ──
  detailStrip: {
    flexDirection: "row",
    backgroundColor: INNER_BG,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  detailLabel: {
    color: "#444",
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "600",
  },

  // ── Carry strip — mirrors overview strip ──
  carryStrip: {
    flexDirection: "row",
    backgroundColor: INNER_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  carryItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    gap: 2,
  },
  carryLabel: {
    color: "#444",
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  carryValue: {
    fontSize: 14,
    fontWeight: "700",
  },

  // ── Momentum rows ──
  momentumRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INNER_BG,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  momentumColorBar: {
    width: 3,
    height: 32,
    borderRadius: 2,
  },
  momentumLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    flex: 1,
  },
  momentumCount: {
    color: "#444",
    fontSize: 10,
  },
  momentumPlace: {
    fontSize: 13,
    fontWeight: "700",
    minWidth: 48,
    textAlign: "right",
  },

  // ── Shared ──
  sectionLabel: {
    color: "#444",
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 16,
  },
  subText: {
    color: "#444",
    fontSize: 10,
    lineHeight: 15,
  },
  infoBox: {
    backgroundColor: INNER_BG,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#16162a",
  },
  infoText: { color: "#666", fontSize: 11, lineHeight: 16 },
  emptyState: { paddingVertical: 20, alignItems: "center" },
  emptyStateText: { color: "#444", fontSize: 12, letterSpacing: 0.5 },
});
