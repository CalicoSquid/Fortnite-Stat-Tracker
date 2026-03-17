import React, { useRef, useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Animated, PanResponder } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";
import { AnalyticsMatch } from "@/constants/analytics";

// ── Gradient ───────────────────────────────────────────────────────────────
const GRADIENT: Record<number, string> = {
  1: "#ff3b3b", 2: "#ff6f3b", 3: "#ff993b", 4: "#ffcc3b", 5: "#ffff3b",
  6: "#ccff3b", 7: "#99ff3b", 8: "#66ff3b", 9: "#33ff3b", 10: "#00ff00",
};
function stateColor(n: number): string {
  return GRADIENT[Math.round(Math.max(1, Math.min(10, n)))] ?? "#ffffff";
}

// ── Constants ──────────────────────────────────────────────────────────────
const INNER_BG   = "#0a0a12";
const DOT_R      = 4.5;
const WIN_R      = 7;
const HIT_R      = 14;
const PLOT_H     = 300;
const TOP_PAD    = 14;
const BOT_PAD    = 14;
const INNER_H    = PLOT_H - TOP_PAD - BOT_PAD;
const Y_AXIS_W   = 28;
const ZOOM_MIN   = 1;
const ZOOM_MAX   = 100;
const ZOOM_START = 10;
const PINCH_SCALE = 300;
const ZOOM_LINGER_MS = 800;
const THUMB_SIZE = 22;
const TRACK_H    = 2;

type Mode = "kills" | "placement";

// ── Helpers ────────────────────────────────────────────────────────────────
function buildPlacementTicks(yMax: number): number[] {
  let ticks: number[];
  if (yMax <= 5) ticks = [1, yMax];
  else if (yMax <= 10) ticks = [1, 5, yMax];
  else if (yMax <= 25) ticks = [1, 5, 10, yMax];
  else if (yMax <= 50) ticks = [1, 10, 25, yMax];
  else ticks = [1, 25, 50, 75, yMax];
  return [...new Set(ticks)];
}

function buildKillsTicks(kMax: number): number[] {
  let ticks: number[];
  if (kMax <= 5)  ticks = [0, kMax];
  else if (kMax <= 10) ticks = [0, 5, kMax];
  else if (kMax <= 15) ticks = [0, 5, 10, kMax];
  else ticks = [0, 5, 10, 15, kMax];
  return [...new Set(ticks)];
}

function placementYPx(placement: number, yMax: number) {
  return TOP_PAD + ((placement - 1) / Math.max(1, yMax - 1)) * INNER_H;
}

function killsYPx(kills: number, kMax: number) {
  return TOP_PAD + ((kMax - kills) / Math.max(1, kMax)) * INNER_H;
}

function xFrac(state: number) { return (state - 0.5) / 10; }
function dividerFrac(afterState: number) { return afterState / 10; }

function jitter(seed: number, range: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return (x - Math.floor(x) - 0.5) * range;
}

