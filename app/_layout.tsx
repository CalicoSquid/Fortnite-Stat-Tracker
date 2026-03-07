// app/_layout.tsx
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, AuthContext } from "../services/authProvider";
import { useContext, createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./login";
import CustomSplash from "../components/Customsplash";

// Hold the native splash until we're ready
SplashScreen.preventAutoHideAsync();

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

// ----- Constants -----
const SKINS_KEY = "skins_cache";
const SKINS_LAST_FETCH = "skins_cache_date";
const SKINS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

// ----- Fetch skins -----
async function fetchSkins(): Promise<Skin[]> {
  try {
    const res = await fetch("https://fortnite-api.com/v2/cosmetics/br");
    const data = await res.json();
    if (!data?.data || !Array.isArray(data.data)) return [];
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
      .filter((s: Skin) => !!s.id && !!s.name && !!s.image);
    if (skins.length > 0) {
      await AsyncStorage.setItem(SKINS_KEY, JSON.stringify(skins));
      await AsyncStorage.setItem(SKINS_LAST_FETCH, Date.now().toString());
    }
    return skins;
  } catch (err) {
    console.error("[skins] Failed to fetch:", err);
    return [];
  }
}

async function loadSkins(): Promise<Skin[]> {
  try {
    const cached = await AsyncStorage.getItem(SKINS_KEY);
    const lastFetch = await AsyncStorage.getItem(SKINS_LAST_FETCH);
    const now = Date.now();
    if (cached && cached !== "[]" && lastFetch && now - parseInt(lastFetch, 10) < SKINS_CACHE_TTL) {
      return JSON.parse(cached);
    }
    return await fetchSkins();
  } catch (err) {
    console.error("[skins] Failed to load:", err);
    return [];
  }
}

// ----- AppStack -----
function AppStack() {
  const user = useContext(AuthContext);
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loadingSkins, setLoadingSkins] = useState(true);

  useEffect(() => {
    loadSkins().then((s) => {
      setSkins(s);
      setLoadingSkins(false);
    }).catch(() => setLoadingSkins(false));
  }, []);

  if (!user) return <LoginScreen />;

  return (
    <SkinsContext.Provider value={{ skins, skinLoading: loadingSkins }}>
      <Stack screenOptions={{ headerShown: false }} />
    </SkinsContext.Provider>
  );
}

// ----- Root Layout -----
export default function Layout() {
  const [fontsLoaded] = useFonts({
    BurbankBlack: require("../assets/fonts/BBCB.otf"),
    Raleway: require("../assets/fonts/Raleway.ttf"),
  });

  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded) {
      // Hide the native splash — our custom one takes over immediately
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Don't render anything until fonts are loaded
  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <>
        <AppStack />
        {/* Custom splash renders on top until animation completes */}
        {showCustomSplash && (
          <CustomSplash onFinished={() => setShowCustomSplash(false)} />
        )}
      </>
    </AuthProvider>
  );
}