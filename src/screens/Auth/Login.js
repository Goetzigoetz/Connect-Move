import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Pressable,
  Linking,
  SafeAreaView,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import { GOOGLE_WEB_CLIENT_ID } from "@env";
import { auth, db } from "../../../config/firebase";
import moment from "moment";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as AppleAuthentication from "expo-apple-authentication";
import { createUniqueUsername } from "../../utils/allFunctions";
import { COLORS } from "../../styles/colors";
import i18n from "../../../i18n";
import * as Crypto from "expo-crypto";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "@react-native-firebase/firestore";
import { sendWelcomeEmail } from "../../utils/sendMails";
import {
  AppleAuthProvider,
  FacebookAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  updateProfile,
} from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { AppleButton } from "@invertase/react-native-apple-authentication";
import { appleAuth } from "@invertase/react-native-apple-authentication";

import { LoginManager, AccessToken } from "react-native-fbsdk-next";
import { sha256 } from "react-native-sha256";

GoogleSignin.configure({
  webClientId:
    "1059136866702-97ob1v2agbhp115lgpbnhq5e78ndsg4h.apps.googleusercontent.com",
  iosClientId:
    "1059136866702-6cgoo68f7mbgmd9ujc93feaq0qfcrlps.apps.googleusercontent.com",
  offlineAccess: false,
});

