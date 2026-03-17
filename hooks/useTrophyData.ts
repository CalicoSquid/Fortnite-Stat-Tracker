import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Match {
  date: string | Timestamp;
  mode: string;
  placement: number;
  kills: number;
  skinId: string;
  mentalState: number;
  notes: string;
  sessionId: string;
}

export interface Session {
  id: string;
  createdAt: Date;
  endedAt: Date | null;
  totalKills: number;
  totalMatches: number;
  averagePlacement: number;
  averageMental: number;
  wins: number;
  winPercentage: number;
}

interface UseTrophyDataResult {
  matches: Match[];
  sessions: Session[];
  loading: boolean;
}

export function useTrophyData(uid: string | undefined): UseTrophyDataResult {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Matches — real-time listener ──
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "users", uid, "matches"),
      orderBy("date", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setMatches(snap.docs.map((d) => d.data() as Match));
    });
    return () => unsub();
  }, [uid]);

  // ── Sessions — one-time fetch ──
  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, "users", uid, "sessions"),
            orderBy("createdAt", "desc"),
          ),
        );
        setSessions(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
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
            };
          }),
        );
      } catch (e) {
        console.error("[useTrophyData] sessions fetch failed:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uid]);

  return { matches, sessions, loading };
}