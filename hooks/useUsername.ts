import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USERNAME_KEY = "hg_username";

export function useUsername() {
  const [username, setUsername] = useState("Player");
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(USERNAME_KEY).then((val) => {
      if (val) setUsername(val);
    });
  }, []);

  const saveUsername = async () => {
    const trimmed = draftName.trim();
    if (trimmed.length > 0) {
      setUsername(trimmed);
      await AsyncStorage.setItem(USERNAME_KEY, trimmed);
    }
    setEditingName(false);
  };

  const startEditing = () => {
    setDraftName(username);
    setEditingName(true);
  };

  const cancelEditing = () => {
    setEditingName(false);
  };

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