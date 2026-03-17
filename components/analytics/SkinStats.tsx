import React, { useContext } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SkinsContext } from "@/app/_layout";
import { avg, AnalyticsMatch } from "@/constants/analytics";

const PURPLE = "#8b5cf6";
const BLUE = "#3b82f6";
const AMBER = "#f59e0b";
const GREEN = "#22c55e";
const RED = "#ef4444";
const INNER_BG = "#0a0a12";

type Highlight = {
  label: string;
  color: string;
  data: SkinData;
  stat: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type SkinData = {
  id: string;
  wins: number;
  top10: number;
  totalKills: number;
  avgPlace: number;
  count: number;
};

const EmptyState = ({ message }: { message: string }) => (
  <View style={s.emptyState}>
    <Text style={s.emptyStateText}>{message}</Text>
  </View>
);

export default function SkinStats({ matches }: { matches: AnalyticsMatch[] }) {
  const { skins } = useContext(SkinsContext);

  if (!matches.length) return <EmptyState message="No matches logged yet." />;

  const skinIds = [...new Set(matches.map((m) => m.skinId).filter(Boolean))];
  if (!skinIds.length)
    return <EmptyState message="No skin data recorded yet." />;

  const getSkin = (id: string) => skins.find((s) => s.id === id);

  const skinData: SkinData[] = skinIds.map((id) => {
    const ms = matches.filter((m) => m.skinId === id);
    const wins = ms.filter((m) => m.placement === 1).length;
    const top10 = ms.filter((m) => m.placement <= 10).length;
    const totalKills = ms.reduce((a, m) => a + m.kills, 0);
    const avgPlace = avg(ms.map((m) => m.placement));
    return { id, wins, top10, totalKills, avgPlace, count: ms.length };
  });

  const totalMatches = matches.length;
  const overallWinRate =
    matches.filter((m) => m.placement === 1).length / totalMatches;
  const dynamicMin = Math.max(2, Math.floor(totalMatches / skinIds.length / 2));

  const byMostUsed = [...skinData].sort((a, b) => b.count - a.count)[0];
  const byWins = [...skinData].sort((a, b) => b.wins - a.wins)[0];
  const byKills = [...skinData].sort((a, b) => b.totalKills - a.totalKills)[0];
  const byTop10 = [...skinData].sort((a, b) => b.top10 - a.top10)[0];

  const byPlace = [...skinData]
    .filter((s) => s.count >= dynamicMin)
    .sort((a, b) => a.avgPlace - b.avgPlace)[0];

  const worst = [...skinData]
    .filter((s) => {
      if (s.count < dynamicMin) return false;
      return s.wins / s.count <= overallWinRate;
    })
    .sort((a, b) => {
      const aWinRate = a.wins / a.count;
      const bWinRate = b.wins / b.count;
      if (aWinRate !== bWinRate) return aWinRate - bWinRate;
      return b.avgPlace - a.avgPlace;
    })[0];

  const highlights: Highlight[] = [
    {
      label: "MOST USED",
      color: PURPLE,
      data: byMostUsed,
      stat: `${byMostUsed.count} matches`,
      icon: "repeat",
    },
    {
      label: "MOST WINS",
      color: AMBER,
      data: byWins,
      stat: `${byWins.wins} wins`,
      icon: "trophy-outline",
    },
    {
      label: "MOST KILLS",
      color: RED,
      data: byKills,
      stat: `${byKills.totalKills} total kills`,
      icon: "skull-outline",
    },
    {
      label: "MOST TOP 10s",
      color: BLUE,
      data: byTop10,
      stat: `${byTop10.top10} top 10s`,
      icon: "medal-outline",
    },
    ...(byPlace
      ? [
          {
            label: "BEST PLACEMENT",
            color: GREEN,
            data: byPlace,
            stat: `#${byPlace.avgPlace.toFixed(1)} avg`,
            icon: "ribbon-outline" as keyof typeof Ionicons.glyphMap,
          },
        ]
      : []),
    ...(worst
      ? [
          {
            label: "WORST SKIN",
            color: "#555",
            data: worst,
            stat: `#${worst.avgPlace.toFixed(1)} avg · ${worst.wins} wins`,
            icon: "trending-down-outline" as keyof typeof Ionicons.glyphMap,
          },
        ]
      : []),
  ];

  return (
    <View style={{ gap: 12 }}>
      {highlights.map(({ label, color, data, stat, icon }) => {
        const skin = getSkin(data.id);
        return (
          <View key={label} style={[s.skinRow, { borderColor: color + "33" }]}>
            {skin?.image ? (
              <Image
                source={{ uri: skin.image }}
                style={s.skinThumb}
                resizeMode="contain"
              />
            ) : (
              <View style={[s.skinThumb, s.skinThumbFallback]}>
                <Ionicons name="person" size={24} color="#444" />
              </View>
            )}
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <Text style={[s.skinHighlightLabel, { color }]}>{label}</Text>
              <Text style={s.skinName}>{skin?.name ?? data.id}</Text>
              <Text style={s.skinMatchCount}>{data.count} matches played</Text>
            </View>
            <View style={s.rightCol}>
              <View style={[s.iconWrap, { backgroundColor: color + "18", borderColor: color + "33" }]}>
                <Ionicons name={icon} size={16} color={color} />
              </View>
              <Text style={[s.skinStat, { color }]}>{stat}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  skinRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INNER_BG,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  skinThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#16162a",
  },
  skinThumbFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  skinHighlightLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  skinName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  skinMatchCount: {
    color: "#444",
    fontSize: 10,
    marginTop: 2,
  },
  skinStat: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "right",
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 6,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyStateText: {
    color: "#444",
    fontSize: 12,
    letterSpacing: 0.5,
  },
});