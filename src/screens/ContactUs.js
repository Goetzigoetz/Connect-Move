import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { COLORS } from "../styles/colors";
import { API_URL } from "@env";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import { auth } from "../../config/firebase";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "../ThemeProvider";

const ContactHeader = ({ isDarkMode, t }) => (
  <Animated.View entering={FadeIn.duration(600)} style={styles.headerSection}>
    <Text
      style={[
        styles.headerTitle,
        { color: isDarkMode ? "#FFFFFF" : "#000000" },
      ]}
    >
      {t("contactUsTitle")}
    </Text>
    <Text
      style={[
        styles.headerSubtitle,
        { color: isDarkMode ? "#94A3B8" : "#64748B" },
      ]}
    >
      {t("contactIntro")}
    </Text>
  </Animated.View>
);

export default function ContactUs({ navigation }) {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();

  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Récupérer les sujets depuis les traductions avec fallback
  const contactSubjects = t("contactSubjects", { returnObjects: true });
  const SUBJECTS = Array.isArray(contactSubjects) ? contactSubjects : [
    { id: 1, label: "Question générale", icon: "help-outline" },
    { id: 2, label: "Problème technique", icon: "bug-report" },
    { id: 3, label: "Suggestion", icon: "lightbulb-outline" },
    { id: 4, label: "Signalement", icon: "flag" },
    { id: 5, label: "Autre", icon: "more-horiz" },
  ];

  useEffect(() => {
    if (auth.currentUser) {
      setUserEmail(auth.currentUser.email || "");
    }
  }, []);

  const handleSelectSubject = (value) => {
    setSubject(value);
    setShowPicker(false);
    if (value !== t("other")) setCustomSubject("");
  };

  const isFormValid = () => {
    const hasSubject =
      subject && (subject !== t("other") || customSubject.trim());
    const hasMessage = message.trim().length > 0;
    return hasSubject && hasMessage;
  };

  const handleSend = async () => {
    if (!isFormValid()) return;

    setSending(true);

    const finalSubject =
      subject === t("other") ? customSubject.trim() : subject;

    try {
      const response = await fetch(`${API_URL}/contact.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          subject: finalSubject,
          message: message.trim(),
          colors: {
            primary: COLORS.primary,
            secondary: COLORS.secondary,
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage({
          message: t("messageSent"),
          description: t("messageSentDesc"),
          type: "success",
          icon: "success",
          duration: 4000,
        });

        setSubject("");
        setCustomSubject("");
        setMessage("");

        navigation.goBack();
      } else {
        console.error("Erreur serveur:", {
          status: response.status,
          data: data,
        });

        showMessage({
          message: t("error"),
          description: data.error || t("sendMessageError"),
          type: "danger",
          icon: "danger",
        });
      }
    } catch (error) {
      console.error("Erreur complète:", error);

      showMessage({
        message: t("networkError"),
        description: t("serverConnectionError"),
        type: "danger",
        icon: "danger",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.contentContainer}>
            {/* Header Section */}
            <ContactHeader isDarkMode={isDarkMode} t={t} />

            {/* User Email Display */}
            {userEmail && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(50)}
                style={[
                  styles.emailContainer,
                  {
                    backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                    borderColor: isDarkMode ? "#2F3336" : "#EFF3F4",
                  },
                ]}
              >
                <MaterialIcons
                  name="email"
                  size={20}
                  color="#F97316"
                />
                <View style={styles.emailTextContainer}>
                  <Text
                    style={[
                      styles.emailLabel,
                      { color: "#71717A" },
                    ]}
                  >
                    {t("yourEmail")}
                  </Text>
                  <Text
                    style={[
                      styles.emailText,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                  >
                    {userEmail}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Subject Selector */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(100)}
              style={styles.fieldContainer}
            >
              <Text
                style={[
                  styles.fieldLabel,
                  { color: "#71717A" },
                ]}
              >
                {t("subject")} *
              </Text>
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={[
                  styles.subjectButton,
                  {
                    backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                    borderColor: subject
                      ? "#F97316"
                      : isDarkMode
                      ? "#2F3336"
                      : "#EFF3F4",
                  },
                ]}
              >
                <View style={styles.subjectContent}>
                  <MaterialIcons
                    name={
                      subject
                        ? SUBJECTS.find((s) => s.label === subject)?.icon ||
                          "info"
                        : "chevron-right"
                    }
                    size={20}
                    color={
                      subject
                        ? "#F97316"
                        : "#71717A"
                    }
                  />
                  <Text
                    style={[
                      styles.subjectText,
                      {
                        color: subject
                          ? isDarkMode ? "#FFFFFF" : "#000000"
                          : "#71717A",
                      },
                    ]}
                  >
                    {subject || t("selectSubject")}
                  </Text>
                </View>
                <MaterialIcons
                  name="arrow-drop-down"
                  size={24}
                  color="#71717A"
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Subject Picker Modal */}
            <Modal visible={showPicker} transparent animationType="fade">
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowPicker(false)}
              >
                <View
                  style={[
                    styles.modalContent,
                    { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" },
                  ]}
                >
                  <View
                    style={[
                      styles.modalHeader,
                      { backgroundColor: "#F97316" },
                    ]}
                  >
                    <Text style={styles.modalTitle}>
                      {t("chooseSubject")}
                    </Text>
                  </View>
                  {SUBJECTS.map((s, i) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.modalOption,
                        {
                          backgroundColor:
                            subject === s.label
                              ? isDarkMode
                                ? COLORS.bgDarkTertiary
                                : "#FFF7ED"
                              : "transparent",
                          borderBottomWidth: i < SUBJECTS.length - 1 ? 1 : 0,
                          borderBottomColor: isDarkMode
                            ? "#2F3336"
                            : "#EFF3F4",
                        },
                      ]}
                      onPress={() => handleSelectSubject(s.label)}
                    >
                      <MaterialIcons
                        name={s.icon}
                        size={20}
                        color={
                          subject === s.label
                            ? "#F97316"
                            : "#71717A"
                        }
                      />
                      <Text
                        style={[
                          styles.modalOptionText,
                          {
                            color:
                              subject === s.label
                                ? "#F97316"
                                : isDarkMode
                                ? "#FFFFFF"
                                : "#000000",
                          },
                        ]}
                      >
                        {s.label}
                      </Text>
                      {subject === s.label && (
                        <MaterialIcons
                          name="check"
                          size={20}
                          color="#F97316"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Custom Subject Input */}
            {subject === t("other") && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(150)}
                style={styles.fieldContainer}
              >
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: "#71717A" },
                  ]}
                >
                  {t("specifySubject")} *
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                      borderColor: isDarkMode ? "#2F3336" : "#EFF3F4",
                    },
                  ]}
                >
                  <TextInput
                    value={customSubject}
                    onChangeText={(txt) =>
                      txt.length <= 100 && setCustomSubject(txt)
                    }
                    maxLength={100}
                    placeholder={t("specifySubjectPlaceholder")}
                    placeholderTextColor="#71717A"
                    style={[
                      styles.input,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.charCounter,
                    { color: "#71717A" },
                  ]}
                >
                  {customSubject.length}/100
                </Text>
              </Animated.View>
            )}

            {/* Message Input */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(200)}
              style={styles.fieldContainer}
            >
              <Text
                style={[
                  styles.fieldLabel,
                  { color: "#71717A" },
                ]}
              >
                {t("yourMessage")} *
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                    borderColor: isDarkMode ? "#2F3336" : "#EFF3F4",
                  },
                ]}
              >
                <TextInput
                  value={message}
                  onChangeText={(txt) => txt.length <= 500 && setMessage(txt)}
                  maxLength={500}
                  placeholder={t("messagePlaceholder")}
                  placeholderTextColor="#71717A"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  style={[
                    styles.messageInput,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.charCounter,
                  { color: "#71717A" },
                ]}
              >
                {message.length}/500
              </Text>
            </Animated.View>

            {/* Summary Section */}
            {isFormValid() && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(250)}
                style={[
                  styles.summaryContainer,
                  {
                    backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFF7ED",
                    borderLeftColor: "#F97316",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="information-outline"
                  size={18}
                  color="#F97316"
                />
                <View style={styles.summaryTextContainer}>
                  <Text
                    style={[
                      styles.summaryLabel,
                      { color: "#F97316" },
                    ]}
                  >
                    {t("summary")}
                  </Text>
                  <Text
                    style={[
                      styles.summaryText,
                      { color: isDarkMode ? "#E5E7EB" : "#4B5563" },
                    ]}
                  >
                    <Text style={styles.summaryBold}>{t("subject")}: </Text>
                    {subject === t("other") ? customSubject : subject}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Send Button */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(300)}
              style={styles.buttonContainer}
            >
              <TouchableOpacity
                disabled={sending || !isFormValid()}
                onPress={handleSend}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor:
                      sending || !isFormValid() ? "#71717A" : "#F97316",
                    opacity: sending || !isFormValid() ? 0.6 : 1,
                  },
                ]}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.sendButtonText}>{t("send")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Header Section
  headerSection: {
    alignItems: "flex-start",
    paddingVertical: 8,
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },

  // Email Display
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  emailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  emailLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  emailText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },

  // Field Container
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  // Subject Button
  subjectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  subjectContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  subjectText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    marginLeft: 12,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 16,
    width: "85%",
    maxWidth: 400,
    overflow: "hidden",
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalOptionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
  },

  // Input Containers
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  input: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    paddingVertical: 0,
    minHeight: 24,
  },
  messageInput: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    minHeight: 120,
    paddingVertical: 0,
  },
  charCounter: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },

  // Summary
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderLeftWidth: 4,
    marginBottom: 24,
  },
  summaryTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  summaryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
  },
  summaryBold: {
    fontFamily: "Inter_600SemiBold",
  },

  // Button
  buttonContainer: {
    marginBottom: 40,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 9999,
    gap: 8,
  },
  sendButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
