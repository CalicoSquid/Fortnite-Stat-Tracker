import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useContext, useState } from "react";
import { db } from "../../services/firebase";
import { AuthContext } from "../../services/authProvider";
import {
  collection,
  query,
  where,
  doc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { useSessionData } from "@/hooks/useSessionData";
import SessionStatGrid from "@/components/session/SessionStatGrid";
import SessionMentalBar from "@/components/session/SessionMentalBar";
import MatchListItem from "@/components/session/MatchListItem";
import EditMatchModal from "@/components/session/EditMatchModal";
import { SkinsContext } from "@/app/_layout";
import MentalBar from "@/components/session/MentalBar";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PURPLE = "#8b5cf6";
const RED = "#ef4444";
const BG = "#0d0d14";
const CARD_BG = "#0f0f1a";
const BORDER = "#1e1e30";

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const user = useContext(AuthContext);
  const { skins } = useContext(SkinsContext);
  const [ending, setEnding] = useState(false);
  const [editingMatch, setEditingMatch] = useState<any | null>(null);
  const [matchPage, setMatchPage] = useState(0);

  const { session, matches, loading, fadeAnim, slideAnim } = useSessionData(
    user?.uid,
    sessionId,
  );

  const PAGE_SIZE = 5;
  const sortedMatches = [...matches].sort((a, b) => {
    const aTime = a.date?.toDate
      ? a.date.toDate().getTime()
      : new Date(a.date).getTime();
    const bTime = b.date?.toDate
      ? b.date.toDate().getTime()
      : new Date(b.date).getTime();
    return bTime - aTime;
  });
  const totalPages = Math.ceil(sortedMatches.length / PAGE_SIZE);
  const pagedMatches = sortedMatches.slice(
    matchPage * PAGE_SIZE,
    (matchPage + 1) * PAGE_SIZE,
  );

  const handleDeleteSession = async () => {
    if (!user || !session?.id) return;
    Alert.alert(
      "Delete Session",
      "This will permanently delete this session and all its matches. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setEnding(true);
            try {
              const matchesRef = collection(db, "users", user.uid, "matches");
              const q = query(matchesRef, where("sessionId", "==", session.id));
              const snap = await getDocs(q);
              await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
              await deleteDoc(
                doc(db, "users", user.uid, "sessions", session.id),
              );
              router.replace("/");
            } catch (err) {
              console.error("Failed to delete session:", err);
              setEnding(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={s.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={s.notFound}>Session not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: BG }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={s.screenTitle}>
            {session.createdAt
              ? new Date(session.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "SESSION"}
          </Text>
          <View style={s.spacer} />
        </View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            gap: 12,
          }}
        >
          <SessionStatGrid
            totalMatches={session.totalMatches}
            wins={session.wins}
            winPercentage={session.winPercentage}
            totalKills={session.totalKills}
            averagePlacement={session.averagePlacement}
            totalKillsPerMatch={
              session.totalKills / Math.max(1, session.totalMatches)
            }
          />

          <MentalBar value={session.averageMental} />

          {/* ── Match list ── */}
          {pagedMatches.map((m, i) => (
            <MatchListItem
              key={i}
              match={m}
              onPress={() => setEditingMatch(m)}
            />
          ))}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <View style={s.pagination}>
              <TouchableOpacity
                style={[s.pageBtn, matchPage === 0 && { opacity: 0.3 }]}
                onPress={() => setMatchPage((p) => p - 1)}
                disabled={matchPage === 0}
              >
                <Text style={s.pageBtnText}>‹ PREV</Text>
              </TouchableOpacity>
              <Text style={s.pageIndicator}>
                {matchPage + 1} / {totalPages}
              </Text>
              <TouchableOpacity
                style={[
                  s.pageBtn,
                  matchPage === totalPages - 1 && { opacity: 0.3 },
                ]}
                onPress={() => setMatchPage((p) => p + 1)}
                disabled={matchPage === totalPages - 1}
              >
                <Text style={s.pageBtnText}>NEXT ›</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Zero state ── */}
          {session.totalMatches === 0 && (
            <View style={s.zeroState}>
              <Ionicons name="game-controller-outline" size={32} color="#333" />
              <Text style={s.zeroText}>No matches yet</Text>
              <Text style={s.zeroSub}>
                Add your first match to start tracking
              </Text>
            </View>
          )}

          {/* ── Delete session ── */}
          <TouchableOpacity
            style={s.btnDelete}
            onPress={handleDeleteSession}
            disabled={ending}
          >
            <Ionicons name="trash-outline" size={15} color={RED} />
            <Text style={s.btnDeleteText}>DELETE SESSION</Text>
          </TouchableOpacity>
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {editingMatch && (
        <EditMatchModal
          match={editingMatch}
          sessionId={sessionId}
          uid={user!.uid}
          matches={matches}
          skins={skins}
          onClose={() => setEditingMatch(null)}
          onSaved={() => setEditingMatch(null)}
        />
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  notFound: { color: "#555", fontSize: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
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
  zeroState: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    gap: 8,
  },
  zeroText: {
    color: "#444",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  zeroSub: { color: "#333", fontSize: 11, textAlign: "center" },
  btnDelete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RED + "40",
  },
  btnDeleteText: {
    color: RED,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    opacity: 0.7,
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
});
