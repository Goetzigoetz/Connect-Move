import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../ThemeProvider";
import { useTranslation } from "react-i18next";
import WebViewModal from "../components/WebViewModal";
import { COLORS } from "../styles/colors";

const LEGAL_DOCUMENTS = [
  {
    id: "cgu",
    labelKey: "conditions_generales_utilisation",
    label: "Conditions Générales d'Utilisation",
    icon: "file-document-outline",
    url: "https://connectetmove.com/termes.html",
    description: "Conditions d'utilisation de l'application",
  },
  {
    id: "privacy",
    labelKey: "politique_confidentialite",
    label: "Politique de Confidentialité",
    icon: "shield-lock-outline",
    url: "https://connectetmove.com/vie%20privee.html",
    description: "Protection de vos données personnelles",
  },
  {
    id: "legal",
    labelKey: "mentions_legales",
    label: "Mentions Légales",
    icon: "scale-balance",
    url: "https://connectetmove.com/juridique.html",
    description: "Informations légales sur l'éditeur",
  },
  {
    id: "contact",
    labelKey: "nous_contacter",
    label: "Nous contacter",
    icon: "email-outline",
    url: "https://connectetmove.com/contacter.html",
    description: "Besoin d'aide ou de support",
  },
];

const LegalPage = () => {
  const { isDarkMode } = useThemeContext();
  const { t } = useTranslation();

  const [webViewVisible, setWebViewVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const handleDocumentPress = (document) => {
    setSelectedDocument(document);
    setWebViewVisible(true);
  };

  const handleCloseWebView = () => {
    setWebViewVisible(false);
    setSelectedDocument(null);
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
              {t("documents_legaux") || "Documents légaux"}
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: isDarkMode ? "#71717A" : "#71717A" },
              ]}
            >
              {t("consultez_nos_documents_legaux") || "Consultez nos documents légaux et politiques"}
            </Text>
          </View>

          {/* Documents List */}
          <View style={styles.documentsListContainer}>
            {LEGAL_DOCUMENTS.map((document, index) => {
              return (
                <View key={document.id}>
                  <TouchableOpacity
                    onPress={() => handleDocumentPress(document)}
                    style={[
                      styles.documentOption,
                      {
                        backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF",
                      },
                    ]}
                    activeOpacity={0.6}
                  >
                    {/* Left Content */}
                    <View style={styles.documentContent}>
                      {/* Icon Container */}
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(59, 130, 246, 0.15)"
                              : "rgba(59, 130, 246, 0.1)",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={document.icon}
                          size={24}
                          color="#3B82F6"
                        />
                      </View>

                      {/* Document Info */}
                      <View style={styles.documentInfo}>
                        <Text
                          style={[
                            styles.documentLabel,
                            {
                              color: isDarkMode ? "#FFFFFF" : "#000000",
                            },
                          ]}
                        >
                          {t(document.labelKey) || document.label}
                        </Text>
                        <Text
                          style={[
                            styles.documentDescription,
                            { color: isDarkMode ? "#71717A" : "#71717A" },
                          ]}
                        >
                          {document.description}
                        </Text>
                      </View>
                    </View>

                    {/* Right Content - Arrow Icon */}
                    <View style={styles.arrowIconContainer}>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={isDarkMode ? "#71717A" : "#A1A1AA"}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Separator */}
                  {index < LEGAL_DOCUMENTS.length - 1 && (
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

         
        </ScrollView>
      </SafeAreaView>

      {/* WebView Modal */}
      <WebViewModal
        visible={webViewVisible}
        url={selectedDocument?.url}
        title={selectedDocument ? t(selectedDocument.labelKey) : ""}
        onClose={handleCloseWebView}
      />
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
  documentsListContainer: {
    paddingHorizontal: 0,
  },
  documentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 80,
  },
  documentContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  documentInfo: {
    flex: 1,
    justifyContent: "center",
  },
  documentLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    letterSpacing: -0.2,
    lineHeight: 20,
    marginBottom: 4,
  },
  documentDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  arrowIconContainer: {
    marginLeft: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: 0.5,
    marginLeft: 80,
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

export default LegalPage;
