import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { avg, stateLabel, AnalyticsMatch } from "@/constants/analytics";
import gradientColors from "@/constants/gradient";

const INNER_BG = "#0a0a12";

type BarMode = "placement" | "kills";

function fmtKills(n: number) { return n.toFixed(1); }

function CardTitle({ label }: { label: string }) {
  return (
    <View style={s.cardTitleWrap}>
      <Text style={s.cardTitle}>{label}</Text>
      <View style={s.cardTitleDivider} />
    </View>
  );
}

function BarModeToggle({ mode, onChange }: { mode: BarMode; onChange: (m: BarMode) => void }) {
  return (
    <View style={tog.wrap}>
      {(["placement", "kills"] as BarMode[]).map((m) => {
        const active = mode === m;
        return (
          <Pressable key={m} onPress={() => onChange(m)} style={[tog.btn, active && tog.btnActive]}>
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
  wrap:        { flexDirection: "row", backgroundColor: "#0c0c1a", borderRadius: 8, borderWidth: 1, borderColor: "#1a1a2e", padding: 3, gap: 3 },
  btn:         { flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  btnActive:   { backgroundColor: "#ffffff0e", borderWidth: 1, borderColor: "#ffffff18" },
  label:       { color: "#2e2e50", fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  labelActive: { color: "#aaaaaa" },
});

const STATE_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
type StateNum = (typeof STATE_KEYS)[number];

function ChartExplainer({ mode }: { mode: BarMode }) {
  return (
    <View style={exp.wrap}>
      <Text style={exp.body}>
        Each bar represents your average{" "}
        <Text style={exp.emphasis}>{mode === "placement" ? "placement" : "kills"}</Text>{" "}
        across all matches where you recorded that mental state{" "}
        <Text style={exp.emphasis}>after the game.</Text>{" "}
        {mode === "placement"
          ? "A longer bar means a better (lower) placement — shorter bars indicate you finished worse when feeling that way."
          : "A longer bar means more kills — shorter bars indicate fewer eliminations when feeling that way."}{" "}
        Tap any row to inspect that state in detail.
      </Text>
    </View>
  );
}

const exp = StyleSheet.create({
  wrap:     { marginBottom: 14 },
  body:     { color: "#3a3a55", fontSize: 10, lineHeight: 16, letterSpacing: 0.3 },
  emphasis: { color: "#4a4a6a", fontWeight: "700" },
});

function PerformanceInsight({ matches, mode }: { matches: AnalyticsMatch[]; mode: BarMode }) {
  const stateStats = STATE_KEYS.map((n) => {
    const ms = matches.filter((m) => Math.round(m.mentalState) === n);
    if (ms.length < 2) return null;
    return {
      state:    n,
      count:    ms.length,
      avgPlace: avg(ms.map((m) => m.placement)),
      avgKills: avg(ms.map((m) => m.kills)),
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

  const bestColor  = gradientColors[best.state  - 1] as string;
  const worstColor = gradientColors[worst.state - 1] as string;
  const bestMetric  = mode === "placement" ? `#${best.avgPlace.toFixed(1)}`  : `${best.avgKills.toFixed(1)}`;
  const worstMetric = mode === "placement" ? `#${worst.avgPlace.toFixed(1)}` : `${worst.avgKills.toFixed(1)}`;
  const metricLabel = mode === "placement" ? "avg place" : "avg kills";

  if (spread < 1.5) {
    return (
      <View style={[s.detailStrip, { borderColor: "#1e1e35", marginTop: 12 }]}>
        <View style={[s.detailItem, { paddingHorizontal: 12 }]}>
          <Text style={[s.detailLabel, { textAlign: "center", lineHeight: 16, color: "#2e2e44" }]}>
            💡 Performance is consistent across all mental states — no strong pattern detected yet.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.detailStrip, { borderColor: bestColor + "30", marginTop: 12 }]}>
      <View style={[s.detailItem, { flex: 0, paddingHorizontal: 12, borderRightWidth: 1, borderColor: bestColor + "20" }]}>
        <Text style={{ fontSize: 16 }}>💡</Text>
      </View>
      <View style={[s.detailItem, { borderRightWidth: 1, borderColor: bestColor + "20" }]}>
        <Text style={[s.detailValue, { color: bestColor }]}>{best.state}</Text>
        <Text style={[s.detailLabel, { color: bestColor + "99" }]}>{stateLabel(best.state).toUpperCase()}</Text>
        <Text style={[s.detailLabel, { color: "#2e2e44", marginTop: 2 }]}>{bestMetric} {metricLabel}</Text>
      </View>
      <View style={s.detailItem}>
        <Text style={[s.detailValue, { color: worstColor }]}>{worst.state}</Text>
        <Text style={[s.detailLabel, { color: worstColor + "99" }]}>{stateLabel(worst.state).toUpperCase()}</Text>
        <Text style={[s.detailLabel, { color: "#2e2e44", marginTop: 2 }]}>{worstMetric} {metricLabel}</Text>
      </View>
    </View>
  );
}

function StatePlacementChart({
  matches, selectedState, mode, onSelect,
}: {
  matches: AnalyticsMatch[];
  selectedState: StateNum | null;
  mode: BarMode;
  onSelect: (n: StateNum | null) => void;
}) {
  const barAnims = useRef(STATE_KEYS.map(() => new Animated.Value(0))).current;

  const stateStats = STATE_KEYS.map((n) => {
    const ms = matches.filter((m) => Math.round(m.mentalState) === n);
    if (!ms.length) return { state: n, count: 0, avg: 0, best: 0, worst: 0, winPct: 0, avgKills: 0 };
    const placements = ms.map((m) => m.placement);
    return {
      state:    n,
      count:    ms.length,
      avg:      avg(placements),
      best:     Math.min(...placements),
      worst:    Math.max(...placements),
      winPct:   (ms.filter((m) => m.placement === 1).length / ms.length) * 100,
      avgKills: avg(ms.map((m) => m.kills)),
    };
  });

  const filledStats   = stateStats.filter((s) => s.count > 0);
  const worstAvgPlace = Math.max(...filledStats.map((s) => s.avg), 1);
  const MAX_PLACE     = Math.ceil(worstAvgPlace * 1.25);
  const maxAvgKills   = Math.max(...filledStats.map((s) => s.avgKills), 1);
  const MAX_KILLS     = Math.ceil(maxAvgKills * 1.25);

  useEffect(() => {
    barAnims.forEach((a) => a.setValue(0));
    Animated.stagger(35, barAnims.map((anim) =>
      Animated.spring(anim, { toValue: 1, useNativeDriver: false, tension: 60, friction: 12 })
    )).start();
  }, [mode]);

  useEffect(() => {
    Animated.stagger(35, barAnims.map((anim) =>
      Animated.spring(anim, { toValue: 1, useNativeDriver: false, tension: 60, friction: 12 })
    )).start();
  }, []);

  return (
    <View style={s.binnedWrap}>
      {STATE_KEYS.map((n, idx) => {
        const stat  = stateStats[idx];
        const color = gradientColors[n - 1] as string;
        if (!stat.count) return null;

        const isSelected = selectedState === n;
        const isDimmed   = selectedState !== null && !isSelected;

        const avgFill = mode === "placement"
          ? Math.max(0.04, (MAX_PLACE - stat.avg) / MAX_PLACE)
          : Math.max(0.04, stat.avgKills / MAX_KILLS);

        const barWidth = barAnims[idx].interpolate({
          inputRange: [0, 1], outputRange: ["0%", `${avgFill * 100}%`],
        });

        const displayValue = mode === "placement"
          ? `#${stat.avg.toFixed(1)}`
          : stat.avgKills.toFixed(1);

        return (
          <Pressable
            key={n}
            onPress={() => onSelect(isSelected ? null : n)}
            style={[s.binnedRow, isDimmed && { opacity: 0.2 }]}
          >
            <View style={[s.stateBadge, {
              backgroundColor: color + (isSelected ? "30" : "15"),
              borderColor:     color + (isSelected ? "99" : "40"),
            }]}>
              <Text style={[s.stateBadgeText, { color: isSelected ? color : color + "cc" }]}>
                {n}
              </Text>
            </View>
            <View style={s.binnedTrack}>
              <Animated.View style={[s.binnedBar, {
                width:           barWidth,
                backgroundColor: color + (isSelected ? "55" : "35"),
                borderColor:     color + (isSelected ? "cc" : "77"),
              }]} />
              <View style={[s.avgMarker, {
                left:            `${avgFill * 100}%` as any,
                backgroundColor: color,
                opacity:         isSelected ? 1 : 0.85,
              }]} />
            </View>
            <Text style={[s.binnedValue, { color: isSelected ? color : color + "88" }]}>
              {displayValue}
            </Text>
          </Pressable>
        );
      })}
      <View style={s.axisRow}>
        <Text style={s.axisLabel}>{mode === "placement" ? "worse ←" : "fewer ←"}</Text>
        <Text style={s.axisLabel}>{mode === "placement" ? "→ better" : "→ more"}</Text>
      </View>
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function MentalState({ matches }: { matches: AnalyticsMatch[] }) {
  const [selectedState, setSelectedState] = useState<StateNum | null>(null);
  const [barMode, setBarMode]             = useState<BarMode>("placement");

  return (
    <View style={s.card}>
      <CardTitle
        label={barMode === "placement" ? "AVG PLACEMENT PER MENTAL STATE" : "AVG KILLS PER MENTAL STATE"}
      />
      <ChartExplainer mode={barMode} />
      <BarModeToggle
        mode={barMode}
        onChange={(m) => { setBarMode(m); setSelectedState(null); }}
      />

      <View style={{ height: 10 }} />

      <StatePlacementChart
        matches={matches}
        selectedState={selectedState}
        mode={barMode}
        onSelect={setSelectedState}
      />

      {selectedState && gradientColors[selectedState - 1] ? (() => {
        const selectedColor = gradientColors[selectedState - 1] as string;
        const selectedMs    = matches.filter((m) => Math.round(m.mentalState) === selectedState);
        if (!selectedMs.length) return null;
        const detail = {
          avgPlace: avg(selectedMs.map((m) => m.placement)),
          avgKills: avg(selectedMs.map((m) => m.kills)),
          winPct:   (selectedMs.filter((m) => m.placement === 1).length / selectedMs.length) * 100,
          best:     Math.min(...selectedMs.map((m) => m.placement)),
          worst:    Math.max(...selectedMs.map((m) => m.placement)),
          count:    selectedMs.length,
        };
        return (
          <View style={[s.detailStrip, { borderColor: selectedColor + "30", marginTop: 12 }]}>
            {[
              { label: "PLACE",  value: `${detail.avgPlace.toFixed(1)}` },
              { label: "BEST",   value: `${detail.best}` },
              { label: "WORST",  value: `${detail.worst}` },
              { label: "KILLS",  value: fmtKills(detail.avgKills) },
              { label: "WIN %",  value: `${detail.winPct.toFixed(1)}` },
              { label: "GAMES",  value: detail.count.toString(), dim: true },
            ].map((item, i, arr) => (
              <View key={item.label} style={[s.detailItem,
                i < arr.length - 1 && { borderRightWidth: 1, borderColor: selectedColor + "20" }]}>
                <Text style={[s.detailValue, { color: (item as any).dim ? "#3a3a55" : selectedColor }]}>
                  {item.value}
                </Text>
                <Text style={s.detailLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        );
      })() : (
        <PerformanceInsight matches={matches} mode={barMode} />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card:             { backgroundColor: INNER_BG, borderRadius: 12, borderWidth: 1, borderColor: "#1e1e30", padding: 14, gap: 0 },
  cardTitleWrap:    { marginBottom: 14 },
  cardTitle:        { color: "#555", fontSize: 9, letterSpacing: 2, fontWeight: "600", marginBottom: 10 },
  cardTitleDivider: { height: 1, backgroundColor: "#1a1a2e" },

  binnedWrap:     { gap: 8 },
  binnedRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
  stateBadge:     { width: 28, height: 30, borderRadius: 7, borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stateBadgeText: { fontSize: 11, fontWeight: "800", letterSpacing: -0.3 },
  binnedTrack:    { flex: 1, height: 30, backgroundColor: "#0c0c1a", borderRadius: 6, overflow: "hidden", justifyContent: "center" },
  binnedBar:      { position: "absolute", left: 0, top: 0, bottom: 0, borderTopRightRadius: 5, borderBottomRightRadius: 5, borderWidth: 1, borderLeftWidth: 0 },
  avgMarker:      { position: "absolute", width: 3, top: 3, bottom: 3, borderRadius: 1.5, marginLeft: -1.5 },
  binnedValue:    { width: 38, fontSize: 10, fontWeight: "700", letterSpacing: -0.3, textAlign: "right" },
  axisRow:        { flexDirection: "row", justifyContent: "space-between", paddingLeft: 36, paddingRight: 40, marginTop: 4 },
  axisLabel:      { fontSize: 8, color: "#2e2e44", letterSpacing: 0.5 },

  detailStrip:  { flexDirection: "row", backgroundColor: "#0c0c1a", borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  detailItem:   { flex: 1, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
  detailValue:  { fontSize: 13, fontWeight: "700", marginBottom: 3, letterSpacing: -0.3 },
  detailLabel:  { color: "#333", fontSize: 7, letterSpacing: 1.2, fontWeight: "600" },
});