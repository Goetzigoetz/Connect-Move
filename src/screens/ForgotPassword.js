import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { db } from "../../config/firebase";
import { COLORS } from "../styles/colors";
import { showMessage } from "react-native-flash-message";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { API_URL } from "@env";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../ThemeProvider";

const { width, height } = Dimensions.get("window");

export default function ForgotPassword() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();
  const scrollViewRef = useRef(null);
  const [email, setEmail] = useState("");
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


  const handleSendCode = async () => {
    if (!email.trim()) {
      showMessage({
        message: t("emailRequired"),
        description: t("emailRequiredDesc"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showMessage({
        message: t("invalidEmail"),
        description: t("invalidEmailFormat"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      const userSnapshot = await db
        .collection("users")
        .where("email", "==", email.trim())
        .get();

      if (userSnapshot.empty) {
        showMessage({
          message: t("userNotFound"),
          description: t("noAccountWithEmail"),
          type: "danger",
          icon: "danger",
        });
        setLoading(false);
        return;
      }

      const codeVerification = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      const response = await fetch(`${API_URL}/forgot_password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          codeVerification,
          colors: {
            primary: COLORS.primary,
            secondary: COLORS.secondary,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erreur lors de l'envoi");
      }

      // Stocker le code dans Firestore directement depuis l'app
      await db.collection("password_reset_codes").doc(email.trim()).set({
        code: codeVerification,
        email: email.trim(),
        timestamp: new Date(),
      });

      showMessage({
        message: t("codeSent"),
        description: t("codeSentDesc"),
        type: "success",
        icon: "success",
      });

      navigation.navigate("ResetPassword", {
        email: email.trim(),
      });

    } catch (error) {
      console.error("Erreur envoi code:", error);
      showMessage({
        message: t("error"),
        description: t("sendCodeError"),
        type: "danger",
        icon: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background gradient */}
      <LinearGradient
        colors={isDarkMode ? ["#15202B", "#192734", "#15202B"] : ["#F97316", "#F97316", "#EA580C"]}
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
                    source={require("../../assets/512.png")}
                    style={styles.logo}
                    contentFit="contain"
                  />
                </View>
              </View>

              {/* Title */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>{t("mot_de_passe_oublié") || "Mot de passe oublié"}</Text>
                <Text style={styles.subtitle}>
                  Entrez votre adresse e-mail et nous vous enverrons un code pour réinitialiser votre mot de passe
                </Text>
              </View>

              {/* Input */}
              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.95)" : "#FFFFFF" }]}>
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color="rgba(249, 115, 22, 0.7)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={t("adresse_email") || "Adresse e-mail"}
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

              {/* Button */}
              <TouchableOpacity
                onPress={handleSendCode}
                style={[
                  styles.button,
                  { opacity: loading || !email ? 0.6 : 1 },
                ]}
                disabled={loading || !email}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#F97316" />
                ) : (
                  <Text style={styles.buttonText}>{t("suivant") || "Suivant"}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F97316",
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
  logoSection: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#FFFFFF",
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
    fontSize: 38,
    color: "#FFFFFF",
    marginBottom: 12,
    lineHeight: 44,
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 17,
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
  },
  buttonText: {
    color: "#F97316",
    fontFamily: "Inter_500Medium",
    fontSize: 18,
    letterSpacing: 0,
  },
});