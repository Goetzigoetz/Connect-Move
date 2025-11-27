import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Clipboard,
} from "react-native";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  increment,
  arrayUnion,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import grantPromotionalEntitlement from "../utils/grantPromotionalEntitlement";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "../ThemeProvider";
import SettingsPageLayout from "../components/SettingsPageLayout";
import { COLORS } from "../styles/colors";
import { useSubscription } from "../contexts/SubscriptionContext";

const ReferralPage = ({ navigation }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();
  const { forceRefresh } = useSubscription();

  const [referralCode, setReferralCode] = useState("");
  const [userReferralCode, setUserReferralCode] = useState("");
  const [isReferralLocked, setIsReferralLocked] = useState(false);
  const [promoButton, setPromoButton] = useState(false);
  const [pointsConfig, setPointsConfig] = useState({
    parrain_gratuit_point: 0,
    parrain_premium_point: 0,
    parrain_pro_point: 0,
  });

  const scrollViewRef = useRef(null);
  const inputSectionRef = useRef(null);

  const handleInputFocus = () => {
    // Scroll vers la section input avec animation smooth
    setTimeout(() => {
      inputSectionRef.current?.measureLayout(
        scrollViewRef.current,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
        }
      );
    }, 100);
  };

  useEffect(() => {
    fetchUserData();
    fetchPointsConfig();
  }, []);

