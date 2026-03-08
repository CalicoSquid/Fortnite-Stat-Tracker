import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PURPLE = "#8b5cf6";
const CARD_BG = "#0f0f1a";
const BORDER = "#1e1e30";

type Props = {
  isAnonymous: boolean;
  showProSuccess: boolean;
  onSignIn: () => void;
  onLogout: () => void;
  onDismissSuccess: () => void;
};

export function AccountSection({
  isAnonymous,
  showProSuccess,
  onSignIn,
  onLogout,
  onDismissSuccess,
}: Props) {
  return (
    <>
      {/* ── PRO SUCCESS MODAL ── */}
      <Modal visible={showProSuccess} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={onDismissSuccess}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={[styles.modalTopBorder, { backgroundColor: "#22c55e" }]} />
            <Text style={{ fontSize: 40, textAlign: "center" }}>☁️</Text>
            <Text style={styles.modalTitle}>STATS BACKED UP</Text>
            <Text style={styles.modalBody}>
              Your data is now saved to your Google account. You'll never lose
              your stats again.
            </Text>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: "#22c55e" }]}
              onPress={onDismissSuccess}
            >
              <Text style={styles.modalBtnText}>LET'S GO</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── ACCOUNT BUTTONS ── */}
      <View style={styles.container}>
        {isAnonymous ? (
          <Pressable onPress={onSignIn} style={styles.backupBanner}>
            <View style={styles.backupLeft}>
              <Text style={styles.backupIcon}>☁️</Text>
              <View style={{ gap: 2 }}>
                <Text style={styles.backupTitle}>BACK UP YOUR STATS</Text>
                <Text style={styles.backupSub}>
                  Sign in with Google to save to cloud
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={PURPLE} />
          </Pressable>
        ) : (
          <Pressable onPress={onLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>LOGOUT</Text>
          </Pressable>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    marginBottom: 40,
    gap: 12,
  },
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
    opacity: 0.7,
  },
  modalTitle: {
    fontFamily: "BurbankBlack",
    fontSize: 16,
    color: "#fff",
    letterSpacing: 3,
    textAlign: "center",
  },
  modalBody: {
    color: "#555",
    fontSize: 12,
    textAlign: "center",
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  modalBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 8,
  },
  modalBtnText: {
    fontFamily: "BurbankBlack",
    fontSize: 16,
    color: "#fff",
    letterSpacing: 3,
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