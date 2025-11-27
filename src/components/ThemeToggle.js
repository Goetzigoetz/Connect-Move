import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import i18n from "../../i18n";
import { COLORS } from "../styles/colors";
import { useThemeContext } from "../ThemeProvider";

const ThemeToggle = () => {
  const navigation = useNavigation();
  const { isDarkMode, themePreference } = useThemeContext();

  // Obtenir le label du thème actuel
  const getThemeLabel = () => {
    switch (themePreference) {
      case "system":
        return i18n.t("theme_systeme");
      case "light":
        return i18n.t("theme_clair");
      case "dark":
        return i18n.t("theme_sombre");
      default:
        return i18n.t("theme_systeme");
    }
  };

  // Obtenir l'icône du thème actuel
  const getThemeIcon = () => {
    switch (themePreference) {
      case "system":
        return "phone-portrait-outline";
      case "light":
        return "sunny-outline";
      case "dark":
        return "moon-outline";
      default:
        return "phone-portrait-outline";
    }
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
        borderColor: isDarkMode ? "#2F3336" : "#EFF3F4",
      }
    ]}>
      <TouchableOpacity
        onPress={() => navigation.navigate("ThemeSettings")}
        style={styles.menuItem}
        activeOpacity={0.6}
      >
        <View style={styles.menuItemContent}>
          <Ionicons
            name={getThemeIcon()}
            size={22}
            color="#71717A"
          />
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.menuItemText,
                { color: isDarkMode ? "#FFFFFF" : "#000000" }
              ]}
            >
              {i18n.t("apparence")}
            </Text>
            <Text
              style={[
                styles.menuItemSubtext,
                { color: isDarkMode ? "#71717A" : "#9CA3AF" }
              ]}
            >
              {getThemeLabel()}
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDarkMode ? "#4B5563" : "#D1D5DB"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  menuItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  menuItemSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
});

export default ThemeToggle;
