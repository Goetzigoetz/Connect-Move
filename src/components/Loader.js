import { View, ActivityIndicator } from "react-native";
import React from "react";
import { COLORS } from "../styles/colors";
import { useThemeContext } from "../ThemeProvider";

export default function Loader() {
  const { isDarkMode } = useThemeContext();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "-40%",
      }}
    >
      <ActivityIndicator color={COLORS.primary} size={"small"} />
    </View>
  );
}
