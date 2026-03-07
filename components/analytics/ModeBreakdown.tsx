import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { avg, modeColor, AnalyticsMatch } from "@/constants/analytics";

const AMBER = "#f59e0b";
const INNER_BG = "#0a0a12";

const EmptyState = ({ message }: { message: string }) => (
  <View style={s.emptyState}>
    <Text style={s.emptyStateText}>{message}</Text>
  </View>
);

export default function ModeBreakdown({
  matches,
}: {
  matches: AnalyticsMatch[];
}) {
  const modes = ["OG", "BR", "Reload"] as const;
  if (!matches.length) return <EmptyState message="No matches logged yet." />;

  return (
    <View style={{ gap: 10 }}>
      {modes.map((mode) => {
        const ms = matches.filter((m) => m.mode === mode);
        if (!ms.length) return null;
        const color = modeColor(mode);
        const wins = ms.filter((m) => m.placement === 1).length;
        return (
          <View key={mode} style={[s.modeCard, { borderColor: color + "33" }]}>
            <View style={[s.modeTopBar, { backgroundColor: color }]} />
            <View style={s.modeHeader}>
              <Text style={[s.modeLabel, { color }]}>{mode}</Text>
              <Text style={s.modeCount}>{ms.length} MATCHES</Text>
            </View>
            <View style={s.modeStats}>
              {[
                { lbl: "WINS", val: wins.toString() },
                {
                  lbl: "AVG KILLS",
                  val: avg(ms.map((m) => m.kills)).toFixed(1),
                },
                {
                  lbl: "AVG PLACE",
                  val: `#${avg(ms.map((m) => m.placement)).toFixed(0)}`,
                },
                {
                  lbl: "AVG MENTAL",
                  val: avg(ms.map((m) => m.mentalState)).toFixed(1),
                },
              ].map((st) => (
                <View key={st.lbl} style={s.modeStat}>
                  <Text
                    style={[
                      s.modeStatVal,
                      st.lbl === "WINS" && wins > 0 ? { color: AMBER } : {},
                    ]}
                  >
                    {st.val}
                  </Text>
                  <Text style={s.modeStatLbl}>{st.lbl}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  modeCard: {
    backgroundColor: INNER_BG,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  modeTopBar: { height: 2, opacity: 0.6 },
  modeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    paddingBottom: 8,
  },
  modeLabel: { fontFamily: "BurbankBlack", fontSize: 14, letterSpacing: 2 },
  modeCount: {
    color: "#444",
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  modeStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 14,
    paddingHorizontal: 8,
  },
  modeStat: { alignItems: "center", gap: 4 },
  modeStatVal: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modeStatLbl: {
    color: "#444",
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: "600",
  },
  emptyState: { paddingVertical: 20, alignItems: "center" },
  emptyStateText: { color: "#444", fontSize: 12, letterSpacing: 0.5 },
});
