// app/_layout.tsx

import { Stack } from "expo-router";
import { Text } from "react-native";
import { useFonts } from "expo-font";
import { AuthProvider, AuthContext } from "../services/authProvider";
import { useContext } from "react";
import LoginScreen from "./login"; // your login screen

// This component decides which stack to show based on user state
function AppStack() {
  const user = useContext(AuthContext); // get the current user from context
  console.log("user:", user);
  // Show login screen if no user
  if (!user) {
    return <LoginScreen />;
  }

  // Otherwise, show main app stack
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: "#111" },
        headerStyle: { backgroundColor: "#111" },
        headerTintColor: "#fff",
        headerTitle: (props) => (
          <Text
            style={{
              fontFamily: "Raleway",
              fontSize: 20,
              color: "#fff",
            }}
          >
            {props.children}
          </Text>
        ),
      }}
    />
  );
}

export default function Layout() {
  const [fontsLoaded] = useFonts({
    BurbankBlack: require("../assets/fonts/BBCB.otf"),
    Raleway: require("../assets/fonts/Raleway.ttf"),
  });

  if (!fontsLoaded) return null;

  // Wrap everything in AuthProvider to provide user context to the app
  return (
    <AuthProvider>
      <AppStack />
    </AuthProvider>
  );
}
