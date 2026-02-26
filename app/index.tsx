import {
  View,
  Text,
  Pressable,
  FlatList,
  Dimensions,
  Animated,
  Image,
  ScrollView,
  ActivityIndicator,
  Easing,
  TextInput,
  Modal,
  StyleSheet,
} from "react-native";
import { router, Stack } from "expo-router";
import { useRef, useEffect, useState, useContext } from "react";
import { auth, db } from "../services/firebase";
import { AuthContext } from "../services/authProvider";
import { SkinsContext } from "./_layout";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { purpleGradient } from "../constants/gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

type RouteType = "../session" | "/view-data" | "/graphs";

const tiles: { title: string; route: RouteType; icon: string }[] = [
  { title: "View Data", route: "/view-data", icon: "📊" },
  { title: "Graphs", route: "/graphs", icon: "📈" },
];

const { width } = Dimensions.get("window");
const tileMargin = 15;
const numColumns = 2;
const tileWidth = (width - tileMargin * (numColumns + 1)) / numColumns;

const PURPLE = "#8b5cf6";
const BG = "#0d0d14";
const CARD_BG = "#0f0f1a";
const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";
const DEFAULT_AVATAR =
  "https://wallpapers.com/images/hd/fortnite-purple-q39h6u1tdqzulyvo.jpg";
const USERNAME_KEY = "hg_username";
const SLOT_COUNT = 10;

