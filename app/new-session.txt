import { useContext, useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { AuthContext, useAuth } from "../services/authProvider";
import { Session } from "../types/session";
import { Match } from "../types/match";

export default function SessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("SessionScreen mounted", { user, sessionId });

    if (!user || !sessionId) return;

    // Session listener
    const sessionRef = doc(db, "users", user.uid, "sessions", sessionId);
    const unsubscribeSession = onSnapshot(
      sessionRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSession({
            id: docSnap.id,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            endedAt: data.endedAt?.toDate ? data.endedAt.toDate() : null,
            totalKills: data.totalKills || 0,
            totalMatches: data.totalMatches || 0,
            averagePlacement: data.averagePlacement || 0,
            averageMental: data.averageMental || 0,
            wins: data.wins || 0,
            winPercentage: data.winPercentage || 0,
          });
        } else {
          setSession(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching session:", err);
        setLoading(false);
      }
    );

    // Matches listener
    const matchesRef = collection(db, "users", user.uid, "matches");
    const matchesQuery = query(matchesRef, where("sessionId", "==", sessionId));
    const unsubscribeMatches = onSnapshot(
      matchesQuery,
      (snapshot) => {
        const matchData: Match[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            sessionId: data.sessionId,
            date: data.date?.toDate ? data.date.toDate() : new Date(),
            mode: data.mode || "Unknown",
            placement: data.placement || 0,
            kills: data.kills || 0,
            mentalState: data.mentalState || 0,
            skinId: data.skinId || "Unknown",
            notes: data.notes || "",
          };
        });
        setMatches(matchData);
      },
      (err) => {
        console.error("Error fetching matches:", err);
      }
    );

    return () => {
      unsubscribeSession();
      unsubscribeMatches();
    };
  }, [user, sessionId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111" }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading session...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111" }}>
        <Text style={{ color: "#fff" }}>Session not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, backgroundColor: "#111" }}>
      <Text style={{ color: "#fff", fontSize: 24, marginBottom: 20 }}>Session Stats</Text>

      <Text style={{ color: "#fff" }}>Total Matches: {session.totalMatches}</Text>
      <Text style={{ color: "#fff" }}>Total Kills: {session.totalKills}</Text>
      <Text style={{ color: "#fff" }}>Avg Placement: {session.averagePlacement.toFixed(2)}</Text>
      <Text style={{ color: "#fff" }}>Avg Mental: {session.averageMental.toFixed(2)}</Text>

      <Text style={{ color: "#fff", fontSize: 20, marginTop: 30 }}>Matches</Text>

      {matches.length === 0 ? (
        <Text style={{ color: "#fff", marginTop: 10 }}>No matches yet.</Text>
      ) : (
        matches.map((m) => (
          <View key={m.id} style={{ marginTop: 10, padding: 10, backgroundColor: "#1a1a24", borderRadius: 12 }}>
            <Text style={{ color: "#fff" }}>Mode: {m.mode}</Text>
            <Text style={{ color: "#fff" }}>Kills: {m.kills}</Text>
            <Text style={{ color: "#fff" }}>Placement: {m.placement}</Text>
            <Text style={{ color: "#fff" }}>Mental: {m.mentalState}</Text>
            <Text style={{ color: "#fff" }}>Skin: {m.skinId}</Text>
            {m.notes ? <Text style={{ color: "#fff" }}>Notes: {m.notes}</Text> : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}
