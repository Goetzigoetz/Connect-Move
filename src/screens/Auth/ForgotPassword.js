import { View, Text, SafeAreaView } from "react-native";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import BackButton from "../../components/Buttons/BackButton";
import {
  DEFAULT_FLATLIST_SCROLLVIEW_BOTTOM_PADDING,
  INPUT_CLASS,
  INPUT_CLASS_BORDER_BOTTOM,
} from "../../styles/constants";
import PrimaryButton from "../../components/Buttons/PrimaryButton";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { TextInput, Alert } from "react-native";
import { collection, getDocs, where, query } from "firebase/firestore";
import { auth, db } from "../../../config/firebase";
import { TouchableOpacity } from "react-native";
import { emailRegex } from "../../utils/allFunctions";
import { sendPasswordResetEmail } from "firebase/auth";
import { useTranslation } from "react-i18next";

export default function ForgotPassword({ navigation, route }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <BackButton onPress={navigation.goBack} />,
      headerTitle: t("screens.forgotPassword.pageTitle"),
    });
  }, [navigation]);

  useEffect(() => {
    navigation
      .getParent()
      ?.setOptions({ tabBarStyle: { display: "none" }, tabBarVisible: false });
  }, [navigation]);

  const validate = async () => {
    if (email == "") {
      Alert.alert(
        "Vous n'avez insérer aucune adresse e-mail valide",
        "Veuillez donc insérer votre adresse e-mail"
      );
      setIsLoading(false);
      return;
    }

    if (!emailRegex.test(email)) {
      Alert.alert(
        "Votre adresse e-mail est invalide",
        "Assurez-vous de bien vérifier l'orthographe"
      );
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const searchUserEmail = query(
      collection(db, "users"),
      where("email", "==", email)
    );

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Nous vous avons envoyé un e-mail de réinitialisation de mot de passe",
        "Veuillez suivre les étapes qui y sont indiquées"
      );
      navigation.goBack();
    } catch (error) {
      if (error.code == "auth/user-not-found") {
        Alert.alert(
          "Une erreur est survenue",
          "Aucun utilisateur trouvé avec cette addresse e-mail."
        );
        setIsLoading(false);
        return;
      }
      Alert.alert("Une erreur est survenue", `${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAwareScrollView
        className="px-4"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        scrollEnabled
        behavior="padding"
        contentContainerStyle={{
          paddingBottom: DEFAULT_FLATLIST_SCROLLVIEW_BOTTOM_PADDING,
        }}
      >
        <View className="">
          {/* <PageSubTitle title={"Connectes-toi à ton compte"} /> */}

          <View className="mt-5">
            <TextInput
              style={{ fontFamily: "Inter_500Medium" }}
              className={INPUT_CLASS_BORDER_BOTTOM}
              placeholder={t("inputs.email.placeholder")}
              placeholderTextColor={"gray"}
              value={email}
              onChangeText={setEmail}
            />
          </View>
          {/* login button */}
          <View className="mt-10 w-full bg-white flex-1">
            <PrimaryButton
              text={t("screens.forgotPassword.btn")}
              isLoading={isLoading}
              onPress={validate}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
