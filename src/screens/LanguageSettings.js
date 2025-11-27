import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../ThemeProvider";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../i18n";
import { COLORS } from "../styles/colors";

const LANGUAGES = [
  {
    code: "fr",
    label: "Français",
    nativeName: "Français",
    flag: require("../../assets/img/fr.png"),
  },
  {
    code: "en",
    label: "English",
    nativeName: "English",
    flag: require("../../assets/img/en.png"),
  },
  {
    code: "de",
    label: "Deutsch",
    nativeName: "Deutsch",
    flag: require("../../assets/img/de.webp"),
  },
  {
    code: "es",
    label: "Español",
    nativeName: "Español",
    flag: require("../../assets/img/es.webp"),
  },
  {
    code: "it",
    label: "Italiano",
    nativeName: "Italiano",
    flag: require("../../assets/img/it.png"),
  },
  {
    code: "cn",
    label: "中文",
    nativeName: "简体中文",
    flag: require("../../assets/img/cn.png"),
  },
  {
    code: "jp",
    label: "日本語",
    nativeName: "日本語",
    flag: require("../../assets/img/jp.png"),
  },
];

const LanguageSettings = ({ navigation }) => {
  const { isDarkMode } = useThemeContext();
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || "fr");

  const handleLanguageChange = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      setSelectedLanguage(languageCode);
      // Sauvegarder la langue sélectionnée dans AsyncStorage avec la même clé que i18n
      await AsyncStorage.setItem("settings.lang", languageCode);
    } catch (error) {
      console.error("Erreur lors du changement de langue:", error);
    }
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
              {t("selectionner_une_langue")}
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: isDarkMode ? "#71717A" : "#71717A" },
              ]}
            >
              {t("choisissez_votre_langue_preferee")}
            </Text>
          </View>

          {/* Language List */}
          <View style={styles.languageListContainer}>
            {LANGUAGES.map((language, index) => {
              const isSelected = selectedLanguage === language.code;

              return (
                <View key={language.code}>
                  <TouchableOpacity
                    onPress={() => handleLanguageChange(language.code)}
                    style={[
                      styles.languageOption,
                      {
                        backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF",
                      },
                    ]}
                    activeOpacity={0.6}
                  >
                    {/* Left Content */}
                    <View style={styles.languageContent}>
                      {/* Flag Container */}
                      <View
                        style={[
                          styles.flagContainer,
                          {
                            borderWidth: isDarkMode ? 0 : 0.5,
                            borderColor: isDarkMode ? "transparent" : "#E4E4E7",
                          },
                        ]}
                      >
                        <Image
                          source={language.flag}
                          style={styles.flagImage}
                        />
                      </View>

                      {/* Language Info */}
                      <View style={styles.languageInfo}>
                        <Text
                          style={[
                            styles.languageLabel,
                            {
                              color: isDarkMode ? "#FFFFFF" : "#000000",
                              fontFamily: isSelected ? "Inter_500Medium" : "Inter_400Regular",
                            },
                          ]}
                        >
                          {language.label}
                        </Text>
                        {language.label !== language.nativeName && (
                          <Text
                            style={[
                              styles.languageNative,
                              { color: isDarkMode ? "#71717A" : "#71717A" },
                            ]}
                          >
                            {language.nativeName}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Right Content - Check Icon */}
                    {isSelected && (
                      <View style={styles.checkIconContainer}>
                        <Ionicons
                          name="checkmark"
                          size={22}
                          color="#1D9BF0"
                        />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Separator */}
                  {index < LANGUAGES.length - 1 && (
                    <View
                      style={[
                        styles.separator,
                        {
                          backgroundColor: isDarkMode
                            ? "#2F3336"
                            : "#EFF3F4",
                        },
                      ]}
                    />
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
                  backgroundColor: isDarkMode
                    ? "#0A0A0A"
                    : "#F7F9F9",
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
                  {t("changements_langue_effet_immediat")}
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
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  languageListContainer: {
    paddingHorizontal: 0,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  languageContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 12,
  },
  flagImage: {
    width: 40,
    height: 40,
  },
  languageInfo: {
    flex: 1,
    justifyContent: "center",
  },
  languageLabel: {
    fontSize: 15,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  languageNative: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    letterSpacing: -0.1,
    marginTop: 2,
  },
  checkIconContainer: {
    marginLeft: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: 0.5,
    marginLeft: 68,
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

export default LanguageSettings;
