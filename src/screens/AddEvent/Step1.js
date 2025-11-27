import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { COLORS } from "../../styles/colors";
import Animated, { FadeInUp } from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import i18n from "../../../i18n";
import { useThemeContext } from "../../ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const Step1 = ({ userSUB, onNext, initialData }) => {
  const { isDarkMode } = useThemeContext();

  const [price, setPrice] = useState(initialData?.price?.toString() || "0");
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [maxParticipants, setMaxParticipants] = useState(initialData?.maxParticipants || 2);
  const allowedParticipants = userSUB === "pro" ? 20 : 5;
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  const titleInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleValidation = () => {
    let valid = true;
    let tempErrors = {};

    if (!title.trim()) {
      valid = false;
      tempErrors.title = i18n.t("titre_obligatoire");
    }
    if (!description.trim()) {
      valid = false;
      tempErrors.description = i18n.t("description_obligatoire");
    }
    if (maxParticipants < 2 || maxParticipants > 20) {
      valid = false;
      tempErrors.maxParticipants = i18n.t("nombre_participants_entre_2_et_20");
    }

    setErrors(tempErrors);
    return valid;
  };

  const handleNext = () => {
    if (handleValidation()) {
      onNext({ price, title, description, maxParticipants });
    } else {
      showMessage({
        message: i18n.t("erreur"),
        description: i18n.t("veuillez_corriger_erreurs_avant_continuer"),
        type: "warning",
      });
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      extraHeight={150}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }}
    >
      <Animated.View entering={FadeInUp.duration(400)} style={styles.container}>
        {/* Titre principal */}
        <View style={styles.headerSection}>
          <Text
            style={[
              styles.mainTitle,
              { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
            ]}
          >
            {i18n.t("creer_un_evenement")}
          </Text>
          <Text
            style={[
              styles.mainSubtitle,
              { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
            ]}
          >
            {i18n.t("donner_envie_de_ne_pas_rater_evenement")}
          </Text>
        </View>

        {/* Section Titre et Description */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderColor: isDarkMode ? "#2F3336" : "#E5E7EB",
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="create-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {i18n.t("details")}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {i18n.t("donner_envie_de_ne_pas_rater_evenement")}
              </Text>
            </View>
          </View>

          {/* Champ Titre */}
          <View style={styles.inputContainer}>
            <Text
              style={[
                styles.inputLabel,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              {i18n.t("titre")} *
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: errors.title
                    ? "#EF4444"
                    : focusedField === "title"
                    ? COLORS.primary
                    : isDarkMode
                    ? "#1F2937"
                    : "#D1D5DB",
                  backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF",
                },
              ]}
            >
              <TextInput
                ref={titleInputRef}
                style={[
                  styles.textInput,
                  { color: isDarkMode ? "#FFFFFF" : "#111827" },
                ]}
                placeholder={i18n.t("exemple_gravir_everest")}
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  setErrors((prev) => ({ ...prev, title: "" }));
                }}
                onFocus={() => setFocusedField("title")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          {/* Champ Description */}
          <View style={styles.inputContainer}>
            <Text
              style={[
                styles.inputLabel,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              {i18n.t("description")} *
            </Text>
            <View
              style={[
                styles.inputWrapper,
                styles.textAreaWrapper,
                {
                  borderColor: errors.description
                    ? "#EF4444"
                    : focusedField === "description"
                    ? COLORS.primary
                    : isDarkMode
                    ? "#1F2937"
                    : "#D1D5DB",
                  backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF",
                },
              ]}
            >
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  { color: isDarkMode ? "#FFFFFF" : "#111827" },
                ]}
                placeholder={i18n.t("donnez_plus_de_details")}
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  setErrors((prev) => ({ ...prev, description: "" }));
                }}
                onFocus={() => setFocusedField("description")}
                onBlur={() => setFocusedField(null)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>
        </View>

        {/* Section Participants */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderColor: isDarkMode ? "#2F3336" : "#E5E7EB",
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="people-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {i18n.t("participants")}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {i18n.t("nombre_participants_max_dont_vous", { max: allowedParticipants })}
              </Text>
            </View>
          </View>

          <View style={styles.participantControls}>
            <View style={styles.participantDisplay}>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  {
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                    opacity: maxParticipants <= 2 ? 0.3 : 1,
                  },
                ]}
                onPress={() => {
                  if (maxParticipants > 2) {
                    setMaxParticipants(maxParticipants - 1);
                    setErrors((prev) => ({ ...prev, maxParticipants: "" }));
                  }
                }}
                disabled={maxParticipants <= 2}
                activeOpacity={0.6}
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={isDarkMode ? "#FFFFFF" : "#1F2937"}
                />
              </TouchableOpacity>

              <View style={styles.countWrapper}>
                <Text style={styles.participantCount}>
                  {maxParticipants}
                </Text>
                <Text
                  style={[
                    styles.participantLabel,
                    { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
                  ]}
                >
                  personnes
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.controlButton,
                  {
                    backgroundColor: COLORS.primary,
                    opacity: maxParticipants >= allowedParticipants ? 0.3 : 1,
                  },
                ]}
                onPress={() => {
                  if (maxParticipants < allowedParticipants) {
                    setMaxParticipants(maxParticipants + 1);
                    setErrors((prev) => ({ ...prev, maxParticipants: "" }));
                  }
                }}
                disabled={maxParticipants >= allowedParticipants}
                activeOpacity={0.6}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          {errors.maxParticipants && (
            <Text style={styles.errorText}>{errors.maxParticipants}</Text>
          )}
        </View>

        {/* Section Prix (Pro uniquement) */}
        {userSUB === "pro" && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                borderColor: isDarkMode ? "#2F3336" : "#E5E7EB",
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.cardTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                  ]}
                >
                  {i18n.t("adhesion")}
                </Text>
                <Text
                  style={[
                    styles.cardSubtitle,
                    { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  {i18n.t("mettez_le_cout_de_ladhesion_a_votre_evenement_en_euros_ou_laissez_a_0_si_lentree_est_libre")}
                </Text>
              </View>
            </View>

            <View style={styles.priceInputContainer}>
              <TextInput
                style={[
                  styles.priceInput,
                  {
                    color: isDarkMode ? "#FFFFFF" : "#1F2937",
                  },
                ]}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={price}
                onChangeText={(text) => {
                  setPrice(text);
                  setErrors((prev) => ({ ...prev, price: "" }));
                }}
                placeholder="0"
              />
              <Text
                style={[
                  styles.currencySymbol,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                €
              </Text>
            </View>
            {errors.price && (
              <Text style={styles.errorText}>{errors.price}</Text>
            )}
          </View>
        )}

        {/* Bouton Suivant */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[COLORS.primary, `${COLORS.primary}DD`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>{i18n.t("suivant")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  container: {
    padding: 20,
    paddingBottom: 100,
    gap: 20,
  },
  headerSection: {
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    opacity: 0.8,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 8,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}08`,
    marginVertical: 8,
  },
  priceInput: {
    fontSize: 56,
    fontFamily: "Inter_800ExtraBold",
    textAlign: "center",
    minWidth: 120,
    letterSpacing: -1,
  },
  currencySymbol: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
  },
  participantControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  participantDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  countWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  participantCount: {
    fontSize: 40,
    fontFamily: "Inter_800ExtraBold",
    textAlign: "center",
    letterSpacing: -1,
    color: COLORS.primary,
  },
  participantLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  inputContainer: {
    marginVertical: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  inputWrapper: {
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  textAreaWrapper: {
    minHeight: 110,
  },
  textInput: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    paddingHorizontal: 16,
    paddingVertical: 14,
    lineHeight: 20,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 14,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
  },
  nextButton: {
    marginTop: 12,
    borderRadius: 9999,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
});

export default Step1;
