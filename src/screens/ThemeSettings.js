import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "../ThemeProvider";
import { COLORS } from "../styles/colors";

const THEME_OPTIONS = [
  {
    value: "system",
    labelKey: "theme_systeme",
    descriptionKey: "theme_systeme_desc",
    icon: "phone-portrait-outline",
  },
  {
    value: "light",
    labelKey: "theme_clair",
    descriptionKey: "theme_clair_desc",
    icon: "sunny-outline",
  },
  {
    value: "dark",
    labelKey: "theme_sombre",
    descriptionKey: "theme_sombre_desc",
    icon: "moon-outline",
  },
];

const ThemeSettings = ({ navigation }) => {
  const { isDarkMode, themePreference, setThemePreference } = useThemeContext();
  const { t } = useTranslation();

  const handleThemeChange = async (value) => {
    await setThemePreference(value);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text
              style={[
                styles.headerTitle,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              {t("apparence")}
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: isDarkMode ? "#71717A" : "#71717A" },
              ]}
            >
              {t("personnalisez_apparence_app")}
            </Text>
          </View>

          {/* Theme Options */}
          <View style={styles.optionsContainer}>
            {THEME_OPTIONS.map((option, index) => {
              const isSelected = themePreference === option.value;

              return (
                <View key={option.value}>
                  <TouchableOpacity
                    onPress={() => handleThemeChange(option.value)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF",
                        borderColor: isSelected
                          ? COLORS.primary
                          : isDarkMode
                          ? "#2F3336"
                          : "#EFF3F4",
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    activeOpacity={0.6}
                  >
                    {/* Icon */}
                    <View
                      style={[
                        styles.iconContainer,
                        {
                          backgroundColor: isSelected
                            ? `${COLORS.primary}20`
                            : isDarkMode
                            ? "#2F3336"
                            : "#F3F4F6",
                        },
                      ]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={24}
                        color={isSelected ? COLORS.primary : isDarkMode ? "#9CA3AF" : "#6B7280"}
                      />
                    </View>

                    {/* Text Content */}
                    <View style={styles.optionContent}>
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: isDarkMode ? "#FFFFFF" : "#000000",
                            fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular",
                          },
                        ]}
                      >
                        {t(option.labelKey)}
                      </Text>
                      <Text
                        style={[
                          styles.optionDescription,
                          { color: isDarkMode ? "#71717A" : "#71717A" },
                        ]}
                      >
                        {t(option.descriptionKey)}
                      </Text>
                    </View>

                    {/* Check Icon */}
                    {isSelected && (
                      <View style={styles.checkIconContainer}>
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Separator */}
                  {index < THEME_OPTIONS.length - 1 && (
                    <View style={{ height: 12 }} />
                  )}
                </View>
              );
            })}
          </View>

          {/* Footer Info */}
          <View style={styles.footerInfo}>
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDarkMode ? "#0A0A0A" : "#F7F9F9",
                },
              ]}
            >
              <View style={styles.infoContent}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={isDarkMode ? "#71717A" : "#536471"}
                  style={styles.infoIcon}
                />
                <Text
                  style={[
                    styles.infoText,
                    { color: isDarkMode ? "#71717A" : "#536471" },
                  ]}
                >
                  {t("theme_info")}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 16 : 24,
    paddingBottom: 24,
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  optionsContainer: {
    paddingHorizontal: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  optionDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  checkIconContainer: {
    marginLeft: 12,
  },
  footerInfo: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
  },
  infoContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoIcon: {
    marginTop: 1,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
});

export default ThemeSettings;
