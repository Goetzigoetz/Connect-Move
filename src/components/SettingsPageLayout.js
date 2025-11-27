import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { COLORS } from "../styles/colors";
import { useThemeContext } from "../ThemeProvider";

/**
 * Layout réutilisable pour les pages de paramètres/settings
 * Style cohérent avec LanguageSettings et LegalPage
 */
const SettingsPageLayout = ({
  title,
  subtitle,
  children,
  showFooter = false,
  footerContent = null,
  scrollViewRef = null,
  enableKeyboardAvoiding = false,
}) => {
  const { isDarkMode } = useThemeContext();

  const content = (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header Section */}
      {(title || subtitle) && (
        <View style={styles.headerSection}>
          {title && (
            <Text
              style={[
                styles.headerTitle,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[
                styles.headerSubtitle,
                { color: isDarkMode ? "#71717A" : "#71717A" },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {children}
      </View>

      {/* Footer Info (optionnel) */}
      {showFooter && footerContent && (
        <View style={styles.footerInfo}>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDarkMode
                  ? COLORS.bgDarkSecondary
                  : "#F7F9F9",
              },
            ]}
          >
            {footerContent}
          </View>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }]}>
      <SafeAreaView style={styles.safeArea}>
        {enableKeyboardAvoiding ? (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            {content}
          </KeyboardAvoidingView>
        ) : (
          content
        )}
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
    fontFamily: "Inter_700Bold",
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
  contentContainer: {
    paddingHorizontal: 0,
  },
  footerInfo: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
  },
});

export default SettingsPageLayout;