const Login = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleFacebookLogin = async () => {
    const result = await LoginManager.logInWithPermissions([
      "public_profile",
      "email",
    ]);

    if (result.isCancelled) {
      throw "User cancelled the login process";
    }

    // Once signed in, get the users AccessToken
    const data = await AccessToken.getCurrentAccessToken();

    if (!data) {
      throw "Something went wrong obtaining access token";
    }

    // Create a Firebase credential with the AccessToken
    const facebookCredential = FacebookAuthProvider.credential(
      data.accessToken
    );

    // Sign-in the user with the credential
    return signInWithCredential(getAuth(), facebookCredential);
  };

  const handleGoogleAuth = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();
      // console.log("result from GoogleSignin.signIn():", result);

      const idToken = result.data.idToken;
      if (!idToken) throw new Error("idToken Google manquant");

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);
      console.log(userCredential.user);
      // Extraction des données utilisateur Google
      const user = result.data.user;
      const photoURL = userCredential.user.photoURL || "";
      const email = user.email || userCredential.user.email;
      const firstName =
        user.givenName ||
        userCredential.user.displayName?.split(" ")[0] ||
        "user";
      const lastName = user.familyName || "user";
      const userName = createUniqueUsername(email);

      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          loginWithGoogle: true,
          loginWithApple: false,
          email,
          photoURL,
          firstName,
          lastName,
          username: userName,
          interests: [],
          showMyProfile: true,
          createdAt: moment().toISOString(),
          isActive: true,
        });
        await sendWelcomeEmail(email, userName).catch(console.error);
      }

      navigation.replace("Home");
    } catch (error) {
      console.error("Google Signin error", error);
      showMessage({
        message: "Erreur lors de la connexion Google. Veuillez réessayer.",
        type: "danger",
      });
    }
  };

  const handleAppleAuth = async () => {
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error("Apple token absent");
      }

      const { identityToken, nonce, email, fullName } =
        appleAuthRequestResponse;

      const appleCredential = AppleAuthProvider.credential(
        identityToken,
        nonce
      );

      const userCredential = await signInWithCredential(auth, appleCredential);

      const userEmail = email || userCredential.user.email;
      const firstName =
        fullName?.givenName ||
        userCredential.user?.displayName?.split(" ")[0] ||
        "user";
      const lastName = fullName?.familyName || "user";

      const userName = createUniqueUsername(userEmail);

      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          loginWithApple: true,
          email: userEmail,
          firstName,
          lastName,
          username: userName,
          interests: [],
          showMyProfile: true,
          createdAt: moment().toISOString(),
          isActive: true,
        });
        await sendWelcomeEmail(userEmail, userName).catch(console.error);
      }

      navigation.replace("Home");
    } catch (error) {
      console.error("Erreur lors de la connexion avec Apple:", error);
      showMessage({
        message:
          "Une erreur est survenue lors de la connexion avec Apple. Veuillez réessayer.",
        type: "danger",
      });
    }
  };

  // Fonction de connexion via téléphone
  const handlePhoneAuth = () => {
    navigation.navigate("PhoneVerificationPage");
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={200}
        className="bg-white dark:bg-gray-900"
      >
        <Animated.View
          entering={FadeInDown.duration(100)}
          className="flex-1 px-6 pt-8"
        >
          {/* En-tête */}
          <View className="mb-12">
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            >
              {i18n.t("bienvenue")}
            </Text>
            <Text
              style={{ fontFamily: "Inter_400Regular" }}
              className="text-gray-500 dark:text-gray-400 text-lg"
            >
              {i18n.t("connectez-vous_pour_rejoindre_la_communaute")}
            </Text>
          </View>

          {/* Formulaire */}
          <View className="space-y-6">
            <View className="flex flex-col gap-4">
              <Pressable
                onPress={() => navigation.navigate("PasswordPage")}
                style={{
                  backgroundColor: COLORS.primary,
                }}
                className={`mt-4 py-3 rounded flex-row items-center justify-center`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons
                      name="mail"
                      size={24}
                      color="#FFFFFF"
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      style={{
                        fontFamily: "Inter_400Regular",
                      }}
                      className="text-white font-semibold text-lg mr-2"
                    >
                      {i18n.t("continuer")}
                    </Text>
                  </>
                )}
              </Pressable>

              {Platform.OS === "ios" && (
                <Pressable
                  onPress={handleAppleAuth}
                  className="py-3 flex-row items-center justify-center bg-black dark:bg-gray-800 dark:border-gray-700 rounded active:bg-gray-900 dark:active:bg-gray-700"
                >
                  <Ionicons
                    name="logo-apple"
                    size={24}
                    color="#FFFFFF"
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                    }}
                    className="text-white  text-lg"
                  >
                    {i18n.t("continuer_avec_apple")}
                  </Text>
                </Pressable>
              )}
              {/* <Pressable
                onPress={handleFacebookLogin}
                className="py-3 flex-row items-center justify-center bg-[#1877F2] border border-gray-200 dark:border-gray-700 rounded active:bg-[#145DBF]"
              >
                <Ionicons
                  name="logo-facebook"
                  size={24}
                  color="#FFFFFF"
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                  }}
                  className="text-white  text-lg"
                >
                  {i18n.t("continuer_avec_facebook")}
                </Text>
              </Pressable> */}

              <Pressable
                onPress={handleGoogleAuth}
                className="py-3 flex-row items-center justify-center bg-red-600 border border-gray-200 dark:border-gray-700 rounded active:bg-red-700"
              >
                <Ionicons
                  name="logo-google"
                  size={24}
                  color="#FFFFFF"
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="text-white text-lg"
                >
                  {i18n.t("continuer_avec_google")}
                </Text>
              </Pressable>

              <Pressable
                onPress={handlePhoneAuth}
                className="py-3 flex-row items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded active:bg-gray-50 dark:active:bg-gray-700"
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={24}
                  color="#374151"
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                  }}
                  className="text-gray-700 dark:text-gray-300  text-lg"
                >
                  {i18n.t("continuer_avec_un_numero")}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer */}
          <Text
            style={{
              fontFamily: "Inter_400Regular",
            }}
            className="text-center text-gray-700 dark:text-gray-300 mt-8 mb-6"
          >
            En continuant, vous acceptez nos{" "}
            <Text
              onPress={() =>
                Linking.openURL("https://connectetmove.com/termes.html")
              }
              style={{
                fontFamily: "Inter_400Regular",
                color: "#FF8200",
                textDecorationLine: "underline",
              }}
            >
              {i18n.t("conditions_dutilisation")}
            </Text>
          </Text>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default Login;
