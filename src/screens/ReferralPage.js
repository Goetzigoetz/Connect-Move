import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  FieldPath,
  increment,
  arrayUnion,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import grantPromotionalEntitlement from "../utils/grantPromotionalEntitlement";
import Purchases from "react-native-purchases";
import { showMessage } from "react-native-flash-message";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import i18n from "../../i18n";
const ReferralPage = ({ navigation }) => {
  const [referralCode, setReferralCode] = useState("");
  const [userReferralCode, setUserReferralCode] = useState("");
  const [isReferralLocked, setIsReferralLocked] = useState(false);
  const [promoButton, setPromoButton] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

const fetchUserData = async () => {
  const userUID = auth.currentUser?.uid;
  if (userUID) {
    setUserReferralCode(userUID.slice(0, 6));
  }

  try {
    const userDocRef = doc(db, "users", userUID);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists() && userDocSnap.data().parrainId) {
      setReferralCode(userDocSnap.data().parrainId.slice(0, 6));
      setIsReferralLocked(true);
    }
    if (userDocSnap.exists() && userDocSnap.data().sub === "gratuit") {
      setPromoButton(true);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données utilisateur :", error);
  }
};

const handleValidateReferralCode = async () => {
  if (!referralCode || referralCode.length !== 6) {
    showMessage({
      message: "Veuillez entrer un code valide.",
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

    const usersQuery = query(
      collection(db, "users"),
      where(FieldPath.documentId(), ">=", referralCode),
      where(FieldPath.documentId(), "<=", referralCode + "\uf8ff")
    );
    const querySnapshot = await getDocs(usersQuery);

    if (querySnapshot.empty) {
      showMessage({ message: "Code invalide.", type: "danger" });
      return;
    }

    const parrainDoc = querySnapshot.docs[0];
    const parrainData = parrainDoc.data();
    const parrainId = parrainDoc.id;
    const parrainRole = parrainData.sub;
    const currentUserUID = auth.currentUser?.uid;

    if (!currentUserUID) {
      showMessage({ message: "Non connecté.", type: "danger" });
      return;
    }

    // Transactions batch
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
      message: `Code validé, ${points[parrainRole]} pièces vous ont été envoyées à vous et à votre parrain`,
      type: "success",
    });
    fetchUserData();
  } catch (error) {
    console.error("Erreur:", error);
    showMessage({ message: "Erreur lors de la validation.", type: "danger" });
  }
};

  const handleGrantReward = async () => {
    try {
      // Obtenir l'ID utilisateur RevenueCat actuel
      const customerInfo = await Purchases.getCustomerInfo();
      const appUserId = customerInfo.originalAppUserId; // Ou l'ID que vous utilisez

      const entitlementId = "premium";
      const durationDays = 7;
      const duration = "weekly";

      if (appUserId) {
        await grantPromotionalEntitlement(
          appUserId,
          entitlementId,
          durationDays,
          duration
        );
        await AsyncStorage.setItem("sub", entitlementId);
        Alert.alert(
          `Votre abonnement a été activé avec succès, veuillez fermer l'app et la réouvrir si les changements n'ont pas été directement éffectués.`
        );

        await Purchases.getCustomerInfo(); // ou getCustomerInfo() à nouveau
        await Purchases.syncPurchases(); // ou getCustomerInfo() à nouveau
        navigation.goBack();
      } else {
        Alert.alert("Impossible de récupérer l'ID utilisateur.");
      }
    } catch (error) {
      console.error("Erreur lors de l'octroi de la récompense:", error);
      Alert.alert(
        `Erreur : ${error.message || "Impossible d'accorder la récompense."}`
      );
    }
  };

  return (
    <KeyboardAwareScrollView
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraHeight={200}
      className="flex-1 bg-gray-100 dark:bg-gray-900"
    >
      <Animated.View entering={FadeIn.duration(200)} className="p-5">
        {/* Header */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-lg font-semibold text-gray-900 dark:text-white"
              style={{ fontFamily: "Inter_400Regular" }}
            >
              {i18n.t("votre_code_de_parrainage")}
            </Text>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#3B82F6"
            />
          </View>
          <Text
            className="text-4xl font-bold text-blue-600 dark:text-blue-400 tracking-tight"
            style={{ fontFamily: "Inter_500Medium" }}
          >
            {userReferralCode || i18n.t("chargement")}
          </Text>
          <Text
            className="text-sm text-gray-500 dark:text-gray-400 mt-1"
            style={{ fontFamily: "Inter_400Regular" }}
          >
            {i18n.t(
              "partagez_ce_code_avec_vos_amis_pour_quils_beneficient_davantages"
            )}
          </Text>
        </View>

        {/* Enter Referral Code Section */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <Text
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            style={{ fontFamily: "Inter_500Medium" }}
          >
            {i18n.t("entrez_un_code_de_parrainage")}
          </Text>
          <View className="mt-1 relative rounded-md">
            <TextInput
              className="block w-full pr-10 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
              style={[
                styles.input,
                {
                  borderColor: isReferralLocked ? "#E5E7EB" : "#D1D5DB",
                  backgroundColor: isReferralLocked ? "#F3F4F6" : "#FFFFFF",
                  color: isReferralLocked ? "#9CA3AF" : "#111827",
                },
                isReferralLocked && styles.inputDisabled,
              ]}
              editable={!isReferralLocked}
              value={referralCode}
              onChangeText={(text) => setReferralCode(text)}
              maxLength={6}
              placeholder="XXXXXX"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <Text
            className="mt-2 text-sm text-gray-500 dark:text-gray-400"
            style={{ fontFamily: "Inter_400Regular" }}
          >
            {i18n.t("sensible_a_la_casse")}
          </Text>

          {/* Validate Button */}
          {!isReferralLocked && (
            <TouchableOpacity
              onPress={handleValidateReferralCode}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              activeOpacity={0.8}
            >
              <Text
                className="text-white text-base font-medium text-center"
                style={{ fontFamily: "Inter_500Medium" }}
              >
                {i18n.t("valider_le_code")}
              </Text>
            </TouchableOpacity>
          )}
          {promoButton && isReferralLocked && (
            <TouchableOpacity
              onPress={handleGrantReward}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              activeOpacity={0.8}
            >
              <Text
                className="text-white text-base font-medium text-center"
                style={{ fontFamily: "Inter_500Medium" }}
              >
                {i18n.t("obtenir_1_semaine_premium_gratuit")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* How it Works Section */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <Text
            className="text-lg font-semibold text-gray-900 dark:text-white mb-5"
            style={{ fontFamily: "Inter_400Regular" }}
          >
            {i18n.t("comment_ca_marche")}
          </Text>

          {/* Step 1: Invite Friends */}
          <View className="flex-row items-start mb-4">
            <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3 flex-shrink-0">
              <Ionicons name="person-add-outline" size={16} color="#3B82F6" />
            </View>
            <Text
              className="text-sm text-gray-700 dark:text-gray-300 flex-1"
              style={{ fontFamily: "Inter_500Medium", lineHeight: 20 }}
            >
              <Text className="font-bold">
                {i18n.t(
                  "partagez_ce_code_avec_vos_amis_pour_quils_beneficient_davantages"
                )}
              </Text>{" "}
            </Text>
          </View>

          {/* Step 2: Earn Rewards */}
          <View className="flex-row items-start mb-4">
            <View className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3 flex-shrink-0">
              <Ionicons name="gift-outline" size={16} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text
                className="text-sm text-gray-700 dark:text-gray-300"
                style={{ fontFamily: "Inter_500Medium", lineHeight: 20 }}
              >
                <Text className="font-bold">
                  {i18n.t("gagnez_des_recompenses")}
                </Text>{" "}
                {i18n.t("selon_le_type_de_compte_de_votre_ami")}
              </Text>
              {/* Rewards List */}
              <View className="mt-2 pl-2">
                <Text
                  className="text-xs text-gray-600 dark:text-gray-400"
                  style={{ fontFamily: "Inter_400Regular" }}
                >
                  • <Text className="font-semibold">{i18n.t("50_pieces")}</Text>{" "}
                  {i18n.t("compte_gratuit")}
                </Text>
                <Text
                  className="text-xs text-gray-600 dark:text-gray-400"
                  style={{ fontFamily: "Inter_400Regular" }}
                >
                  •{" "}
                  <Text className="font-semibold">{i18n.t("100_pieces")}</Text>{" "}
                  {i18n.t("compte_premium")}
                </Text>
                <Text
                  className="text-xs text-gray-600 dark:text-gray-400"
                  style={{ fontFamily: "Inter_400Regular" }}
                >
                  •{" "}
                  <Text className="font-semibold">{i18n.t("150_pieces")}</Text>{" "}
                  {i18n.t("compte_pro")}
                </Text>
              </View>
            </View>
          </View>

          {/* Step 3: Limitation */}
          <View className="flex-row items-start">
            <View className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mr-3 flex-shrink-0">
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
            </View>
            <Text
              className="text-sm text-gray-700 dark:text-gray-300 flex-1"
              style={{ fontFamily: "Inter_500Medium", lineHeight: 20 }}
            >
              <Text className="font-bold">{i18n.t("important")}</Text>{" "}
              {i18n.t("vous_ne_pouvez_avoir_qu_un_seul_parrain")}
            </Text>
          </View>
        </View>
      </Animated.View>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 40,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 6,
  },
});

export default ReferralPage;
