import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import grantPromotionalEntitlement from "../utils/grantPromotionalEntitlement";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import SettingsPageLayout from "../components/SettingsPageLayout";
import { COLORS } from "../styles/colors";
import { useThemeContext } from "../ThemeProvider";
import { useSubscription } from "../contexts/SubscriptionContext";

const CodePromoPage = ({ navigation }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();
  const { forceRefresh } = useSubscription();

  const [promoCode, setPromoCode] = useState("");
  const [isCodeLocked, setIsCodeLocked] = useState(false);

  useEffect(() => {
    checkIfAlreadyUsed();
  }, []);

  const checkIfAlreadyUsed = async () => {
    try {
      const userUID = auth.currentUser?.uid;
      if (!userUID) return;

      const userDocRef = doc(db, "users", userUID);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists() && userSnap.data().promoCodeUsed) {
        setPromoCode(userSnap.data().promoCodeUsed);
        setIsCodeLocked(true);
      }
    } catch (e) {
      console.error("Erreur lors du check promo déjà utilisé:", e);
    }
  };

  const handleValidatePromoCode = async () => {
    if (!promoCode || promoCode.trim().length < 3) {
      showMessage({
        message: t("veuillez_entrer_code_promo_valide"),
        type: "danger",
      });
      return;
    }

    try {
      const codesQuery = query(
        collection(db, "codes"),
        where("code", "==", promoCode.trim()),
        where("isActive", "==", true)
      );

      const snap = await getDocs(codesQuery);

      if (snap.empty) {
        showMessage({ message: t("code_promo_invalide_ou_expire"), type: "danger" });
        return;
      }

      const currentUserUID = auth.currentUser?.uid;
      if (!currentUserUID) {
        showMessage({ message: t("non_connecte"), type: "danger" });
        return;
      }

      const userRef = doc(db, "users", currentUserUID);
      await updateDoc(userRef, {
        promoCodeUsed: promoCode,
      });
      setIsCodeLocked(true);

      // Grant the promotional entitlement
      const entitlementId = "premium";
      const durationDays = 7;
      const duration = "weekly";

      const result = await grantPromotionalEntitlement(
        entitlementId,
        durationDays,
        duration
      );

      if (result.success) {
        // Synchroniser avec le contexte centralisé
        await forceRefresh();

        // Redirection vers PaymentResultScreen avec succès
        navigation.navigate("PaymentResultScreen", { success: true });
      } else {
        showMessage({
          message: result.error || t("erreur_lors_de_la_validation"),
          type: "danger",
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      showMessage({ message: t("erreur_lors_de_la_validation"), type: "danger" });
    }
  };


  return (
    <SettingsPageLayout
      title={t("code_promo")}
      subtitle={t("utilisez_code_promo_recompenses")}
    >
      {/* Section Saisie du code */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        style={styles.section}
      >
        <View
          style={[
            styles.inputCard,
            { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F7F9F9" },
          ]}
        >
          <Text
            style={[
              styles.inputLabel,
              { color: isDarkMode ? "#FFFFFF" : "#000000" },
            ]}
          >
            {t("entrez_votre_code_promo")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: isCodeLocked
                  ? isDarkMode
                    ? "#2F3336"
                    : "#E5E7EB"
                  : isDarkMode
                  ? "#3F3F46"
                  : "#D1D5DB",
                backgroundColor: isCodeLocked
                  ? isDarkMode
                    ? COLORS.bgDarkTertiary
                    : "#F3F4F6"
                  : isDarkMode
                  ? COLORS.bgDarkSecondary
                  : "#FFFFFF",
                color: isCodeLocked
                  ? isDarkMode
                    ? "#71717A"
                    : "#9CA3AF"
                  : isDarkMode
                  ? "#FFFFFF"
                  : "#000000",
              },
            ]}
            editable={!isCodeLocked}
            value={promoCode}
            onChangeText={(text) => setPromoCode(text)}
            placeholder={t("ex_code2025")}
            placeholderTextColor={isDarkMode ? "#71717A" : "#9CA3AF"}
          />

          {!isCodeLocked && (
            <TouchableOpacity
              onPress={handleValidatePromoCode}
              style={styles.validateButton}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>{t("valider_le_code")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Section Comment ça marche */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(200)}
        style={styles.section}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? "#FFFFFF" : "#000000" },
          ]}
        >
          {t("comment_ca_marche")}
        </Text>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F7F9F9" },
          ]}
        >
          <View style={styles.infoItem}>
            <View style={[styles.iconContainer, { backgroundColor: "#3B82F620" }]}>
              <MaterialCommunityIcons
                name="ticket-percent"
                size={20}
                color="#3B82F6"
              />
            </View>
            <Text
              style={[
                styles.infoText,
                { color: isDarkMode ? "#CBD5E1" : "#475569" },
              ]}
            >
              {t("entrez_code_promo_valide_recu_email")}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={[styles.iconContainer, { backgroundColor: "#10B98120" }]}>
              <MaterialCommunityIcons name="gift" size={20} color="#10B981" />
            </View>
            <Text
              style={[
                styles.infoText,
                { color: isDarkMode ? "#CBD5E1" : "#475569" },
              ]}
            >
              {t("activez_1_semaine_premium_gratuite")}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={[styles.iconContainer, { backgroundColor: "#EF444420" }]}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={20}
                color="#EF4444"
              />
            </View>
            <Text
              style={[
                styles.infoText,
                { color: isDarkMode ? "#CBD5E1" : "#475569" },
              ]}
            >
              {t("important_un_seul_code_promo_par_compte")}
            </Text>
          </View>
        </View>
      </Animated.View>
    </SettingsPageLayout>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  inputCard: {
    borderRadius: 16,
    padding: 20,
  },
  inputLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  input: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  validateButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: "center",
  },
  claimButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 8,
  },
});

export default CodePromoPage;
