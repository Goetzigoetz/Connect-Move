import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

export default function ConnectionError() {
  const { t } = useTranslation();

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
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    // Animations des formes flottantes
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

    // Animation de pulsation pour l'icône wifi
    pulseAnim.value = withRepeat(
      withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
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

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background gradient */}
      <LinearGradient
        colors={["#F97316", "#F97316", "#EA580C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Formes animées en arrière-plan - Thème sport */}
      <Animated.View style={[styles.sportShape, styles.shape1, circle1Style]}>
        <Ionicons name="basketball-outline" size={90} color="rgba(255, 255, 255, 0.28)" />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape2, circle2Style]}>
        <Ionicons name="football-outline" size={110} color="rgba(255, 255, 255, 0.25)" />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape3, circle3Style]}>
        <Ionicons name="bicycle-outline" size={75} color="rgba(255, 255, 255, 0.22)" />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape4, circle4Style]}>
        <Ionicons name="tennisball-outline" size={70} color="rgba(255, 255, 255, 0.26)" />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape5, circle5Style]}>
        <Ionicons name="barbell-outline" size={85} color="rgba(255, 255, 255, 0.24)" />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape6, circle6Style]}>
        <Ionicons name="american-football-outline" size={65} color="rgba(255, 255, 255, 0.23)" />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape7, circle7Style]}>
        <Ionicons name="baseball-outline" size={60} color="rgba(255, 255, 255, 0.27)" />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape8, circle8Style]}>
        <Ionicons name="golf-outline" size={55} color="rgba(255, 255, 255, 0.21)" />
      </Animated.View>

      {/* Overlay pour atténuer légèrement */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, contentStyle]}>
          {/* Icon Section avec pulsation */}
          <View style={styles.iconSection}>
            <Animated.View style={[styles.iconContainer, pulseStyle]}>
              <Ionicons name="wifi-outline" size={60} color="#FFFFFF" />
              <View style={styles.crossLine} />
            </Animated.View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              {t("erreur_de_connexion_reseau")}
            </Text>
            <Text style={styles.subtitle}>
              {t("connexion_instable")}
            </Text>
          </View>

          {/* Info Section */}
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Ionicons name="wifi" size={24} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.infoText}>{t("verifiez_wifi")}</Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="phone-portrait" size={24} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.infoText}>{t("verifiez_4g")}</Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="airplane" size={24} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.infoText}>{t("desactivez_mode_avion")}</Text>
            </View>
          </View>

          {/* Footer text */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t("reconnexion_auto")}
            </Text>
          </View>
        </Animated.View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 60,
  },
  iconSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  crossLine: {
    position: "absolute",
    width: 2,
    height: 100,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: "#FFFFFF",
    marginBottom: 16,
    lineHeight: 34,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 26,
    letterSpacing: -0.2,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  infoContainer: {
    gap: 20,
    marginBottom: 40,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 16,
  },
  infoText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 22,
  },
});
