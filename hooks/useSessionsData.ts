import { useContext, useEffect, useState, useCallback } from "react";
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
import { db } from "@/services/firebase";
import { Session } from "@/types/session";

export function useSessionsData(uid: string | undefined) {
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

  // ── Load sessions ──
  useEffect(() => {
    if (!uid) return;
    const loadSessions = async () => {
      setLoading(true);
      try {
        const sessionsRef = collection(db, "users", uid, "sessions");
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
  }, [uid]);

  // ── Live match listener for active session ──
  useEffect(() => {
    if (!uid || !activeSession) return;
    const matchesRef = collection(db, "users", uid, "matches");
    const q = query(matchesRef, where("sessionId", "==", activeSession.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matches = snapshot.docs.map((d) => d.data() as any);
      const totalMatches = matches.length;
      const totalKills = matches.reduce((s, m) => s + (m.kills || 0), 0);
      const averagePlacement =
        matches.reduce((s, m) => s + (m.placement || 0), 0) /
        (totalMatches || 1);
      const averageMental =
        matches.reduce((s, m) => s + (m.mentalState || 0), 0) /
        (totalMatches || 1);
      const wins = matches.filter((m) => m.placement === 1).length;
      setStats({
        totalMatches,
        totalKills,
        averagePlacement,
        averageMental,
        wins,
      });
    });
    return () => unsubscribe();
  }, [uid, activeSession]);

  // ── Start session ──
  const handleStartSession = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const sessionsRef = collection(db, "users", uid, "sessions");
      const docRef = await addDoc(sessionsRef, {
        createdAt: new Date(),
        endedAt: null,
        totalKills: 0,
        totalMatches: 0,
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
      setSessions((prev) => [newSession, ...prev]);
    } catch (err) {
      console.error("Failed to start session", err);
    }
    setLoading(false);
  };

  // ── End session ──
  const handleEndSession = async () => {
    if (!uid || !activeSession?.id) return;
    setLoading(true);
    try {
      const endedAt = new Date();
      await updateDoc(doc(db, "users", uid, "sessions", activeSession.id), {
        endedAt,
        totalKills: stats.totalKills,
        totalMatches: stats.totalMatches,
        averagePlacement: stats.averagePlacement,
        averageMental: stats.averageMental,
        wins: stats.wins,
        winPercentage:
          stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0,
      });

      // ── Update the session in local state so list reflects immediately ──
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                endedAt,
                totalKills: stats.totalKills,
                totalMatches: stats.totalMatches,
                averagePlacement: stats.averagePlacement,
                averageMental: stats.averageMental,
                wins: stats.wins,
                winPercentage:
                  stats.totalMatches > 0
                    ? (stats.wins / stats.totalMatches) * 100
                    : 0,
              }
            : s,
        ),
      );

      setActiveSession(null);
      setStats({
        totalMatches: 0,
        totalKills: 0,
        averagePlacement: 0,
        averageMental: 0,
        wins: 0,
      });
    } catch (err) {
      console.error("Failed to end session", err);
    }
    setLoading(false);
  };

  const lifetimeSessions = sessions.length;
  const lifetimeMatches = sessions.reduce(
    (s, sess) => s + sess.totalMatches,
    0,
  );
  const lifetimeKills = sessions.reduce((s, sess) => s + sess.totalKills, 0);

  return {
    sessions,
    activeSession,
    stats,
    loading,
    lifetimeSessions,
    lifetimeMatches,
    lifetimeKills,
    handleStartSession,
    handleEndSession,
  };
}
