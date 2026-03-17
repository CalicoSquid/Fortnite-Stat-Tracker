import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { AnalyticsMatch, AnalyticsSession } from "@/constants/analytics";

export function useViewData(uid: string | undefined) {
  const [matches, setMatches] = useState<AnalyticsMatch[]>([]);
  const [sessions, setSessions] = useState<AnalyticsSession[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Real-time matches listener ──
  useEffect(() => {
    if (!uid) return;
    const matchesRef = collection(db, "users", uid, "matches");
    const q = query(matchesRef, orderBy("date", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setMatches(
          snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as unknown as AnalyticsMatch,
          ),
        );
      },
      (err) => console.error("ViewData matches error:", err),
    );
    return () => unsub();
  }, [uid]);

  // ── One-time sessions fetch ──
  useEffect(() => {
    if (!uid) return;
    const loadSessions = async () => {
      try {
        const sessionsRef = collection(db, "users", uid, "sessions");
        const q = query(sessionsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        setSessions(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              createdAt: (data.createdAt as Timestamp).toDate(),
              endedAt: data.endedAt
                ? (data.endedAt as Timestamp).toDate()
                : null,
              totalKills: data.totalKills ?? 0,
              totalMatches: data.totalMatches ?? 0,
              averagePlacement: data.averagePlacement ?? 0,
              averageMental: data.averageMental ?? 0,
              wins: data.wins ?? 0,
              winPercentage: data.winPercentage ?? 0,
              startingMental: data.startingMental ?? undefined,
            };
          }),
        );
      } catch (err) {
        console.error("ViewData sessions error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, [uid]);

  return { matches, sessions, loading };
}
