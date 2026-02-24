import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Session } from "../types/session";
import { v4 as uuid } from "uuid";

export const createSession = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const sessionId = uuid();

  const sessionRef = doc(
    db,
    "users",
    user.uid,
    "sessions",
    sessionId
  );

  const newSession: Session = {
    createdAt: new Date(),
    endedAt: null,
    totalMatches: 0,
    totalKills: 0,
    averagePlacement: 0,
    averageMental: 0,
    wins: 0,
    winPercentage: 0,
  };

  await setDoc(sessionRef, newSession);

  return sessionId;
};

export const getSessions = async (): Promise<Session[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const sessionsRef = collection(
    db,
    "users",
    user.uid,
    "sessions"
  );

  const q = query(sessionsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data().createdAt.toDate(),
    endedAt: docSnap.data().endedAt
      ? docSnap.data().endedAt.toDate()
      : null,
  })) as Session[];
};

export const endSession = async (sessionId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const sessionRef = doc(
    db,
    "users",
    user.uid,
    "sessions",
    sessionId
  );

  await updateDoc(sessionRef, {
    endedAt: new Date(),
  });
};
