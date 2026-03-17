import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/services/authProvider";
import { useTrophyData } from "@/hooks/useTrophyData";
import { useTrophyStats } from "@/hooks/useTrophyStats";
import { TrophySummaryStrip } from "@/components/trophy/TrophySummaryStrip";
import { TrophyGrid } from "@/components/trophy/TrophyGrid";

const PURPLE = "#8b5cf6";
const BG = "#0d0d14";
const CARD_BG = "#0f0f1a";
const BORDER = "#1e1e30";

export default function TrophyCabinetScreen() {
  const { user } = useAuth();
  const { matches, sessions, loading } = useTrophyData(user?.uid);
  const { trophies, summary } = useTrophyStats(matches, sessions);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
      delay: 100,
    }).start();
  }, []);

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={PURPLE} size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: BG }}
        contentContainerStyle={s.scroll}
      >
        {/* ── Header ── */}
        <Animated.View
          style={[
            s.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={s.screenTitle}>TROPHY CABINET</Text>
          </View>
          <View style={s.spacer} />
        </Animated.View>

        {/* ── Summary strip ── */}
        <TrophySummaryStrip summary={summary} />

        {/* ── Section label ── */}
        <Text style={s.sectionLabel}>PERSONAL RECORDS</Text>

        {/* ── Trophy grid ── */}
        <TrophyGrid trophies={trophies} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: BG,
    padding: 20,
    paddingTop: 34,
    gap: 12,
  },
  centered: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  spacer: { width: 36, height: 36 },
  screenTitle: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 18,
    letterSpacing: 3,
  },
  sectionLabel: {
    color: "#333",
    fontSize: 9,
    letterSpacing: 2.5,
    fontWeight: "700",
    marginBottom: 4,
    marginLeft: 2,
  },
});