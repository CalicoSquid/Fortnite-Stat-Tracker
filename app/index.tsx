import { View, FlatList, Animated, ScrollView, StyleSheet } from "react-native";
import { router, Stack, Href } from "expo-router";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../services/authProvider";
import { useHomeStats } from "../hooks/useHomeStats";
import { useUsername } from "../hooks/useUsername";
import { useGoogleSignIn } from "../hooks/useGoogleSignin";
import { signOutGoogle } from "../services/googleAuth";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";
import { HomeSkeleton } from "../components/dashboard/HomeSkeleton";
import { HeroCard } from "../components/dashboard/HeroCard";
import { SessionsTile } from "../components/dashboard/SessionsTile";
import { StatsGraph } from "../components/dashboard/StatsGraph";
import { AccountSection } from "../components/dashboard/AccountSection";

const PURPLE = "#8b5cf6";
const AMBER = "#f59e0b";
const CARD_BG = "#0f0f1a";
const BORDER = "#1e1e30";
const BG = "#0d0d14";
const tileMargin = 15;

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

export default function HomeScreen() {
  const { user, isAnonymous, refreshUser } = useAuth();
  const { signIn } = useGoogleSignIn();
  const [showProSuccess, setShowProSuccess] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  const {
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
  } = useHomeStats();

  const {
    username,
    editingName,
    draftName,
    setDraftName,
    saveUsername,
    startEditing,
    cancelEditing,
  } = useUsername();

  // ── Active session listener ──
  useEffect(() => {
    if (!user?.uid) return;
    const sessionsRef = collection(db, "users", user.uid, "sessions");
    const q = query(sessionsRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setHasActiveSession(snap.docs.some((d) => !d.data().endedAt));
    });
    return () => unsub();
  }, [user?.uid]);

  const handleSignIn = async () => {
    const result = await signIn();
    if (result.success) {
      await refreshUser();
      setShowProSuccess(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutGoogle();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const renderTile = ({ item }: { item: (typeof tiles)[0] }) => (
    <Pressable
      onPress={() => router.push(item.route)}
      style={[styles.tile, { borderColor: item.color + "40" }]}
    >
      <Ionicons name={item.icon} size={26} color={item.color} />
      <Text style={[styles.tileText, { color: item.color }]}>{item.title}</Text>
    </Pressable>
  );

  if (loading || !totals) return <HomeSkeleton />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ headerShown: false }} />

      <HeroCard
        totals={totals}
        avatarImage={avatarImage}
        heroOpacity={heroOpacity}
        heroY={heroY}
        username={username}
        editingName={editingName}
        draftName={draftName}
        setDraftName={setDraftName}
        startEditing={startEditing}
        cancelEditing={cancelEditing}
        saveUsername={saveUsername}
      />

      <Animated.View
        style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentY }],
        }}
      >
        <View style={{ paddingHorizontal: tileMargin }}>
          <SessionsTile
            hasActiveSession={hasActiveSession}
            primaryScale={primaryScale}
            glowOpacity={glowOpacity}
          />
        </View>

        <FlatList
          data={tiles}
          renderItem={renderTile}
          keyExtractor={(item) => item.title}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: tileMargin / 2 }}
        />

        <StatsGraph
          totals={totals}
          paddedLast10={paddedLast10}
          animatedBars={animatedBars}
        />

        <AccountSection
          isAnonymous={isAnonymous}
          showProSuccess={showProSuccess}
          onSignIn={handleSignIn}
          onLogout={handleLogout}
          onDismissSuccess={() => setShowProSuccess(false)}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  tile: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    height: 110,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    margin: tileMargin / 2,
  },
  tileText: {
    fontSize: 15,
    marginTop: 8,
    fontFamily: "BurbankBlack",
    letterSpacing: 1,
  },
});