// ─── Mode badge colors ────────────────────────────────────────────────────────
const MODE_COLORS: Record<string, string> = {
  OG: "#8b5cf6",
  BR: "#3b82f6",
  Reload: "#f59e0b",
};
const getPlacementColor = (placement: number) => {
  if (placement === 1) return "#FFD700"; // gold

  const clamped = Math.max(1, Math.min(placement, 100));
  const percent = (101 - clamped) / 100; 
  // 1 = best non-win
  // 0 = worst

  const hue = 270; // true purple

  // Dark + rich when bad
  // Light + soft when good
  const lightness = 20 + percent * 60; 
  // 20% (deep royal purple)
  // 80% (pastel violet)

  const saturation = 85 - percent * 35; 
  // 85% (rich dark purple)
  // 50% (soft pastel)

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
export default function HomeScreen() {
  const user = useContext(AuthContext);
  const { skins, skinLoading } = useContext(SkinsContext);

  const [totals, setTotals] = useState<{
    matches: number;
    kills: number;
    wins: number;
    top10: number;
    winPercentage: number;
    kdRatio: number;
    last10: number[];
    topMode: string;
  } | null>(null);

  const [avatarImage, setAvatarImage] = useState<string>(DEFAULT_AVATAR);
  const [loading, setLoading] = useState(false);

  // ── Username state ──
  const [username, setUsername] = useState("Player");
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");

  // Animated values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const primaryScale = useRef(new Animated.Value(0.9)).current;
  const glowOpacity = useRef(new Animated.Value(0.6)).current;
  const animatedBars = useRef<Animated.Value[]>(
    Array.from({ length: 10 }, () => new Animated.Value(0)),
  ).current;

  // ── Load username from AsyncStorage ──────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(USERNAME_KEY).then((val) => {
      if (val) setUsername(val);
    });
  }, []);

  const saveUsername = async () => {
    const trimmed = draftName.trim();
    if (trimmed.length > 0) {
      setUsername(trimmed);
      await AsyncStorage.setItem(USERNAME_KEY, trimmed);
    }
    setEditingName(false);
  };

  // ─── Fetch matches & compute stats ───────────────────────────────────────
  useEffect(() => {
    if (!user?.uid || skinLoading) return;

    setLoading(true);
    const matchesRef = collection(db, "users", user.uid, "matches");
    const q = query(matchesRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matches = snapshot.docs.map((doc) => doc.data() as any);

        // ── Avatar: skin with most wins ──
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

        // ── Mode: most played overall ──
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
        const last10 = matches
          .slice(0, 10) // newest → older
          .map((m) => m.placement ?? 0)
          .reverse(); // oldest → newest

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

        // ── Animate bars — pad left with nulls, data on the right ──
        // animatedBars[0..9] map to paddedLast10[0..9]
        // null slots animate to 0, data slots animate to 1
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

  // ─── Entry animations ─────────────────────────────────────────────────────
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

  const renderTile = ({
    item,
  }: {
    item: { title: string; route: RouteType; icon: string };
  }) => (
    <Animated.View
      style={{ transform: [{ scale: scaleAnim }], margin: tileMargin / 2 }}
    >
      <Pressable
        onPress={() => router.push(item.route)}
        onPressIn={() =>
          Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          }).start()
        }
        style={styles.tile}
      >
        <Text style={styles.tileIcon}>{item.icon}</Text>
        <Text style={styles.tileText}>{item.title}</Text>
      </Pressable>
    </Animated.View>
  );

  if (loading || !totals)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: BG,
        }}
      >
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );

  // Always 10 fixed slots, newest match is rightmost
  const paddedLast10: (number | null)[] = [
    ...Array(Math.max(0, SLOT_COUNT - totals.last10.length)).fill(null),
    ...totals.last10,
  ];

  const modeColor = MODE_COLORS[totals.topMode] ?? PURPLE;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Modal visible={editingName} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setEditingName(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalTopBorder} />
            <Text style={styles.modalTitle}>YOUR GAMERTAG</Text>
            <TextInput
              style={styles.modalInput}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Enter your Epic name..."
              placeholderTextColor="#444"
              autoFocus
              autoCorrect={false}
              maxLength={24}
              onSubmitEditing={saveUsername}
            />
            <Pressable style={styles.modalSaveBtn} onPress={saveUsername}>
              <Text style={styles.modalSaveText}>SAVE</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── HERO CARD ── */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeaderRow}>
          {/* Tap name to edit */}
          <Pressable
            onPress={() => {
              setDraftName(username);
              setEditingName(true);
            }}
            style={styles.playerNameRow}
          >
            <Text
              style={styles.playerName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {username}
            </Text>
            <Text style={styles.editPencil}>✎</Text>
          </Pressable>

          {/* Dynamic mode badge */}
          <View
            style={[
              styles.modeBadge,
              {
                backgroundColor: `${modeColor}22`,
                borderColor: `${modeColor}88`,
              },
            ]}
          >
            <Text style={[styles.modeText, { color: modeColor }]}>
              {totals.topMode}
            </Text>
          </View>
        </View>

        <View style={styles.heroContentRow}>
          <Image source={{ uri: avatarImage }} style={styles.avatar} />
          <View style={styles.statsColumns}>
            <StatBox
              label="WIN %"
              value={`${totals.winPercentage.toFixed(1)}%`}
              accent
            />
            <StatBox
              label="KILLS"
              value={totals.kills.toLocaleString()}
              accent
            />
            <StatBox label="MATCHES" value={totals.matches.toLocaleString()} />
            <StatBox label="WINS" value={totals.wins.toLocaleString()} />
            <StatBox label="TOP 10" value={totals.top10.toLocaleString()} />
            <StatBox label="K/D" value={totals.kdRatio.toFixed(2)} />
          </View>
        </View>
      </View>

      {/* ── PRIMARY ACTION ── */}
      <View style={{ paddingHorizontal: tileMargin }}>
        <Animated.View
          style={{
            transform: [{ scale: primaryScale }],
            shadowOpacity: glowOpacity,
          }}
        >
          <Pressable
            onPress={() => router.push("../session")}
            onPressIn={() =>
              Animated.spring(primaryScale, {
                toValue: 0.96,
                useNativeDriver: true,
              }).start()
            }
            onPressOut={() =>
              Animated.spring(primaryScale, {
                toValue: 1,
                useNativeDriver: true,
              }).start()
            }
            style={styles.primaryTile}
          >
            <Text style={styles.primaryTileEmoji}>🪂</Text>
            <Text style={styles.primaryText}>SESSIONS</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* ── SECONDARY TILES ── */}
      <FlatList
        data={tiles}
        renderItem={renderTile}
        keyExtractor={(item) => item.title}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={{ paddingHorizontal: tileMargin / 2 }}
      />

      {/* ── LAST 10 MATCHES GRAPH ── */}
      <View style={styles.graphCard}>
        <Text style={styles.sectionTitle}>Last 10 Matches</Text>

        {/* Labels row — always 10 fixed slots */}
        <View style={styles.labelsRow}>
          {paddedLast10.map((placement, i) => {
            if (placement === null)
              return <View key={i} style={styles.barSlot} />;
            const clamped = Math.max(1, Math.min(placement, 100));
            const isWin = clamped === 1;
            return (
              <View key={i} style={styles.barSlot}>
                <Text style={[styles.barLabel, isWin && styles.barLabelWin]}>
                  {isWin ? "👑" : clamped}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Bars row — always 10 fixed slots */}
        <View style={styles.barsRow}>
          {paddedLast10.map((placement, i) => {
            if (placement === null) {
              return (
                <View
                  key={i}
                  style={[
                    styles.barSlot,
                    { justifyContent: "flex-end", alignItems: "center" },
                  ]}
                >
                  <View style={styles.emptyBar} />
                </View>
              );
            }
            const clamped = Math.max(1, Math.min(placement, 100));
            const isWin = clamped === 1;
            const MAX_BAR = 140;
            // Continuous: 1st = 100%, 100th = 1%
            const heightPercent = (101 - clamped) / 100;
            const targetHeight = Math.max(MAX_BAR * heightPercent, 4);
            const gradientIndex = Math.min(Math.floor((clamped - 1) / 10), 9);
            const invertedIndex = 9 - gradientIndex;

            const barColor = getPlacementColor(clamped);
            return (
              <View
                key={i}
                style={[
                  styles.barSlot,
                  { justifyContent: "flex-end", alignItems: "center" },
                ]}
              >
                <Animated.View
                  style={{
                    width: "85%",
                    backgroundColor: barColor,
                    borderRadius: 6,
                    borderWidth: isWin ? 2 : 0,
                    borderColor: isWin ? "#FFD700" : "transparent",
                    shadowColor: isWin ? "#FFD700" : "transparent",
                    shadowOpacity: isWin ? 0.9 : 0,
                    shadowRadius: isWin ? 10 : 0,
                    shadowOffset: { width: 0, height: 0 },
                    height: animatedBars[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, targetHeight],
                    }),
                  }}
                />
              </View>
            );
          })}
        </View>

        {totals.last10.length < 10 && (
          <Text style={styles.graphHint}>
            {10 - totals.last10.length} more match
            {10 - totals.last10.length !== 1 ? "es" : ""} to fill the chart
          </Text>
        )}
      </View>

      {/* ── LOGOUT ── */}
      <View style={{ paddingHorizontal: tileMargin, marginBottom: 40 }}>
        <Pressable
          onPress={async () => {
            router.replace("/login");
          }}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutText}>LOGOUT</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.statBox, accent && styles.statBoxAccent]}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // ── Username modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    gap: 16,
    overflow: "hidden",
  },
  modalTopBorder: {
    position: "absolute",
    top: 0,
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: PURPLE,
    opacity: 0.7,
  },
  modalTitle: {
    fontFamily: "BurbankBlack",
    fontSize: 16,
    color: "#fff",
    letterSpacing: 3,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: INNER_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 18,
    fontFamily: "BurbankBlack",
    letterSpacing: 1,
  },
  modalSaveBtn: {
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: PURPLE,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  modalSaveText: {
    fontFamily: "BurbankBlack",
    fontSize: 16,
    color: "#fff",
    letterSpacing: 3,
  },

  // ── Hero card ──
  heroCard: {
    margin: tileMargin,
    marginTop: 50,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  cardTopBorder: {
    position: "absolute",
    top: 0,
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: PURPLE,
    opacity: 0.8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  heroHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  playerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  playerName: {
    fontFamily: "BurbankBlack",
    fontSize: 32,
    color: "#fff",
    flexShrink: 1,
  },
  editPencil: {
    color: "#444",
    fontSize: 16,
  },
  modeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  modeText: {
    fontFamily: "BurbankBlack",
    fontSize: 11,
    letterSpacing: 1,
  },
  heroContentRow: {
    flexDirection: "row",
    gap: 14,
  },
  avatar: {
    width: 110,
    height: 145,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statsColumns: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statBox: {
    width: "47%",
    backgroundColor: INNER_BG,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#16162a",
  },
  statBoxAccent: { borderColor: "rgba(139,92,246,0.3)" },
  statValue: {
    fontFamily: "BurbankBlack",
    fontSize: 18,
    color: "#fff",
    marginBottom: 2,
  },
  statValueAccent: { color: "#a78bfa" },
  statLabel: {
    fontSize: 9,
    color: "#555",
    letterSpacing: 1.5,
    fontWeight: "600",
  },

  // ── Primary tile ──
  primaryTile: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    height: 90,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: tileMargin,
    shadowColor: PURPLE,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    elevation: 10,
  },
  primaryTileEmoji: { fontSize: 28 },
  primaryText: {
    fontFamily: "BurbankBlack",
    fontSize: 28,
    color: "#fff",
    letterSpacing: 2,
  },

  // ── Secondary tiles ──
  tile: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    height: 110,
    width: tileWidth,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    margin: tileMargin / 2,
  },
  tileText: {
    color: "#fff",
    fontSize: 15,
    marginTop: 8,
    fontFamily: "BurbankBlack",
    letterSpacing: 1,
  },
  tileIcon: { fontSize: 28 },

  // ── Graph card ──
  graphCard: {
    margin: tileMargin,
    marginTop: tileMargin / 2,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionTitle: {
    fontFamily: "BurbankBlack",
    fontSize: 18,
    color: "#fff",
    letterSpacing: 1,
    marginBottom: 14,
  },
  labelsRow: {
    flexDirection: "row", // left to right: oldest → newest
    marginBottom: 6,
    alignItems: "flex-end",
    height: 24,
  },
  barsRow: {
    flexDirection: "row", // left to right: oldest → newest
    alignItems: "flex-end",
    height: 140,
  },
  // Fixed-width slot — always same width regardless of count
  barSlot: {
    flex: 1,
    alignItems: "center",
  },
  barLabel: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 11,
    marginBottom: 2,
  },
  barLabelWin: {
    fontSize: 15,
    color: "#FFD700",
  },
  emptyBar: {
    width: "85%",
    height: 4,
    backgroundColor: "#1a1a28",
    borderRadius: 3,
  },
  graphHint: {
    color: "#333",
    fontSize: 10,
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 10,
  },

  // ── Logout ──
  logoutBtn: {
    backgroundColor: "transparent",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    fontFamily: "BurbankBlack",
    fontSize: 14,
    color: "#444",
    letterSpacing: 3,
  },
});
