import { View, Text, SafeAreaView, Platform, StatusBar } from "react-native";
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
import PageSubTitle from "../../components/Titles/PageSubTitle";
import PageTitle from "../../components/Titles/PageTitle";
import { signInWithEmailAndPassword } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

export default function Login({ navigation, route }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordIsVisible, setPasswordIsVisible] = useState(false);

  useEffect(() => {
    Platform.OS === "ios"
      ? StatusBar.setBarStyle("dark-content")
      : (StatusBar.setBarStyle("light-content"),
        StatusBar.setBackgroundColor("#00000"));
    return () => {
      StatusBar.setBarStyle("light-content"),
        StatusBar.setBackgroundColor("#00000");
    };
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <BackButton onPress={navigation.goBack} />,
      headerTitle: t("screens.login.pageTitle"),
    });
  }, [navigation]);

  useEffect(() => {
    inputRef?.current?.focus();
    navigation
      .getParent()
      ?.setOptions({ tabBarStyle: { display: "none" }, tabBarVisible: false });
    return () => {
      if (!route?.params?.doNotShowNav) {
        navigation
          .getParent()
          ?.setOptions({ tabBarStyle: undefined, tabBarVisible: undefined });
      }
    };
  }, [navigation]);

  useEffect(() => {
    getLastLogin();
  }, []);

  async function getLastLogin() {
    const value = await AsyncStorage.getItem("USER_LAST_LOGIN");
    if (value !== null) {
      Alert.alert(
        `${t("screens.login.alert.title")}`,
        `${t("screens.login.alert.desc")}`,
        [
          {
            text: `${t("screens.login.alert.btn1")}`,
            onPress: () => {
              const userLastLogin = JSON.parse(value);
              setEmail(userLastLogin.email);
              setPassword(userLastLogin.password);
            },
          },
          {
            text: `${t("screens.login.alert.btn2")}`,
            style: "cancel",
          },
        ],
        {
          cancelable: true,
        }
      );
    }
  }

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

    if (password == "") {
      Alert.alert(
        "Votre mot de passe est incorrect",
        "Veuillez le ressaisir à nouveau"
      );
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      const jsonValue = JSON.stringify({ email, password });
      await AsyncStorage.setItem("USER_LAST_LOGIN", jsonValue);

      navigation.popToTop();
    } catch (error) {
      let errorMessage = "";
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Adresse e-mail invalide.";
          break;
        case "auth/user-disabled":
          errorMessage = "Ce compte utilisateur a été désactivé.";
          break;
        case "auth/user-not-found":
          errorMessage = "Aucun utilisateur trouvé avec cette addresse e-mail.";
          break;
        case "auth/wrong-password":
          errorMessage = "Mot de passe incorrect.";
          break;
        default:
          errorMessage = "Une erreur est survenue lors de la connexion.";
          break;
      }

      Alert.alert("Erreur de connexion", errorMessage);
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
          <View className="mt-5">
            <TextInput
              ref={inputRef}
              autoCorrect={false}
              autoCapitalize="none"
              style={{ fontFamily: "Inter_500Medium" }}
              className={INPUT_CLASS_BORDER_BOTTOM}
              placeholder={t("inputs.email.placeholder")}
              placeholderTextColor={"gray"}
              value={email}
              keyboardType="email-address"
              onChangeText={(val) => {
                setEmail(val);
              }}
            />
            <View className="mt-5">
              <View className="relative">
                {/* input */}
                <TextInput
                  style={{ fontFamily: "Inter_500Medium" }}
                  className={INPUT_CLASS_BORDER_BOTTOM}
                  placeholder={t("inputs.password.placeholder")}
                  placeholderTextColor={"gray"}
                  value={password}
                  secureTextEntry={!passwordIsVisible}
                  onChangeText={(val) => {
                    setPassword(val);
                  }}
                />
                {/* eyes button */}
                <TouchableOpacity
                  activeOpacity={0.5}
                  className="absolute -right-2 top-2 w-20 h-10 items-center justify-center rounded-full"
                  onPress={() => setPasswordIsVisible(!passwordIsVisible)}
                >
                  <Ionicons
                    name={passwordIsVisible ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={"black"}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword", { email })}
                activeOpacity={0.7}
                className="mt-4 ml-1 items-end"
              >
                <Text
                  style={{ fontFamily: "Inter_500Medium" }}
                  className="text-xs text-blue-500"
                >
                  {t("screens.login.forgotPassword")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* login button */}
          <View className="mt-10 w-full bg-white flex-1">
            <PrimaryButton
              text={t("screens.login.btn")}
              isLoading={isLoading}
              onPress={validate}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
