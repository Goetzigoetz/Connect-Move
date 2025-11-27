import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../config/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "@react-native-firebase/firestore";
import { useNavigation, useRoute } from "@react-navigation/native";
import { showMessage } from "react-native-flash-message";
import { COLORS } from "../styles/colors";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import i18n from "../../i18n";
import moment from "moment";
import { useThemeContext } from "../ThemeProvider";

const REASON_OPTIONS = [
  { labelKey: "spam_publicite", value: "spam", icon: "megaphone-outline", color: "#F59E0B", bgLight: "#FEF3C7", bgDark: "rgba(245, 158, 11, 0.15)" },
  { labelKey: "evenement_frauduleux", value: "fraud", icon: "warning-outline", color: "#EF4444", bgLight: "#FEE2E2", bgDark: "rgba(239, 68, 68, 0.15)" },
  { labelKey: "propos_inappropries", value: "inappropriate", icon: "chatbubble-ellipses-outline", color: "#8B5CF6", bgLight: "#EDE9FE", bgDark: "rgba(139, 92, 246, 0.15)" },
  { labelKey: "fausse_information", value: "misinformation", icon: "information-circle-outline", color: "#3B82F6", bgLight: "#DBEAFE", bgDark: "rgba(59, 130, 246, 0.15)" },
  { labelKey: "autre_raison", value: "other", icon: "ellipsis-horizontal-circle-outline", color: "#6B7280", bgLight: "#F3F4F6", bgDark: "rgba(107, 114, 128, 0.15)" },
];

