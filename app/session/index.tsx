import { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Easing,
  BackHandler,
} from "react-native";
import { Stack, router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../services/authProvider";
import { Session } from "../../types/session";
import { db } from "../../services/firebase";
import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { useRef, useCallback } from "react";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(date: Date) {
  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
}

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

// ─── Pulsing dot ─────────────────────────────────────────────────────────────

function LiveDot() {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.2, duration: 750, useNativeDriver: true, easing: Easing.ease }),
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true, easing: Easing.ease }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.liveBadge}>
      <Animated.View style={[styles.liveDot, { opacity: anim }]} />
      <Text style={styles.liveText}>LIVE SESSION</Text>
    </View>
  );
}

// ─── Storm eye ───────────────────────────────────────────────────────────────

function StormEye() {
  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const ring3 = useRef(new Animated.Value(1)).current;

  const pulseRing = (anim: Animated.Value, delay: number) =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1.06, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );

  useEffect(() => {
    pulseRing(ring1, 0).start();
    pulseRing(ring2, 400).start();
    pulseRing(ring3, 800).start();
  }, []);

  return (
    <View style={styles.stormEyeContainer}>
      <Animated.View style={[styles.stormRing, styles.ring1, { transform: [{ scale: ring1 }] }]} />
      <Animated.View style={[styles.stormRing, styles.ring2, { transform: [{ scale: ring2 }] }]} />
      <Animated.View style={[styles.stormRing, styles.ring3, { transform: [{ scale: ring3 }] }]} />
      <View style={styles.stormCore}>
        <Text style={styles.stormEmoji}>⚡</Text>
      </View>
    </View>
  );
}

// ─── Past session row ─────────────────────────────────────────────────────────

