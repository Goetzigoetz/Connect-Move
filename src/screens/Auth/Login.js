import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../../config/firebase";
import { showMessage } from "react-native-flash-message";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { createUniqueUsername } from "../../utils/allFunctions";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import {
  doc,
  getDoc,
  setDoc,
} from "@react-native-firebase/firestore";
import moment from "moment";
import {
  AppleAuthProvider,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
} from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { appleAuth } from "@invertase/react-native-apple-authentication";
// import { LoginManager, AccessToken } from "react-native-fbsdk-next";
import i18n from "../../../i18n";
import WebViewModal from "../../components/WebViewModal";
import { useThemeContext } from "../../ThemeProvider";

const { width, height } = Dimensions.get("window");

GoogleSignin.configure({
  webClientId:
    "1059136866702-97ob1v2agbhp115lgpbnhq5e78ndsg4h.apps.googleusercontent.com",
  iosClientId:
    "1059136866702-6cgoo68f7mbgmd9ujc93feaq0qfcrlps.apps.googleusercontent.com",
  offlineAccess: false,
});

const Login = ({ navigation }) => {
  const { isDarkMode } = useThemeContext();
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState("");
  const [webViewTitle, setWebViewTitle] = useState("");

  // Animations dynamiques du background - Sport theme (plus d'éléments)
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
    // Sport-themed floating animations - ballon de foot, basketball, etc.
    float1.value = withRepeat(
      withTiming(40, {
        duration: 3500,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      true
    );

    float2.value = withRepeat(
      withTiming(-35, {
        duration: 4200,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      true
    );

    float3.value = withRepeat(
      withTiming(28, {
        duration: 5000,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      true
    );

    float4.value = withRepeat(
      withTiming(-22, {
        duration: 3800,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      true
    );

    float5.value = withRepeat(
      withTiming(32, {
        duration: 4500,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      true
    );

    float6.value = withRepeat(
      withTiming(-30, {
        duration: 4100,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      true
    );

    float7.value = withRepeat(
      withTiming(25, {
        duration: 3600,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      true
    );

    float8.value = withRepeat(
      withTiming(-28, {
        duration: 4700,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      true
    );

    rotate.value = withRepeat(
      withTiming(360, {
        duration: 20000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    rotate2.value = withRepeat(
      withTiming(-360, {
        duration: 18000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Fade in du contenu
    fadeAnim.value = withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, []);

  const circle1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: float1.value },
      { translateX: float1.value * 0.5 },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const circle2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: float2.value },
      { translateX: float2.value * -0.3 },
      { rotate: `${-rotate.value}deg` },
    ],
  }));

  const circle3Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: float3.value },
      { translateX: float3.value * 0.7 },
    ],
  }));

  const circle4Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: float4.value },
      { translateX: float4.value * -0.5 },
    ],
  }));

  const circle5Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: float5.value },
      { translateX: float5.value * 0.4 },
      { scale: interpolate(float5.value, [0, 32], [1, 1.15]) },
    ],
  }));

  const circle6Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: float6.value },
      { translateX: float6.value * 0.6 },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const circle7Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: float7.value },
      { translateX: float7.value * -0.4 },
      { rotate: `${rotate2.value}deg` },
    ],
  }));

  const circle8Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: float8.value },
      { translateX: float8.value * 0.3 },
      { scale: interpolate(float8.value, [-28, 0], [1.1, 1]) },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      {
        translateY: interpolate(fadeAnim.value, [0, 1], [20, 0]),
      },
    ],
  }));

  // const handleFacebookLogin = async () => {
  //   const result = await LoginManager.logInWithPermissions([
  //     "public_profile",
  //     "email",
  //   ]);

  //   if (result.isCancelled) {
  //     throw "User cancelled the login process";
  //   }

  //   const data = await AccessToken.getCurrentAccessToken();

  //   if (!data) {
  //     throw "Something went wrong obtaining access token";
  //   }

  //   const facebookCredential = FacebookAuthProvider.credential(
  //     data.accessToken
  //   );

  //   return signInWithCredential(auth, facebookCredential);
  // };

  const handleGoogleAuth = async () => {
    try {
      setLoadingGoogle(true);
      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();

      const idToken = result.data.idToken;
      if (!idToken) throw new Error("idToken Google manquant");

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);

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
        // Nouvel utilisateur - créer profil temporaire et rediriger vers l'onboarding
        await setDoc(userDocRef, {
          email,
          username: userName,
          referralCode: userCredential.user.uid.slice(0, 6).toUpperCase(),
          createdAt: moment().toISOString(),
          lastLogin: moment().toISOString(),
          isActive: true,
          onboardingCompleted: false,
          loginMethod: "google",
          photoURL,
          // Champs temporaires pour éviter la redirection vers EditProfile
          interests: ["onboarding"],
          location: { address: "onboarding" },
        });

        navigation.replace("OnboardingFlow", {
          userId: userCredential.user.uid,
          email,
          firstName,
          lastName,
          photoURL,
          loginMethod: "google",
        });
      } else {
        // Utilisateur existant - mettre à jour lastLogin et aller à Home
        await setDoc(userDocRef, {
          lastLogin: moment().toISOString(),
        }, { merge: true });
        // App.js basculera automatiquement vers Navigator quand authenticated devient true
      }
    } catch (error) {
      console.error("Google Signin error", error);
      showMessage({
        message: i18n.t("erreur_connexion_google"),
        type: "danger",
      });
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleAppleAuth = async () => {
    try {
      setLoadingApple(true);
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
        // Nouvel utilisateur - créer profil temporaire et rediriger vers l'onboarding
        await setDoc(userDocRef, {
          email: userEmail,
          username: userName,
          referralCode: userCredential.user.uid.slice(0, 6).toUpperCase(),
          createdAt: moment().toISOString(),
          lastLogin: moment().toISOString(),
          isActive: true,
          onboardingCompleted: false,
          loginMethod: "apple",
          // Champs temporaires pour éviter la redirection vers EditProfile
          interests: ["onboarding"],
          location: { address: "onboarding" },
        });

        navigation.replace("OnboardingFlow", {
          userId: userCredential.user.uid,
          email: userEmail,
          firstName,
          lastName,
          loginMethod: "apple",
        });
      } else {
        // Utilisateur existant - mettre à jour lastLogin et aller à Home
        await setDoc(userDocRef, {
          lastLogin: moment().toISOString(),
        }, { merge: true });
        // App.js basculera automatiquement vers Navigator quand authenticated devient true
      }
    } catch (error) {
      console.error("Erreur lors de la connexion avec Apple:", error);
      showMessage({
        message: i18n.t("erreur_connexion_apple"),
        type: "danger",
      });
    } finally {
      setLoadingApple(false);
    }
  };

  const handlePhoneAuth = () => {
    navigation.navigate("PhoneVerificationPage");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background animé avec gradient primary orange */}
      <LinearGradient
        colors={isDarkMode ? ["#15202B", "#192734", "#15202B"] : ["#F97316", "#F97316", "#EA580C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Formes animées en arrière-plan - Thème sport (plus nombreuses et visibles) */}
      <Animated.View style={[styles.sportShape, styles.shape1, circle1Style]}>
        <Ionicons name="basketball-outline" size={90} color={isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.28)"} />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape2, circle2Style]}>
        <Ionicons name="football-outline" size={110} color={isDarkMode ? "rgba(255, 255, 255, 0.13)" : "rgba(255, 255, 255, 0.25)"} />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape3, circle3Style]}>
        <Ionicons name="bicycle-outline" size={75} color={isDarkMode ? "rgba(255, 255, 255, 0.11)" : "rgba(255, 255, 255, 0.22)"} />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape4, circle4Style]}>
        <Ionicons name="tennisball-outline" size={70} color={isDarkMode ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.26)"} />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape5, circle5Style]}>
        <Ionicons name="barbell-outline" size={85} color={isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.24)"} />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape6, circle6Style]}>
        <Ionicons name="american-football-outline" size={65} color={isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.23)"} />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape7, circle7Style]}>
        <Ionicons name="baseball-outline" size={60} color={isDarkMode ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.27)"} />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape8, circle8Style]}>
        <Ionicons name="golf-outline" size={55} color={isDarkMode ? "rgba(255, 255, 255, 0.11)" : "rgba(255, 255, 255, 0.21)"} />
      </Animated.View>

      {/* Overlay pour atténuer légèrement */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header - Fixed close button only */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.content, contentStyle]}>
            {/* Logo - Scrollable */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../../assets/512.png")}
                  style={styles.logo}
                  contentFit="contain"
                />
              </View>
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>{i18n.t("bienvenue")}</Text>
              <Text style={styles.subtitle}>
                {i18n.t("connectez-vous_pour_rejoindre_la_communaute")}
              </Text>
            </View>

            {/* Buttons Container */}
            <View style={styles.buttonsContainer}>
              {/* Email - Primary CTA */}
              <TouchableOpacity
                onPress={() => navigation.navigate("PasswordPage")}
                style={styles.primaryButton}
                disabled={loadingEmail || loadingGoogle || loadingApple || loadingPhone}
                activeOpacity={0.85}
              >
                {loadingEmail ? (
                  <ActivityIndicator color="#F97316" />
                ) : (
                  <>
                    <Ionicons
                      name="mail"
                      size={22}
                      color="#F97316"
                      style={{ marginRight: 12 }}
                    />
                    <Text style={styles.primaryButtonText}>
                      {i18n.t("continuer")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{i18n.t("ou")}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social buttons */}
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  onPress={handleAppleAuth}
                  style={styles.socialButton}
                  disabled={loadingEmail || loadingGoogle || loadingApple || loadingPhone}
                  activeOpacity={0.85}
                >
                  {loadingApple ? (
                    <ActivityIndicator color="#000000" />
                  ) : (
                    <>
                      <Ionicons
                        name="logo-apple"
                        size={22}
                        color="#000000"
                        style={{ marginRight: 12 }}
                      />
                      <Text style={styles.socialButtonText}>
                        {i18n.t("continuer_avec_apple")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleGoogleAuth}
                style={styles.socialButton}
                disabled={loadingEmail || loadingGoogle || loadingApple || loadingPhone}
                activeOpacity={0.85}
              >
                {loadingGoogle ? (
                  <ActivityIndicator color="#EA4335" />
                ) : (
                  <>
                    <Ionicons
                      name="logo-google"
                      size={22}
                      color="#EA4335"
                      style={{ marginRight: 12 }}
                    />
                    <Text style={styles.socialButtonText}>
                      {i18n.t("continuer_avec_google")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePhoneAuth}
                style={styles.socialButton}
                disabled={loadingEmail || loadingGoogle || loadingApple || loadingPhone}
                activeOpacity={0.85}
              >
                {loadingPhone ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <>
                    <Ionicons
                      name="phone-portrait-outline"
                      size={22}
                      color="#000000"
                      style={{ marginRight: 12 }}
                    />
                    <Text style={styles.socialButtonText}>
                      {i18n.t("continuer_avec_un_numero")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                En continuant, vous acceptez nos{" "}
                <Text
                  onPress={() => {
                    setWebViewUrl("https://connectetmove.com/termes.html");
                    setWebViewTitle(i18n.t("conditions_dutilisation"));
                    setWebViewVisible(true);
                  }}
                  style={styles.footerLink}
                >
                  {i18n.t("conditions_dutilisation")}
                </Text>
              </Text>
            </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* WebView Modal */}
      <WebViewModal
        visible={webViewVisible}
        url={webViewUrl}
        title={webViewTitle}
        onClose={() => setWebViewVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(249, 115, 22, 0.03)"
  },
  sportShape: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center"
  },
  shape1: {
    top: height * 0.08,
    left: width * 0.05
  },
  shape2: {
    top: height * 0.15,
    right: width * 0.08
  },
  shape3: {
    bottom: height * 0.06,
    left: width * 0.08
  },
  shape4: {
    bottom: height * 0.08,
    right: width * 0.15
  },
  shape5: {
    top: height * 0.35,
    right: width * 0.05
  },
  shape6: {
    bottom: height * 0.2,
    right: width * 0.6
  },
  shape7: {
    top: height * 0.1,
    right: width * 0.5
  },
  shape8: {
    bottom: height * 0.22,
    left: width * 0.35
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start"
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center"
  },
  logoSection: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 30
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40
  },
  content: {
    paddingHorizontal: 24,
    justifyContent: "flex-end",
    minHeight: height * 0.5
  },
  titleSection: {
    marginBottom: 40
  },
  title: {
    fontFamily: "Inter_500Medium",
    fontSize: 38,
    color: "#FFFFFF",
    marginBottom: 12,
    lineHeight: 44,
    letterSpacing: -0.5
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 24,
    letterSpacing: -0.2
  },
  buttonsContainer: {
    gap: 14
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  primaryButtonText: {
    color: "#F97316",
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    letterSpacing: -0.2
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)"
  },
  socialButtonText: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: "#000000",
    letterSpacing: -0.2
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)"
  },
  dividerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginHorizontal: 16,
    letterSpacing: -0.1
  },
  footer: {
    marginTop: 40,
    alignItems: "center"
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: 20,
    letterSpacing: -0.1
  },
  footerLink: {
    color: "#FFFFFF",
    fontFamily: "Inter_500Medium",
    textDecorationLine: "underline"
  },
});

export default Login;
