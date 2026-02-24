// app/login.tsx
import React from "react";
import { View, TextInput, Pressable, Text, Animated, Alert } from "react-native";
import { useOtpLogin } from "../services/useOtpLogin";

export default function LoginScreen() {
  const { email, setEmail, otp, setOtp, sentOtp, sendOtp, verifyOtp } = useOtpLogin();

  const buttonScale = React.useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      {/* Email Input */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        placeholder="your@email.com"
        placeholderTextColor="#555"
      />

      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <Pressable
          onPress={sendOtp}
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Send OTP 🔥</Text>
        </Pressable>
      </Animated.View>

      {/* OTP Input */}
      {sentOtp && (
        <>
          <Text style={styles.label}>Enter OTP</Text>
          <TextInput
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            style={styles.input}
            placeholder="123456"
            placeholderTextColor="#555"
          />

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              onPress={verifyOtp}
              onPressIn={pressIn}
              onPressOut={pressOut}
              style={[styles.button, { backgroundColor: "#32CD32" }]}
            >
              <Text style={styles.buttonText}>Verify OTP ✅</Text>
            </Pressable>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#0f0f15",
    justifyContent: "center" as const,
    padding: 20,
  },
  title: {
    fontFamily: "BurbankBlack",
    fontSize: 36,
    color: "white",
    marginBottom: 30,
    textAlign: "center" as const,
  },
  label: {
    fontFamily: "BurbankBlack",
    fontSize: 14,
    color: "#8b5cf6",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1a1a24",
    color: "#fff",
    fontFamily: "Raleway",
    fontSize: 16,
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 15,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: "white",
    fontFamily: "BurbankBlack",
    fontSize: 18,
  },
};
