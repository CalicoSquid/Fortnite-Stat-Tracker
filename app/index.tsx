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
} from "react-native";
import { router, Stack } from "expo-router";
import { useRef, useEffect, useState, useContext, useCallback } from "react";
import { auth, db } from "../services/firebase";
import { AuthContext } from "../services/authProvider";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { purpleGradient } from "../constants/gradient";
import { useFocusEffect } from "@react-navigation/native";

type RouteType = "../session" | "/view-data" | "/graphs";

const tiles: { title: string; route: RouteType; icon: string }[] = [
  { title: "New Session", route: "../session", icon: "🔥" },
  { title: "View Data", route: "/view-data", icon: "📊" },
  { title: "Graphs", route: "/graphs", icon: "📈" },
];

const { width } = Dimensions.get("window");
const tileMargin = 15;
const numColumns = 2;
const tileWidth = (width - tileMargin * (numColumns + 1)) / numColumns;

export default function HomeScreen() {
  const user = useContext(AuthContext);
  const [totals, setTotals] = useState<{
    matches: number;
    kills: number;
    wins: number;
    top10: number;
    winPercentage: number;
    kdRatio: number;
    last10: number[];
  } | null>(null);

  const [loading, setLoading] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const primaryScale = useRef(new Animated.Value(0.9)).current;
  const glowOpacity = useRef(new Animated.Value(0.6)).current;

  // Animated bars for last 10 matches
  const animatedBars = useRef<Animated.Value[]>([]).current;

  // --- Fetch totals on focus ---
  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;

      const fetchTotals = async () => {
        setLoading(true);
        try {
          const matchesRef = collection(db, "users", user.uid, "matches");
          const snapshot = await getDocs(
            query(matchesRef, orderBy("date", "desc"))
          );

          const matches = snapshot.docs.map((doc) => doc.data() as any);

          const totalMatches = matches.length;
          const totalKills = matches.reduce((sum, m) => sum + (m.kills ?? 0), 0);
          const top10 = matches.filter((m) => (m.placement ?? 0) <= 10);
          const wins = matches.filter((m) => (m.placement ?? 0) === 1).length;
          const winPercentage = totalMatches ? (wins / totalMatches) * 100 : 0;
          const kdRatio = totalMatches ? totalKills / totalMatches : 0;
          const last10 = matches.length
            ? matches.slice(0, 10).map((m) => m.placement ?? 0)
            : [];

          // Reset animated bars
          animatedBars.splice(0, animatedBars.length);
          last10.forEach(() => animatedBars.push(new Animated.Value(0)));

          setTotals({
            matches: totalMatches,
            kills: totalKills,
            wins,
            winPercentage,
            kdRatio,
            last10,
            top10: top10.length,
          });

          // Animate last10 bars
          Animated.stagger(
            100,
            last10.map((_, i) =>
              Animated.timing(animatedBars[i], {
                toValue: 1,
                duration: 700,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
              })
            )
          ).start();
        } catch (err) {
          console.error("Failed to fetch totals:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchTotals();
    }, [user])
  );

  // Primary button animations
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
      ])
    ).start();
  }, []);

  const renderTile = ({
    item,
  }: {
    item: { title: string; route: RouteType; icon: string };
  }) => {
    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          margin: tileMargin / 2,
        }}
      >
        <Pressable
          onPress={() => router.push(item.route)}
          onPressIn={() =>
            Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start()
          }
          onPressOut={() =>
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()
          }
          style={styles.tile}
        >
          <Text style={styles.tileIcon}>{item.icon}</Text>
          <Text style={styles.tileText}>{item.title}</Text>
        </Pressable>
      </Animated.View>
    );
  };

  if (loading || !totals)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0f15" }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HERO CARD */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeaderRow}>
          <Text style={styles.playerName} numberOfLines={1} ellipsizeMode="tail">
            CalicoSquid
          </Text>
          <View style={styles.modeBadge}>
            <Text style={styles.modeText}>OG PUBS</Text>
          </View>
        </View>

        <View style={styles.divider} />
        <View style={styles.accentGlow} />

        <View style={styles.heroContentRow}>
          <Image
            source={{ uri: "https://wallpapers.com/images/hd/fortnite-purple-q39h6u1tdqzulyvo.jpg" }}
            style={styles.avatar}
          />

          <View style={styles.statsColumn}>
            <Stat label="Win %" value={`${totals.winPercentage.toFixed(1)}%`} />
            <Stat label="Kills" value={totals.kills.toLocaleString()} />
            <Stat label="Matches" value={totals.matches.toLocaleString()} />
          </View>

          <View style={styles.statsColumn}>
            <Stat label="Wins" value={totals.wins.toLocaleString()} />
            <Stat label="Top 10" value={totals.top10.toLocaleString()} />
            <Stat label="K/D" value={totals.kdRatio.toFixed(2)} />
          </View>
        </View>
      </View>

      {/* PRIMARY ACTION */}
      <View style={{ paddingHorizontal: tileMargin / 2 }}>
        <Animated.View
          style={{
            transform: [{ scale: primaryScale }],
            shadowOpacity: glowOpacity,
          }}
        >
          <Pressable
            onPress={() => router.push("../session")}
            onPressIn={() => Animated.spring(primaryScale, { toValue: 0.96, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(primaryScale, { toValue: 1, useNativeDriver: true }).start()}
            style={styles.primaryTile}
          >
            <Text style={styles.primaryText}>Sessions</Text>
          </Pressable>
        </Animated.View>
      </View>

      <FlatList
        data={tiles.filter((t) => t.route !== "../session")}
        renderItem={renderTile}
        keyExtractor={(item) => item.title}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={{ paddingHorizontal: tileMargin / 2 }}
      />

      {/* LAST 10 MATCHES GRAPH */}
      <View style={styles.graphTile}>
        <Text style={styles.graphTitle}>Last 10 Matches</Text>

        <View style={styles.labelsRow}>
          {totals.last10.map((placement, i) => {
            const clamped = Math.max(1, Math.min(placement, 100));
            const isWin = clamped === 1;
            return (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <Text style={[styles.barLabel, { fontSize: isWin ? 16 : 12, color: isWin ? "#FFD700" : "#fff" }]}>
                  {isWin ? "👑" : clamped}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.barsRow}>
          {totals.last10.map((placement, i) => {
            const clamped = Math.max(1, Math.min(placement, 100));
            const isWin = clamped === 1;
            const maxBarHeight = 140;
            const decileIndex = Math.floor((clamped - 1) / 10);
            const targetHeight = isWin ? maxBarHeight : Math.max((90 - decileIndex * 10) * 1.4, 10);
            const barColor = isWin ? "#FFD700" : purpleGradient[9 - decileIndex];

            return (
              <View key={i} style={{ flex: 1, justifyContent: "flex-end", alignItems: "center" }}>
                <Animated.View
                  style={{
                    width: "80%",
                    backgroundColor: barColor,
                    borderRadius: 6,
                    borderWidth: isWin ? 2 : 0,
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
      </View>

      {/* LOGOUT */}
      <Animated.View
        style={{
          transform: [{ scale: primaryScale }],
          shadowOpacity: glowOpacity,
          marginHorizontal: tileMargin / 2,
          marginBottom: 30,
        }}
      >
        <Pressable
          onPress={async () => {
            try {
              await auth.signOut();
              await AsyncStorage.removeItem("email");
              await AsyncStorage.removeItem("password");
              router.replace("/login");
            } catch (err) {
              console.error("Logout failed:", err);
            }
          }}
          onPressIn={() => Animated.spring(primaryScale, { toValue: 0.96, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(primaryScale, { toValue: 1, useNativeDriver: true }).start()}
          style={styles.logout}
        >
          <Text style={styles.primaryText}>Logout</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ...styles remain the same

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#0f0f15",
  },

  heroCard: {
    margin: 20,
    backgroundColor: "#1a1a24",
    borderRadius: 24,
    padding: 20,
    marginTop: 40,
  },

  avatar: {
    width: 130,
    borderRadius: 20,
    marginRight: 20,
  },

  playerName: {
    fontFamily: "BurbankBlack",
    fontSize: 42,
    color: "white",
  },

  statsColumn: {
    flex: 1,
    justifyContent: "space-between" as const,
  },

  statItem: {
    marginBottom: 14,
  },

  statValue: {
    fontFamily: "BurbankBlack",
    fontSize: 22,
    color: "white",
  },

  statLabel: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },

  tile: {
    backgroundColor: "#1e1e2a",
    borderRadius: 18,
    height: 120,
    width: tileWidth,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },

  tileText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 8,
    fontFamily: "BurbankBlack",
  },

  tileIcon: {
    fontSize: 32,
  },

  primaryTile: {
    backgroundColor: "#8b5cf6",
    borderRadius: 24,
    height: 130,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 15,
    width: "94%" as const,
    alignSelf: "center" as const,
    shadowColor: "#8b5cf6",
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  logout: {
    backgroundColor: "#2a2a35",
    borderRadius: 16, // reduced from 24
    borderWidth: 2,
    borderColor: "#8b5cf6",
    height: 60,
    width: "94%" as const,
    alignSelf: "center" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 15,
  },

  primaryText: {
    fontFamily: "BurbankBlack",
    fontSize: 28,
    color: "white",
  },

  heroHeaderRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },

  modeBadge: {
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  modeText: {
    fontFamily: "BurbankBlack",
    fontSize: 12,
    color: "white",
  },

  divider: {
    height: 1,
    backgroundColor: "#2a2a35",
    marginTop: 12,
  },

  accentGlow: {
    height: 3,
    backgroundColor: "#8b5cf6",
    borderRadius: 3,
    marginBottom: 18,
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },

  heroContentRow: {
    flexDirection: "row" as const,
  },

  graphTitle: {
    fontFamily: "BurbankBlack",
    fontSize: 20,
    color: "white",
    marginBottom: 15,
  },

  graphTile: {
    margin: 20,
    backgroundColor: "#1a1a24",
    borderRadius: 24,
    padding: 20,
    //height: 220,
  },

  graphRow: {
    flexDirection: "row-reverse" as const,
    alignItems: "flex-end" as const,
    height: 160,
    paddingBottom: 10, // <- adds bottom spacing
  },

  bar: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 6,
    justifyContent: "flex-end" as const,
    alignItems: "center" as const,
  },

  barLabel: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 12,
    marginBottom: 2,
  },

  labelsRow: {
  flexDirection: "row-reverse" as const,
  marginBottom: 8,        // space between labels and bars
  alignItems: "flex-end" as const,
  height: 24,
},

barsRow: {
  flexDirection: "row-reverse" as const,
  alignItems: "flex-end" as const,
  height: 140,            // max height for bars so it fits inside tile
},
};
