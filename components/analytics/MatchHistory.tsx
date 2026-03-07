import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import gradientColors from "@/constants/gradient";
import { modeColor, coerceDate, AnalyticsMatch } from "@/constants/analytics";

const AMBER = "#f59e0b";
const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";

const EmptyState = ({ message }: { message: string }) => (
  <View style={s.emptyState}>
    <Text style={s.emptyStateText}>{message}</Text>
  </View>
);

export default function MatchHistory({
  matches,
}: {
  matches: AnalyticsMatch[];
}) {
  const [page, setPage] = useState(0);

  if (!matches.length) return <EmptyState message="No matches logged yet." />;

  const pageSize = 5;
  const totalPages = Math.ceil(matches.length / pageSize);
  const shown = matches.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <View style={{ gap: 8 }}>
      {shown.map((m, i) => (
        <View key={i} style={s.historyRow}>
          <View
            style={[s.modePill, { backgroundColor: modeColor(m.mode) + "22" }]}
          >
            <Text style={[s.modePillText, { color: modeColor(m.mode) }]}>
              {m.mode}
            </Text>
          </View>
          <View style={{ flex: 1, paddingHorizontal: 10 }}>
            <Text style={s.historyDate}>{coerceDate(m.date)}</Text>
            {!!m.notes && (
              <Text style={s.historyNotes} numberOfLines={1}>
                {m.notes}
              </Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end", gap: 3 }}>
            <Text
              style={[s.placementBadge, m.placement === 1 && { color: AMBER }]}
            >
              {m.placement === 1 ? "👑 #1" : `#${m.placement}`}
            </Text>
            <Text style={s.killsBadge}>{m.kills} kills</Text>
          </View>
          <View
            style={[
              s.mentalDot,
              { backgroundColor: gradientColors[m.mentalState - 1] },
            ]}
          />
        </View>
      ))}

      {totalPages > 1 && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <TouchableOpacity
            style={[s.pageBtn, page === 0 && { opacity: 0.3 }]}
            onPress={() => setPage((p) => p - 1)}
            disabled={page === 0}
          >
            <Text style={s.pageBtnText}>‹ PREV</Text>
          </TouchableOpacity>
          <Text style={s.pageIndicator}>
            {page + 1} / {totalPages}
          </Text>
          <TouchableOpacity
            style={[s.pageBtn, page === totalPages - 1 && { opacity: 0.3 }]}
            onPress={() => setPage((p) => p + 1)}
            disabled={page === totalPages - 1}
          >
            <Text style={s.pageBtnText}>NEXT ›</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INNER_BG,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#16162a",
    gap: 8,
  },
  modePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  modePillText: { fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  historyDate: { color: "#666", fontSize: 10, letterSpacing: 0.5 },
  historyNotes: { color: "#444", fontSize: 10 },
  placementBadge: { color: "#fff", fontSize: 13, fontWeight: "700" },
  killsBadge: { color: "#555", fontSize: 10, fontWeight: "600" },
  mentalDot: { width: 7, height: 7, borderRadius: 4 },
  emptyState: { paddingVertical: 20, alignItems: "center" },
  emptyStateText: { color: "#444", fontSize: 12, letterSpacing: 0.5 },
  pageBtn: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  pageBtnText: {
    color: "#555",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  pageIndicator: {
    color: "#444",
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "600",
  },
});
