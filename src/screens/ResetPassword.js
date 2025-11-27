import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { auth, db } from "../../config/firebase";
import {
  signInWithEmailAndPassword,
} from "@react-native-firebase/auth";
import { showMessage } from "react-native-flash-message";
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
import i18n from "../../i18n";
import { useThemeContext } from "../ThemeProvider";

const { width, height } = Dimensions.get("window");

export default function ResetPassword() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDarkMode } = useThemeContext();
  const scrollViewRef = useRef(null);
  const { email } = route?.params || {};

  const [verificationCode, setVerificationCode] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
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

  const handleResetPassword = async () => {
    if (!verificationCode.trim()) {
      showMessage({
        message: i18n.t("code_verification_requis"),
        type: "warning",
      });
      return;
    }

    if (!oldPassword.trim()) {
      showMessage({
        message: i18n.t("ancien_mot_de_passe_requis"),
        type: "warning",
      });
      return;
    }

    if (newPassword.length < 6) {
      showMessage({
        message: i18n.t("mot_de_passe_court"),
        type: "warning",
      });
      return;
    }

    if (!email) {
      showMessage({
        message: i18n.t("erreur"),
        description: i18n.t("email_manquant"),
        type: "danger",
      });
      navigation.goBack();
      return;
    }

    setLoading(true);

    try {
      // 1. Vérifier le code de vérification dans Firestore
      const resetCodeRef = db.collection("password_reset_codes").doc(email);
      const resetCodeDoc = await resetCodeRef.get();

      console.log("Document existe ?", resetCodeDoc.exists);

      if (!resetCodeDoc.exists) {
        showMessage({
          message: i18n.t("erreur"),
          description: "Aucun code trouvé pour cet email. Demandez un nouveau code.",
          type: "danger",
        });
        setLoading(false);
        return;
      }

      const resetData = resetCodeDoc.data();
      console.log("Données récupérées:", resetData);

      if (!resetData || !resetData.code) {
        showMessage({
          message: i18n.t("erreur"),
          description: "Données du code invalides. Demandez un nouveau code.",
          type: "danger",
        });
        setLoading(false);
        return;
      }

      // Vérifier que le code correspond
      if (resetData.code !== verificationCode.trim()) {
        showMessage({
          message: i18n.t("erreur"),
          description: i18n.t("code_invalide_expire"),
          type: "danger",
        });
        setLoading(false);
        return;
      }

      // Vérifier que le code n'a pas expiré (15 minutes)
      const now = new Date();
      const codeTimestamp = resetData.timestamp?.toDate ? resetData.timestamp.toDate() : new Date(resetData.timestamp);
      const diffMinutes = (now - codeTimestamp) / 1000 / 60;

      if (diffMinutes > 15) {
        // Supprimer le code expiré
        await resetCodeRef.delete();

        showMessage({
          message: i18n.t("erreur"),
          description: i18n.t("code_expire"),
          type: "danger",
        });
        setLoading(false);
        return;
      }

      // 2. Se connecter avec l'ancien mot de passe
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        oldPassword
      );

      // 3. Changer le mot de passe
      await userCredential.user.updatePassword(newPassword);

      // 4. Supprimer le code de vérification utilisé
      await resetCodeRef.delete();

      showMessage({
        message: i18n.t("mot_de_passe_reinitialise"),
        description: i18n.t("mot_de_passe_modifie_succes"),
        type: "success",
      });

      // L'utilisateur reste connecté et est redirigé vers l'app
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    } catch (error) {
      console.error("Erreur réinitialisation:", error);

      let errorMessage = i18n.t("erreur_reinitialisation");

      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = i18n.t("ancien_mot_de_passe_incorrect");
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = i18n.t("trop_tentatives");
      } else if (error.code === "auth/user-not-found") {
        errorMessage = i18n.t("utilisateur_non_trouve");
      }

      showMessage({
        message: i18n.t("erreur"),
        description: errorMessage,
        type: "danger",
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
                <Text style={styles.title}>{i18n.t("reinitialiser_mot_de_passe")}</Text>
                <Text style={styles.subtitle}>
                  {i18n.t("entrez_code_ancien_nouveau_mot_de_passe")}
                </Text>
              </View>

              {/* Inputs */}
              <View style={styles.inputsContainer}>
                {/* Verification Code Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={22}
                      color="rgba(249, 115, 22, 0.7)"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={i18n.t("code_de_verification")}
                      placeholderTextColor={isDarkMode ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"}
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      onFocus={handleInputFocus}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus={true}
                    />
                  </View>
                </View>

                {/* Old Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-open-outline"
                      size={22}
                      color="rgba(249, 115, 22, 0.7)"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={i18n.t("ancien_mot_de_passe")}
                      placeholderTextColor={isDarkMode ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"}
                      value={oldPassword}
                      onChangeText={setOldPassword}
                      onFocus={handleInputFocus}
                      secureTextEntry={!showOldPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowOldPassword(!showOldPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showOldPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color="rgba(249, 115, 22, 0.7)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* New Password Input */}
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
                      placeholder={i18n.t("nouveau_mot_de_passe")}
                      placeholderTextColor={isDarkMode ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      onFocus={handleInputFocus}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
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
              </View>

              {/* Button */}
              <TouchableOpacity
                onPress={handleResetPassword}
                style={[
                  styles.button,
                  { opacity: loading || !verificationCode || !oldPassword || !newPassword ? 0.6 : 1 },
                ]}
                disabled={loading || !verificationCode || !oldPassword || !newPassword}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#F97316" />
                ) : (
                  <Text style={styles.buttonText}>{i18n.t("reinitialiser")}</Text>
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
    color: "#1F1F1F"
  },
  eyeIcon: {
    marginLeft: 12
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
