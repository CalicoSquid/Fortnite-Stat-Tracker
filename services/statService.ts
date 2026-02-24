import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";

export const updateSessionStats = async (sessionId: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const matchesRef = collection(
    db,
    "users",
    user.uid,
    "matches"
  );

  const q = query(matchesRef, where("sessionId", "==", sessionId));
  const snapshot = await getDocs(q);

  const matches = snapshot.docs.map((doc) => doc.data());

  const totalMatches = matches.length;
  const totalKills = matches.reduce((sum, m) => sum + m.kills, 0);

  const averagePlacement =
    totalMatches === 0
      ? 0
      : matches.reduce((sum, m) => sum + m.placement, 0) /
        totalMatches;

  const averageMental =
    totalMatches === 0
      ? 0
      : matches.reduce((sum, m) => sum + m.mentalState, 0) /
        totalMatches;

  const sessionRef = doc(
    db,
    "users",
    user.uid,
    "sessions",
    sessionId
  );

  await updateDoc(sessionRef, {
    totalMatches,
    totalKills,
    averagePlacement: Number(averagePlacement.toFixed(2)),
    averageMental: Number(averageMental.toFixed(2)),
  });
};
