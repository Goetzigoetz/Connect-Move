import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import { COLORS } from "../styles/colors";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { auth } from "../../config/firebase";
import { EmailAuthProvider, reauthenticateWithCredential } from "@react-native-firebase/auth";
import { showMessage } from "react-native-flash-message";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "@env";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "../ThemeProvider";

export default function DeleteAccountScreen({ navigation }) {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();
  const reasons = t("deleteReasons", { returnObjects: true });

  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [sending, setSending] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);

  const handleSelectReason = (reason) => {
    setSelectedReason(reason);
    setModalVisible(false);
    if (reason !== t("other")) setCustomReason("");
  };

  const validateAndShowConfirmation = () => {
    if (
      !selectedReason ||
      (selectedReason === t("other") && !customReason.trim())
    ) {
      showMessage({
        message: t("error"),
        description: t("selectReasonError"),
        type: "danger",
        icon: "danger",
        duration: 3000,
      });
      return;
    }
    setConfirmationModalVisible(true);
  };

  const handleDeleteAccount = async () => {
    setConfirmationModalVisible(false);
    setSending(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      await user.delete().then(async () => {
        await fetch(`${API_URL}/goodbye.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: auth.currentUser?.email,
            reason:
              selectedReason === t("other")
                ? customReason.trim()
                : selectedReason,
            deletedAt: new Date().toISOString(),
          }),
        });
      });

      showMessage({
        message: t("accountDeleted"),
        description: t("accountDeletedDesc"),
        type: "success",
        icon: "success",
        duration: 4000,
      });
    } catch (e) {
      if (e.code === "auth/requires-recent-login") {
        setSending(false);
        Alert.prompt(
          t("securityCheck"),
          t("securityCheckDesc"),
          async (password) => {
            if (!password) return;
            setSending(true);
            try {
              const cred = EmailAuthProvider.credential(
                auth.currentUser.email,
                password
              );
              await reauthenticateWithCredential(auth.currentUser, cred);
              await auth.currentUser.delete();

              showMessage({
                message: t("accountDeleted"),
                description: t("accountDeletedDesc"),
                type: "success",
                icon: "success",
                duration: 4000,
              });
              await fetch(`${API_URL}/goodbye.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: auth.currentUser?.email,
                  reason:
                    selectedReason === t("other")
                      ? customReason.trim()
                      : selectedReason,
                  deletedAt: new Date().toISOString(),
                }),
              });
            } catch (error) {
              showMessage({
                message: t("error"),
                description: t("invalidPassword"),
                type: "danger",
                icon: "danger",
                duration: 4000,
              });
            } finally {
              setSending(false);
            }
          },
          "secure-text"
        );
      } else {
        showMessage({
          message: t("error"),
          description: t("deleteAccountError"),
          type: "danger",
          icon: "danger",
          duration: 4000,
        });
        setSending(false);
      }
    }
  };

  const deletionItems = t("deletionItems", { returnObjects: true });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }]}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: isDarkMode ? "#FFFFFF" : COLORS.black }
            ]}
          >
            {t("deleteMyAccount")}
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: isDarkMode ? "#A1A1AA" : "#6B7280" }
            ]}
          >
            {t("irreversibleAction")}
          </Text>
        </View>

        <View style={[
          styles.warningCard,
          { backgroundColor: isDarkMode ? "#450A0A" : "#FEF2F2" }
        ]}>
          <Ionicons
            name="warning"
            size={24}
            color="#EF4444"
            style={{ marginRight: 12 }}
          />
          <View style={styles.warningContent}>
            <Text
              style={[
                styles.warningTitle,
                { color: isDarkMode ? "#FCA5A5" : "#991B1B" }
              ]}
            >
              {t("warning")}
            </Text>
            <Text
              style={[
                styles.warningText,
                { color: isDarkMode ? "#F87171" : "#B91C1C" }
              ]}
            >
              {t("warningDesc")}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? "#D1D5DB" : "#374151" }
          ]}
        >
          {t("whyDelete")}
        </Text>

        <Pressable
          onPress={() => setModalVisible(true)}
          style={[
            styles.reasonSelector,
            {
              backgroundColor: isDarkMode ? "#27272A" : "#F9FAFB",
              borderColor: isDarkMode ? "#3F3F46" : "#D1D5D8"
            }
          ]}
        >
          <Text
            style={[
              styles.reasonText,
              {
                color: selectedReason
                  ? (isDarkMode ? "#FFFFFF" : COLORS.primary)
                  : (isDarkMode ? "#71717A" : "#9CA3AF")
              }
            ]}
          >
            {selectedReason || t("chooseReason")}
          </Text>
          <Ionicons name="chevron-down" size={20} color={isDarkMode ? "#71717A" : "#9CA3AF"} />
        </Pressable>

        {selectedReason === t("other") && (
          <View style={styles.customReasonContainer}>
            <TextInput
              value={customReason}
              onChangeText={(text) =>
                text.length <= 250 ? setCustomReason(text) : null
              }
              placeholder={t("specifyReasonPlaceholder")}
              placeholderTextColor={isDarkMode ? "#71717A" : "#9CA3AF"}
              style={[
                styles.customReasonInput,
                {
                  backgroundColor: isDarkMode ? "#27272A" : "#FFFFFF",
                  borderColor: isDarkMode ? "#3F3F46" : "#D1D5D8",
                  color: isDarkMode ? "#FFFFFF" : "#000000"
                }
              ]}
              multiline
              maxLength={250}
            />
            <Text style={[styles.characterCount, { color: isDarkMode ? "#71717A" : "#9CA3AF" }]}>
              {customReason.length}/250
            </Text>
          </View>
        )}

        <View style={[
          styles.infoCard,
          { backgroundColor: isDarkMode ? "#0A2A3E" : "#EFF6FF" }
        ]}>
          <Text
            style={[
              styles.infoTitle,
              { color: isDarkMode ? "#93C5FD" : "#1E3A8A" }
            ]}
          >
            {t("whatWillBeDeleted")}
          </Text>
          <View>
            {deletionItems.map((item, index) => (
              <View key={index} style={styles.deletionItem}>
                <Text style={[styles.bullet, { color: isDarkMode ? "#60A5FA" : "#3B82F6" }]}>•</Text>
                <Text
                  style={[
                    styles.deletionText,
                    { color: isDarkMode ? "#BFDBFE" : "#1E40AF" }
                  ]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          onPress={validateAndShowConfirmation}
          disabled={
            sending ||
            !selectedReason ||
            (selectedReason === t("other") && !customReason.trim())
          }
          style={[
            styles.deleteButton,
            {
              backgroundColor:
                sending ||
                !selectedReason ||
                (selectedReason === t("other") && !customReason.trim())
                  ? "#F87171"
                  : "#DC2626",
              opacity:
                sending ||
                !selectedReason ||
                (selectedReason === t("other") && !customReason.trim())
                  ? 0.6
                  : 1
            }
          ]}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="trash-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.deleteButtonText}>
                {t("deletePermanently")}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => navigation.goBack()}
          disabled={sending}
          style={styles.cancelButton}
        >
          <Text style={[styles.cancelButtonText, { color: isDarkMode ? "#A1A1AA" : "#6B7280" }]}>
            {t("cancel")}
          </Text>
        </Pressable>

        <Modal visible={modalVisible} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setModalVisible(false)}
          >
            <View style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
            ]}>
              <View style={[
                styles.modalHeader,
                { borderBottomColor: isDarkMode ? "#3F3F46" : "#E5E7EB" }
              ]}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDarkMode ? "#FFFFFF" : COLORS.primary }
                  ]}
                >
                  {t("selectReason")}
                </Text>
              </View>
              <ScrollView style={styles.reasonsList}>
                {reasons.map((reason, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.reasonItem,
                      {
                        borderBottomColor: isDarkMode ? "#3F3F46" : "#F3F4F6",
                        backgroundColor:
                          selectedReason === reason
                            ? (isDarkMode ? "#1E3A8A" : "#F0F9FF")
                            : "transparent",
                      }
                    ]}
                    onPress={() => handleSelectReason(reason)}
                  >
                    <View style={styles.reasonItemContent}>
                      <Text
                        style={[
                          styles.reasonItemText,
                          {
                            color:
                              selectedReason === reason
                                ? COLORS.primary
                                : (isDarkMode ? "#D1D5DB" : "#374151")
                          }
                        ]}
                      >
                        {reason}
                      </Text>
                      {selectedReason === reason && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={COLORS.primary}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={confirmationModalVisible}
          transparent
          animationType="fade"
        >
          <View style={styles.confirmationOverlay}>
            <View style={[
              styles.confirmationModal,
              { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
            ]}>
              <View style={styles.confirmationHeader}>
                <View style={styles.alertIcon}>
                  <Ionicons name="alert-circle" size={48} color="#DC2626" />
                </View>
                <Text style={[styles.confirmationTitle, { color: isDarkMode ? "#FFFFFF" : "#111827" }]}>
                  {t("confirmDeletion")}
                </Text>
                <Text style={[styles.confirmationText, { color: isDarkMode ? "#A1A1AA" : "#6B7280" }]}>
                  {t("confirmDeletionDesc")}
                </Text>
              </View>

              <View style={styles.confirmationButtons}>
                <Pressable
                  onPress={handleDeleteAccount}
                  style={styles.confirmDeleteButton}
                >
                  <Text style={styles.confirmDeleteButtonText}>
                    {t("yesDeletePermanently")}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setConfirmationModalVisible(false)}
                  style={[
                    styles.confirmCancelButton,
                    { backgroundColor: isDarkMode ? "#27272A" : "#F3F4F6" }
                  ]}
                >
                  <Text style={[styles.confirmCancelButtonText, { color: isDarkMode ? "#D1D5DB" : "#374151" }]}>
                    {t("cancel")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  warningCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    marginBottom: 4,
  },
  warningText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 12,
  },
  reasonSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  reasonText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    flex: 1,
  },
  customReasonContainer: {
    marginBottom: 24,
  },
  customReasonInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  characterCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 8,
    textAlign: "right",
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 12,
  },
  deletionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  bullet: {
    marginRight: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  deletionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  cancelButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    minWidth: "80%",
    maxWidth: "90%",
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
  },
  reasonsList: {
    maxHeight: 400,
  },
  reasonItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  reasonItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reasonItemText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  confirmationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmationModal: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  confirmationHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  alertIcon: {
    backgroundColor: "#FEE2E2",
    borderRadius: 50,
    padding: 12,
    marginBottom: 12,
  },
  confirmationTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 8,
  },
  confirmationText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  confirmationButtons: {
    gap: 8,
  },
  confirmDeleteButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmDeleteButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  confirmCancelButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmCancelButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});
