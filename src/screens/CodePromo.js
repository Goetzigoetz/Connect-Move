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
  updateDoc,
} from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import grantPromotionalEntitlement from "../utils/grantPromotionalEntitlement";
import Purchases from "react-native-purchases";
import { showMessage } from "react-native-flash-message";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, { FadeIn } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import i18n from "../../i18n";

const CodePromoPage = ({ navigation }) => {
  const [promoCode, setPromoCode] = useState("");
  const [isCodeLocked, setIsCodeLocked] = useState(false);
  const [canClaimReward, setCanClaimReward] = useState(false);

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

        if (userSnap.data().sub === "gratuit") {
          setCanClaimReward(true);
        }
      }
    } catch (e) {
      console.error("Erreur lors du check promo déjà utilisé:", e);
    }
  };

  const handleValidatePromoCode = async () => {
    if (!promoCode || promoCode.trim().length < 3) {
      showMessage({
        message: "Veuillez entrer un code promo valide.",
        type: "danger",
      });
      return;
    }

    try {
      // Vérifier dans Firestore
      const codesQuery = query(
        collection(db, "codes"),
        where("code", "==", promoCode.trim()), // sensible à la casse
        where("isActive", "==", true)
      );

      const snap = await getDocs(codesQuery);

      if (snap.empty) {
        showMessage({ message: "Code promo invalide ou expiré.", type: "danger" });
        return;
      }

      // Associer le code à l’utilisateur
      const currentUserUID = auth.currentUser?.uid;
      if (!currentUserUID) {
        showMessage({ message: "Non connecté.", type: "danger" });
        return;
      }

      const userRef = doc(db, "users", currentUserUID);
     await updateDoc(userRef, {
  promoCodeUsed: promoCode,
});
      setIsCodeLocked(true);
      setCanClaimReward(true);

      showMessage({
        message: "Code valide, vous pouvez réclamer votre semaine gratuite 🎉",
        type: "success",
      });
    } catch (error) {
      console.error("Erreur:", error);
      showMessage({ message: "Erreur lors de la validation.", type: "danger" });
    }
  };

  const handleGrantReward = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const appUserId = customerInfo.originalAppUserId;

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
          "Succès",
          "Votre abonnement d'une semaine a été activé avec succès ✅ Veuillez fermer et réouvrir l'app."
        );

        await Purchases.getCustomerInfo();
        await Purchases.syncPurchases();
        navigation.goBack();
      } else {
        Alert.alert("Impossible de récupérer l'ID utilisateur RevenueCat.");
      }
    } catch (error) {
      console.error("Erreur lors de l'octroi:", error);
      Alert.alert(`Erreur : ${error.message}`);
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
        {/* Saisie du code promo */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <Text
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            style={{ fontFamily: "Inter_500Medium" }}
          >
            Entrez votre code promo
          </Text>
          <TextInput
            className="block w-full pr-10 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
            style={[
              styles.input,
              {
                borderColor: isCodeLocked ? "#E5E7EB" : "#D1D5DB",
                backgroundColor: isCodeLocked ? "#F3F4F6" : "#FFFFFF",
                color: isCodeLocked ? "#9CA3AF" : "#111827",
              },
              isCodeLocked && styles.inputDisabled,
            ]}
            editable={!isCodeLocked}
            value={promoCode}
            onChangeText={(text) => setPromoCode(text)}
            placeholder="Ex: CODE2025"
            placeholderTextColor="#9CA3AF"
          />

          {!isCodeLocked && (
            <TouchableOpacity
              onPress={handleValidatePromoCode}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-full"
              activeOpacity={0.8}
            >
              <Text
                className="text-white text-base font-medium text-center"
                style={{ fontFamily: "Inter_500Medium" }}
              >
                Valider le code
              </Text>
            </TouchableOpacity>
          )}

          {canClaimReward && (
            <TouchableOpacity
              onPress={handleGrantReward}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-md"
              activeOpacity={0.8}
            >
              <Text
                className="text-white text-base font-medium text-center"
                style={{ fontFamily: "Inter_500Medium" }}
              >
                Obtenir 1 semaine Premium gratuite
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Section Explication */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <Text
            className="text-lg font-semibold text-gray-900 dark:text-white mb-5"
            style={{ fontFamily: "Inter_400Regular" }}
          >
            Comment ça marche ?
          </Text>

          <View className="flex-row items-start mb-4">
            <Ionicons
              name="pricetag-outline"
              size={20}
              color="#3B82F6"
              style={{ marginRight: 8 }}
            />
            <Text className="text-gray-700 dark:text-gray-300 flex-1">
              Entrez un <Text className="font-bold">code promo valide</Text> reçu
              par email ou événement spécial.
            </Text>
          </View>

          <View className="flex-row items-start mb-4">
            <Ionicons
              name="gift-outline"
              size={20}
              color="#10B981"
              style={{ marginRight: 8 }}
            />
            <Text className="text-gray-700 dark:text-gray-300 flex-1">
              Activez <Text className="font-bold">1 semaine Premium gratuite</Text>.
            </Text>
          </View>

          <View className="flex-row items-start">
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color="#EF4444"
              style={{ marginRight: 8 }}
            />
            <Text className="text-gray-700 dark:text-gray-300 flex-1">
              <Text className="font-bold">Important :</Text> un seul code promo
              peut être utilisé par compte.
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
  inputDisabled: {
    opacity: 0.6,
  },
});

export default CodePromoPage;
