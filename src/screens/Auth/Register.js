import { View, Text, SafeAreaView, Platform, StatusBar } from "react-native";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import BackButton from "../../components/Buttons/BackButton";
import {
  DEFAULT_FLATLIST_SCROLLVIEW_BOTTOM_PADDING,
  INPUT_CLASS,
  INPUT_CLASS_BORDER_BOTTOM,
  mySelectStyle,
} from "../../styles/constants";
import PrimaryButton from "../../components/Buttons/PrimaryButton";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { TextInput, Alert } from "react-native";
import {
  collection,
  getDocs,
  where,
  query,
  setDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "../../../config/firebase";
import { TouchableOpacity } from "react-native";
import { emailRegex } from "../../utils/allFunctions";
import PageSubTitle from "../../components/Titles/PageSubTitle";
import PageTitle from "../../components/Titles/PageTitle";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import RNPickerSelect from "react-native-picker-select";
import Icon from "../../components/Icons";
import { COLORS } from "../../styles/colors";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import moment from "moment";
import sendAdminNotif from "../../utils/sendAdminNotif";
import { useTranslation } from "react-i18next";

export default function Register({ navigation, route }) {
  const { t } = useTranslation();

  const inputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [secondFirstName, setSecondFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [knowing, setKnowing] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifPassword, setVerifPassword] = useState("");
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
      headerTitle: t("screens.register.pageTitle"),
      headerRight: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={validate}
          className="flex-row items-center justify-end"
        >
          <Text
            className="text-sm underline"
            style={{
              fontFamily: "Inter_500Medium",
              color: COLORS.primary,
            }}
          >
            {t("screens.register.finish")}
          </Text>
        </TouchableOpacity>
      ),
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

  const validate = async () => {
    if (firstName == "" || lastName == "") {
      Alert.alert(
        "Nous avons besoin de savoir qui vous êtes",
        "Veuillez donc insérer votre nom et aussi votre prénom, des documents de vérification d'identité peuvent aussi vous être demandés"
      );
      setIsLoading(false);
      return;
    }

    if (email == "") {
      Alert.alert(
        "Votre adresse e-mail est invalide",
        "Assurez-vous de bien vérifier l'orthographe"
      );
      setIsLoading(false);
      return;
    }

    if (password == "" || password.length < 4) {
      Alert.alert(
        "Votre mot de passe est nul ou insuffisant",
        "Veuillez le ressaisir à nouveau"
      );
      setIsLoading(false);
      return;
    }

    if (password !== verifPassword) {
      Alert.alert(
        "Les deux mots de passe saisis sont incorrects",
        "Veuillez les ressaisir à nouveau"
      );
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await createUserWithEmailAndPassword(auth, email, password);

      const myRef = doc(db, "users", res.user.uid);
      await setDoc(
        myRef,
        {
          firstName:
            secondFirstName == ""
              ? firstName
              : firstName + " " + secondFirstName,
          lastName: lastName,
          knowing: knowing,
          email: email,
          createdAt: moment().format(),
        },
        { merge: true }
      );
      await updateProfile(auth.currentUser, {
        displayName: firstName + " " + lastName,
      });
      sendAdminNotif(`✅ Nouvelle inscription: ${firstName + " " + lastName}`);
      sendEmailVerification(auth.currentUser)
      // navigation.navigate("ValidateProfileStep1");
    } catch (error) {
      switch (error.code) {
        case "auth/email-already-in-use":
          Alert.alert("Une erreur est survenue", "Adresse e-mail déjà utilisé");
          break;
        case "auth/invalid-email":
          Alert.alert(
            "Une erreur est survenue",
            "L'adresse Email est invalide"
          );
          break;
        case "auth/operation-not-allowed":
          Alert.alert("Une erreur est survenue", "Opération non autorisée");
          break;
        case "auth/weak-password":
          Alert.alert("Une erreur est survenue", "Mot de passe trop faible");
          break;
        default:
          Alert.alert("Une erreur est survenue", `${error}`);
          console.log(error);
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const DnstWork = () => {
    alert("Ne fonctionne pas encore");
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
          <View className="">
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-sm py-2 px-1"
            >
              {t("screens.register.personalInfo")}
            </Text>
            <View className="w-full mt-3">
              <TextInput
                ref={inputRef}
                style={{ fontFamily: "Inter_500Medium" }}
                className={INPUT_CLASS_BORDER_BOTTOM}
                placeholder={t("inputs.lastName.placeholder")}
                placeholderTextColor={"gray"}
                value={lastName}
                onChangeText={(val) => {
                  setLastName(val);
                }}
              />
            </View>
            <View className="w-full mt-3">
              <TextInput
                style={{ fontFamily: "Inter_500Medium" }}
                className={INPUT_CLASS_BORDER_BOTTOM}
                placeholder={t("inputs.firstName.placeholder")}
                placeholderTextColor={"gray"}
                value={firstName}
                onChangeText={(val) => {
                  setFirstName(val);
                }}
              />
            </View>
            <View className="w-full mt-3">
              <TextInput
                style={{ fontFamily: "Inter_500Medium" }}
                className={INPUT_CLASS_BORDER_BOTTOM}
                placeholder={t("inputs.secondFirstName.placeholder")}
                placeholderTextColor={"gray"}
                value={secondFirstName}
                onChangeText={(val) => {
                  setSecondFirstName(val);
                }}
              />
            </View>

            <View className="mt-3">
              <Text
                style={{ fontFamily: "Inter_500Medium" }}
                className="text-sm py-2 px-1"
              >
                {t("screens.register.knowing")}
              </Text>
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                className="mb-5"
              >
                <RNPickerSelect
                  Icon={() =>
                    Platform.OS === "ios" && (
                      <View className="mt-1">
                        <Icon bgNone icon={"chevron-down-outline"} w={20} />
                      </View>
                    )
                  }
                  style={{
                    inputIOS: mySelectStyle,
                    inputAndroid: mySelectStyle,
                    placeholder: { color: "black" },
                  }}
                  doneText={"Valider"}
                  onValueChange={(value) => setKnowing(value)}
                  items={[
                    {
                      label: "Facebook",
                      value: "Facebook",
                    },
                    {
                      label: "Instagram",
                      value: "Instagram",
                    },
                    {
                      label: "TikTok",
                      value: "TikTok",
                    },
                    {
                      label: "Publicité télévisée",
                      value: "Publicité télévisée",
                    },
                    {
                      label: "Bouche à oreille",
                      value: "Bouche à oreille",
                    },
                  ]}
                  placeholder={{ label: t("inputs.select"), value: null }}
                />
              </Animated.View>
            </View>
          </View>
          <View className="mt-5">
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-sm py-2 px-1"
            >
              Adresse e-mail
            </Text>
            <TextInput
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
              <Text
                style={{ fontFamily: "Inter_500Medium" }}
                className="text-sm py-2 px-1"
              >
                Mot de passe
              </Text>
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
              <View className="relative">
                {/* input */}
                <TextInput
                  style={{ fontFamily: "Inter_500Medium" }}
                  className={INPUT_CLASS_BORDER_BOTTOM}
                  placeholder={t("inputs.passwordVerif.placeholder")}
                  placeholderTextColor={"gray"}
                  value={verifPassword}
                  secureTextEntry={!passwordIsVisible}
                  onChangeText={(val) => {
                    setVerifPassword(val);
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
            </View>
          </View>
          {/* login button */}
          <View className="mt-10 w-full bg-white flex-1">
            <PrimaryButton
              text={t("screens.register.btn")}
              isLoading={isLoading}
              onPress={validate}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