function touchDist(touches: { pageX: number; pageY: number }[]) {
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

function calcTrendPlacement(matches: AnalyticsMatch[], yMax: number) {
  const n = matches.length;
  if (n < 2) return null;
  const sumX  = matches.reduce((s, m) => s + m.mentalState, 0);
  const sumY  = matches.reduce((s, m) => s + m.placement, 0);
  const sumXY = matches.reduce((s, m) => s + m.mentalState * m.placement, 0);
  const sumX2 = matches.reduce((s, m) => s + m.mentalState ** 2, 0);
  const denom = n * sumX2 - sumX ** 2;
  if (!denom) return null;
  const slope     = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const clamp     = (v: number) => Math.max(1, Math.min(yMax, v));
  return {
    x1: xFrac(1),  y1: (clamp(intercept + slope * 1)  - 1) / Math.max(1, yMax - 1),
    x2: xFrac(10), y2: (clamp(intercept + slope * 10) - 1) / Math.max(1, yMax - 1),
  };
}

function calcTrendKills(matches: AnalyticsMatch[], kMax: number) {
  const n = matches.length;
  if (n < 2) return null;
  const sumX  = matches.reduce((s, m) => s + m.mentalState, 0);
  const sumY  = matches.reduce((s, m) => s + m.kills, 0);
  const sumXY = matches.reduce((s, m) => s + m.mentalState * m.kills, 0);
  const sumX2 = matches.reduce((s, m) => s + m.mentalState ** 2, 0);
  const denom = n * sumX2 - sumX ** 2;
  if (!denom) return null;
  const slope     = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const clamp     = (v: number) => Math.max(0, Math.min(kMax, v));
  return {
    x1: xFrac(1),  y1: (kMax - clamp(intercept + slope * 1))  / Math.max(1, kMax),
    x2: xFrac(10), y2: (kMax - clamp(intercept + slope * 10)) / Math.max(1, kMax),
  };
}

function matchKey(m: AnalyticsMatch, i: number): string {
  return (m as any).id ?? (m as any).timestamp ?? `idx-${i}`;
}

// ── Mode Toggle ────────────────────────────────────────────────────────────
function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <View style={tog.wrap}>
      {(["kills", "placement"] as Mode[]).map((m) => {
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
  btn:        { flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  btnActive:  { backgroundColor: "#ffffff0e", borderWidth: 1, borderColor: "#ffffff18" },
  label:      { color: "#2e2e50", fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  labelActive:{ color: "#aaaaaa" },
});

// ── Snap Slider ────────────────────────────────────────────────────────────
function SnapSlider({
  total, value, onChange,
}: {
  total: number; value: number; onChange: (v: number) => void;
}) {
  const snaps = useMemo(() => {
    const pts = [10, 25, 50].filter((p) => p < total);
    pts.push(total);
    return pts;
  }, [total]);

  const snapIndex = useMemo(() => {
    const idx = snaps.findIndex((s) => s === value || (value >= total && s === total));
    return idx === -1 ? snaps.length - 1 : idx;
  }, [value, snaps, total]);

  const [trackW, setTrackW]  = useState(0);
  const trackWRef    = useRef(0);
  const thumbAnim    = useRef(new Animated.Value(0)).current;
  const isDragging   = useRef(false);
  const currentIndex = useRef(snapIndex);
  const thumbStartX  = useRef(0);

  const thumbX = (idx: number) => {
    const w = trackWRef.current;
    if (w === 0 || snaps.length <= 1) return 0;
    return (idx / (snaps.length - 1)) * (w - THUMB_SIZE);
  };

  useEffect(() => {
    if (!isDragging.current && trackWRef.current > 0) {
      currentIndex.current = snapIndex;
      Animated.spring(thumbAnim, {
        toValue: thumbX(snapIndex),
        useNativeDriver: true, tension: 180, friction: 20,
      }).start();
    }
  }, [snapIndex, trackW]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
        isDragging.current  = true;
        thumbStartX.current = thumbX(currentIndex.current);
      },
      onPanResponderMove: (_, gs) => {
        const w = trackWRef.current;
        if (w === 0 || snaps.length <= 1) return;
        const usableW = w - THUMB_SIZE;
        const rawX    = Math.max(0, Math.min(usableW, thumbStartX.current + gs.dx));
        thumbAnim.setValue(rawX);
        const closest = Math.round((rawX / usableW) * (snaps.length - 1));
        if (closest !== currentIndex.current) {
          currentIndex.current = closest;
          onChange(snaps[closest]);
        }
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
        Animated.spring(thumbAnim, {
          toValue: thumbX(currentIndex.current),
          useNativeDriver: true, tension: 180, friction: 20,
        }).start();
      },
    })
  ).current;

  useEffect(() => { currentIndex.current = snapIndex; }, [snapIndex]);

  const activeLabel = value >= total ? `ALL ${total}` : `LAST ${value}`;
  const fillFrac    = snaps.length <= 1 ? 1 : snapIndex / (snaps.length - 1);

  return (
    <View style={sl.wrap}>
      <View style={sl.staticLabelRow}>
        <Text style={sl.staticLabelKey}>MATCHES</Text>
        <Text style={sl.staticLabelVal}>{activeLabel}</Text>
      </View>
      <View
        style={sl.trackContainer}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setTrackW(w);
          trackWRef.current = w;
        }}
      >
        <View style={sl.trackBg} />
        <View style={[sl.trackFill, { width: `${fillFrac * 100}%` }]} />
        {snaps.map((_, i) => {
          const x = trackWRef.current > 0
            ? (i / (snaps.length - 1)) * (trackWRef.current - THUMB_SIZE) + THUMB_SIZE / 2
            : 0;
          return (
            <View key={i} style={[sl.notch, { left: x - 1, opacity: i <= snapIndex ? 0 : 0.3 }]} />
          );
        })}
        {trackW > 0 && (
          <Animated.View
            style={[sl.thumbWrap, { transform: [{ translateX: thumbAnim }] }]}
            {...panResponder.panHandlers}
          >
            <View style={sl.thumb}>
              <View style={sl.thumbInner} />
            </View>
          </Animated.View>
        )}
      </View>
      <View style={sl.endLabels}>
        <Text style={sl.endLabel}>LAST {snaps[0]}</Text>
        <Text style={sl.endLabel}>ALL {total}</Text>
      </View>
    </View>
  );
}