const fetchPointsConfig = async () => {
  try {
    const pointsDocRef = doc(db, "admin", "defispoint");
    const pointsDocSnap = await getDoc(pointsDocRef);

    if (pointsDocSnap.exists()) {
      const data = pointsDocSnap.data();
      setPointsConfig({
        parrain_gratuit_point: data.parrain_gratuit_point || 0,
        parrain_premium_point: data.parrain_premium_point || 0,
        parrain_pro_point: data.parrain_pro_point || 0,
      });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la configuration des points :", error);
  }
};

const fetchUserData = async () => {
  const userUID = auth.currentUser?.uid;
  if (userUID) {
    setUserReferralCode(userUID.slice(0, 6).toUpperCase());
  }

  try {
    const userDocRef = doc(db, "users", userUID);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists() && userDocSnap.data().parrainId) {
      setReferralCode(userDocSnap.data().parrainId.slice(0, 6).toUpperCase());
      setIsReferralLocked(true);
    }
    if (userDocSnap.exists() && userDocSnap.data().sub === "gratuit") {
      setPromoButton(true);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données utilisateur :", error);
  }
};

const handleCopyCode = async () => {
  try {
    await Clipboard.setString(userReferralCode);
    showMessage({
      message: t("code_copie"),
      type: "success",
    });
  } catch (error) {
    showMessage({
      message: t("erreur_copie"),
      type: "danger",
    });
  }
};

const handleValidateReferralCode = async () => {
  if (!referralCode || referralCode.length !== 6) {
    showMessage({
      message: t("veuillez_entrer_un_code_valide"),
      type: "danger",
    });
    return;
  }

  try {
    const pointsDocRef = doc(db, "admin", "defispoint");
    const pointsDocSnap = await getDoc(pointsDocRef);
    const pointsConfig = pointsDocSnap.data();

    const points = {
      pro: pointsConfig.parrain_pro_point,
      premium: pointsConfig.parrain_premium_point,
      gratuit: pointsConfig.parrain_gratuit_point,
    };

    // Convertir en majuscules pour recherche insensible à la casse
    const normalizedCode = referralCode.toUpperCase();

    // Rechercher par champ referralCode au lieu de documentId
    const usersQuery = query(
      collection(db, "users"),
      where("referralCode", "==", normalizedCode)
    );
    const querySnapshot = await getDocs(usersQuery);

    if (querySnapshot.empty) {
      showMessage({ message: t("code_invalide"), type: "danger" });
      return;
    }

    const parrainDoc = querySnapshot.docs[0];
    const parrainData = parrainDoc.data();
    const parrainId = parrainDoc.id;
    const parrainRole = parrainData.sub;
    const currentUserUID = auth.currentUser?.uid;

    if (!currentUserUID) {
      showMessage({ message: t("non_connecte"), type: "danger" });
      return;
    }

    const batch = writeBatch(db);
    const userRef = doc(db, "users", currentUserUID);
    const parrainRef = doc(db, "users", parrainId);
    const defisRef = doc(db, "defis", currentUserUID);

    batch.update(userRef, {
      parrainId,
      pieces: increment(points[parrainRole]),
    });

    batch.update(parrainRef, {
      parrainedIds: arrayUnion(currentUserUID),
      pieces: increment(points[parrainRole]),
    });

    batch.set(defisRef, {
      userId: currentUserUID,
      type: "parrainage",
      createdAt: serverTimestamp(),
      points: points[parrainRole],
    });

    await batch.commit();

    showMessage({
      message: t("code_valide_pieces_envoyees", { points: points[parrainRole] }),
      type: "success",
    });
    fetchUserData();
  } catch (error) {
    console.error("Erreur:", error);
    showMessage({ message: t("erreur_lors_de_la_validation"), type: "danger" });
  }
};

  const handleGrantReward = async () => {
    try {
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

        showMessage({
          message: t("recompense_accordee"),
          description: t("abonnement_premium_active"),
          type: "success",
        });

        navigation.goBack();
      } else {
        Alert.alert(
          t("erreur"),
          result.error || t("impossible_accorder_recompense")
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'octroi de la récompense:", error);
      Alert.alert(
        t("erreur"),
        error.message || t("impossible_accorder_recompense")
      );
    }
  };

  return (
    <SettingsPageLayout
      title={t("parrainage")}
      subtitle={t("partagez_et_gagnez_des_recompenses")}
      scrollViewRef={scrollViewRef}
      enableKeyboardAvoiding={true}
    >
      {/* Votre code */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        style={styles.section}
      >
        <View
          style={[
            styles.codeCard,
            { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F7F9F9" },
          ]}
        >
          <View style={styles.codeHeader}>
            <Text
              style={[
                styles.codeTitle,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              {t("votre_code_de_parrainage")}
            </Text>
            <TouchableOpacity onPress={handleCopyCode} activeOpacity={0.7}>
              <MaterialCommunityIcons
                name="content-copy"
                size={24}
                color="#3B82F6"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleCopyCode} activeOpacity={0.7}>
            <Text style={styles.codeValue}>
              {userReferralCode || t("chargement")}
            </Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.codeDescription,
              { color: isDarkMode ? "#94A3B8" : "#64748B" },
            ]}
          >
            {t("partagez_ce_code_avec_vos_amis_pour_quils_beneficient_davantages")}
          </Text>
        </View>
      </Animated.View>

      {/* Entrer un code */}
      <Animated.View
        ref={inputSectionRef}
        entering={FadeInDown.duration(500).delay(200)}
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
            {t("entrez_un_code_de_parrainage")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: isReferralLocked
                  ? isDarkMode
                    ? "#2F3336"
                    : "#E5E7EB"
                  : isDarkMode
                  ? "#3F3F46"
                  : "#D1D5DB",
                backgroundColor: isReferralLocked
                  ? isDarkMode
                    ? "#1A1A1A"
                    : "#F3F4F6"
                  : isDarkMode
                  ? "#0A0A0A"
                  : "#FFFFFF",
                color: isReferralLocked
                  ? isDarkMode
                    ? "#71717A"
                    : "#9CA3AF"
                  : isDarkMode
                  ? "#FFFFFF"
                  : "#000000",
              },
            ]}
            editable={!isReferralLocked}
            value={referralCode}
            onChangeText={(text) => setReferralCode(text.toUpperCase())}
            onFocus={handleInputFocus}
            maxLength={6}
            placeholder="XXXXXX"
            placeholderTextColor={isDarkMode ? "#71717A" : "#9CA3AF"}
            autoCapitalize="characters"
          />

          {!isReferralLocked && (
            <TouchableOpacity
              onPress={handleValidateReferralCode}
              style={styles.validateButton}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>{t("valider_le_code")}</Text>
            </TouchableOpacity>
          )}

          {promoButton && isReferralLocked && (
            <TouchableOpacity
              onPress={handleGrantReward}
              style={styles.rewardButton}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {t("obtenir_1_semaine_premium_gratuit")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Comment ça marche */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(300)}
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
            styles.howItWorksCard,
            { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F7F9F9" },
          ]}
        >
          {/* Étape 1 */}
          <View style={styles.stepItem}>
            <View style={[styles.stepIcon, { backgroundColor: "#3B82F620" }]}>
              <MaterialCommunityIcons
                name="account-multiple-plus"
                size={20}
                color="#3B82F6"
              />
            </View>
            <Text
              style={[
                styles.stepText,
                { color: isDarkMode ? "#CBD5E1" : "#475569" },
              ]}
            >
              {t("partagez_ce_code_avec_vos_amis_pour_quils_beneficient_davantages")}
            </Text>
          </View>

          {/* Étape 2 */}
          <View style={styles.stepItem}>
            <View style={[styles.stepIcon, { backgroundColor: "#10B98120" }]}>
              <MaterialCommunityIcons name="gift" size={20} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.stepText,
                  { color: isDarkMode ? "#CBD5E1" : "#475569" },
                ]}
              >
                <Text style={styles.stepBold}>{t("gagnez_des_recompenses")}</Text>{" "}
                {t("selon_le_type_de_compte_de_votre_ami")}
              </Text>
              <View style={styles.rewardsList}>
                <View style={styles.rewardItem}>
                  <View style={styles.rewardBullet} />
                  <Text
                    style={[
                      styles.rewardText,
                      { color: isDarkMode ? "#94A3B8" : "#64748B" },
                    ]}
                  >
                    <Text style={styles.rewardPoints}>
                      {pointsConfig.parrain_gratuit_point} {t("pieces")}
                    </Text>{" "}
                    - {t("compte_gratuit")}
                  </Text>
                </View>
                <View style={styles.rewardItem}>
                  <View style={styles.rewardBullet} />
                  <Text
                    style={[
                      styles.rewardText,
                      { color: isDarkMode ? "#94A3B8" : "#64748B" },
                    ]}
                  >
                    <Text style={styles.rewardPoints}>
                      {pointsConfig.parrain_premium_point} {t("pieces")}
                    </Text>{" "}
                    - {t("compte_premium")}
                  </Text>
                </View>
                <View style={styles.rewardItem}>
                  <View style={styles.rewardBullet} />
                  <Text
                    style={[
                      styles.rewardText,
                      { color: isDarkMode ? "#94A3B8" : "#64748B" },
                    ]}
                  >
                    <Text style={styles.rewardPoints}>
                      {pointsConfig.parrain_pro_point} {t("pieces")}
                    </Text>{" "}
                    - {t("compte_pro")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Étape 3 */}
          <View style={[styles.stepItem, { marginBottom: 0 }]}>
            <View style={[styles.stepIcon, { backgroundColor: "#EF444420" }]}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={20}
                color="#EF4444"
              />
            </View>
            <Text
              style={[
                styles.stepText,
                { color: isDarkMode ? "#CBD5E1" : "#475569" },
              ]}
            >
              <Text style={styles.stepBold}>{t("important")}</Text>{" "}
              {t("vous_ne_pouvez_avoir_qu_un_seul_parrain")}
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
  // Code Card
  codeCard: {
    borderRadius: 16,
    padding: 20,
  },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  codeTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    letterSpacing: -0.3,
  },
  codeValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 40,
    color: "#3B82F6",
    letterSpacing: 4,
    marginBottom: 8,
  },
  codeDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  // Input Card
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
    borderRadius: 9999,
    marginBottom: 16,
  },
  validateButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: "center",
  },
  rewardButton: {
    backgroundColor: "#10B981",
    borderRadius: 9999,
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
  // How It Works
  howItWorksCard: {
    borderRadius: 16,
    padding: 20,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 8,
  },
  stepBold: {
    fontFamily: "Inter_600SemiBold",
  },
  rewardsList: {
    marginTop: 12,
    paddingLeft: 8,
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  rewardBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#10B981",
    marginTop: 8,
    marginRight: 8,
  },
  rewardText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  rewardPoints: {
    fontFamily: "Inter_600SemiBold",
  },
});

export default ReferralPage;
