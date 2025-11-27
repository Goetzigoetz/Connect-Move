import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { showMessage } from "react-native-flash-message";
import { useThemeContext } from "../../../ThemeProvider";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
} from "react-native-reanimated";
import i18n from "../../../../i18n";
import { COLORS } from "../../../styles/colors";

const { width, height } = Dimensions.get("window");

const OnboardingStep1 = ({ userData, onNext, onBack }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();
  const scrollViewRef = useRef(null);
  const [firstName, setFirstName] = useState(userData.firstName || "");
  const [lastName, setLastName] = useState(userData.lastName || "");

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
    // Sport-themed floating animations
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

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
    }, 100);
  };

  const handleContinue = () => {
    if (!firstName.trim()) {
      showMessage({
        message: t("onboarding_step1_error_prenom"),
        type: "warning",
      });
      return;
    }
    if (!lastName.trim()) {
      showMessage({
        message: t("onboarding_step1_error_nom"),
        type: "warning",
      });
      return;
    }

    onNext({ firstName: firstName.trim(), lastName: lastName.trim() });
  };

  return (
    <View style={styles.container}>
      {/* Animated sport icons background */}
      <Animated.View style={[styles.sportShape, styles.shape1, circle1Style]}>
        <Ionicons
          name="basketball-outline"
          size={90}
          color={isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.28)"}
        />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape2, circle2Style]}>
        <Ionicons
          name="football-outline"
          size={110}
          color={isDarkMode ? "rgba(255, 255, 255, 0.13)" : "rgba(255, 255, 255, 0.25)"}
        />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape3, circle3Style]}>
        <Ionicons
          name="bicycle-outline"
          size={75}
          color={isDarkMode ? "rgba(255, 255, 255, 0.11)" : "rgba(255, 255, 255, 0.22)"}
        />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape4, circle4Style]}>
        <Ionicons
          name="tennisball-outline"
          size={70}
          color={isDarkMode ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.26)"}
        />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape5, circle5Style]}>
        <Ionicons
          name="barbell-outline"
          size={85}
          color={isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.24)"}
        />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape6, circle6Style]}>
        <Ionicons
          name="american-football-outline"
          size={65}
          color={isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.23)"}
        />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape7, circle7Style]}>
        <Ionicons
          name="baseball-outline"
          size={60}
          color={isDarkMode ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.27)"}
        />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape8, circle8Style]}>
        <Ionicons
          name="golf-outline"
          size={55}
          color={isDarkMode ? "rgba(255, 255, 255, 0.11)" : "rgba(255, 255, 255, 0.21)"}
        />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Animated.View style={[styles.content, contentStyle]}>
            {/* Title */}
            <Text style={styles.title}>{t("onboarding_step1_title")}</Text>
            <Text style={styles.subtitle}>
              {t("onboarding_step1_subtitle")}
            </Text>

            {/* Input Fields */}
            <View style={styles.inputsContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>{t("onboarding_step1_prenom_label")}</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: isDarkMode ? "#27272A" : "#FFFFFF",
                    color: isDarkMode ? "#FFFFFF" : "#000000"
                  }]}
                  placeholder={t("onboarding_step1_prenom_placeholder")}
                  placeholderTextColor={isDarkMode ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"}
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={handleInputFocus}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoFocus={true}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>{t("onboarding_step1_nom_label")}</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: isDarkMode ? "#27272A" : "#FFFFFF",
                    color: isDarkMode ? "#FFFFFF" : "#000000"
                  }]}
                  placeholder={t("onboarding_step1_nom_placeholder")}
                  placeholderTextColor={isDarkMode ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"}
                  value={lastName}
                  onChangeText={setLastName}
                  onFocus={handleInputFocus}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Bottom Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
                activeOpacity={0.85}
              >
                <Text style={styles.continueButtonText}>{t("continuer")}</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sportShape: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  shape1: {
    top: height * 0.08,
    left: width * 0.05,
  },
  shape2: {
    top: height * 0.15,
    right: width * 0.08,
  },
  shape3: {
    bottom: height * 0.06,
    left: width * 0.08,
  },
  shape4: {
    bottom: height * 0.08,
    right: width * 0.15,
  },
  shape5: {
    top: height * 0.35,
    right: width * 0.05,
  },
  shape6: {
    bottom: height * 0.2,
    right: width * 0.6,
  },
  shape7: {
    top: height * 0.1,
    right: width * 0.5,
  },
  shape8: {
    bottom: height * 0.22,
    left: width * 0.35,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 200,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  inputsContainer: {
    gap: 20,
  },
  inputWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#000000",
  },
  buttonContainer: {
    paddingVertical: 24,
    marginTop: 10,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    borderRadius: 9999,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  continueButtonText: {
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
  },
  inputAccessory: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  accessoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  accessoryButtonText: {
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});

export default OnboardingStep1;
