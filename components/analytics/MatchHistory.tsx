import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import gradientColors from "@/constants/gradient";
import { modeColor, coerceDate, AnalyticsMatch } from "@/constants/analytics";
import { SkinsContext } from "@/app/_layout";
import EditMatchModal from "@/components/session/EditMatchModal";

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
  uid,
}: {
  matches: AnalyticsMatch[];
  uid: string;
}) {
  const [page, setPage] = useState(0);
  const [editMatch, setEditMatch] = useState<AnalyticsMatch | null>(null);
  const { skins } = useContext(SkinsContext);

  if (!matches.length) return <EmptyState message="No matches logged yet." />;

  const pageSize = 5;
  const totalPages = Math.ceil(matches.length / pageSize);
  const shown = matches.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <View style={{ gap: 8 }}>
      {shown.map((m, i) => {
        const skin = skins.find((sk) => sk.id === m.skinId);
        const mentalColor = gradientColors[
          Math.round(m.mentalState) - 1
        ] as string;
        const isWin = m.placement === 1;

        return (
          <Pressable
            key={i}
            onPress={() => setEditMatch(m)}
            style={({ pressed }) => [
              s.historyRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {/* Skin image or mode pill fallback */}
            {skin?.image ? (
              <Image
                source={{ uri: skin.image }}
                style={s.skinThumb}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  s.modePill,
                  { backgroundColor: modeColor(m.mode) + "22" },
                ]}
              >
                <Text style={[s.modePillText, { color: modeColor(m.mode) }]}>
                  {m.mode}
                </Text>
              </View>
            )}

            {/* Date + notes */}
            <View style={{ flex: 1, paddingHorizontal: 10, gap: 2 }}>
              <Text style={s.historyDate}>{coerceDate(m.date)}</Text>
              {!!m.notes && (
                <Text style={s.historyNotes} numberOfLines={1}>
                  {m.notes}
                </Text>
              )}
              {/* Mode pill inline if skin is showing */}
              {skin?.image && (
                <View
                  style={[
                    s.modePillSmall,
                    { backgroundColor: modeColor(m.mode) + "22" },
                  ]}
                >
                  <Text
                    style={[s.modePillSmallText, { color: modeColor(m.mode) }]}
                  >
                    {m.mode}
                  </Text>
                </View>
              )}
            </View>

            {/* Placement + kills */}
            <View style={{ alignItems: "flex-end", gap: 3 }}>
              {isWin ? (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Ionicons name="trophy" size={11} color={AMBER} />
                  <Text style={[s.placementBadge, { color: AMBER }]}>#1</Text>
                </View>
              ) : (
                <Text style={s.placementBadge}>#{m.placement}</Text>
              )}
              <Text style={s.killsBadge}>{m.kills} kills</Text>
            </View>

            {/* Mental dot */}
            <View style={[s.mentalDot, { backgroundColor: mentalColor }]} />
          </Pressable>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={s.paginationRow}>
          <TouchableOpacity
            style={[s.pageBtn, page === 0 && { opacity: 0.3 }]}
            onPress={() => setPage((p) => p - 1)}
            disabled={page === 0}
          >
            <Text style={s.pageBtnText}>‹ PREV</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
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

      {/* Edit modal */}
      {editMatch && (
        <EditMatchModal
          match={editMatch}
          sessionId={editMatch.sessionId}
          uid={uid}
          matches={matches}
          skins={skins}
          onClose={() => setEditMatch(null)}
          onSaved={() => setEditMatch(null)}
        />
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

  skinThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#0d0d1e",
  },
  modePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modePillText: { fontSize: 9, fontWeight: "700", letterSpacing: 1 },

  modePillSmall: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  modePillSmallText: { fontSize: 8, fontWeight: "700", letterSpacing: 0.8 },

  historyDate: { color: "#666", fontSize: 10, letterSpacing: 0.5 },
  historyNotes: { color: "#444", fontSize: 10 },

  placementBadge: { color: "#fff", fontSize: 13, fontWeight: "700" },
  killsBadge: { color: "#555", fontSize: 10, fontWeight: "600" },

  mentalDot: { width: 7, height: 7, borderRadius: 4 },

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

  emptyState: { paddingVertical: 20, alignItems: "center" },
  emptyStateText: { color: "#444", fontSize: 12, letterSpacing: 0.5 },
});
