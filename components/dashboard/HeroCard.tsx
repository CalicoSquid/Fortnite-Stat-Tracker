import {
  View,
  Text,
  Image,
  Pressable,
  Modal,
  TextInput,
  Animated,
  StyleSheet,
} from "react-native";
import { StatBox } from "./StatBox";
import { HomeTotals } from "../../hooks/useHomeStats";

const PURPLE = "#8b5cf6";
const CARD_BG = "#0f0f1a";
const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";

const MODE_COLORS: Record<string, string> = {
  OG: "#8b5cf6",
  BR: "#3b82f6",
  Reload: "#f59e0b",
};

type Props = {
  totals: HomeTotals;
  avatarImage: string | null;
  heroOpacity: Animated.Value;
  heroY: Animated.Value;
  username: string;
  editingName: boolean;
  draftName: string;
  setDraftName: (val: string) => void;
  startEditing: () => void;
  cancelEditing: () => void;
  saveUsername: () => void;
};

export function HeroCard({
  totals,
  avatarImage,
  heroOpacity,
  heroY,
  username,
  editingName,
  draftName,
  setDraftName,
  startEditing,
  cancelEditing,
  saveUsername,
}: Props) {
  const modeColor = MODE_COLORS[totals.topMode] ?? PURPLE;

  return (
    <>
      {/* ── USERNAME EDIT MODAL ── */}
      <Modal visible={editingName} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={cancelEditing}>
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

          {/* ── Player name + mode badge ── */}
          <View style={styles.heroHeaderRow}>
            <Pressable onPress={startEditing} style={styles.playerNameRow}>
              <Text
                style={styles.playerName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {username}
              </Text>
              <Text style={styles.editPencil}>✎</Text>
            </Pressable>
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

          {/* ── Avatar + stats ── */}
          <View style={styles.heroContentRow}>
            {avatarImage ? (
              <Image source={{ uri: avatarImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarBolt}>⚡</Text>
              </View>
            )}

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
    </>
  );
}

const styles = StyleSheet.create({
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
  heroCard: {
    margin: 15,
    marginTop: 50,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    gap: 16,
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
    alignItems: "stretch",
    gap: 14,
  },
  avatar: {
    width: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  avatarPlaceholder: {
    width: 110,
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
  statsColumns: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
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
});