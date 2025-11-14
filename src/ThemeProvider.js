import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";

const themes = {
  light: {
    mode: "light",
    background: "#FFFFFF",
    text: "#18181B",
    primary: "#2970fa",
  },
  dark: {
    mode: "dark",
    background: "#1b1819ff",
    text: "#FFFFFF",
    primary: "#9CC9FF",
  },
};

const ThemeContext = createContext({
  theme: themes.light,
});

export function ThemeProvider({ children }) {
  const colorScheme = useColorScheme() || "light";
  const theme = useMemo(() => (colorScheme === "dark" ? themes.dark : themes.light), [colorScheme]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext).theme;
}
