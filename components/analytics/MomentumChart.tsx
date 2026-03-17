import React, { useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { avg, AnalyticsMatch, AnalyticsSession } from "@/constants/analytics";
import { Timestamp } from "firebase/firestore";
import gradientColors from "@/constants/gradient";
import { stateLabel } from "@/constants/analytics";

// ── Types ──────────────────────────────────────────────────────────────────
type BarMode = "placement" | "kills";

interface MomentumPair {
  prevMental: number;
  match: AnalyticsMatch;
}

// ── Constants ──────────────────────────────────────────────────────────────
const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";

const STATE_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
type StateNum = (typeof STATE_KEYS)[number];

// ── Helpers ────────────────────────────────────────────────────────────────
function toDate(d: string | Timestamp | Date): Date {
  if (d instanceof Date) return d;
  if (typeof d === "string") return new Date(d);
  return d.toDate();
}

function MomentumInsight({ pairs, mode }: { pairs: MomentumPair[]; mode: BarMode }) {
  const stateStats = STATE_KEYS.map((n) => {
    const bucket = pairs.filter((p) => p.prevMental === n);
    if (bucket.length < 2) return null;
    return {
      state:    n,
      count:    bucket.length,
      avgPlace: avg(bucket.map((p) => p.match.placement)),
      avgKills: avg(bucket.map((p) => p.match.kills)),
    };
  }).filter(Boolean) as { state: number; count: number; avgPlace: number; avgKills: number }[];

  if (stateStats.length < 3) return null;

  const sorted = mode === "placement"
    ? [...stateStats].sort((a, b) => a.avgPlace - b.avgPlace)
    : [...stateStats].sort((a, b) => b.avgKills - a.avgKills);

  const best  = sorted[0];
  const worst = sorted[sorted.length - 1];

  const spread = mode === "placement"
    ? worst.avgPlace - best.avgPlace
    : best.avgKills - worst.avgKills;

  function gc(n: number) { return gradientColors[n - 1] as string; }

  if (spread < 1.5) {
    return (
      <View style={[s.detailStrip, { borderColor: "#1e1e35", marginTop: 12 }]}>
        <View style={[s.detailItem, { paddingHorizontal: 12 }]}>
          <Text style={[s.detailLabel, { textAlign: "center", lineHeight: 16, color: "#2e2e44" }]}>
            💡 Mental carry-over has little effect on your {mode === "placement" ? "placement" : "kills"} — results are consistent regardless of how the last game felt.
          </Text>
        </View>
      </View>
    );
  }

  const bestColor  = gc(best.state);
  const worstColor = gc(worst.state);

  const bestMetric  = mode === "placement" ? `#${best.avgPlace.toFixed(1)}` : `${best.avgKills.toFixed(1)}`;
  const worstMetric = mode === "placement" ? `#${worst.avgPlace.toFixed(1)}` : `${worst.avgKills.toFixed(1)}`;
  const metricLabel = mode === "placement" ? "avg place" : "avg kills";

  return (
    <View style={[s.detailStrip, { borderColor: bestColor + "30", marginTop: 12 }]}>

      {/* Emoji header */}
      <View style={[s.detailItem, { flex: 0, paddingHorizontal: 12, borderRightWidth: 1, borderColor: bestColor + "20" }]}>
        <Text style={{ fontSize: 16 }}>💡</Text>
      </View>

      {/* Best */}
      <View style={[s.detailItem, { borderRightWidth: 1, borderColor: bestColor + "20" }]}>
        <Text style={[s.detailValue, { color: bestColor }]}>{best.state}</Text>
        <Text style={[s.detailLabel, { color: bestColor + "99" }]}>{stateLabel(best.state).toUpperCase()}</Text>
        <Text style={[s.detailLabel, { color: "#2e2e44", marginTop: 2 }]}>{bestMetric} {metricLabel}</Text>
      </View>

      {/* Worst */}
      <View style={s.detailItem}>
        <Text style={[s.detailValue, { color: worstColor }]}>{worst.state}</Text>
        <Text style={[s.detailLabel, { color: worstColor + "99" }]}>{stateLabel(worst.state).toUpperCase()}</Text>
        <Text style={[s.detailLabel, { color: "#2e2e44", marginTop: 2 }]}>{worstMetric} {metricLabel}</Text>
      </View>

    </View>
  );
}

function buildMomentumPairs(
  matches: AnalyticsMatch[],
  sessions: AnalyticsSession[],
): MomentumPair[] {
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const pairs: MomentumPair[] = [];

  // group by session
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

// ── Toggle ─────────────────────────────────────────────────────────────────
function BarModeToggle({
  mode,
  onChange,
}: {
  mode: BarMode;
  onChange: (m: BarMode) => void;
}) {
  return (
    <View style={tog.wrap}>
      {(["placement", "kills"] as BarMode[]).map((m) => {
        const active = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            style={[tog.btn, active && tog.btnActive]}
          >
            <Text style={[tog.label, active && tog.labelActive]}>
              {m === "kills" ? "KILLS" : "PLACEMENT"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const tog = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: "#0c0c1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1a1a2e",
    padding: 3,
    gap: 3,
  },
  btn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  btnActive: {
    backgroundColor: "#ffffff0e",
    borderWidth: 1,
    borderColor: "#ffffff18",
  },
  label: {
    color: "#2e2e50",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  labelActive: { color: "#aaaaaa" },
});

// ── Bar chart ──────────────────────────────────────────────────────────────
function MomentumBars({
  pairs,
  mode,
  selectedState,
  onSelect,
}: {
  pairs: MomentumPair[];
  mode: BarMode;
  selectedState: StateNum | null;
  onSelect: (n: StateNum | null) => void;
}) {
  const barAnims = useRef(STATE_KEYS.map(() => new Animated.Value(0))).current;

  const stateStats = STATE_KEYS.map((n) => {
    const bucket = pairs.filter((p) => p.prevMental === n);
    if (!bucket.length)
      return {
        state: n,
        count: 0,
        avgPlace: 0,
        avgKills: 0,
        winPct: 0,
        best: 0,
        worst: 0,
      };
    const placements = bucket.map((p) => p.match.placement);
    const kills = bucket.map((p) => p.match.kills);
    return {
      state: n,
      count: bucket.length,
      avgPlace: avg(placements),
      avgKills: avg(kills),
      winPct:
        (bucket.filter((p) => p.match.placement === 1).length / bucket.length) *
        100,
      best: Math.min(...placements),
      worst: Math.max(...placements),
    };
  });

  const filledStats = stateStats.filter((s) => s.count > 0);

  const worstAvgPlace = Math.max(...filledStats.map((s) => s.avgPlace), 1);
  const MAX_PLACE = Math.ceil(worstAvgPlace * 1.25);
  const maxAvgKills = Math.max(...filledStats.map((s) => s.avgKills), 1);
  const MAX_KILLS = Math.ceil(maxAvgKills * 1.25);

  useEffect(() => {
    barAnims.forEach((a) => a.setValue(0));
    Animated.stagger(
      35,
      barAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: false,
          tension: 60,
          friction: 12,
        }),
      ),
    ).start();
  }, [mode]);

  useEffect(() => {
    Animated.stagger(
      35,
      barAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: false,
          tension: 60,
          friction: 12,
        }),
      ),
    ).start();
  }, []);

  return (
    <View style={s.binnedWrap}>
      {STATE_KEYS.map((n, idx) => {
        const stat = stateStats[idx];
        const color = gradientColors[n - 1] as string;
        if (!stat.count) return null;

        const isSelected = selectedState === n;
        const isDimmed = selectedState !== null && !isSelected;

        const avgFill =
          mode === "placement"
            ? Math.max(0.04, (MAX_PLACE - stat.avgPlace) / MAX_PLACE)
            : Math.max(0.04, stat.avgKills / MAX_KILLS);

        const barWidth = barAnims[idx].interpolate({
          inputRange: [0, 1],
          outputRange: ["0%", `${avgFill * 100}%`],
        });

        const displayValue =
          mode === "placement"
            ? `#${stat.avgPlace.toFixed(1)}`
            : stat.avgKills.toFixed(1);

        return (
          <Pressable
            key={n}
            onPress={() => onSelect(isSelected ? null : n)}
            style={[s.binnedRow, isDimmed && { opacity: 0.2 }]}
          >
            <View
              style={[
                s.stateBadge,
                {
                  backgroundColor: color + (isSelected ? "30" : "15"),
                  borderColor: color + (isSelected ? "99" : "40"),
                },
              ]}
            >
              <Text
                style={[
                  s.stateBadgeText,
                  { color: isSelected ? color : color + "cc" },
                ]}
              >
                {n}
              </Text>
            </View>

            <View style={s.binnedTrack}>
              <Animated.View
                style={[
                  s.binnedBar,
                  {
                    width: barWidth,
                    backgroundColor: color + (isSelected ? "55" : "35"),
                    borderColor: color + (isSelected ? "cc" : "77"),
                  },
                ]}
              />
              <View
                style={[
                  s.avgMarker,
                  {
                    left: `${avgFill * 100}%` as any,
                    backgroundColor: color,
                    opacity: isSelected ? 1 : 0.85,
                  },
                ]}
              />
            </View>

            <Text
              style={[
                s.binnedValue,
                { color: isSelected ? color : color + "88" },
              ]}
            >
              {displayValue}
            </Text>
          </Pressable>
        );
      })}

      <View style={s.axisRow}>
        <Text style={s.axisLabel}>
          {mode === "placement" ? "worse ←" : "fewer ←"}
        </Text>
        <Text style={s.axisLabel}>
          {mode === "placement" ? "→ better" : "→ more"}
        </Text>
      </View>
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
  const [mode, setMode] = useState<BarMode>("placement");
  const [selectedState, setSelectedState] = useState<StateNum | null>(null);

  const pairs = buildMomentumPairs(matches, sessions);

  if (!pairs.length) {
    return (
      <View style={s.card}>
        <View style={s.cardTitleWrap}>
          <Text style={s.cardTitle}>MOMENTUM</Text>
          <View style={s.cardTitleDivider} />
        </View>
        <View style={s.emptyState}>
          <Text style={s.emptyText}>
            Complete more sessions to see momentum data.
          </Text>
        </View>
      </View>
    );
  }

  const selectedColor = selectedState
    ? (gradientColors[selectedState - 1] as string)
    : null;

  const selectedPairs = selectedState
    ? pairs.filter((p) => p.prevMental === selectedState)
    : [];

  const selectedDetail =
    selectedState && selectedPairs.length
      ? {
          count: selectedPairs.length,
          avgPlace: avg(selectedPairs.map((p) => p.match.placement)),
          avgKills: avg(selectedPairs.map((p) => p.match.kills)),
          winPct:
            (selectedPairs.filter((p) => p.match.placement === 1).length /
              selectedPairs.length) *
            100,
          best: Math.min(...selectedPairs.map((p) => p.match.placement)),
          worst: Math.max(...selectedPairs.map((p) => p.match.placement)),
        }
      : null;

  // count sessions that contributed a baseline (startingMental present)
  const baselineSessions = sessions.filter(
    (s) => s.startingMental != null,
  ).length;

  return (
    <View style={s.card}>
      {/* ── Title ── */}
      <View style={s.cardTitleWrap}>
        <View style={s.titleRow}>
          <Text style={s.cardTitle}>CARRY-OVER EFFECT</Text>
          <Text style={s.titleSub}>next game impact</Text>
        </View>
        <View style={s.cardTitleDivider} />
        <Text style={s.explainer}>
          Each bar represents your average{" "}
          {mode === "placement" ? "placement" : "kills"} in the game immediately
          after feeling that mental state. If your 9 bar is short, feeling great
          doesn't carry forward — if it's long, good vibes translate.
        </Text>
      </View>

      {/* ── Toggle ── */}
      <BarModeToggle
        mode={mode}
        onChange={(m) => {
          setMode(m);
          setSelectedState(null);
        }}
      />

      <View style={{ height: 10 }} />

      {/* ── Bars ── */}
      <MomentumBars
        pairs={pairs}
        mode={mode}
        selectedState={selectedState}
        onSelect={setSelectedState}
      />

      {/* ── Detail strip or hint ── */}
      {selectedDetail && selectedColor ? (
        <View
          style={[
            s.detailStrip,
            { borderColor: selectedColor + "30", marginTop: 12 },
          ]}
        >
          {[
            { label: "PLACE", value: `${selectedDetail.avgPlace.toFixed(1)}` },
            { label: "BEST", value: `${selectedDetail.best}` },
            { label: "WORST", value: `${selectedDetail.worst}` },
            { label: "KILLS", value: selectedDetail.avgKills.toFixed(1) },
            { label: "WIN %", value: `${selectedDetail.winPct.toFixed(0)}` },
            {
              label: "GAMES",
              value: selectedDetail.count.toString(),
              dim: true,
            },
          ].map((item, i, arr) => (
            <View
              key={item.label}
              style={[
                s.detailItem,
                i < arr.length - 1 && {
                  borderRightWidth: 1,
                  borderColor: selectedColor + "20",
                },
              ]}
            >
              <Text
                style={[
                  s.detailValue,
                  { color: (item as any).dim ? "#3a3a55" : selectedColor },
                ]}
              >
                {item.value}
              </Text>
              <Text style={s.detailLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={s.tapHint}>tap a row to inspect</Text>
      )}

      {/* ── Pair count footnote ── */}
      {/* ── Insight ── */}

      {/* ── Insight ── */}
      {!selectedState && <MomentumInsight pairs={pairs} mode={mode} />}

      {/* ── Pair count footnote ── */}
      <Text style={s.footnote}>
        {pairs.length} match pairs · {baselineSessions} session
        {baselineSessions !== 1 ? "s" : ""} with baseline
      </Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card: {
    backgroundColor: INNER_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 0,
  },

  // Title — matches parent pattern
  cardTitleWrap: { marginBottom: 14 },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: {
    color: "#555",
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "600",
  },
  titleSub: { color: "#2e2e44", fontSize: 8, letterSpacing: 0.5 },
  cardTitleDivider: { height: 1, backgroundColor: "#1a1a2e" },
  explainer: {
    color: "#3a3a55",
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 0.3,
    marginTop: 10,
  },

  infoBox: {
    backgroundColor: INNER_BG,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#16162a",
    marginTop: 4,
  },
  infoText: { color: "#666", fontSize: 11, lineHeight: 18 },
  infoEmphasis: { fontWeight: "700", color: "#888" },
  infoBoxLabel: {
    color: "#444",
    fontSize: 8,
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 10,
  },
  infoRow: { flexDirection: "row" },
  infoCol: { flex: 1, alignItems: "center", gap: 3 },
  infoColDivider: { width: 1, backgroundColor: "#1a1a2e", marginHorizontal: 8 },
  infoColHeader: {
    color: "#333",
    fontSize: 7,
    letterSpacing: 2,
    fontWeight: "600",
  },
  infoStateNum: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 32,
  },
  infoStateLabel: {
    color: "#555",
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "600",
  },
  infoMetric: { color: "#3a3a55", fontSize: 9, letterSpacing: 0.5 },

  // Bars
  binnedWrap: { gap: 8 },
  binnedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stateBadge: {
    width: 28,
    height: 30,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stateBadgeText: { fontSize: 11, fontWeight: "800", letterSpacing: -0.3 },
  binnedTrack: {
    flex: 1,
    height: 30,
    backgroundColor: "#0c0c1a",
    borderRadius: 6,
    overflow: "hidden",
    justifyContent: "center",
  },
  binnedBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderLeftWidth: 0,
  },
  avgMarker: {
    position: "absolute",
    width: 3,
    top: 3,
    bottom: 3,
    borderRadius: 1.5,
    marginLeft: -1.5,
  },
  binnedValue: {
    width: 38,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: -0.3,
    textAlign: "right",
  },
  axisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 36,
    paddingRight: 40,
    marginTop: 4,
  },
  axisLabel: { fontSize: 8, color: "#2e2e44", letterSpacing: 0.5 },

  // Detail strip
  detailStrip: {
    flexDirection: "row",
    backgroundColor: "#0c0c1a",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  detailLabel: {
    color: "#333",
    fontSize: 7,
    letterSpacing: 1.2,
    fontWeight: "600",
  },
  tapHint: {
    color: "#2e2e44",
    fontSize: 9,
    textAlign: "center",
    letterSpacing: 0.5,
    marginTop: 10,
  },

  // Footnote
  footnote: {
    color: "#2e2e44",
    fontSize: 8,
    letterSpacing: 0.8,
    textAlign: "center",
    marginTop: 10,
  },

  // Empty
  emptyState: { paddingVertical: 20, alignItems: "center" },
  emptyText: {
    color: "#444",
    fontSize: 12,
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
