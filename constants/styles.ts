import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d14",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 30,
    color: "white",
    fontFamily: "BurbankBlack", // <-- use custom font
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: "white",
    marginBottom: 12,
    fontFamily: "Burbank-Black",
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Burbank-Black",
  },

  center : {
    justifyContent: "center",
    alignItems: "center",
  },

  text : {
    color: "white",
    fontSize: 16,
    fontFamily: "Burbank-Black",
  },
});
