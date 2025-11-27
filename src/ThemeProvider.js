import React, { useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { ThemeContextProvider, useThemeContext } from "./contexts/ThemeContext";
import { COLORS } from "./styles/colors";

const themes = {
  light: {
    mode: "light",
    background: "#FFFFFF",
    text: "#18181B",
    primary: COLORS.primary,
  },
  dark: {
    mode: "dark",
    background: COLORS.bgDark,
    text: "#FFFFFF",
    primary: "#9CC9FF",
  },
};

// Composant interne qui utilise le contexte
function ThemeStatusBar() {
  const { effectiveTheme } = useThemeContext();
  return <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />;
}

export function ThemeProvider({ children }) {
  return (
    <ThemeContextProvider>
      <ThemeStatusBar />
      {children}
    </ThemeContextProvider>
  );
}

// Hook pour obtenir le thème actuel (compatibilité)
export function useTheme() {
  const { effectiveTheme } = useThemeContext();
  return effectiveTheme === "dark" ? themes.dark : themes.light;
}

// Ré-exporter le hook du contexte
export { useThemeContext } from "./contexts/ThemeContext";