function PastSessionRow({ session }: { session: Session }) {
  return (
    <Pressable
      style={styles.pastRow}
      onPress={() =>
        router.push({
          pathname: "/session/[sessionId]",
          params: { sessionId: session.id as string },
        })
      }
    >
      <View>
        <Text style={styles.pastDate}>{formatDate(session.createdAt)}</Text>
        <Text style={styles.pastMatches}>{session.totalMatches} matches</Text>
      </View>
      <View style={styles.pastStats}>
        <View style={styles.pastStat}>
          <Text style={styles.pastStatVal}>{session.totalKills}</Text>
          <Text style={styles.pastStatLbl}>KILLS</Text>
        </View>
        <View style={styles.pastStat}>
          <Text style={styles.pastStatVal}>{session.averagePlacement.toFixed(1)}</Text>
          <Text style={styles.pastStatLbl}>AVG</Text>
        </View>
        <View style={styles.pastStat}>
          <Text style={styles.pastStatVal}>{session.wins ?? 0}</Text>
          <Text style={styles.pastStatLbl}>WINS</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Mental State Bar ─────────────────────────────────────────────────────────

function MentalBar({ value }: { value: number }) {
  const fillPercent = (value / 10) * 100;
  return (
    <View style={styles.mentalWrap}>
      <View style={styles.mentalLabelRow}>
        <Text style={styles.mentalLabel}>MENTAL STATE</Text>
        <Text style={styles.mentalVal}>{value.toFixed(1)} / 10</Text>
      </View>
      <View style={styles.mentalTrack}>
        <LinearGradient
          colors={["#ef4444", "#f59e0b", "#22c55e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.mentalFill, { width: `${fillPercent}%` }]}
        />
      </View>
      <View style={styles.mentalEndLabels}>
        <Text style={styles.mentalEndLbl}>Tilted</Text>
        <Text style={styles.mentalEndLbl}>Locked In</Text>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SessionsOverview() {
  const user = useContext(AuthContext);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [stats, setStats] = useState({
    totalMatches: 0,
    totalKills: 0,
    averagePlacement: 0,
    averageMental: 0,
    wins: 0,
  });
  const [loading, setLoading] = useState(true);

  const getSessionDocRef = (sessionId: string) =>
    doc(db, "users", user!.uid, "sessions", sessionId);

  // ── Intercept Android hardware back → always go home, never stack ──
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        router.replace("/");
        return true; // prevent default back behavior
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, [])
  );

  // Load sessions
  useEffect(() => {
    if (!user) return;
    const loadSessions = async () => {
      setLoading(true);
      try {
        const sessionsRef = collection(db, "users", user.uid, "sessions");
        const q = query(sessionsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const allSessions: Session[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            createdAt: (data.createdAt as Timestamp).toDate(),
            endedAt: data.endedAt ? (data.endedAt as Timestamp).toDate() : null,
            totalKills: data.totalKills ?? 0,
            totalMatches: data.totalMatches ?? 0,
            averagePlacement: data.averagePlacement ?? 0,
            averageMental: data.averageMental ?? 0,
            wins: data.wins ?? 0,
            winPercentage: data.winPercentage ?? 0,
          };
        });
        setSessions(allSessions);
        setActiveSession(allSessions.find((s) => !s.endedAt) || null);
      } catch (err) {
        console.error("Failed to load sessions", err);
      }
      setLoading(false);
    };
    loadSessions();
  }, [user]);

  // Live match listener
  useEffect(() => {
    if (!user || !activeSession) return;
    const matchesRef = collection(db, "users", user.uid, "matches");
    const q = query(matchesRef, where("sessionId", "==", activeSession.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matches = snapshot.docs.map((d) => d.data() as any);
      const totalMatches = matches.length;
      const totalKills = matches.reduce((s, m) => s + (m.kills || 0), 0);
      const averagePlacement =
        matches.reduce((s, m) => s + (m.placement || 0), 0) / (totalMatches || 1);
      const averageMental =
        matches.reduce((s, m) => s + (m.mentalState || 0), 0) / (totalMatches || 1);
      const wins = matches.filter((m) => m.placement === 1).length;
      setStats({ totalMatches, totalKills, averagePlacement, averageMental, wins });
    });
    return () => unsubscribe();
  }, [user, activeSession]);

  // Lifetime totals
  const lifetimeSessions = sessions.length;
  const lifetimeMatches = sessions.reduce((s, sess) => s + sess.totalMatches, 0);
  const lifetimeKills = sessions.reduce((s, sess) => s + sess.totalKills, 0);

  const handleStartSession = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const sessionsRef = collection(db, "users", user.uid, "sessions");
      const docRef = await addDoc(sessionsRef, {
        createdAt: new Date(),
        endedAt: null,
        totalKills: 0,
        totalMatches: 0,
        totalPlacement: 0,
        totalMental: 0,
        averagePlacement: 0,
        averageMental: 0,
        wins: 0,
        winPercentage: 0,
      });
      const newSession: Session = {
        id: docRef.id,
        createdAt: new Date(),
        endedAt: null,
        totalKills: 0,
        wins: 0,
        winPercentage: 0,
        totalMatches: 0,
        averagePlacement: 0,
        averageMental: 0,
      };
      setActiveSession(newSession);
      setSessions([newSession, ...sessions]);
    } catch (err) {
      console.error("Failed to start session", err);
    }
    setLoading(false);
  };

  const handleEndSession = async () => {
    if (!activeSession || !user || !activeSession.id) return;
    setLoading(true);
    try {
      await updateDoc(getSessionDocRef(activeSession.id), {
        endedAt: new Date(),
        totalKills: stats.totalKills,
        totalMatches: stats.totalMatches,
        averagePlacement: stats.averagePlacement,
        averageMental: stats.averageMental,
        wins: stats.wins,
        winPercentage:
          stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0,
      });
      setActiveSession(null);
      setStats({ totalMatches: 0, totalKills: 0, averagePlacement: 0, averageMental: 0, wins: 0 });
      router.replace("/");
    } catch (err) {
      console.error("Failed to end session", err);
    }
    setLoading(false);
  };

  if (!user || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  const pastSessions = sessions.filter((s) => s.endedAt);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {activeSession ? (
        <>
          {/* ── Screen header ── */}
          <View style={styles.screenHeader}>
            <Pressable style={styles.backBtn} onPress={() => router.replace("/")}>
              <Text style={styles.backArrow}>←</Text>
            </Pressable>
            <Text style={styles.screenTitle}>SESSION</Text>
            <View style={styles.spacer} />
          </View>

          <LiveDot />

          <View style={styles.sessionCard}>
            <View style={styles.cardTopBorder} />
            <Text style={styles.sessionStarted}>
              Started {formatTime(activeSession.createdAt)} · {timeAgo(activeSession.createdAt)}
            </Text>

            <View style={styles.statGrid}>
              <View style={[styles.statBox, styles.statBoxAccent]}>
                <Text style={[styles.statNum, styles.statNumAccent]}>{stats.totalMatches}</Text>
                <Text style={styles.statLbl}>MATCHES</Text>
              </View>
              <View style={[styles.statBox, styles.statBoxAccent]}>
                <Text style={[styles.statNum, styles.statNumAccent]}>{stats.totalKills}</Text>
                <Text style={styles.statLbl}>KILLS</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{stats.averagePlacement.toFixed(1)}</Text>
                <Text style={styles.statLbl}>AVG PLACE</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{stats.wins}</Text>
                <Text style={styles.statLbl}>WINS</Text>
              </View>
            </View>

            <MentalBar value={stats.averageMental} />
          </View>

          <View style={styles.btnRow}>
            <Pressable
              style={styles.btnContinue}
              onPress={() =>
                router.push({
                  pathname: "/add-match",
                  params: { sessionId: activeSession.id as string },
                })
              }
            >
              <Text style={styles.btnContinueText}>▶  ADD MATCH</Text>
            </Pressable>
            <Pressable style={styles.btnEnd} onPress={handleEndSession}>
              <Text style={styles.btnEndText}>END</Text>
            </Pressable>
          </View>

          {pastSessions.length > 0 && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>PAST SESSIONS</Text>
                <View style={styles.dividerLine} />
              </View>
              {pastSessions.slice(0, 5).map((s) => (
                <PastSessionRow key={s.id} session={s} />
              ))}
            </>
          )}
        </>
      ) : (
        <>
          {/* ── Screen header ── */}
          <View style={styles.screenHeader}>
            <Pressable style={styles.backBtn} onPress={() => router.replace("/")}>
              <Text style={styles.backArrow}>←</Text>
            </Pressable>
            <Text style={styles.screenTitle}>SESSION</Text>
            <View style={styles.spacer} />
          </View>

          <StormEye />

          <Text style={styles.emptyHeadline}>Ready to{"\n"}Drop In?</Text>
          <Text style={styles.emptySub}>No active session · Start tracking</Text>

          {lifetimeSessions > 0 && (
            <View style={styles.quickStatsRow}>
              <View style={styles.qsCard}>
                <Text style={styles.qsVal}>{lifetimeSessions}</Text>
                <Text style={styles.qsLbl}>SESSIONS</Text>
              </View>
              <View style={styles.qsCard}>
                <Text style={styles.qsVal}>{lifetimeMatches}</Text>
                <Text style={styles.qsLbl}>MATCHES</Text>
              </View>
              <View style={styles.qsCard}>
                <Text style={styles.qsVal}>
                  {lifetimeKills >= 1000
                    ? `${(lifetimeKills / 1000).toFixed(1)}k`
                    : lifetimeKills}
                </Text>
                <Text style={styles.qsLbl}>KILLS</Text>
              </View>
            </View>
          )}

          <Pressable style={styles.startBtn} onPress={handleStartSession}>
            <Text style={styles.startBtnEmoji}>🪂</Text>
            <Text style={styles.startBtnText}>START NEW SESSION</Text>
          </Pressable>

          {pastSessions.length > 0 && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>RECENT</Text>
                <View style={styles.dividerLine} />
              </View>
              {pastSessions.slice(0, 5).map((s) => (
                <PastSessionRow key={s.id} session={s} />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PURPLE = "#8b5cf6";
const PURPLE_DARK = "#7c3aed";
const GREEN = "#22c55e";
const BG = "#0d0d14";
const CARD_BG = "#0f0f1a";
const INNER_BG = "#0a0a12";
const BORDER = "#1e1e30";

const styles = StyleSheet.create({
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

  // ── Screen header ──
  screenHeader: {
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
  spacer: {
    width: 36,
    height: 36, 
  },
  backArrow: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 20,
  },
  screenTitle: {
    color: "#fff",
    fontFamily: "BurbankBlack",
    fontSize: 18,
    letterSpacing: 3,
  },

  // ── Live badge ──
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  liveText: {
    color: GREEN,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: "700",
  },

  // ── Session card ──
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
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: INNER_BG,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#16162a",
  },
  statBoxAccent: {
    borderColor: "rgba(139,92,246,0.3)",
  },
  statNum: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 34,
    marginBottom: 4,
  },
  statNumAccent: {
    color: "#a78bfa",
  },
  statLbl: {
    color: "#555",
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "600",
  },

  // ── Mental bar ──
  mentalWrap: { marginTop: 16 },
  mentalLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  mentalLabel: { color: "#555", fontSize: 10, letterSpacing: 2, fontWeight: "600" },
  mentalVal: { color: PURPLE, fontSize: 12, fontWeight: "700" },
  mentalTrack: {
    height: 5,
    backgroundColor: "#1a1a28",
    borderRadius: 3,
    overflow: "hidden",
  },
  mentalFill: {
    height: "100%",
    borderRadius: 3,
  },
  mentalEndLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  mentalEndLbl: { color: "#444", fontSize: 9, letterSpacing: 1 },

  // ── Buttons ──
  btnRow: { flexDirection: "row", gap: 10 },
  btnContinue: {
    flex: 2,
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: PURPLE,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  btnContinueText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
  btnEnd: {
    flex: 1,
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  btnEndText: {
    color: GREEN,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },

  // ── Storm eye ── (smaller core)
  stormEyeContainer: {
    width: 130,
    height: 130,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  stormRing: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 1,
  },
  ring1: { width: 130, height: 130, borderColor: "rgba(139,92,246,0.12)" },
  ring2: { width: 94,  height: 94,  borderColor: "rgba(139,92,246,0.22)" },
  ring3: { width: 62,  height: 62,  borderColor: "rgba(139,92,246,0.38)" },
  stormCore: {
    width: 38,           // ← was 52
    height: 38,
    borderRadius: 19,
    backgroundColor: PURPLE_DARK,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PURPLE,
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  stormEmoji: { fontSize: 17 }, // ← was 22

  // ── Empty state text ──
  emptyHeadline: {
    color: "#fff",
    fontSize: 28,           // ← was 32
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

  // ── Quick stats ──
  quickStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  qsCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  qsVal: {
    color: PURPLE,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 3,
  },
  qsLbl: {
    color: "#555",
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "600",
  },

  // ── Start button ──
  startBtn: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: PURPLE,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  startBtnEmoji: { fontSize: 18 },
  startBtnText: {
    color: "#fff",
    fontSize: 22,           // ← was 25
    fontFamily: "BurbankBlack",
    letterSpacing: 3,
  },

  // ── Divider ──
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#1e1e2e" },
  dividerText: { color: "#444", fontSize: 10, letterSpacing: 2, fontWeight: "600" },

  // ── Past session rows ──
  pastRow: {
    backgroundColor: CARD_BG,
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a1a28",
  },
  pastDate: { color: "#888", fontSize: 12, letterSpacing: 1, marginBottom: 3 },
  pastMatches: { color: "#444", fontSize: 10, letterSpacing: 0.5 },
  pastStats: { flexDirection: "row", gap: 16 },
  pastStat: { alignItems: "flex-end" },
  pastStatVal: { color: "#fff", fontSize: 15, fontWeight: "700" },
  pastStatLbl: { color: "#444", fontSize: 9, letterSpacing: 1.5, fontWeight: "600" },
});