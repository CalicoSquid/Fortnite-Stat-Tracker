import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { db } from "../../services/firebase";
import { AuthContext } from "../../services/authProvider";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { Session } from "../../types/session";

export default function SessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const user = useContext(AuthContext);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !sessionId) return;

    const matchesRef = collection(db, "users", user.uid, "matches");
    const q = query(matchesRef, where("sessionId", "==", sessionId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matches = snapshot.docs.map((doc) => doc.data() as any);

        const totalMatches = matches.length;
        const totalKills = matches.reduce((sum, m) => sum + m.kills, 0);
        const averagePlacement = matches.reduce((sum, m) => sum + m.placement, 0) / (totalMatches || 1);
        const averageMental = matches.reduce((sum, m) => sum + m.mentalState, 0) / (totalMatches || 1);

        const wins = matches.filter((m) => m.placement === 1).length;
        const winPercentage = totalMatches ? (wins / totalMatches) * 100 : 0;

        setSession({
          id: sessionId,
          createdAt: matches[0]?.date || new Date(),
          endedAt: null,
          totalMatches,
          totalKills,
          averagePlacement,
          averageMental,
          wins,
          winPercentage,
        });

        setLoading(false);
      },
      (error) => {
        console.error("Snapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, sessionId]);

  const handleEndSession = async () => {
    if (!user || !session?.id) return;
    try {
      const sessionRef = doc(db, "users", user.uid, "sessions", session.id);
      await updateDoc(sessionRef, { endedAt: new Date() });
      router.push("/"); // go back to sessions overview
    } catch (err) {
      console.error("Failed to end session:", err);
    }
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );

  if (!session)
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Session not found.</Text>
      </View>
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: "" }} />

      <View style={styles.card}>
        <Text style={styles.title}>Session Stats</Text>
        <Text style={styles.stat}>Total Matches: {session.totalMatches}</Text>
        <Text style={styles.stat}>Wins: {session.wins ?? 0}</Text>
        <Text style={styles.stat}>Win %: {(session.winPercentage ?? 0).toFixed(1)}%</Text>
        <Text style={styles.stat}>Total Kills: {session.totalKills}</Text>
        <Text style={styles.stat}>Avg Placement: {session.averagePlacement.toFixed(2)}</Text>
        <Text style={styles.stat}>Avg Mental: {session.averageMental.toFixed(2)}</Text>
      </View>

      <Pressable
        style={styles.addButton}
        onPress={() => router.replace(`/add-match?sessionId=${session.id}`)}
      >
        <Text style={styles.addButtonText}>Add Match</Text>
      </Pressable>

      <Pressable
        style={styles.endButton}
        onPress={handleEndSession}
      >
        <Text style={styles.endButtonText}>End Session</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#111",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  text: {
    color: "#fff",
    fontSize: 18,
  },
  card: {
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    color: "#8b5cf6",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },
  stat: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  endButton: {
    backgroundColor: "#32CD32",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  endButtonText: {
    color: "#111",
    fontWeight: "bold",
    fontSize: 18,
  },
});
