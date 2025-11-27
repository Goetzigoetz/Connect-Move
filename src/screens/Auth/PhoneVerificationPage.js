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
import moment from "moment";
import { showMessage } from "react-native-flash-message";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";
import { signInWithPhoneNumber } from "@react-native-firebase/auth";
import { doc, getDoc, setDoc } from "@react-native-firebase/firestore";
import { createUniqueUsername } from "../../utils/allFunctions";
import i18n from "../../../i18n";
import * as Progress from "react-native-progress";
import { COLORS } from "../../styles/colors";
import { useThemeContext } from "../../ThemeProvider";

const { width, height } = Dimensions.get("window");

const PhoneVerificationPage = ({ navigation }) => {
  const { isDarkMode } = useThemeContext();
  const scrollViewRef = useRef(null);
  const refs = useRef([]);

  const [confirmationResult, setConfirmationResult] = useState(null);
  const [countryCode, setCountryCode] = useState("33");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("phone"); // "phone" ou "code"
  const [resendTimer, setResendTimer] = useState(0);
  const [countryCodeValid, setCountryCodeValid] = useState(true);
  const [phoneNumberValid, setPhoneNumberValid] = useState(true);

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Validate country code (1-3 digits)
  const validateCountryCode = (code) => {
    return code.length > 0 && code.length <= 3 && /^\d+$/.test(code);
  };

  // Validate phone number (basic validation: 6-15 digits)
  const validatePhoneNumber = (number) => {
    return number.length >= 6 && number.length <= 15 && /^\d+$/.test(number);
  };

  // Handle country code change with "+" prefix protection
  const handleCountryCodeChange = (text) => {
    // Only allow digits
    const digitsOnly = text.replace(/\D/g, "");
    // Limit to 3 digits
    const limited = digitsOnly.slice(0, 3);
    setCountryCode(limited);
    setCountryCodeValid(validateCountryCode(limited));
  };

  // Handle phone number change
  const handlePhoneNumberChange = (text) => {
    // Only allow digits
    const digitsOnly = text.replace(/\D/g, "");
    // Limit to 15 digits
    const limited = digitsOnly.slice(0, 15);
    setPhoneNumber(limited);
    setPhoneNumberValid(validatePhoneNumber(limited));
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

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

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

  const handleSendCode = async () => {
    if (
      !countryCodeValid ||
      !phoneNumberValid ||
      countryCode.length === 0 ||
      phoneNumber.length === 0
    ) {
      showMessage({
        message: i18n.t("numero_telephone_invalide"),
        type: "danger",
      });
      return;
    }

    // Format: +{countryCode}{phoneNumber} (remove leading 0 if present)
    const cleanPhoneNumber = phoneNumber.replace(/^0/, "");
    const formattedNumber = `+${countryCode}${cleanPhoneNumber}`;
    setLoading(true);

    try {
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber);
      showMessage({
        message: i18n.t("code_sms_envoye"),
        type: "success",
      });
      setConfirmationResult(confirmation);
      setStep("code");
      setResendTimer(90);
    } catch (error) {
      console.log(error);
      Alert.alert(i18n.t("erreur"), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (codeToVerify) => {
    if (codeToVerify.length !== 6 || codeToVerify.some((c) => c === "")) {
      showMessage({
        message: i18n.t("code_6_chiffres"),
        type: "danger",
      });
      return;
    }
    setLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(
        codeToVerify.join("")
      );
      const userId = userCredential.user.uid;
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      const phoneNum = userCredential.user.phoneNumber;

      if (!userDocSnap.exists()) {
        // Nouvel utilisateur - créer profil temporaire et rediriger vers OnboardingFlow
        await setDoc(userDocRef, {
          phoneNumber: phoneNum,
          referralCode: userId.slice(0, 6).toUpperCase(),
          createdAt: moment().toISOString(),
          lastLogin: moment().toISOString(),
          isActive: true,
          onboardingCompleted: false,
          loginMethod: "phone",
          emailVerified: true, // Le téléphone est déjà vérifié
          // Champs temporaires pour éviter la redirection vers EditProfile
          interests: ["onboarding"],
          location: { address: "onboarding" },
        });

        navigation.replace("OnboardingFlow", {
          userId,
          email: null, // Pas d'email pour connexion par téléphone
          phoneNumber: phoneNum,
          loginMethod: "phone",
        });
      } else {
        // Utilisateur existant - mettre à jour lastLogin et aller à MainTabs
        await setDoc(
          userDocRef,
          {
            lastLogin: moment().toISOString(),
          },
          { merge: true }
        );
        // App.js basculera automatiquement vers Navigator quand authenticated devient true
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du code :", error);
      showMessage({
        message: i18n.t("code_invalide_expire"),
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    if (resendTimer > 0) return;
    setCode(Array(6).fill(""));
    setStep("phone");
    setResendTimer(0);
    showMessage({
      message: i18n.t("renvoyer_nouveau_code"),
      type: "info",
    });
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.bgDark : "#F97316" },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Background gradient */}
      <LinearGradient
        colors={
          isDarkMode
            ? [COLORS.bgDarkSecondary, COLORS.bgDarkTertiary, COLORS.bgDark]
            : ["#F97316", "#F97316", "#EA580C"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Icônes sportives animées */}
      <Animated.View style={[styles.sportShape, styles.shape1, circle1Style]}>
        <Ionicons
          name="basketball-outline"
          size={90}
          color={
            isDarkMode
              ? "rgba(255, 255, 255, 0.15)"
              : "rgba(255, 255, 255, 0.28)"
          }
        />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape2, circle2Style]}>
        <Ionicons
          name="football-outline"
          size={110}
          color={
            isDarkMode
              ? "rgba(255, 255, 255, 0.13)"
              : "rgba(255, 255, 255, 0.25)"
          }
        />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape3, circle3Style]}>
        <Ionicons
          name="bicycle-outline"
          size={75}
          color={
            isDarkMode
              ? "rgba(255, 255, 255, 0.11)"
              : "rgba(255, 255, 255, 0.22)"
          }
        />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape4, circle4Style]}>
        <Ionicons
          name="tennisball-outline"
          size={70}
          color={
            isDarkMode
              ? "rgba(255, 255, 255, 0.14)"
              : "rgba(255, 255, 255, 0.26)"
          }
        />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape5, circle5Style]}>
        <Ionicons
          name="barbell-outline"
          size={85}
          color={
            isDarkMode
              ? "rgba(255, 255, 255, 0.12)"
              : "rgba(255, 255, 255, 0.24)"
          }
        />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape6, circle6Style]}>
        <Ionicons
          name="american-football-outline"
          size={65}
          color={
            isDarkMode
              ? "rgba(255, 255, 255, 0.12)"
              : "rgba(255, 255, 255, 0.23)"
          }
        />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape7, circle7Style]}>
        <Ionicons
          name="baseball-outline"
          size={60}
          color={
            isDarkMode
              ? "rgba(255, 255, 255, 0.14)"
              : "rgba(255, 255, 255, 0.27)"
          }
        />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape8, circle8Style]}>
        <Ionicons
          name="golf-outline"
          size={55}
          color={
            isDarkMode
              ? "rgba(255, 255, 255, 0.11)"
              : "rgba(255, 255, 255, 0.21)"
          }
        />
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

        {/* Progress Indicator - Fixed */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <Progress.Bar
              progress={step === "phone" ? 0.5 : 1}
              width={width - 48}
              height={6}
              color="#FFFFFF"
              unfilledColor="rgba(255, 255, 255, 0.3)"
              borderWidth={0}
              borderRadius={3}
              animated={true}
              animationType="timing"
            />
          </View>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>
              {i18n.t("etape_sur", {
                current: step === "phone" ? 1 : 2,
                total: 2,
              })}
            </Text>
          </View>
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
                <View
                  style={[
                    styles.logoContainer,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.95)"
                        : "#FFFFFF",
                    },
                  ]}
                >
                  <ExpoImage
                    source={require("../../../assets/512.png")}
                    style={styles.logo}
                    contentFit="contain"
                  />
                </View>
              </View>

              {/* Title */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>
                  {step === "phone"
                    ? i18n.t("numero_de_telephone")
                    : i18n.t("code_de_verification")}
                </Text>
                <Text style={styles.subtitle}>
                  {step === "phone"
                    ? i18n.t(
                        "vous_allez_recevoir_un_code_de_verification_par_sms"
                      )
                    : i18n.t("saisissez_le_code_recu_par_sms")}
                </Text>
              </View>

              {step === "phone" ? (
                <>
                  {/* Phone Input - Two separate boxes */}
                  <View style={styles.inputContainer}>
                    <View style={styles.phoneInputRow}>
                      {/* Country Code Input */}
                      <View
                        style={[
                          styles.countryCodeInputWrapper,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(255, 255, 255, 0.95)"
                              : "#FFFFFF",
                            borderColor:
                              countryCode.length === 0
                                ? "rgba(0, 0, 0, 0.1)"
                                : countryCodeValid
                                ? "#10B981"
                                : "#EF4444",
                            borderWidth: 2,
                          },
                        ]}
                      >
                        <Text style={styles.plusSymbol}>+</Text>
                        <TextInput
                          style={styles.countryCodeInput}
                          placeholder="33"
                          placeholderTextColor={
                            isDarkMode
                              ? "rgba(0, 0, 0, 0.4)"
                              : "rgba(0, 0, 0, 0.4)"
                          }
                          value={countryCode}
                          onChangeText={handleCountryCodeChange}
                          onFocus={handleInputFocus}
                          keyboardType="phone-pad"
                          maxLength={3}
                        />
                      </View>

                      {/* Phone Number Input */}
                      <View
                        style={[
                          styles.phoneNumberInputWrapper,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(255, 255, 255, 0.95)"
                              : "#FFFFFF",
                            borderColor:
                              phoneNumber.length === 0
                                ? "rgba(0, 0, 0, 0.1)"
                                : phoneNumberValid
                                ? "#10B981"
                                : "#EF4444",
                            borderWidth: 2,
                          },
                        ]}
                      >
                        <Ionicons
                          name="call-outline"
                          size={22}
                          color="rgba(249, 115, 22, 0.7)"
                          style={styles.phoneIcon}
                        />
                        <TextInput
                          style={styles.phoneNumberInput}
                          placeholder="612345678"
                          placeholderTextColor={
                            isDarkMode
                              ? "rgba(255, 255, 255, 0.4)"
                              : "rgba(0, 0, 0, 0.4)"
                          }
                          value={phoneNumber}
                          onChangeText={handlePhoneNumberChange}
                          onFocus={handleInputFocus}
                          keyboardType="phone-pad"
                          maxLength={15}
                          autoFocus={true}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Button */}
                  <TouchableOpacity
                    onPress={handleSendCode}
                    style={[
                      styles.button,
                      {
                        opacity:
                          loading ||
                          !countryCodeValid ||
                          !phoneNumberValid ||
                          countryCode.length === 0 ||
                          phoneNumber.length === 0
                            ? 0.6
                            : 1,
                      },
                    ]}
                    disabled={
                      loading ||
                      !countryCodeValid ||
                      !phoneNumberValid ||
                      countryCode.length === 0 ||
                      phoneNumber.length === 0
                    }
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#F97316" />
                    ) : (
                      <Text style={styles.buttonText}>
                        {i18n.t("envoyer_le_code")}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Code Input */}
                  <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          if (!refs.current) refs.current = [];
                          refs.current[index] = ref;
                        }}
                        style={[
                          styles.codeInput,
                          {
                            backgroundColor: isDarkMode
                              ? "rgba(255, 255, 255, 0.95)"
                              : "#FFFFFF",
                          },
                        ]}
                        keyboardType="numeric"
                        maxLength={1}
                        value={digit}
                        onFocus={handleInputFocus}
                        autoFocus={index === 0}
                        onChangeText={(text) => {
                          const newCode = [...code];
                          newCode[index] = text;
                          setCode(newCode);

                          if (text && index < 5) {
                            refs.current[index + 1]?.focus();
                          } else if (text && index === 5) {
                            handleVerifyCode(newCode);
                          }
                        }}
                        onKeyPress={({ nativeEvent }) => {
                          if (
                            nativeEvent.key === "Backspace" &&
                            !code[index] &&
                            index > 0
                          ) {
                            refs.current[index - 1]?.focus();
                          }
                        }}
                      />
                    ))}
                  </View>

                  {/* Verify Button */}
                  <TouchableOpacity
                    onPress={() => handleVerifyCode(code)}
                    style={[
                      styles.button,
                      {
                        opacity:
                          loading || code.some((c) => c === "") ? 0.6 : 1,
                      },
                    ]}
                    disabled={loading || code.some((c) => c === "")}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#F97316" />
                    ) : (
                      <Text style={styles.buttonText}>
                        {i18n.t("verifier")}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Resend Code */}
                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={resendTimer > 0}
                    style={styles.resendButton}
                  >
                    <Text
                      style={[
                        styles.resendText,
                        { opacity: resendTimer > 0 ? 0.5 : 1 },
                      ]}
                    >
                      {resendTimer > 0
                        ? i18n.t("renvoyer_le_code_dans", {
                            seconds: resendTimer,
                          })
                        : i18n.t("renvoyer_le_code")}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Footer - Only show on phone step */}
              {step === "phone" && (
                <Text style={styles.footerText}>
                  {i18n.t(
                    "en_continuant_vous_acceptez_de_recevoir_des_sms_de_verification"
                  )}
                </Text>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(249, 115, 22, 0.03)",
  },
  sportShape: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
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
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  progressBar: {
    marginBottom: 12,
  },
  stepIndicator: {
    alignItems: "center",
  },
  stepText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  logoSection: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  content: {
    paddingHorizontal: 24,
    justifyContent: "flex-end",
    minHeight: height * 0.5,
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontFamily: "Inter_500Medium",
    fontSize: 32,
    color: "#FFFFFF",
    marginBottom: 12,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  inputContainer: {
    marginBottom: 24,
  },
  phoneInputRow: {
    flexDirection: "row",
    gap: 12,
  },
  countryCodeInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    width: 100,
  },
  plusSymbol: {
    fontFamily: "Inter_500Medium",
    fontSize: 18,
    color: "#F97316",
    marginRight: 4,
  },
  countryCodeInput: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    color: "#000000",
    textAlign: "center",
  },
  phoneNumberInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  phoneIcon: {
    marginRight: 12,
  },
  phoneNumberInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: "#000000",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  codeInput: {
    width: 45,
    height: 56,
    borderRadius: 12,
    textAlign: "center",
    fontFamily: "Inter_500Medium",
    fontSize: 24,
    color: "#000000",
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
    elevation: 6,
    marginBottom: 16,
  },
  buttonText: {
    color: "#F97316",
    fontFamily: "Inter_500Medium",
    fontSize: 18,
    letterSpacing: 0,
  },
  resendButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  resendText: {
    color: "#FFFFFF",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 20,
  },
});

export default PhoneVerificationPage;
