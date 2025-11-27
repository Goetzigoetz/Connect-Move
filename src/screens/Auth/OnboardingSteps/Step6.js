import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import { useThemeContext } from "../../../ThemeProvider";
import { doc, setDoc } from "@react-native-firebase/firestore";
import { auth, db } from "../../../../config/firebase";
import moment from "moment";
import { createUniqueUsername } from "../../../utils/allFunctions";
import i18n from "../../../../i18n";
import { COLORS } from "../../../styles/colors";

const { width, height } = Dimensions.get("window");
import { API_URL } from "@env";

// Fonction pour générer un code de vérification à 6 chiffres
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Fonction pour envoyer l'email de vérification
const sendVerificationEmail = async (email, codeVerification) => {
  try {
    const response = await fetch(`${API_URL}/mail_verification.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        codeVerification,
        colors: {
          primary: COLORS.primary,
          secondary: COLORS.primary,
        },
      }),
    });

    if (response.ok) {
      const json = await response.json();
      console.log("Succès:", json.message || "Email de vérification envoyé");
      return json;
    } else {
      console.error("Erreur serveur:", response.status);
    }
  } catch (error) {
    console.error("Erreur requête:", error);
  }
};

const OnboardingStep6 = ({ userData, onNext, onBack, userId, email, navigation, clearOnboardingProgress, refreshNavigator }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();
  const [howDidYouKnow, setHowDidYouKnow] = useState(userData.howDidYouKnow || "");
  const [loading, setLoading] = useState(false);

  // Animations
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);
  const float4 = useSharedValue(0);
  const float5 = useSharedValue(0);
  const float6 = useSharedValue(0);
  const float7 = useSharedValue(0);
  const float8 = useSharedValue(0);
  const rotate = useSharedValue(0);
  const rotate2 = useSharedValue(0);
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    float1.value = withRepeat(withTiming(40, { duration: 3500, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float2.value = withRepeat(withTiming(-35, { duration: 4200, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float3.value = withRepeat(withTiming(28, { duration: 5000, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float4.value = withRepeat(withTiming(-22, { duration: 3800, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float5.value = withRepeat(withTiming(32, { duration: 4500, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float6.value = withRepeat(withTiming(-30, { duration: 4100, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float7.value = withRepeat(withTiming(25, { duration: 3600, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float8.value = withRepeat(withTiming(-28, { duration: 4700, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    rotate.value = withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1, false);
    rotate2.value = withRepeat(withTiming(-360, { duration: 18000, easing: Easing.linear }), -1, false);
    fadeAnim.value = withTiming(1, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  }, []);

  const circle1Style = useAnimatedStyle(() => ({ transform: [{ translateY: float1.value }, { translateX: float1.value * 0.5 }, { rotate: `${rotate.value}deg` }] }));
  const circle2Style = useAnimatedStyle(() => ({ transform: [{ translateY: float2.value }, { translateX: float2.value * -0.3 }, { rotate: `${-rotate.value}deg` }] }));
  const circle3Style = useAnimatedStyle(() => ({ transform: [{ translateY: float3.value }, { translateX: float3.value * 0.7 }] }));
  const circle4Style = useAnimatedStyle(() => ({ transform: [{ translateY: float4.value }, { translateX: float4.value * -0.5 }] }));
  const circle5Style = useAnimatedStyle(() => ({ transform: [{ translateY: float5.value }, { translateX: float5.value * 0.4 }, { scale: interpolate(float5.value, [0, 32], [1, 1.15]) }] }));
  const circle6Style = useAnimatedStyle(() => ({ transform: [{ translateY: float6.value }, { translateX: float6.value * 0.6 }, { rotate: `${rotate.value}deg` }] }));
  const circle7Style = useAnimatedStyle(() => ({ transform: [{ translateY: float7.value }, { translateX: float7.value * -0.4 }, { rotate: `${rotate2.value}deg` }] }));
  const circle8Style = useAnimatedStyle(() => ({ transform: [{ translateY: float8.value }, { translateX: float8.value * 0.3 }, { scale: interpolate(float8.value, [-28, 0], [1.1, 1]) }] }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ translateY: interpolate(fadeAnim.value, [0, 1], [20, 0]) }] }));

  const sources = [
    { value: "friend", label: t("onboarding_step6_option_ami"), icon: "people" },
    { value: "social-media", label: t("onboarding_step6_option_reseaux"), icon: "logo-instagram" },
    { value: "google", label: t("onboarding_step6_option_recherche"), icon: "logo-google" },
    { value: "app-store", label: t("onboarding_step6_option_store"), icon: "apps" },
    { value: "advertisement", label: t("onboarding_step6_option_publicite"), icon: "megaphone" },
    { value: "article", label: t("onboarding_step6_option_article"), icon: "newspaper" },
    { value: "other", label: t("onboarding_step6_option_autre"), icon: "ellipsis-horizontal" },
  ];

  const handleFinish = async () => {
    if (!howDidYouKnow) {
      showMessage({
        message: t("onboarding_step6_error"),
        type: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      const finalData = { ...userData, howDidYouKnow };
      const userName = createUniqueUsername(email, finalData.phoneNumber);

      // Si l'utilisateur s'est connecté via Google, Apple ou téléphone, l'email/téléphone est déjà vérifié
      const isEmailAlreadyVerified = finalData.loginMethod === "google" || finalData.loginMethod === "apple" || finalData.loginMethod === "phone";
      const verificationCode = isEmailAlreadyVerified ? null : generateVerificationCode();

      // Calculer l'âge
      let age = null;
      if (finalData.birthDate) {
        age = moment().diff(moment(finalData.birthDate), "years");
      }

      // Préparer les données utilisateur complètes
      const userDataToSave = {
        firstName: finalData.firstName,
        lastName: finalData.lastName,
        gender: finalData.gender,
        birthDate: finalData.birthDate ? moment(finalData.birthDate).toISOString() : null,
        age,
        expertiseLevel: finalData.expertiseLevel,
        interests: finalData.interests,
        location: finalData.location,
        howDidYouKnow: finalData.howDidYouKnow,
        username: userName,
        referralCode: userId.slice(0, 6).toUpperCase(),
        showMyProfile: true,
        createdAt: moment().toISOString(),
        lastLogin: moment().toISOString(),
        isActive: true,
        onboardingCompleted: true,
        verificationCode: isEmailAlreadyVerified ? null : verificationCode,
        emailVerified: isEmailAlreadyVerified, // Si Google/Apple/Phone, email/téléphone déjà vérifié
        loginMethod: finalData.loginMethod || "email",
        // Ajouter l'email si présent
        ...(email && { email }),
        // Ajouter le phoneNumber si présent
        ...(finalData.phoneNumber && { phoneNumber: finalData.phoneNumber }),
        // Ajouter la photo de profil si présente
        ...(finalData.photoURL && { photoURL: finalData.photoURL }),
      };

      // Mettre à jour le profil Firestore avec les vraies données (remplace le profil temporaire)
      await setDoc(doc(db, "users", userId), userDataToSave, { merge: false });

      // Envoyer l'email de vérification SEULEMENT si connexion par email/mot de passe
      if (!isEmailAlreadyVerified && verificationCode) {
        await sendVerificationEmail(email, verificationCode).catch(console.error);
      }

      // Effacer la progression d'onboarding sauvegardée
      if (clearOnboardingProgress) {
        await clearOnboardingProgress();
      }

      showMessage({
        message: t("onboarding_step6_success"),
        type: "success",
        duration: 3000,
      });

      // Si email déjà vérifié (Google/Apple/Phone), forcer le rechargement du Navigator
      // Sinon, naviguer vers VerifyEmail pour vérifier l'adresse email
      if (isEmailAlreadyVerified) {
        // Forcer le rechargement du Navigator pour qu'il détecte les changements
        // et redirige automatiquement vers MainTabs
        setTimeout(() => {
          if (refreshNavigator) {
            console.log("✅ Onboarding terminé - rechargement du Navigator");
            refreshNavigator();
          }
        }, 1500);
      } else {
        // Seulement pour connexion email/mot de passe
        navigation.replace("VerifyEmail", { email });
      }
    } catch (error) {
      console.error("Erreur lors de la création du profil:", error);
      showMessage({
        message: t("onboarding_step6_error_finalize"),
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
<ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, contentStyle]}>
{/* Title */}
          <Text style={styles.title}>{t("onboarding_step6_title")}</Text>
          <Text style={styles.subtitle}>
            {t("onboarding_step6_subtitle")}
          </Text>

          {/* Sources */}
          <View style={styles.sourcesContainer}>
            {sources.map((source) => (
              <TouchableOpacity
                key={source.value}
                style={[
                  styles.sourceCard,
                  howDidYouKnow === source.value && styles.sourceCardSelected,
                ]}
                onPress={() => setHowDidYouKnow(source.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={source.icon}
                  size={24}
                  color={
                    howDidYouKnow === source.value
                      ? COLORS.primary
                      : "rgba(0, 0, 0, 0.6)"
                  }
                />
                <Text
                  style={[
                    styles.sourceLabel,
                    howDidYouKnow === source.value && styles.sourceLabelSelected,
                  ]}
                >
                  {source.label}
                </Text>
                {howDidYouKnow === source.value && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          <Text style={styles.backButtonText}>{t("retour")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.finishButton, loading && styles.finishButtonDisabled]}
          onPress={handleFinish}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Text style={styles.finishButtonText}>{t("onboarding_step6_finish")}</Text>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  sportShape: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center"
  },
  shape1: { top: height * 0.08, left: width * 0.05 },
  shape2: { top: height * 0.15, right: width * 0.08 },
  shape3: { bottom: height * 0.06, left: width * 0.08 },
  shape4: { bottom: height * 0.08, right: width * 0.15 },
  shape5: { top: height * 0.35, right: width * 0.05 },
  shape6: { bottom: height * 0.2, right: width * 0.6 },
  shape7: { top: height * 0.1, right: width * 0.5 },
  shape8: { bottom: height * 0.22, left: width * 0.35 },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40
  },
title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24
  },
  sourcesContainer: {
    gap: 12
  },
  sourceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 16,
    borderWidth: 2,
    borderColor: "transparent"
  },
  sourceCardSelected: {
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.95)"
  },
  sourceLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium"
  },
  sourceLabelSelected: {
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold"
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 18,
    borderRadius: 9999,
    gap: 8,
    flex: 1
  },
  backButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 17
  },
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    borderRadius: 9999,
    gap: 8,
    flex: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  finishButtonDisabled: {
    opacity: 0.7
  },
  finishButtonText: {
    color: COLORS.primary,
    fontFamily: "Inter_700Bold",
    fontSize: 17
  },
});

export default OnboardingStep6;
