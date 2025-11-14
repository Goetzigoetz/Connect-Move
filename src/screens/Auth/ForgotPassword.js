import React, { useState, useLayoutEffect, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  Alert,
  Pressable,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../../config/firebase";
import { sendPasswordResetEmail } from "@react-native-firebase/auth";
import { emailRegex } from "../../utils/allFunctions";
import { COLORS } from "../../styles/colors";
import PrimaryButton from "../../components/Buttons/PrimaryButton";
import BackButton from "../../components/Buttons/BackButton";
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";

export default function ForgotPassword() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  auth.languageCode = i18n.language || i18n.locale || "fr";

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <BackButton onPress={navigation.goBack} />,
      headerTitle: "",
    });
  }, [navigation]);

  useEffect(() => {
    navigation
      .getParent()
      ?.setOptions({ tabBarStyle: { display: "none" }, tabBarVisible: false });
  }, [navigation]);

  const handleResetPassword = async () => {
    if (email.trim() === "") {
      Alert.alert(
        "Adresse e-mail manquante",
        "Veuillez entrer votre adresse e-mail"
      );
      return;
    }

    if (!emailRegex.test(email)) {
      Alert.alert(
        "Adresse e-mail invalide",
        "Merci de vérifier l’orthographe de votre e-mail."
      );
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "E-mail envoyé ✅",
        "Nous vous avons envoyé un e-mail pour réinitialiser votre mot de passe. Vérifiez vos spams si besoin."
      );
      navigation.goBack();
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        Alert.alert(
          "Utilisateur introuvable",
          "Aucun compte n’est associé à cette adresse e-mail."
        );
      } else {
        Alert.alert("Erreur", "Une erreur est survenue : " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={200}
        className="bg-white dark:bg-gray-900 px-6"
      >
        <View className="flex-1 pt-8">
          <View className="mb-8">
            <Text
              style={{ fontFamily: "Inter_700Bold" }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            >
              {t("mot_de_passe_oublié")}
            </Text>
          </View>

          <View className="mb-6">
            <View className="relative">
              <TextInput
                style={{
                  fontFamily: "Inter_400Regular",
                  height: 56,
                }}
                placeholder={t("adresse_email")}
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-lg rounded pl-12 pr-12 border border-gray-300 dark:border-gray-700"
              />
              <View className="absolute left-4 top-5">
                <Ionicons name="mail-outline" size={24} color="#6B7280" />
              </View>
            </View>
          </View>

          <Pressable
            style={{
              backgroundColor: COLORS.primary,
              opacity: isLoading || !email ? 0.5 : 1,
            }} // Changez la couleur de fond ici
            onPress={() => handleResetPassword()}
            disabled={isLoading || !email}
            className={`py-3 rounded flex-row items-center justify-center`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white font-semibold text-lg mr-2">
                  {i18n.t("suivant")}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
