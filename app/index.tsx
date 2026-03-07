import {
  View,
  Text,
  Pressable,
  FlatList,
  Dimensions,
  Animated,
  Image,
  ScrollView,
  Easing,
  TextInput,
  Modal,
  StyleSheet,
} from "react-native";
import { router, Stack, Href } from "expo-router";
import { useRef, useEffect, useState, useContext } from "react";
import { db } from "../services/firebase";
import { AuthContext, useAuth } from "../services/authProvider";
import { SkinsContext } from "./_layout";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { purpleGradient } from "../constants/gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useGoogleSignIn } from "../hooks/useGoogleSignin";
import { signOutGoogle } from "@/services/googleAuth";

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────
function useShimmer() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });
}

function SkeletonBlock({
  w,
  h,
  radius = 8,
  style,
}: {
  w: number | string;
  h: number;
  radius?: number;
  style?: any;
}) {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius: radius,
          backgroundColor: "#1e1e30",
          opacity,
        },
        style,
      ]}
    />
  );
}

function HomeSkeleton() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero card */}
      <View
        style={{
          margin: tileMargin,
          marginTop: 50,
          backgroundColor: CARD_BG,
          borderRadius: 18,
          padding: 20,
          borderWidth: 1,
          borderColor: BORDER,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <SkeletonBlock w={160} h={36} radius={8} />
          <SkeletonBlock w={60} h={26} radius={999} />
        </View>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <SkeletonBlock w={110} h={145} radius={12} />
          <View
            style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 8 }}
          >
            {Array(6)
              .fill(null)
              .map((_, i) => (
                <SkeletonBlock key={i} w="47%" h={52} radius={10} />
              ))}
          </View>
        </View>
      </View>
      {/* Sessions button */}
      <View style={{ paddingHorizontal: tileMargin }}>
        <SkeletonBlock
          w="100%"
          h={90}
          radius={14}
          style={{ marginBottom: tileMargin }}
        />
      </View>
      {/* Tiles */}
      <View style={{ flexDirection: "row", paddingHorizontal: tileMargin / 2 }}>
        <SkeletonBlock
          w={tileWidth}
          h={110}
          radius={14}
          style={{ margin: tileMargin / 2 }}
        />
        <SkeletonBlock
          w={tileWidth}
          h={110}
          radius={14}
          style={{ margin: tileMargin / 2 }}
        />
      </View>
      {/* Graph */}
      <View
        style={{
          margin: tileMargin,
          marginTop: tileMargin / 2,
          backgroundColor: CARD_BG,
          borderRadius: 18,
          padding: 20,
          borderWidth: 1,
          borderColor: BORDER,
        }}
      >
        <SkeletonBlock w={140} h={20} radius={6} style={{ marginBottom: 14 }} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            height: 140,
            gap: 4,
          }}
        >
          {[40, 90, 60, 120, 80, 50, 110, 70, 100, 55].map((h, i) => (
            <SkeletonBlock key={i} w="9%" h={h} radius={6} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const { width } = Dimensions.get("window");
const tileMargin = 15;
const numColumns = 2;
const tileWidth = (width - tileMargin * (numColumns + 1)) / numColumns;

const PURPLE = "#8b5cf6";
const AMBER = "#f59e0b";
const BG = "#0d0d14";
const CARD_BG = "#0f0f1a";
const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";
const DEFAULT_AVATAR = null;
const USERNAME_KEY = "hg_username";
const SLOT_COUNT = 10;

const tiles: {
  title: string;
  route: Href;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  {
    title: "Analytics",
    route: "/view-data" as Href,
    icon: "stats-chart-outline",
    color: PURPLE,
  },
  {
    title: "Trophy Cabinet",
    route: "/graphs" as Href,
    icon: "trophy-outline",
    color: AMBER,
  },
];
// ─── Mode badge colors ────────────────────────────────────────────────────────
const MODE_COLORS: Record<string, string> = {
  OG: "#8b5cf6",
  BR: "#3b82f6",
  Reload: "#f59e0b",
};

export default function HomeScreen() {
  const { user, isAnonymous } = useAuth();
  const { skins, skinLoading } = useContext(SkinsContext);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const { signIn, googleLoading, error } = useGoogleSignIn();

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

  const [avatarImage, setAvatarImage] = useState<string | null>(DEFAULT_AVATAR);
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

  // Entrance animations
  const heroY = useRef(new Animated.Value(30)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (!user?.uid) return;
    const sessionsRef = collection(db, "users", user.uid, "sessions");
    const q = query(sessionsRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const active = snap.docs.some((d) => !d.data().endedAt);
      setHasActiveSession(active);
    });
    return () => unsub();
  }, [user?.uid]);

  const renderTile = ({ item }: { item: (typeof tiles)[0] }) => (
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
        style={[styles.tile, { borderColor: item.color + "40" }]}
      >
        <Ionicons name={item.icon} size={26} color={item.color} />
        <Text style={[styles.tileText, { color: item.color }]}>
          {item.title}
        </Text>
      </Pressable>
    </Animated.View>
  );

  if (loading || !totals) return <HomeSkeleton />;

  // Always 10 fixed slots, newest match is rightmost
  const paddedLast10: (number | null)[] = [
    ...totals.last10.slice().reverse(),
    ...Array(Math.max(0, SLOT_COUNT - totals.last10.length)).fill(null),
  ];

  const modeColor = MODE_COLORS[totals.topMode] ?? PURPLE;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── USERNAME EDIT MODAL ── */}
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
      <Animated.View
        style={{ opacity: heroOpacity, transform: [{ translateY: heroY }] }}
      >
        <View style={styles.heroCard}>
          <View style={styles.cardTopBorder} />

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
            {avatarImage ? (
              <Image source={{ uri: avatarImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarBolt}>⚡</Text>
              </View>
            )}

            {/* Zero state — hide stats, show welcome CTA */}
            {totals.matches === 0 ? (
              <View style={styles.zeroState}>
                <Text style={styles.zeroTitle}>NO STATS YET</Text>
                <Text style={styles.zeroSub}>
                  Drop in and play your first match to start tracking your
                  journey.
                </Text>
              </View>
            ) : (
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
                <StatBox label="WINS" value={totals.wins.toLocaleString()} />
                <StatBox label="K/D" value={totals.kdRatio.toFixed(2)} />
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* ── PRIMARY ACTION ── */}
      <Animated.View
        style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentY }],
        }}
      >
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
              {/* Diagonal gradient layers */}

              <View style={styles.primaryTileGradient} />

              {/* Left: icon + label */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  flex: 1,
                }}
              >
                <View style={styles.primaryIconWrap}>
                  <Ionicons
                    name="game-controller-outline"
                    size={22}
                    color={PURPLE}
                  />
                </View>
                <Text style={styles.primaryText}>SESSIONS</Text>
              </View>

              {/* Right: live indicator OR arrow */}
              {hasActiveSession ? (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#ffffff30" />
              )}
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

        {/* ── LAST 10 MATCHES GRAPH — only when there's data ── */}
        {/* ── LAST 10 MATCHES GRAPH — always visible ── */}
        {/* ── LAST 10 MATCHES GRAPH ── */}
        <View style={styles.graphCard}>
          <View style={styles.graphHeader}>
            <Text style={styles.sectionTitle}>LAST 10 MATCHES</Text>
            {totals.matches > 0 && (
              <Text style={styles.graphMeta}>
                {totals.last10.filter((p) => p === 1).length} wins
              </Text>
            )}
          </View>

          {totals.matches === 0 ? (
            <View style={styles.graphEmpty}>
              {[28, 52, 38, 70, 44, 32, 60, 42, 56, 36].map((h, i) => (
                <View key={i} style={[styles.placeholderBar, { height: h }]} />
              ))}
              <Text style={styles.graphHint}>
                Play your first match to see history
              </Text>
            </View>
          ) : (
            <View style={styles.graphContent}>
              <View style={styles.barsRow}>
                {paddedLast10.map((placement, i) => {
                  if (placement === null) {
                    return (
                      <View key={i} style={styles.barSlot}>
                        <View style={styles.emptyBar} />
                      </View>
                    );
                  }
                  const clamped = Math.max(1, Math.min(placement, 100));
                  const isWin = clamped === 1;
                  const MAX_BAR = 120;
                  const heightPercent = (101 - clamped) / 100;
                  const targetHeight = Math.max(MAX_BAR * heightPercent, 4);
                  const barColor = isWin
                    ? AMBER
                    : purpleGradient[
                        Math.min(Math.floor((100 - clamped) / 10), 9)
                      ];

                  return (
                    <View key={i} style={styles.barSlot}>
                      {/* Placement label */}
                      <Text
                        style={[styles.barLabel, isWin && styles.barLabelWin]}
                      >
                        {isWin ? "👑" : `#${clamped}`}
                      </Text>
                      {/* Bar */}
                      <View style={styles.barTrack}>
                        <Animated.View
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            borderRadius: 6,
                            backgroundColor: isWin
                              ? AMBER + "22"
                              : barColor + "18",
                            borderWidth: 1,
                            borderColor: isWin ? AMBER + "88" : barColor + "66",
                            shadowColor: barColor,
                            shadowOpacity: isWin ? 0.7 : 0.4,
                            shadowRadius: isWin ? 8 : 4,
                            shadowOffset: { width: 0, height: 0 },
                            height: animatedBars[i].interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, targetHeight],
                            }),
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
              {totals.last10.length < 10 && (
                <Text style={styles.graphHint}>
                  {10 - totals.last10.length} more{" "}
                  {10 - totals.last10.length === 1 ? "match" : "matches"} to
                  fill
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── LOGOUT ── */}
        {/* ── ACCOUNT SECTION ── */}
<View style={{ paddingHorizontal: tileMargin, marginBottom: 40, gap: 12 }}>

  {/* Anonymous → show backup prompt */}
  {isAnonymous && (
    <Pressable
      onPress={signIn}
      style={styles.backupBanner}
    >
      <View style={styles.backupLeft}>
        <Text style={styles.backupIcon}>☁️</Text>
        <View style={{ gap: 2 }}>
          <Text style={styles.backupTitle}>BACK UP YOUR STATS</Text>
          <Text style={styles.backupSub}>Sign in with Google to save to cloud</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#8b5cf6" />
    </Pressable>
  )}

  {/* Pro user → show logout */}
  {!isAnonymous && (
    <Pressable
      onPress={async () => {
        try {
          await signOutGoogle();
        } catch (err) {
          console.error("Logout failed:", err);
        }
      }}
      style={styles.logoutBtn}
    >
      <Text style={styles.logoutText}>LOGOUT</Text>
    </Pressable>
  )}

</View>
      </Animated.View>
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
  avatarPlaceholder: {
    width: 110,
    height: 145,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
    backgroundColor: "rgba(124,58,237,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBolt: {
    fontSize: 44,
  },

  // ── Zero state ──
  zeroState: {
    flex: 1,
    justifyContent: "center",
    gap: 10,
    paddingLeft: 4,
  },
  zeroTitle: {
    fontFamily: "BurbankBlack",
    fontSize: 18,
    color: "#fff",
    letterSpacing: 2,
  },
  zeroSub: {
    fontSize: 12,
    color: "#555",
    lineHeight: 18,
    letterSpacing: 0.3,
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

  primaryTileEmoji: { fontSize: 28 },

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
    //margin: tileMargin / 2,
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

  labelsRow: {
    flexDirection: "row", // left to right: oldest → newest
    marginBottom: 6,
    alignItems: "flex-end",
    height: 24,
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
  primaryTile: {
    backgroundColor: "#1a1228",
    borderRadius: 14,
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: tileMargin / 2,
    borderWidth: 1,
    borderColor: PURPLE + "80",
    overflow: "hidden",
    elevation: 6,
  },
  primaryGlow: {
    position: "absolute",
    top: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: PURPLE,
    opacity: 0.18,
  },
  primaryText: {
    fontFamily: "BurbankBlack",
    fontSize: 20,
    color: "#fff",
    letterSpacing: 2,
  },
  primaryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PURPLE + "18",
    borderWidth: 1,
    borderColor: PURPLE + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#22c55e18",
    borderWidth: 1,
    borderColor: "#22c55e40",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
    shadowColor: "#22c55e",
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  liveText: {
    color: "#22c55e",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  primaryTileGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PURPLE,
    opacity: 0.12,
    transform: [{ skewX: "-20deg" }, { scaleX: 1.5 }],
  },
  primaryTileDiag: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PURPLE,
    opacity: 0.06,
    transform: [{ skewX: "-35deg" }, { translateX: 60 }, { scaleX: 1.2 }],
  },
  graphCard: {
    margin: tileMargin,
    marginTop: tileMargin / 2,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  graphHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "BurbankBlack",
    fontSize: 14,
    color: "#fff",
    letterSpacing: 3,
  },
  graphMeta: {
    color: AMBER,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  graphEmpty: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
    gap: 4,
  },
  graphContent: { gap: 10 },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 160,
    gap: 4,
  },
  barSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: 160,
    gap: 4,
  },
  barTrack: {
    width: "100%",
    height: 120,
    justifyContent: "flex-end",
  },
  barLabel: {
    color: "#555",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  barLabelWin: {
    fontSize: 13,
    color: AMBER,
  },
  emptyBar: {
    width: "100%",
    height: 4,
    backgroundColor: "#16162a",
    borderRadius: 3,
  },
  placeholderBar: {
    flex: 1,
    backgroundColor: "#16162a",
    borderRadius: 6,
    opacity: 0.5,
  },
  graphHint: {
    color: "#333",
    fontSize: 10,
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 6,
  },
  backupBanner: {
  backgroundColor: CARD_BG,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: PURPLE + "40",
  paddingVertical: 14,
  paddingHorizontal: 16,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},
backupLeft: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  flex: 1,
},
backupIcon: {
  fontSize: 24,
},
backupTitle: {
  fontFamily: "BurbankBlack",
  fontSize: 13,
  color: "#fff",
  letterSpacing: 2,
},
backupSub: {
  fontSize: 11,
  color: "#555",
  letterSpacing: 0.5,
},
});