const sl = StyleSheet.create({
  wrap:           { gap: 6 },
  staticLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  staticLabelKey: { color: "#252540", fontSize: 7, letterSpacing: 1.5, fontWeight: "600" },
  staticLabelVal: { color: "#aaaaaa", fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  trackContainer: { height: THUMB_SIZE, justifyContent: "center", position: "relative" },
  trackBg:        { position: "absolute", left: THUMB_SIZE / 2, right: THUMB_SIZE / 2, height: TRACK_H, backgroundColor: "#1a1a2e", borderRadius: 1 },
  trackFill:      { position: "absolute", left: THUMB_SIZE / 2, height: TRACK_H, backgroundColor: "#ffffff18", borderRadius: 1 },
  notch:          { position: "absolute", width: 2, height: 5, backgroundColor: "#252540", borderRadius: 1, top: (THUMB_SIZE - 5) / 2 },
  thumbWrap:      { position: "absolute", width: THUMB_SIZE, alignItems: "center" },
  thumb:          { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2, backgroundColor: "#13132a", borderWidth: 1, borderColor: "#ffffff20", alignItems: "center", justifyContent: "center" },
  thumbInner:     { width: 7, height: 7, borderRadius: 4, backgroundColor: "#ffffff40" },
  endLabels:      { flexDirection: "row", justifyContent: "space-between" },
  endLabel:       { color: "#252540", fontSize: 7, letterSpacing: 1, fontWeight: "600" },
});

// ── Selected strip ─────────────────────────────────────────────────────────
function SelectedStrip({
  match, color, mode, onDismiss,
}: {
  match: AnalyticsMatch; color: string; mode: Mode; onDismiss: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 12 }).start();
  }, [match]);

  const isWin = match.placement === 1;
  const items = mode === "kills"
    ? [
        { label: "KILLS", value: match.kills.toFixed(1) },
        { label: "STATE", value: match.mentalState.toString() },
        { label: "PLACE", value: `#${match.placement}` },
        ...(isWin ? [{ label: "RESULT", value: "👑", crown: true }] : []),
      ]
    : [
        { label: "PLACE", value: `#${match.placement}` },
        { label: "STATE", value: match.mentalState.toString() },
        { label: "KILLS", value: match.kills.toFixed(1) },
        ...(isWin ? [{ label: "RESULT", value: "👑", crown: true }] : []),
      ];

  return (
    <Animated.View style={[s.strip, {
      borderColor: color + "40", opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [6,0] }) }],
    }]}>
      {items.map((item, i) => (
        <View key={item.label} style={[s.stripItem,
          i < items.length - 1 && { borderRightWidth: 1, borderColor: color + "20" }]}>
          <Text style={[s.stripValue, { color: (item as any).crown ? undefined : color },
            (item as any).crown && s.crownText]}>{item.value}</Text>
          <Text style={s.stripLabel}>{item.label}</Text>
        </View>
      ))}
      <Pressable onPress={onDismiss} style={s.dismissBtn} hitSlop={12}>
        <Text style={s.dismissText}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Gradient legend ────────────────────────────────────────────────────────
