import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "app_theme_preference";

// Options de thème: "system" | "light" | "dark"
const ThemeContext = createContext({
  themePreference: "system", // Préférence utilisateur
  effectiveTheme: "light", // Thème réellement appliqué
  isDarkMode: false,
  setThemePreference: () => {},
  isLoading: true,
});

export function ThemeContextProvider({ children }) {
  const systemColorScheme = useSystemColorScheme() || "light";
  const [themePreference, setThemePreferenceState] = useState("system");
  const [isLoading, setIsLoading] = useState(true);

  // Charger la préférence au démarrage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedPreference && ["system", "light", "dark"].includes(savedPreference)) {
          setThemePreferenceState(savedPreference);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la préférence de thème:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadThemePreference();
  }, []);

  // Sauvegarder et mettre à jour la préférence
  const setThemePreference = async (preference) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
      setThemePreferenceState(preference);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la préférence de thème:", error);
    }
  };

  // Calculer le thème effectif
  const effectiveTheme = useMemo(() => {
    if (themePreference === "system") {
      return systemColorScheme;
    }
    return themePreference;
  }, [themePreference, systemColorScheme]);

  const isDarkMode = effectiveTheme === "dark";

  const value = useMemo(() => ({
    themePreference,
    effectiveTheme,
    isDarkMode,
    setThemePreference,
    isLoading,
  }), [themePreference, effectiveTheme, isDarkMode, isLoading]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeContextProvider");
  }
  return context;
}

export default ThemeContext;
