import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

const USERNAME_KEY = "hg_username";

export function useUsername(uid: string | undefined) {
  const [username, setUsername] = useState("Player");
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    if (!uid) return;
    const load = async () => {
      // ── Check Firestore first ──
      const profileRef = doc(db, "users", uid, "profile", "main");
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists() && profileSnap.data().username) {
        setUsername(profileSnap.data().username);
        return;
      }

      // ── One-time migration: pull from AsyncStorage → write to Firestore ──
      const local = await AsyncStorage.getItem(USERNAME_KEY);
      if (local) {
        setUsername(local);
        await setDoc(profileRef, { username: local }, { merge: true });
        await AsyncStorage.removeItem(USERNAME_KEY); // clean up
      }
    };
    load().catch(console.error);
  }, [uid]);

  const saveUsername = async () => {
    const trimmed = draftName.trim();
    if (trimmed.length > 0 && uid) {
      setUsername(trimmed);
      const profileRef = doc(db, "users", uid, "profile", "main");
      await setDoc(profileRef, { username: trimmed }, { merge: true });
    }
    setEditingName(false);
  };

  const startEditing = () => {
    setDraftName(username);
    setEditingName(true);
  };

  const cancelEditing = () => setEditingName(false);

  return {
    username,
    editingName,
    draftName,
    setDraftName,
    saveUsername,
    startEditing,
    cancelEditing,
  };
}