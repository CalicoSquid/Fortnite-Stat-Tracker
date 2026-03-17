import {
  collection, query, where, getDocs, orderBy,
  updateDoc, deleteDoc, doc, Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";

const STALE_HOURS = 4;

export async function autoCloseStaleSessions(uid: string) {
  const sessionsRef = collection(db, "users", uid, "sessions");
  const openSnap = await getDocs(query(sessionsRef, where("endedAt", "==", null)));

  for (const sessionDoc of openSnap.docs) {
    const sessionId = sessionDoc.id;
    const matchesRef = collection(db, "users", uid, "matches");
    const matchSnap = await getDocs(
      query(matchesRef, where("sessionId", "==", sessionId), orderBy("date", "desc"))
    );

    // ── 0 matches → delete ──
    if (matchSnap.empty) {
      await deleteDoc(doc(db, "users", uid, "sessions", sessionId));
      continue;
    }

    // ── Check staleness ──
    const lastMatchDate = (matchSnap.docs[0].data().date as Timestamp).toDate();
    const hoursSince = (Date.now() - lastMatchDate.getTime()) / 36e5;
    if (hoursSince < STALE_HOURS) continue;

    // ── Aggregate stats from all matches ──
    const matches = matchSnap.docs.map((d) => d.data());
    const totalMatches = matches.length;
    const totalKills = matches.reduce((s, m) => s + (m.kills ?? 0), 0);
    const averagePlacement = matches.reduce((s, m) => s + (m.placement ?? 0), 0) / totalMatches;
    const averageMental = matches.reduce((s, m) => s + (m.mentalState ?? 0), 0) / totalMatches;
    const wins = matches.filter((m) => m.placement === 1).length;
    const winPercentage = (wins / totalMatches) * 100;

    await updateDoc(doc(db, "users", uid, "sessions", sessionId), {
      endedAt: matchSnap.docs[0].data().date, // Timestamp of last match
      totalMatches,
      totalKills,
      averagePlacement,
      averageMental,
      wins,
      winPercentage,
    });
  }
}