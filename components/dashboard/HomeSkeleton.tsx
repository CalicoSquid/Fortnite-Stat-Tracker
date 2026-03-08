import { View, ScrollView, Animated } from "react-native";
import { useRef, useEffect } from "react";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const tileMargin = 15;
const numColumns = 2;
const tileWidth = (width - tileMargin * (numColumns + 1)) / numColumns;

const BG = "#0d0d14";
const CARD_BG = "#0f0f1a";
const BORDER = "#1e1e30";

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

export function HomeSkeleton() {
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