import { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Stack, router } from "expo-router";
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

export default function SessionsOverview() {
  const user = useContext(AuthContext);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [stats, setStats] = useState({
    totalMatches: 0,
    totalKills: 0,
    averagePlacement: 0,
    averageMental: 0,
  });
  const [loading, setLoading] = useState(true);

  const getSessionDocRef = (sessionId: string) =>
    doc(db, "users", user!.uid, "sessions", sessionId);

  // Load sessions list
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
        const active = allSessions.find((s) => !s.endedAt);
        setActiveSession(active || null);
      } catch (err) {
        console.error("Failed to load sessions", err);
      }
      setLoading(false);
    };

    loadSessions();
  }, [user]);

  // Listen to matches in real-time
  useEffect(() => {
    if (!user || !activeSession) return;

    const matchesRef = collection(db, "users", user.uid, "matches");
    const q = query(matchesRef, where("sessionId", "==", activeSession.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matches = snapshot.docs.map((doc) => doc.data() as any);

      const totalMatches = matches.length;
      const totalKills = matches.reduce((sum, m) => sum + (m.kills || 0), 0);
      const averagePlacement =
        matches.reduce((sum, m) => sum + (m.placement || 0), 0) / (totalMatches || 1);
      const averageMental =
        matches.reduce((sum, m) => sum + (m.mentalState || 0), 0) / (totalMatches || 1);

      setStats({ totalMatches, totalKills, averagePlacement, averageMental });
    });

    return () => unsubscribe();
  }, [user, activeSession]);

  // Start a new session
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
        averagePlacement: 0,
        averageMental: 0,
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

      router.push({
        pathname: "/session/[sessionId]",
        params: { sessionId: docRef.id },
      });
    } catch (err) {
      console.error("Failed to start session", err);
    }
    setLoading(false);
  };

  // End session
  const handleEndSession = async () => {
    if (!activeSession || !user || !activeSession.id) return;
    setLoading(true);
    try {
      const sessionRef = getSessionDocRef(activeSession.id);
      await updateDoc(sessionRef, { endedAt: new Date() });
      setActiveSession(null);
      setStats({ totalMatches: 0, totalKills: 0, averagePlacement: 0, averageMental: 0,});
      router.push("/");
    } catch (err) {
      console.error("Failed to end session", err);
    }
    setLoading(false);
  };

  if (!user || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Stack.Screen options={{ title: "" }} />

      {activeSession ? (
        <View style={{ gap: 20 }}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/session/[sessionId]",
                params: { sessionId: activeSession.id as string },
              })
            }
          >
            <View style={styles.activeSessionCard}>
              <Text style={styles.cardTitle}>Active Session</Text>
              <Text style={styles.cardText}>
                Started: {activeSession.createdAt.toLocaleString()}
              </Text>
              <Text style={styles.cardText}>Matches: {stats.totalMatches}</Text>
              <Text style={styles.cardText}>Kills: {stats.totalKills}</Text>
              <Text style={styles.cardText}>
                Avg Placement: {stats.averagePlacement.toFixed(2)}
              </Text>
              <Text style={styles.cardText}>
                Avg Mental: {stats.averageMental.toFixed(2)}
              </Text>
            </View>
          </Pressable>

          <Pressable style={styles.endButton} onPress={handleEndSession}>
            <Text style={styles.buttonText}>End Current Session</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.startButton} onPress={handleStartSession}>
          <Text style={styles.startButtonText}>Start New Session</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#111",
    gap: 20,
  },
  activeSessionCard: {
    backgroundColor: "#1a1a24",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1,
    borderColor: "#32CD32",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  cardText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 6,
  },
  startButton: {
    backgroundColor: "#8b5cf6",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  endButton: {
    backgroundColor: "#32CD32",
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#32CD32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: "#111",
    fontWeight: "bold",
    fontSize: 16,
  },
});
