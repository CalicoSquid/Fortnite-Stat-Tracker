import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import gradientColors from "@/constants/gradient";
import { avg, formatDate, AnalyticsSession } from "@/constants/analytics";

const PURPLE = "#8b5cf6";
const AMBER = "#f59e0b";
const GREEN = "#22c55e";
const RED = "#ef4444";
const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";

const EmptyState = ({ message }: { message: string }) => (
  <View style={s.emptyState}>
    <Text style={s.emptyStateText}>{message}</Text>
  </View>
);

export default function SessionTracker({
  sessions,
}: {
  sessions: AnalyticsSession[];
}) {
  const [page, setPage] = useState(0);
  const router = useRouter();

  const ended = sessions.filter((s) => s.endedAt !== null);
  if (!ended.length) return <EmptyState message="No completed sessions yet." />;

  const pageSize = 5;
  const totalPages = Math.ceil(ended.length / pageSize);
  const shown = ended.slice(page * pageSize, (page + 1) * pageSize);

  const avgSessionLength = avg(ended.map((s) => s.totalMatches)).toFixed(1);
  const bestByWins = [...ended].sort((a, b) => b.wins - a.wins)[0];
  const worstByWins = [...ended].sort((a, b) => a.wins - b.wins)[0];
  const bestByMental = [...ended].sort(
    (a, b) => b.averageMental - a.averageMental,
  )[0];
  const worstByMental = [...ended].sort(
    (a, b) => a.averageMental - b.averageMental,
  )[0];

  const highlights = [
    {
      label: "MOST WINS",
      color: AMBER,
      sess: bestByWins,
      val: `${bestByWins.wins} wins`,
    },
    {
      label: "BEST MENTAL",
      color: GREEN,
      sess: bestByMental,
      val: `${bestByMental.averageMental.toFixed(1)} avg`,
    },
    {
      label: "WORST MENTAL",
      color: RED,
      sess: worstByMental,
      val: `${worstByMental.averageMental.toFixed(1)} avg`,
    },
    {
      label: "FEWEST WINS",
      color: "#555",
      sess: worstByWins,
      val: `${worstByWins.wins} wins`,
    },
  ];

  return (
    <View style={{ gap: 16 }}>
      {/* ── Overview strip ── */}
      <View style={s.overviewStrip}>
        {[
          { label: "SESSIONS", value: ended.length.toString() },
          { label: "AVG MATCHES", value: avgSessionLength },
          {
            label: "TOTAL WINS",
            value: ended.reduce((a, b) => a + b.wins, 0).toString(),
          },
        ].map((item, i, arr) => (
          <View
            key={item.label}
            style={[
              s.overviewItem,
              i < arr.length - 1 && {
                borderRightWidth: 1,
                borderColor: BORDER,
              },
            ]}
          >
            <Text style={s.overviewVal}>{item.value}</Text>
            <Text style={s.overviewLbl}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Highlights ── */}
      <Text style={s.sectionLabel}>SESSION HIGHLIGHTS</Text>
      <View style={{ gap: 8 }}>
        {highlights.map(({ label, color, sess, val }) => (
          <Pressable
            key={label}
            onPress={() => router.push(`/session/${sess.id}`)}
            style={({ pressed }) => [
              s.highlightRow,
              { borderColor: color + "33", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[s.highlightLabel, { color }]}>{label}</Text>
            <View style={{ flex: 1, paddingHorizontal: 10 }}>
              <Text style={s.highlightDate} numberOfLines={1}>
                {formatDate(sess.createdAt)}
              </Text>
              <Text style={s.highlightSub} numberOfLines={1}>
                {sess.totalMatches}m · {sess.winPercentage.toFixed(0)}% wr
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={[s.highlightVal, { color }]}>{val}</Text>
              <Ionicons name="chevron-forward" size={12} color={color + "66"} />
            </View>
          </Pressable>
        ))}
      </View>

      <View style={s.cardDivider} />

      {/* ── All sessions ── */}
      <Text style={s.sectionLabel}>ALL SESSIONS</Text>
      <View style={{ gap: 8 }}>
        {shown.map((sess) => {
          const mentalColor = gradientColors[
            Math.round(sess.averageMental) - 1
          ] as string;
          return (
            <Pressable
              key={sess.id}
              onPress={() => router.push(`/session/${sess.id}`)}
              style={({ pressed }) => [
                s.sessRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              {/* Left — date + match count */}
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={s.sessDate}>{formatDate(sess.createdAt)}</Text>
                <Text style={s.sessSub}>
                  {sess.totalMatches} match{sess.totalMatches !== 1 ? "es" : ""}
                </Text>
              </View>

              {/* Right — stats */}
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={s.sessStat}>
                  {(sess.totalKills / Math.max(1, sess.totalMatches)).toFixed(
                    1,
                  )}{" "}
                  avg kills
                </Text>
                <Text style={[s.sessStat, { color: mentalColor }]}>
                  {sess.averageMental.toFixed(1)} mental
                </Text>
                {sess.wins > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons name="trophy" size={10} color={AMBER} />
                    <Text style={[s.sessStat, { color: AMBER }]}>
                      {sess.wins} {sess.wins === 1 ? "win" : "wins"}
                    </Text>
                  </View>
                )}
              </View>

              <Ionicons
                name="chevron-forward"
                size={14}
                color="#2a2a3a"
                style={{ marginLeft: 8 }}
              />
            </Pressable>
          );
        })}
      </View>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <View style={s.paginationRow}>
          <TouchableOpacity
            style={[s.pageBtn, page === 0 && { opacity: 0.3 }]}
            onPress={() => setPage((p) => p - 1)}
            disabled={page === 0}
          >
            <Text style={s.pageBtnText}>‹ PREV</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 5 }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <View
                key={i}
                style={[s.pageDot, i === page && s.pageDotActive]}
              />
            ))}
          </View>

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
  sectionLabel: {
    color: "#444",
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },

  overviewStrip: {
    flexDirection: "row",
    backgroundColor: INNER_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  overviewItem: { flex: 1, paddingVertical: 14, alignItems: "center", gap: 4 },
  overviewVal: { color: PURPLE, fontSize: 22, fontWeight: "700" },
  overviewLbl: {
    color: "#444",
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: "600",
  },

  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INNER_BG,
    borderRadius: 10,
    paddingVertical: 17,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  highlightLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    minWidth: 70,
    width: "40%",
  },
  highlightDate: {
    color: "#ccc",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  highlightSub: { color: "#444", fontSize: 9 },
  highlightVal: { fontSize: 13, fontWeight: "700" },

  emptyState: { paddingVertical: 20, alignItems: "center" },
  emptyStateText: { color: "#444", fontSize: 12, letterSpacing: 0.5 },

  sessRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INNER_BG,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#16162a",
  },
  sessDate: { color: "#ccc", fontSize: 12, fontWeight: "600" },
  sessSub: { color: "#444", fontSize: 10 },
  sessStat: { color: "#666", fontSize: 11, fontWeight: "600" },

  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
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
  pageDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: BORDER },
  pageDotActive: { backgroundColor: "#444", width: 14 },
});
