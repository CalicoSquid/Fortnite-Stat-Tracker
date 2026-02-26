// app/_layout.tsx
import { Stack } from "expo-router";
import { Text, Image, FlatList } from "react-native";
import { useFonts } from "expo-font";
import { AuthProvider, AuthContext } from "../services/authProvider";
import { useContext, createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./login";

// ----- SKINS CONTEXT -----
export const SkinsContext = createContext<{
  skins: Skin[];
  skinLoading: boolean;
}>({
  skins: [],
  skinLoading: true,
});

export type Skin = {
  id: string;
  name: string;
  image: string;
  rarity?: string;
  variants?: { name: string; image: string }[];
};

// ----- constants -----
const SKINS_KEY = "skins_cache";
const SKINS_LAST_FETCH = "skins_cache_date";
const SKINS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// ----- function to fetch skins -----
async function fetchSkins(): Promise<Skin[]> {
  try {
    console.log("[skins] Fetching skins from API...");
    const res = await fetch("https://fortnite-api.com/v2/cosmetics/br");
    const data = await res.json();

    if (!data?.data || !Array.isArray(data.data)) {
      console.warn("[skins] API returned no data array");
      return [];
    }

    // filter only outfits and map
    const skins: Skin[] = data.data
      .filter((item: any) => item.type?.value?.toLowerCase() === "outfit")
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        image: item.images?.icon,
        rarity: item.rarity?.value,
        variants: item.variants?.flatMap((v: any) =>
          v.options?.map((o: any) => ({ name: o.name, image: o.image })) || []
        ),
      }))
      .filter((s: Skin) => !!s.id && !!s.name && !!s.image); // ensure valid

    console.log(`[skins] Fetched ${skins.length} skins from API`);

    // cache to AsyncStorage if non-empty OR replace empty cached array
    if (skins.length > 0) {
      await AsyncStorage.setItem(SKINS_KEY, JSON.stringify(skins));
      await AsyncStorage.setItem(SKINS_LAST_FETCH, Date.now().toString());
      console.log("[skins] Skins cached successfully");
    }

    return skins;
  } catch (err) {
    console.error("[skins] Failed to fetch skins:", err);
    return [];
  }
}

// ----- Load skins from cache or fetch if stale -----
async function loadSkins(): Promise<Skin[]> {
  try {
    const cached = await AsyncStorage.getItem(SKINS_KEY);
    const lastFetch = await AsyncStorage.getItem(SKINS_LAST_FETCH);
    const now = Date.now();

    // Only use cached data if it exists, is non-empty, and fresh
    if (
      cached &&
      cached !== "[]" &&
      lastFetch &&
      now - parseInt(lastFetch, 10) < SKINS_CACHE_TTL
    ) {
      const parsed = JSON.parse(cached);
      console.log(`[skins] Loaded ${parsed.length} skins from cache`);
      return parsed;
    }

    // fetch fresh if cache is empty, stale, or contains empty array
    console.log("[skins] Cache empty, stale, or invalid, fetching fresh skins...");
    return await fetchSkins();
  } catch (err) {
    console.error("[skins] Failed to load skins:", err);
    return [];
  }
}

// ----- AppStack Component -----
function AppStack() {
  const user = useContext(AuthContext);

  // Skins state
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loadingSkins, setLoadingSkins] = useState(true);

  useEffect(() => {
    console.log("[skins] Loading skins...");
    loadSkins()
      .then((s) => {
        setSkins(s);
        setLoadingSkins(false);
        console.log(`[skins] Skins loaded: ${s.length}`);
      })
      .catch((err) => {
        console.error("[skins] Error loading skins:", err);
        setLoadingSkins(false);
      });
  }, []);

  if (!user) return <LoginScreen />;

  return (
    <SkinsContext.Provider value={{ skins, skinLoading: loadingSkins }}>
      <Stack
  screenOptions={{
    headerShown: false,
  }}
></Stack>
    </SkinsContext.Provider>
  );
}

// ----- Layout Component -----
export default function Layout() {
  const [fontsLoaded] = useFonts({
    BurbankBlack: require("../assets/fonts/BBCB.otf"),
    Raleway: require("../assets/fonts/Raleway.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <AppStack />
    </AuthProvider>
  );
}