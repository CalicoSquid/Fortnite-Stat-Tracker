import { View, Text, Animated, StyleSheet } from "react-native";
import { purpleGradient } from "../../constants/gradient";

const AMBER = "#f59e0b";
const CARD_BG = "#0f0f1a";
const BORDER = "#1e1e30";

type Props = {
  totals: {
    matches: number;
    last10: number[];
  };
  paddedLast10: (number | null)[];
  animatedBars: Animated.Value[];
};

export function StatsGraph({ totals, paddedLast10, animatedBars }: Props) {
  return (
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
                  <Text style={[styles.barLabel, isWin && styles.barLabelWin]}>
                    {isWin ? "👑" : `#${clamped}`}
                  </Text>
                  <View style={styles.barTrack}>
                    <Animated.View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        borderRadius: 6,
                        backgroundColor: isWin ? AMBER + "50" : barColor + "18",
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
              {10 - totals.last10.length === 1 ? "match" : "matches"} to fill
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  graphCard: {
    margin: 15,
    marginTop: 7,
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
});