const ReportReasonScreen = () => {
  const { isDarkMode } = useThemeContext();
  const navigation = useNavigation();
  const route = useRoute();
  const { activityId, activity: passedActivity, activityImage } = route?.params || {};

  const [selectedReason, setSelectedReason] = useState(null);
  const [otherReason, setOtherReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState(passedActivity || null);
  const [loadingActivity, setLoadingActivity] = useState(!passedActivity);

  useEffect(() => {
    if (!passedActivity && activityId) {
      fetchActivity();
    }
  }, [activityId, passedActivity]);

  const fetchActivity = async () => {
    try {
      const activityDoc = await getDoc(doc(db, "activities", activityId));
      if (activityDoc.exists()) {
        setActivity({ id: activityDoc.id, ...activityDoc.data() });
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'activité:", error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Alert.alert(i18n.t("erreur"), i18n.t("indiquer_raison"));
      return;
    }

    let reason = selectedReason !== "other"
      ? i18n.t(REASON_OPTIONS.find(opt => opt.value === selectedReason)?.labelKey)
      : otherReason.trim();

    if (selectedReason === "other" && !reason) {
      Alert.alert(i18n.t("erreur"), i18n.t("indiquer_raison"));
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error(i18n.t("utilisateur_non_connecte"));

      await addDoc(collection(db, "reports"), {
        userId: user.uid,
        activityId,
        activityTitle: activity?.title || null,
        reason,
        reasonType: selectedReason,
        createdAt: serverTimestamp(),
      });

      showMessage({
        message: i18n.t("merci_signalement"),
        description: i18n.t("signalement_examine") || "Nous examinerons votre signalement dans les plus brefs délais.",
        type: "success",
        duration: 3000,
      });

      navigation.goBack();
    } catch (error) {
      console.error("Erreur signalement:", error);
      showMessage({
        message: i18n.t("erreur_signalement"),
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityImage = () => {
    if (activityImage) return activityImage;
    if (activity?.images && activity.images.length > 0) return activity.images[0];
    return null;
  };

  const formatActivityDate = (date) => {
    if (!date) return "";
    // Handle Firebase Timestamp
    if (date?.toDate) {
      return moment(date.toDate()).format("DD MMM");
    }
    // Handle seconds timestamp
    if (date?.seconds) {
      return moment(date.seconds * 1000).format("DD MMM");
    }
    // Handle string format "DD/MM/YYYY"
    if (typeof date === "string" && date.includes("/")) {
      const parsed = moment(date, "DD/MM/YYYY");
      return parsed.isValid() ? parsed.format("DD MMM") : "";
    }
    // Handle other string or Date
    const parsed = moment(date);
    return parsed.isValid() ? parsed.format("DD MMM") : "";
  };

  const ReasonOption = ({ option }) => {
    const isSelected = selectedReason === option.value;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedReason(option.value)}
        style={[
          styles.reasonOption,
          {
            backgroundColor: isSelected
              ? option.color
              : isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
            borderColor: isSelected ? option.color : isDarkMode ? "#27272A" : "#E5E7EB",
          },
        ]}
      >
        <Text
          style={[
            styles.reasonText,
            {
              color: isSelected ? "#FFFFFF" : (isDarkMode ? "#FAFAFA" : "#18181B"),
            },
          ]}
          numberOfLines={1}
        >
          {i18n.t(option.labelKey)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDark : "#F5F5F7" }]}
      edges={["bottom"]}
    >
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={150}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Compact Activity Card - Style liste de conversation */}
        {(activity || loadingActivity) && (
          <Animated.View entering={FadeIn.duration(400)}>
            <View
              style={[
                styles.activityCard,
                {
                  backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                  borderColor: isDarkMode ? "#27272A" : "#E5E7EB",
                },
              ]}
            >
              {loadingActivity ? (
                <View style={styles.activityCardLoading}>
                  <ActivityIndicator color={COLORS.primary} size="small" />
                </View>
              ) : (
                <>
                  {/* Image miniature */}
                  {getActivityImage() ? (
                    <Image
                      source={{ uri: getActivityImage() }}
                      style={styles.activityImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.activityImage, styles.activityImagePlaceholder, { backgroundColor: isDarkMode ? "#27272A" : "#F3F4F6" }]}>
                      <Ionicons name="calendar-outline" size={20} color={isDarkMode ? "#52525B" : "#9CA3AF"} />
                    </View>
                  )}

                  {/* Infos de l'activité */}
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityTitle, { color: isDarkMode ? "#FAFAFA" : "#18181B" }]} numberOfLines={1}>
                      {activity?.title || i18n.t("activite")}
                    </Text>
                    <Text style={[styles.activityMeta, { color: isDarkMode ? "#71717A" : "#9CA3AF" }]} numberOfLines={1}>
                      {formatActivityDate(activity?.date)}{activity?.time ? ` • ${activity.time}` : ""}
                    </Text>
                  </View>

                  {/* Badge signalement */}
                  <View style={styles.reportIndicator}>
                    <Ionicons name="flag" size={16} color="#EF4444" />
                  </View>
                </>
              )}
            </View>
          </Animated.View>
        )}

        {/* Section titre signalement */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? "#FAFAFA" : "#18181B" }]}>
            {i18n.t("pourquoi_signalez_vous") || "Pourquoi signalez-vous cet événement ?"}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: isDarkMode ? "#71717A" : "#6B7280" }]}>
            {i18n.t("selectionnez_raison") || "Sélectionnez la raison principale"}
          </Text>
        </Animated.View>

        {/* Reason Options - Grille 2 par ligne */}
        <View style={styles.reasonsContainer}>
          {REASON_OPTIONS.map((option) => (
            <ReasonOption key={option.value} option={option} />
          ))}
        </View>

        {/* Optional Message Input - Always Visible */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.messageInputContainer}>
          <Text style={[styles.messageInputLabel, { color: isDarkMode ? "#A1A1AA" : "#6B7280" }]}>
            {i18n.t("message_facultatif") || "Message facultatif"}
          </Text>
          <TextInput
            style={[
              styles.messageInput,
              {
                backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                borderColor: isDarkMode ? "#27272A" : "#E5E7EB",
                color: isDarkMode ? "#FAFAFA" : "#18181B",
              },
            ]}
            placeholder={i18n.t("ajouter_details_facultatif") || "Ajouter des détails supplémentaires (facultatif)"}
            placeholderTextColor={isDarkMode ? "#52525B" : "#9CA3AF"}
            value={otherReason}
            onChangeText={setOtherReason}
            multiline
            numberOfLines={4}
            maxLength={400}
            editable={!loading}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: isDarkMode ? "#52525B" : "#9CA3AF" }]}>
            {otherReason.length}/400
          </Text>
        </Animated.View>

        {/* Submit Button */}
        <Animated.View entering={FadeInUp.duration(400).delay(600)} style={styles.submitContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSubmitReport}
            disabled={loading || !selectedReason}
            style={styles.submitButtonWrapper}
          >
            <LinearGradient
              colors={
                loading || !selectedReason
                  ? ["#9CA3AF", "#6B7280"]
                  : ["#EF4444", "#DC2626"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButton}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {i18n.t("envoyer_signalement") || "Envoyer le signalement"}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={[
              styles.cancelButton,
              {
                backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                borderColor: isDarkMode ? "#27272A" : "#E5E7EB",
              },
            ]}
          >
            <Text style={[styles.cancelButtonText, { color: isDarkMode ? "#A1A1AA" : "#6B7280" }]}>
              {i18n.t("annuler")}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Info Note */}
        <Animated.View entering={FadeIn.duration(400).delay(700)} style={styles.infoNote}>
          <Ionicons name="shield-checkmark-outline" size={18} color={isDarkMode ? "#52525B" : "#9CA3AF"} />
          <Text style={[styles.infoNoteText, { color: isDarkMode ? "#52525B" : "#9CA3AF" }]}>
            {i18n.t("signalement_confidentiel") || "Votre signalement est confidentiel et sera traité par notre équipe."}
          </Text>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 200,
  },

  // Compact Activity Card - Style liste
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  activityCardLoading: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activityImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  activityImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  activityInfo: {
    flex: 1,
    gap: 3,
  },
  activityTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  activityMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  reportIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Section Header
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },

  // Reason Options - Grille 2 par ligne
  reasonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  reasonOption: {
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 50,
    borderWidth: 1,
  },
  reasonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    textAlign: "center",
  },

  // Message Input
  messageInputContainer: {
    marginBottom: 24,
  },
  messageInputLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 10,
  },
  messageInput: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    minHeight: 100,
  },
  charCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "right",
    marginTop: 6,
  },

  // Submit Section
  submitContainer: {
    gap: 12,
    marginBottom: 20,
  },
  submitButtonWrapper: {
    borderRadius: 50,
    overflow: "hidden",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 50,
  },
  submitButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },

  // Info Note
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(107, 114, 128, 0.08)",
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  infoNoteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});

export default ReportReasonScreen;
