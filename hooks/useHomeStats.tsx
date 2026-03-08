import { useState, useEffect, useRef, useContext } from "react";
import { Animated, Easing } from "react-native";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../services/authProvider";
import { SkinsContext } from "../app/_layout";

const SLOT_COUNT = 10;

export type HomeTotals = {
  matches: number;
  kills: number;
  wins: number;
  top10: number;
  winPercentage: number;
  kdRatio: number;
  last10: number[];
  topMode: string;
};

export function useHomeStats() {
  const { user } = useAuth();
  const { skins, skinLoading } = useContext(SkinsContext);

  const [totals, setTotals] = useState<HomeTotals | null>(null);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Entrance animations ──
  const heroY = useRef(new Animated.Value(30)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const primaryScale = useRef(new Animated.Value(0.9)).current;
  const glowOpacity = useRef(new Animated.Value(0.6)).current;
  const animatedBars = useRef<Animated.Value[]>(
    Array.from({ length: SLOT_COUNT }, () => new Animated.Value(0)),
  ).current;

  // ── Entry glow + scale ──
  useEffect(() => {
    Animated.spring(primaryScale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.6,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // ── Firestore fetch ──
  useEffect(() => {
    if (!user?.uid || skinLoading) return;

    setLoading(true);
    const matchesRef = collection(db, "users", user.uid, "matches");
    const q = query(matchesRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matches = snapshot.docs.map((doc) => doc.data() as any);

        // ── Avatar: skin with most wins, fallback to most used ──
        const skinWins: Record<string, number> = {};
        matches.forEach((m) => {
          if (m.skinId && m.placement === 1)
            skinWins[m.skinId] = (skinWins[m.skinId] || 0) + 1;
        });
        let bestSkinId: string | null = null;
        let maxWins = 0;
        for (const [skinId, wins] of Object.entries(skinWins)) {
          if (wins > maxWins) {
            maxWins = wins;
            bestSkinId = skinId;
          }
        }
        if (!bestSkinId) {
          const skinCounts: Record<string, number> = {};
          matches.forEach((m) => {
            if (m.skinId)
              skinCounts[m.skinId] = (skinCounts[m.skinId] || 0) + 1;
          });
          let maxCount = 0;
          for (const [skinId, count] of Object.entries(skinCounts)) {
            if (count > maxCount) {
              maxCount = count;
              bestSkinId = skinId;
            }
          }
        }
        const skinImage = bestSkinId
          ? skins.find((s) => s.id === bestSkinId)?.image
          : null;
        if (skinImage) setAvatarImage(skinImage);

        // ── Top mode ──
        const modeCounts: Record<string, number> = {};
        matches.forEach((m) => {
          if (m.mode) modeCounts[m.mode] = (modeCounts[m.mode] || 0) + 1;
        });
        let topMode = "OG";
        let topModeCount = 0;
        for (const [mode, count] of Object.entries(modeCounts)) {
          if (count > topModeCount) {
            topModeCount = count;
            topMode = mode;
          }
        }

        // ── Totals ──
        const totalMatches = matches.length;
        const totalKills = matches.reduce((sum, m) => sum + (m.kills ?? 0), 0);
        const top10 = matches.filter((m) => (m.placement ?? 0) <= 10).length;
        const wins = matches.filter((m) => (m.placement ?? 0) === 1).length;
        const winPercentage = totalMatches ? (wins / totalMatches) * 100 : 0;
        const kdRatio = totalMatches ? totalKills / totalMatches : 0;
        const last10 = matches.slice(0, 10).map((m) => m.placement ?? 0);

        setTotals({
          matches: totalMatches,
          kills: totalKills,
          wins,
          winPercentage,
          kdRatio,
          last10,
          top10,
          topMode,
        });

        // ── Entrance animation ──
        heroY.setValue(30);
        heroOpacity.setValue(0);
        contentY.setValue(20);
        contentOpacity.setValue(0);
        Animated.sequence([
          Animated.parallel([
            Animated.timing(heroOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(heroY, {
              toValue: 0,
              duration: 400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(contentOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(contentY, {
              toValue: 0,
              duration: 300,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]).start();

        // ── Bar animations ──
        animatedBars.forEach((bar) => bar.setValue(0));
        const padCount = Math.max(0, SLOT_COUNT - last10.length);
        Animated.stagger(
          60,
          animatedBars.map((bar, i) => {
            const hasData = i >= padCount;
            return Animated.timing(bar, {
              toValue: hasData ? 1 : 0,
              duration: hasData ? 600 : 0,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            });
          }),
        ).start();

        setLoading(false);
      },
      (err) => {
        console.error("Failed to fetch matches:", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user, skins, skinLoading]);

  // ── Padded last 10 for graph ──
  const paddedLast10: (number | null)[] = totals
    ? [
        ...Array(Math.max(0, SLOT_COUNT - totals.last10.length)).fill(null),
        ...totals.last10.slice().reverse(),
      ]
    : Array(SLOT_COUNT).fill(null);

  return {
    totals,
    avatarImage,
    loading,
    paddedLast10,
    animatedBars,
    heroY,
    heroOpacity,
    contentY,
    contentOpacity,
    primaryScale,
    glowOpacity,
  };
}