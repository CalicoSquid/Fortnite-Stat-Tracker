// services/useOtpLogin.ts
import { useState } from "react";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Generate a random 6-digit code
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function useOtpLogin() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState<string | null>(null);

  const router = useRouter();

  // Step 1: send OTP
  const sendOtp = async () => {
    if (!email) {
      Alert.alert("Enter your email first");
      return;
    }

    const code = generateOtp();
    setSentOtp(code);

    // TODO: send code via email using a backend
    Alert.alert("OTP sent!", `Simulated code: ${code}`);
  };

  // Step 2: verify OTP
  const verifyOtp = async () => {
    if (!sentOtp || otp !== sentOtp) {
      Alert.alert("Invalid OTP");
      return;
    }

    try {
      const password = "TEMP_PASSWORD"; // internal dummy password
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      Alert.alert("Login successful!");
      setSentOtp(null);
      setOtp("");

      // Navigate to main app stack
      await AsyncStorage.setItem("email", email);
      await AsyncStorage.setItem("password", password);
      router.replace("/"); // replace login screen
    } catch (err: any) {
      console.error("OTP login error:", err);
      Alert.alert("Error logging in", err.message);
    }
  };

  return { email, setEmail, otp, setOtp, sentOtp, sendOtp, verifyOtp };
}