function GradientLegend() {
  return (
    <View style={g.wrap}>
      <View style={g.bar}>
        {([1,2,3,4,5,6,7,8,9,10] as const).map((n) => (
          <View key={n} style={[g.segment, { backgroundColor: GRADIENT[n] }]} />
        ))}
      </View>
      <View style={g.numRow}>
        {([1,2,3,4,5,6,7,8,9,10] as const).map((n) => (
          <View key={n} style={g.numCell}>
            <Text style={[g.num, { color: GRADIENT[n] + "cc" }]}>{n}</Text>
          </View>
        ))}
      </View>
      <View style={g.endLabels}>
        <Text style={[g.endLabel, { color: GRADIENT[1] + "99" }]}>TILTED</Text>
        <Text style={[g.endLabel, { color: GRADIENT[10] + "99", textAlign: "right" }]}>LOCKED IN</Text>
      </View>
    </View>
  );
}

const g = StyleSheet.create({
  wrap:      { gap: 3 },
  bar:       { flexDirection: "row", height: 5, borderRadius: 3, overflow: "hidden" },
  segment:   { flex: 1 },
  numRow:    { flexDirection: "row" },
  numCell:   { flex: 1, alignItems: "center" },
  num:       { fontSize: 8, fontWeight: "600" },
  endLabels: { flexDirection: "row", justifyContent: "space-between" },
  endLabel:  { fontSize: 8, letterSpacing: 0.8, fontWeight: "600" },
});

