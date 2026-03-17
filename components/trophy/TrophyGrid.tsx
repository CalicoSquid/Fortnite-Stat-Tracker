import React from "react";
import { View, StyleSheet } from "react-native";
import { TrophyDef } from "@/hooks/useTrophyStats";
import { TrophyCard } from "./TrophyCard";
import { EmptyTrophy } from "./EmptyTrophy";

interface TrophyGridProps {
  trophies: TrophyDef[];
}

export function TrophyGrid({ trophies }: TrophyGridProps) {
  return (
    <View style={s.grid}>
      {trophies.map((t, i) =>
        t.value ? (
          <TrophyCard
            key={t.label}
            iconName={t.iconName}
            label={t.label}
            value={t.value}
            sub={t.sub ?? ""}
            color={t.color}
            tier={t.tier}
            delay={i * 60}
          />
        ) : (
          <EmptyTrophy key={t.label} label={t.label} />
        ),
      )}
    </View>
  );
}

const s = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});