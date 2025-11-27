import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
import { COLORS } from "../../../styles/colors";

const { width, height } = Dimensions.get("window");

const OnboardingStep3 = ({ userData, onNext, onBack }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();
  const [expertiseLevel, setExpertiseLevel] = useState(
    userData.expertiseLevel || ""
  );

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
    float1.value = withRepeat(withTiming(40, { duration: 3500, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float2.value = withRepeat(withTiming(-35, { duration: 4200, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float3.value = withRepeat(withTiming(28, { duration: 5000, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float4.value = withRepeat(withTiming(-22, { duration: 3800, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float5.value = withRepeat(withTiming(32, { duration: 4500, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float6.value = withRepeat(withTiming(-30, { duration: 4100, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float7.value = withRepeat(withTiming(25, { duration: 3600, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float8.value = withRepeat(withTiming(-28, { duration: 4700, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    rotate.value = withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1, false);
    rotate2.value = withRepeat(withTiming(-360, { duration: 18000, easing: Easing.linear }), -1, false);
    fadeAnim.value = withTiming(1, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  }, []);

  const circle1Style = useAnimatedStyle(() => ({ transform: [{ translateY: float1.value }, { translateX: float1.value * 0.5 }, { rotate: `${rotate.value}deg` }] }));
  const circle2Style = useAnimatedStyle(() => ({ transform: [{ translateY: float2.value }, { translateX: float2.value * -0.3 }, { rotate: `${-rotate.value}deg` }] }));
  const circle3Style = useAnimatedStyle(() => ({ transform: [{ translateY: float3.value }, { translateX: float3.value * 0.7 }] }));
  const circle4Style = useAnimatedStyle(() => ({ transform: [{ translateY: float4.value }, { translateX: float4.value * -0.5 }] }));
  const circle5Style = useAnimatedStyle(() => ({ transform: [{ translateY: float5.value }, { translateX: float5.value * 0.4 }, { scale: interpolate(float5.value, [0, 32], [1, 1.15]) }] }));
  const circle6Style = useAnimatedStyle(() => ({ transform: [{ translateY: float6.value }, { translateX: float6.value * 0.6 }, { rotate: `${rotate.value}deg` }] }));
  const circle7Style = useAnimatedStyle(() => ({ transform: [{ translateY: float7.value }, { translateX: float7.value * -0.4 }, { rotate: `${rotate2.value}deg` }] }));
  const circle8Style = useAnimatedStyle(() => ({ transform: [{ translateY: float8.value }, { translateX: float8.value * 0.3 }, { scale: interpolate(float8.value, [-28, 0], [1.1, 1]) }] }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ translateY: interpolate(fadeAnim.value, [0, 1], [20, 0]) }] }));

  const expertiseLevels = [
    {
      value: "beginner",
      label: t("onboarding_step3_expertise_debutant"),
      description: "Je commence tout juste mon parcours sportif",
      icon: "walk",
      color: "#10B981",
    },
    {
      value: "amateur",
      label: "Amateur",
      description: "Je pratique régulièrement pour le plaisir",
      icon: "bicycle",
      color: "#3B82F6",
    },
    {
      value: "intermediate",
      label: t("onboarding_step3_expertise_intermediaire"),
      description: "J'ai une bonne expérience et technique",
      icon: "fitness",
      color: "#F59E0B",
    },
    {
      value: "advanced",
      label: t("onboarding_step3_expertise_avance"),
      description: "Je m'entraîne sérieusement et régulièrement",
      icon: "barbell",
      color: "#EF4444",
    },
    {
      value: "expert",
      label: t("onboarding_step3_expertise_expert"),
      description: "Compétiteur ou professionnel",
      icon: "trophy",
      color: "#8B5CF6",
    },
  ];

  const handleContinue = () => {
    if (!expertiseLevel) {
      showMessage({
        message: t("onboarding_step3_expertise_error"),
        type: "warning",
      });
      return;
    }

    onNext({ expertiseLevel });
  };

  return (
    <View style={styles.container}>
<ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, contentStyle]}>
{/* Title */}
          <Text style={styles.title}>Quel est votre niveau ?</Text>
          <Text style={styles.subtitle}>
            Cela nous aide à vous recommander des activités adaptées
          </Text>

          {/* Expertise Levels */}
          <View style={styles.levelsContainer}>
            {expertiseLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.levelCard,
                  expertiseLevel === level.value && styles.levelCardSelected,
                ]}
                onPress={() => {
                  setExpertiseLevel(level.value);
                  onNext({ expertiseLevel: level.value });
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.levelIconContainer,
                    { backgroundColor: level.color },
                  ]}
                >
                  <Ionicons name={level.icon} size={28} color="#FFFFFF" />
                </View>
                <View style={styles.levelInfo}>
                  <Text
                    style={[
                      styles.levelLabel,
                      expertiseLevel === level.value && styles.levelLabelSelected,
                    ]}
                  >
                    {level.label}
                  </Text>
                  <Text
                    style={[
                      styles.levelDescription,
                      expertiseLevel === level.value &&
                        styles.levelDescriptionSelected,
                    ]}
                  >
                    {level.description}
                  </Text>
                </View>
                {expertiseLevel === level.value && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>Continuer</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40
  },
title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24
  },
  levelsContainer: {
    gap: 12
  },
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 16,
    borderWidth: 2,
    borderColor: "transparent"
  },
  levelCardSelected: {
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.95)"
  },
  levelIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center"
  },
  levelInfo: {
    flex: 1
  },
  levelLabel: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#000000",
    marginBottom: 4
  },
  levelLabelSelected: {
    color: COLORS.primary
  },
  levelDescription: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18
  },
  levelDescriptionSelected: {
    
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 18,
    borderRadius: 9999,
    gap: 8,
    flex: 1
  },
  backButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 17
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    borderRadius: 9999,
    gap: 8,
    flex: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  continueButtonText: {
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 17
  },
});

export default OnboardingStep3;
