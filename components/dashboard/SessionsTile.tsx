import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const PURPLE = "#8b5cf6";

type Props = {
  hasActiveSession: boolean;
  primaryScale: Animated.Value;
  glowOpacity: Animated.Value;
};

export function SessionsTile({ hasActiveSession, primaryScale, glowOpacity }: Props) {
  return (
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
        <View style={styles.primaryTileGradient} />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          <View style={styles.primaryIconWrap}>
            <Ionicons name="game-controller-outline" size={22} color={PURPLE} />
          </View>
          <Text style={styles.primaryText}>SESSIONS</Text>
        </View>

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
  );
}

const styles = StyleSheet.create({
  primaryTile: {
    backgroundColor: "#1a1228",
    borderRadius: 14,
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: PURPLE + "80",
    overflow: "hidden",
    elevation: 6,
  },
  primaryTileGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PURPLE,
    opacity: 0.12,
    transform: [{ skewX: "-20deg" }, { scaleX: 1.5 }],
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
});