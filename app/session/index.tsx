import { useContext, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  BackHandler,
  TouchableOpacity,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { AuthContext } from "../../services/authProvider";
import { useSessionsData } from "@/hooks/useSessionsData";
import LiveDot from "@/components/session/LiveDot";
import StormEye from "@/components/session/StormEye";
import PastSessionRow from "@/components/session/PastSessionRow";
import MentalBar from "@/components/session/MentalBar";
import { Ionicons } from "@expo/vector-icons";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(date: Date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m ago` : `${hrs}h ago`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SessionsOverview() {
  const user = useContext(AuthContext);
  const [sessPage, setSessPage] = useState(0);
  const SESS_PAGE_SIZE = 5;

  const {
    sessions,
    activeSession,
    stats,
    loading,
    lifetimeSessions,
    lifetimeMatches,
    lifetimeKills,
    handleStartSession,
    handleEndSession,
  } = useSessionsData(user?.uid);

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        router.replace("/");
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, []),
  );

  if (!user || loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  const pastSessions = sessions.filter((sess) => sess.endedAt);
  const totalPages = Math.ceil(pastSessions.length / SESS_PAGE_SIZE);
  const pagedSessions = pastSessions.slice(
    sessPage * SESS_PAGE_SIZE,
    (sessPage + 1) * SESS_PAGE_SIZE,
  );

  const ScreenHeader = () => (
    <View style={s.screenHeader}>
      <Pressable style={s.backBtn} onPress={() => router.replace("/")}>
        <Ionicons name="chevron-back" size={20} color="#fff" />
      </Pressable>
      <Text style={s.screenTitle}>SESSION</Text>
      <View style={s.spacer} />
    </View>
  );

  const Divider = ({ label }: { label: string }) => (
    <View style={s.divider}>
      <View style={s.dividerLine} />
      <Text style={s.dividerText}>{label}</Text>
      <View style={s.dividerLine} />
    </View>
  );

  const Pagination = () =>
    totalPages > 1 ? (
      <View style={s.pagination}>
        <TouchableOpacity
          style={[s.pageBtn, sessPage === 0 && { opacity: 0.3 }]}
          onPress={() => setSessPage((p) => p - 1)}
          disabled={sessPage === 0}
        >
          <Text style={s.pageBtnText}>‹ PREV</Text>
        </TouchableOpacity>
        <Text style={s.pageIndicator}>
          {sessPage + 1} / {totalPages}
        </Text>
        <TouchableOpacity
          style={[s.pageBtn, sessPage === totalPages - 1 && { opacity: 0.3 }]}
          onPress={() => setSessPage((p) => p + 1)}
          disabled={sessPage === totalPages - 1}
        >
          <Text style={s.pageBtnText}>NEXT ›</Text>
        </TouchableOpacity>
      </View>
    ) : null;

  return (
    <ScrollView
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader />

      {activeSession ? (
        <>
          <LiveDot />

          <View style={s.sessionCard}>
            <View style={s.cardTopBorder} />
            <Text style={s.sessionStarted}>
              Started {formatTime(activeSession.createdAt)} ·{" "}
              {timeAgo(activeSession.createdAt)}
            </Text>
            <View style={s.statGrid}>
              <View style={[s.statBox, s.statBoxAccent]}>
                <Text style={[s.statNum, s.statNumAccent]}>
                  {stats.totalMatches}
                </Text>
                <Text style={s.statLbl}>MATCHES</Text>
              </View>
              <View style={[s.statBox, s.statBoxAccent]}>
                <Text style={[s.statNum, s.statNumAccent]}>
                  {stats.totalKills}
                </Text>
                <Text style={s.statLbl}>KILLS</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statNum}>
                  {stats.averagePlacement.toFixed(1)}
                </Text>
                <Text style={s.statLbl}>AVG PLACE</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statNum}>{stats.wins}</Text>
                <Text style={s.statLbl}>WINS</Text>
              </View>
            </View>
            <MentalBar value={stats.averageMental} />
          </View>

          <View style={s.btnRow}>
            <Pressable
              style={s.btnContinue}
              onPress={() =>
                router.push({
                  pathname: "/add-match",
                  params: { sessionId: activeSession.id as string },
                })
              }
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={s.btnContinueText}>ADD MATCH</Text>
            </Pressable>
            <Pressable style={s.btnEnd} onPress={handleEndSession}>
              <Ionicons name="stop-circle-outline" size={18} color={GREEN} />
              <Text style={s.btnEndText}>END</Text>
            </Pressable>
          </View>

          {pastSessions.length > 0 && (
            <>
              <Divider label="PAST SESSIONS" />
              {pagedSessions.map((s) => (
                <PastSessionRow key={s.id} session={s} />
              ))}
              <Pagination />
            </>
          )}
        </>
      ) : (
        <>
          <StormEye />
          <Text style={s.emptyHeadline}>Ready to{"\n"}Drop In?</Text>
          <Text style={s.emptySub}>No active session · Start tracking</Text>

          {lifetimeSessions > 0 && (
            <View style={s.quickStatsRow}>
              <View style={s.qsCard}>
                <Text style={s.qsVal}>{lifetimeSessions}</Text>
                <Text style={s.qsLbl}>SESSIONS</Text>
              </View>
              <View style={s.qsCard}>
                <Text style={s.qsVal}>{lifetimeMatches}</Text>
                <Text style={s.qsLbl}>MATCHES</Text>
              </View>
              <View style={s.qsCard}>
                <Text style={s.qsVal}>
                  {lifetimeKills >= 1000
                    ? `${(lifetimeKills / 1000).toFixed(1)}k`
                    : lifetimeKills}
                </Text>
                <Text style={s.qsLbl}>KILLS</Text>
              </View>
            </View>
          )}

          <Pressable style={s.startBtn} onPress={handleStartSession}>
            <View style={s.startBtnIconWrap}>
              <Ionicons name="play" size={18} color={PURPLE} />
            </View>
            <Text style={s.startBtnText}>START NEW SESSION</Text>
            <Ionicons name="chevron-forward" size={18} color="#ffffff30" />
          </Pressable>

          {pastSessions.length > 0 && (
            <>
              <Divider label="RECENT" />
              {pagedSessions.map((sess) => (
                <PastSessionRow key={sess.id} session={sess} />
              ))}
              <Pagination />
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PURPLE = "#8b5cf6";
const GREEN = "#22c55e";
const BG = "#0d0d14";
const CARD_BG = "#0f0f1a";
const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: BG,
    padding: 20,
    paddingTop: 34,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG,
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 10,
  },

  spacer: { width: 36, height: 36 },
  backArrow: { color: "#fff", fontSize: 18, lineHeight: 20 },
  screenTitle: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 18,
    letterSpacing: 3,
  },
  sessionCard: {
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
    opacity: 0.7,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  sessionStarted: {
    color: "#555",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 16,
  },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: INNER_BG,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#16162a",
  },
  statBoxAccent: { borderColor: "rgba(139,92,246,0.3)" },
  statNum: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 34,
    marginBottom: 4,
  },
  statNumAccent: { color: "#a78bfa" },
  statLbl: {
    color: "#555",
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  btnRow: { flexDirection: "row", gap: 10 },
  emptyHeadline: {
    color: "#fff",
    fontSize: 28,
    fontFamily: "BurbankBlack",
    letterSpacing: 2,
    textAlign: "center",
    lineHeight: 32,
    textTransform: "uppercase",
  },
  emptySub: {
    color: "#555",
    fontSize: 12,
    letterSpacing: 1,
    textAlign: "center",
  },
  quickStatsRow: { flexDirection: "row", gap: 10 },
  qsCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  qsVal: { color: PURPLE, fontSize: 20, fontWeight: "700", marginBottom: 3 },
  qsLbl: { color: "#555", fontSize: 9, letterSpacing: 1.5, fontWeight: "600" },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#1e1e2e" },
  dividerText: {
    color: "#444",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "600",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageBtn: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  pageBtnText: {
    color: "#555",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  pageIndicator: {
    color: "#444",
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "600",
  },
  // Back button — remove text arrow style, chevron handles it now
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

  // ADD MATCH button — icon + text row
 btnContinue: {
  flex: 2,
  backgroundColor: PURPLE + "28",
  borderRadius: 12,
  paddingVertical: 15,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  borderWidth: 1,
  borderColor: PURPLE + "70",
},
  btnContinueText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },

  // END button — icon + text row
  btnEnd: {
    flex: 1,
    borderWidth: 1,
    borderColor: GREEN + "50",
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: GREEN + "10",
  },
  btnEndText: {
    color: GREEN,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },

  // START button — matches Sessions tile on home
  startBtn: {
  backgroundColor: "#1a1228",
  borderRadius: 14,
  height: 72,
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 18,
  borderWidth: 1,
  borderColor: PURPLE + "80",
  overflow: "hidden",
},
  startBtnIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PURPLE + "18",
    borderWidth: 1,
    borderColor: PURPLE + "30",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "BurbankBlack",
    letterSpacing: 2,
    flex: 1,
  },

});
