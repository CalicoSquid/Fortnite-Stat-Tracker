import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { v4 as uuid } from "uuid";
import { Match } from "../types/match";
import { updateSessionStats } from "./statService";

export const addMatchToSession = async (
  sessionId: string,
  matchData: Omit<Match, "id" | "sessionId">
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const matchId = uuid();

  const matchRef = doc(
    db,
    "users",
    user.uid,
    "matches",
    matchId
  );

  const newMatch: Match = {
    sessionId,
    ...matchData,
  };

  await setDoc(matchRef, {
    ...newMatch,
    date: new Date(),
  });

  await updateSessionStats(sessionId);

  return matchId;
};

export const getMatchesBySession = async (
  sessionId: string
): Promise<Match[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const matchesRef = collection(
    db,
    "users",
    user.uid,
    "matches"
  );

  const q = query(matchesRef, where("sessionId", "==", sessionId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
    date: docSnap.data().date.toDate(),
  })) as Match[];
};