// ── Main ───────────────────────────────────────────────────────────────────
export default function MentalScatter({ matches }: { matches: AnalyticsMatch[] }) {
  const total = matches.length;

  const maxKillsInData = useMemo(
    () => Math.max(1, ...matches.map((m) => m.kills)),
    [matches],
  );

  const [mode, setMode]         = useState<Mode>("kills");
  const [n, setN]               = useState(Math.min(50, total));
  const [yMax, setYMax]         = useState(ZOOM_START);
  const [kMax, setKMax]         = useState(maxKillsInData);
  const [selected, setSelected] = useState<AnalyticsMatch | null>(null);
  const [plotW, setPlotW]       = useState(0);
  const [showZoomBadge, setShowZoomBadge] = useState(false);

  const pinchStartDist  = useRef<number | null>(null);
  const pinchStartRange = useRef(maxKillsInData);
  const pinching        = useRef(false);
  const zoomLingerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSelected(null);
    if (mode === "kills") setKMax(maxKillsInData);
    else setYMax(ZOOM_START);
  }, [mode]);

  const touchHandlers = {
    onTouchStart: (e: any) => {
      const touches = e.nativeEvent.touches;
      if (touches.length === 2) {
        pinchStartDist.current  = touchDist(touches);
        pinchStartRange.current = mode === "kills" ? kMax : yMax;
        pinching.current        = true;
        setShowZoomBadge(true);
        if (zoomLingerTimer.current) clearTimeout(zoomLingerTimer.current);
      }
    },
    onTouchMove: (e: any) => {
      const touches = e.nativeEvent.touches;
      if (touches.length !== 2 || pinchStartDist.current === null) return;
      const delta = touchDist(touches) - pinchStartDist.current;
      if (mode === "kills") {
        const raw    = pinchStartRange.current - (delta / PINCH_SCALE) * 30;
        const newMax = Math.round(Math.max(2, Math.min(maxKillsInData, raw)));
        if (newMax !== kMax) setKMax(newMax);
      } else {
        const raw    = pinchStartRange.current - (delta / PINCH_SCALE) * (ZOOM_MAX - ZOOM_MIN);
        const newMax = Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, raw)));
        if (newMax !== yMax) setYMax(newMax);
      }
    },
    onTouchEnd: (e: any) => {
      if (e.nativeEvent.touches.length < 2) {
        pinchStartDist.current = null;
        pinching.current       = false;
        zoomLingerTimer.current = setTimeout(() => setShowZoomBadge(false), ZOOM_LINGER_MS);
      }
    },
    onTouchCancel: () => {
      pinchStartDist.current = null;
      pinching.current       = false;
      zoomLingerTimer.current = setTimeout(() => setShowZoomBadge(false), ZOOM_LINGER_MS);
    },
  };

  useEffect(() => () => {
    if (zoomLingerTimer.current) clearTimeout(zoomLingerTimer.current);
  }, []);

  const slice = useMemo(() => {
    const count = n >= total ? total : Math.min(n, total);
    return matches.slice(-count);
  }, [matches, n, total]);

  const visibleSlice = useMemo(() => {
    if (mode === "kills") return slice.filter((m) => m.kills <= kMax);
    return slice.filter((m) => m.placement <= yMax);
  }, [slice, mode, yMax, kMax]);

  const trend = useMemo(() => {
    if (mode === "kills") return calcTrendKills(visibleSlice, kMax);
    return calcTrendPlacement(visibleSlice, yMax);
  }, [visibleSlice, mode, yMax, kMax]);

  const yTicks = useMemo(() => {
    if (mode === "kills") return buildKillsTicks(kMax);
    return buildPlacementTicks(yMax);
  }, [mode, yMax, kMax]);

  const densityByState = useMemo(() => {
    const counts: Record<number, number> = {};
    visibleSlice.forEach((m) => {
      const k = Math.round(m.mentalState);
      counts[k] = (counts[k] ?? 0) + 1;
    });
    return counts;
  }, [visibleSlice]);
  const maxDensity = Math.max(1, ...Object.values(densityByState));

  const selectedColor = selected ? stateColor(selected.mentalState) : null;

  useEffect(() => { setSelected(null); }, [n, yMax, kMax]);

  const dotPositions = useMemo(() =>
    visibleSlice.map((m, i) => {
      const isWin = m.placement === 1;
      const r     = isWin && mode === "placement" ? WIN_R : DOT_R;
      const cx    = Math.min(plotW - HIT_R, Math.max(HIT_R,
        (xFrac(m.mentalState) + jitter(i * 3, 0.022)) * plotW));
      const rawY  = mode === "kills"
        ? killsYPx(m.kills, kMax)        + jitter(i * 7, 3)
        : placementYPx(m.placement, yMax) + jitter(i * 7, 4);
      const cy = Math.min(PLOT_H - BOT_PAD, Math.max(TOP_PAD, rawY));
      return { m, i, r, cx, cy, isWin };
    }),
  [visibleSlice, plotW, yMax, kMax, mode]);

  if (!matches.length) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyText}>No matches logged yet.</Text>
      </View>
    );
  }

  const isEmpty   = visibleSlice.length === 0;
  const zoomLabel = mode === "kills" ? `MAX ${kMax} KILLS` : `TOP ${yMax}`;

  return (
    <View style={s.wrap}>
      <View style={s.card}>

        {/* ── Title ── */}
        <View style={s.cardTitleWrap}>
          <View style={s.titleRow}>
            <Text style={s.cardTitle}>
              {mode === "kills" ? "KILLS VS MENTAL STATE" : "PLACEMENT VS MENTAL STATE"}
            </Text>
            <Text style={s.titleSub}>each dot is a match</Text>
          </View>
          <View style={s.cardTitleDivider} />
        </View>

        {/* ── Mode toggle ── */}
        <ModeToggle mode={mode} onChange={(m) => { setMode(m); setSelected(null); }} />

        {/* ── Snap slider ── */}
        <SnapSlider total={total} value={n} onChange={(v) => { setN(v); setSelected(null); }} />

        {/* ── Chart ── */}
        <View style={s.chartOuter}>
          <View style={s.chartArea}>
            <View style={s.yAxis}>
              {yTicks.map((p) => {
                const topPx = mode === "kills"
                  ? killsYPx(p, kMax) - 5
                  : placementYPx(p, yMax) - 5;
                return (
                  <Text key={p} style={[s.yLabel, { top: topPx }]}>
                    {mode === "kills" ? p : `#${p}`}
                  </Text>
                );
              })}
            </View>

            <View
              style={[s.plotBorder, showZoomBadge && s.plotBorderPinching]}
              {...touchHandlers}
              onLayout={(e) => setPlotW(e.nativeEvent.layout.width)}
            >
              {plotW > 0 && (
                <Svg width={plotW} height={PLOT_H}>
                  {[1,2,3,4,5,6,7,8,9,10].map((state) => {
                    const count   = densityByState[state] ?? 0;
                    const opacity = count > 0 ? (count / maxDensity) * 0.06 : 0;
                    return (
                      <Rect key={`dc-${state}`}
                        x={dividerFrac(state - 1) * plotW} y={0}
                        width={(1 / 10) * plotW} height={PLOT_H}
                        fill={stateColor(state)} opacity={opacity} />
                    );
                  })}

                  {yTicks.map((p) => {
                    const y = mode === "kills" ? killsYPx(p, kMax) : placementYPx(p, yMax);
                    return (
                      <Line key={`gridH-${p}`}
                        x1={0} y1={y} x2={plotW} y2={y}
                        stroke="#1e1e35" strokeWidth={0.5} />
                    );
                  })}

                  {[1,2,3,4,5,6,7,8,9].map((a) => (
                    <Line key={`gridV-${a}`}
                      x1={dividerFrac(a) * plotW} y1={0}
                      x2={dividerFrac(a) * plotW} y2={PLOT_H}
                      stroke="#1e1e35" strokeWidth={0.5} />
                  ))}

                  {trend && (
                    <Line
                      x1={trend.x1 * plotW} y1={TOP_PAD + trend.y1 * INNER_H}
                      x2={trend.x2 * plotW} y2={TOP_PAD + trend.y2 * INNER_H}
                      stroke="#ffffff" strokeWidth={1.5}
                      strokeDasharray="5,5" opacity={0.22} />
                  )}

                  {dotPositions.map(({ m, i, r, cx, cy, isWin }) => {
  if (selected === m) return null;
  const color  = stateColor(m.mentalState);
  const dimmed = selected !== null;
  const key    = matchKey(m, i);
  return (
    <React.Fragment key={key}>
      {/* Invisible hit target */}
      <Circle
        cx={cx} cy={cy} r={HIT_R}
        fill="transparent"
        onPress={() => !pinching.current && setSelected(m)}
      />
      {/* Visible dot */}
      <Circle
        cx={cx} cy={cy} r={r}
        fill={color}
        opacity={dimmed ? 0.06 : isWin && mode === "placement" ? 1 : 0.72}
        onPress={() => !pinching.current && setSelected(m)}
      />
    </React.Fragment>
  );
})}

                  {selected && (() => {
                    const pos = dotPositions.find((p) => p.m === selected);
                    if (!pos) return null;
                    const { cx, cy, isWin } = pos;
                    const color = stateColor(selected.mentalState);
                    const r     = isWin && mode === "placement" ? WIN_R * 1.2 : DOT_R * 1.4;
                    return (
                      <>
                        <Circle cx={cx} cy={cy} r={r + 7}
                          fill="none" stroke={color} strokeWidth={1} opacity={0.2} />
                        <Circle cx={cx} cy={cy} r={r + 3}
                          fill="none" stroke={color} strokeWidth={1} opacity={0.4} />
                        <Circle cx={cx} cy={cy} r={r}
                          fill={color} opacity={1}
                          stroke="#ffffff" strokeWidth={1.5}
                          onPress={() => setSelected(null)} />
                        <Circle cx={cx} cy={cy} r={HIT_R}
                          fill="transparent" onPress={() => setSelected(null)} />
                      </>
                    );
                  })()}
                </Svg>
              )}

              {isEmpty && (
                <View style={s.emptyOverlay}>
                  <Text style={s.emptyOverlayText}>
                    {mode === "kills"
                      ? `No matches with ≤${kMax} kills in view`
                      : yMax === 1 ? "No wins yet — keep playing" : `No matches in top ${yMax}`}
                  </Text>
                </View>
              )}

              {showZoomBadge && (
                <View style={s.zoomBadge}>
                  <Text style={s.zoomBadgeText}>{zoomLabel}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={s.legendRow}>
            <View style={s.yAxisSpacer} />
            <View style={s.legendInner}><GradientLegend /></View>
          </View>
        </View>

        {selected && selectedColor ? (
          <SelectedStrip
            match={selected} color={selectedColor}
            mode={mode} onDismiss={() => setSelected(null)} />
        ) : (
          <Text style={s.hint}>Tap a dot · pinch to zoom</Text>
        )}

      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrap: { gap: 8 },
  card: {
    backgroundColor: INNER_BG, borderRadius: 12,
    borderWidth: 1, borderColor: "#1e1e30", padding: 14, gap: 10,
  },

  // Title — matches parent CardTitle pattern exactly
  cardTitleWrap:    { marginBottom: 4 },
  titleRow:         { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 },
  cardTitle:        { color: "#555", fontSize: 9, letterSpacing: 2, fontWeight: "600" },
  titleSub:         { color: "#2e2e44", fontSize: 8, letterSpacing: 0.5 },
  cardTitleDivider: { height: 1, backgroundColor: "#1a1a2e" },

  chartOuter: { gap: 4 },
  chartArea:  { flexDirection: "row", height: PLOT_H },
  yAxis:      { width: Y_AXIS_W, position: "relative" },
  yLabel:     { position: "absolute", left: 0, right: 3, fontSize: 8, color: "#3a3a55", textAlign: "right" },
  plotBorder: { flex: 1, borderWidth: 1, borderColor: "#252538", borderRadius: 6, overflow: "hidden" },
  plotBorderPinching: { borderColor: "#ffffff18" },
  zoomBadge:  {
    position: "absolute", top: 8, right: 8, backgroundColor: "#0a0a12cc",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5,
    borderWidth: 1, borderColor: "#ffffff15",
  },
  zoomBadgeText:    { color: "#ffffff99", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  emptyOverlay:     { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  emptyOverlayText: { color: "#2e2e44", fontSize: 11, letterSpacing: 1 },
  legendRow:        { flexDirection: "row" },
  yAxisSpacer:      { width: Y_AXIS_W + 1 },
  legendInner:      { flex: 1, marginTop: 2 },
  strip:            { flexDirection: "row", backgroundColor: INNER_BG, borderRadius: 10, borderWidth: 1, overflow: "hidden", alignItems: "center" },
  stripItem:        { flex: 1, paddingVertical: 10, alignItems: "center" },
  stripValue:       { fontSize: 14, fontWeight: "700", marginBottom: 2, letterSpacing: -0.3 },
  crownText:        { fontSize: 18 },
  stripLabel:       { color: "#333", fontSize: 7, letterSpacing: 1.5, fontWeight: "600" },
  dismissBtn:       { paddingHorizontal: 12, paddingVertical: 10 },
  dismissText:      { color: "#444", fontSize: 10 },
  hint:             { color: "#2e2e50", fontSize: 10, textAlign: "center", letterSpacing: 0.5 },
  empty:            { paddingVertical: 20, alignItems: "center" },
  emptyText:        { color: "#444", fontSize: 12, letterSpacing: 0.5 },
});