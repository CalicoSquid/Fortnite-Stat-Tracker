import { useEffect, useState, useRef } from "react";
import { Animated } from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/services/firebase";

export function useSessionData(uid: string | undefined, sessionId: string) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!uid || !sessionId) return;

    const matchesRef = collection(db, "users", uid, "matches");
    const q = query(matchesRef, where("sessionId", "==", sessionId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const m = snapshot.docs.map((doc) => doc.data() as any);
      setMatches(m);

      const totalMatches = m.length;
      const totalKills = m.reduce((sum, x) => sum + (x.kills ?? 0), 0);
      const averagePlacement = totalMatches
        ? m.reduce((sum, x) => sum + (x.placement ?? 0), 0) / totalMatches
        : 0;
      const averageMental = totalMatches
        ? m.reduce((sum, x) => sum + (x.mentalState ?? 5), 0) / totalMatches
        : 0;
      const wins = m.filter((x) => x.placement === 1).length;
      const winPercentage = totalMatches ? (wins / totalMatches) * 100 : 0;

      setSession({
        id: sessionId,
        createdAt: m[0]?.date
          ? m[0].date?.toDate
            ? m[0].date.toDate()
            : new Date(m[0].date)
          : new Date(),
        endedAt: null,
        totalMatches,
        totalKills,
        averagePlacement,
        averageMental,
        wins,
        winPercentage,
      });

      setLoading(false);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    },
    (err) => {
      console.error("Snapshot error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid, sessionId]);

  return { session, matches, loading, fadeAnim, slideAnim };
}