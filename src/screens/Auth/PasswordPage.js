import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../../config/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "@react-native-firebase/auth";
import { doc, setDoc } from "@react-native-firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { showMessage } from "react-native-flash-message";
import moment from "moment";
import { createUniqueUsername } from "../../utils/allFunctions";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
} from "react-native-reanimated";
import i18n from "../../../i18n";
import { useThemeContext } from "../../ThemeProvider";
import { COLORS } from "../../styles/colors";
const { width, height } = Dimensions.get("window");

const PasswordPage = ({ route }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeContext();
  const scrollViewRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Animations
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
    // Animations des icônes sportives
    float1.value = withRepeat(
      withTiming(40, { duration: 3500, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      -1,
      true
    );
    float2.value = withRepeat(
      withTiming(-35, { duration: 4200, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      -1,
      true
    );
    float3.value = withRepeat(
      withTiming(28, { duration: 5000, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      -1,
      true
    );
    float4.value = withRepeat(
      withTiming(-22, { duration: 3800, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      -1,
      true
    );
    float5.value = withRepeat(
      withTiming(32, { duration: 4500, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      -1,
      true
    );
    float6.value = withRepeat(
      withTiming(-30, { duration: 4100, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      -1,
      true
    );
    float7.value = withRepeat(
      withTiming(25, { duration: 3600, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      -1,
      true
    );
    float8.value = withRepeat(
      withTiming(-28, { duration: 4700, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      -1,
      true
    );
    rotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
    rotate2.value = withRepeat(
      withTiming(-360, { duration: 18000, easing: Easing.linear }),
      -1,
      false
    );
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
    transform: [{ translateY: interpolate(fadeAnim.value, [0, 1], [20, 0]) }],
  }));

  const handlePasswordSubmit = async () => {
    if (email.trim() === "") {
      showMessage({
        message: i18n.t("email_invalide"),
        type: "danger",
      });
      return;
    }
    if (password.trim().length < 6) {
      showMessage({
        message: i18n.t("mot_de_passe_court"),
        type: "danger",
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    } catch (error) {
      if (error.code === "auth/user-not-found") {
        Alert.alert(
          i18n.t("compte_non_trouve"),
          i18n.t("creer_compte_question"),
          [
            {
              text: i18n.t("creer_compte"),
              onPress: async () => {
                try {
                  const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                  );

                  // Créer un profil Firestore minimal pour éviter la redirection vers EditProfile
                  const emailUser = userCredential.user.email;
                  const userName = createUniqueUsername(emailUser);
                  const userId = userCredential.user.uid;

                  await setDoc(doc(db, "users", userId), {
                    email: emailUser,
                    username: userName,
                    referralCode: userId.slice(0, 6).toUpperCase(),
                    createdAt: moment().toISOString(),
                    isActive: true,
                    onboardingCompleted: false,
                    // Champs temporaires pour éviter la redirection
                    interests: ["onboarding"],
                    location: { address: "onboarding" },
                  });

                  // Rediriger vers le processus d'onboarding
                  navigation.replace("OnboardingFlow", {
                    userCredential,
                    email: emailUser,
                  });
                } catch (createError) {
                  console.error("Erreur lors de la création du compte:", createError);
                  showMessage({
                    message:
                      createError.code === "auth/email-already-in-use"
                        ? i18n.t("email_deja_utilise")
                        : i18n.t("impossible_creer_compte"),
                    type: "danger",
                  });
                } finally {
                  setLoading(false);
                }
              },
            },
            {
              text: i18n.t("annuler"),
              style: "cancel",
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else if (error.code === "auth/wrong-password") {
        showMessage({
          message: i18n.t("mot_de_passe_incorrect"),
          type: "danger",
        });
      } else if (error.code === "auth/invalid-email") {
        showMessage({
          message: i18n.t("adresse_email_invalide"),
          type: "danger",
        });
      } else {
        showMessage({
          message: i18n.t("erreur_reessayer"),
          type: "danger",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background gradient */}
      <LinearGradient
        colors={isDarkMode ? [COLORS.bgDarkSecondary, COLORS.bgDarkTertiary, COLORS.bgDark] : ["#F97316", "#F97316", "#EA580C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Icônes sportives animées */}
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

      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header - Fixed */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            ref={scrollViewRef}
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

              {/* Title */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>{i18n.t("connectez_vous_a_votre_compte")}</Text>
                <Text style={styles.subtitle}>
                  {i18n.t("entrez_email_password")}
                </Text>
              </View>

              {/* Inputs */}
              <View style={styles.inputsContainer}>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="mail-outline"
                      size={22}
                      color="rgba(249, 115, 22, 0.7)"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={i18n.t("adresse_email")}
                     placeholderTextColor={isDarkMode ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.4)"}
                      value={email}
                      onChangeText={setEmail}
                      onFocus={handleInputFocus}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="emailAddress"
                      autoFocus={true}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={22}
                      color="rgba(249, 115, 22, 0.7)"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={i18n.t("votre_mot_de_passe")}
                      placeholderTextColor={isDarkMode ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.4)"}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={handleInputFocus}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color="rgba(249, 115, 22, 0.7)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("ForgotPassword")}
                  style={styles.forgotPasswordLink}
                >
                  <Text style={styles.forgotPasswordText}>
                    {i18n.t("mot_de_passe_oublie")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Button */}
              <TouchableOpacity
                onPress={handlePasswordSubmit}
                style={[
                  styles.button,
                  { opacity: loading || !email || !password ? 0.6 : 1 },
                ]}
                disabled={loading || !email || !password}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#F97316" />
                ) : (
                  <Text style={styles.buttonText}>{i18n.t("suivant")}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  shape1: { top: height * 0.08, left: width * 0.05 },
  shape2: { top: height * 0.15, right: width * 0.08 },
  shape3: { bottom: height * 0.06, left: width * 0.08 },
  shape4: { bottom: height * 0.08, right: width * 0.15 },
  shape5: { top: height * 0.35, right: width * 0.05 },
  shape6: { bottom: height * 0.2, right: width * 0.6 },
  shape7: { top: height * 0.1, right: width * 0.5 },
  shape8: { bottom: height * 0.22, left: width * 0.35 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center"
  },
  logoSection: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20
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
    fontSize: 32,
    color: "#FFFFFF",
    marginBottom: 12,
    lineHeight: 38,
    letterSpacing: -0.5
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 24,
    letterSpacing: -0.2
  },
  inputsContainer: {
    marginBottom: 24
  },
  inputContainer: {
    marginBottom: 16
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: "#1F2937"
  },
  eyeIcon: {
    marginLeft: 12
  },
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginTop: 8
  },
  forgotPasswordText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#FFFFFF",
    textDecorationLine: "underline"
  },
  button: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  buttonText: {
    color: "#F97316",
    fontFamily: "Inter_500Medium",
    fontSize: 18,
    letterSpacing: 0
  },
});

export default PasswordPage;
