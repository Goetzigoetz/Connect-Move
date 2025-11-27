import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../styles/colors";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "../ThemeProvider";
import { useSubscription } from "../contexts/SubscriptionContext";

const { width, height } = Dimensions.get("window");

const Confetti = ({ index, colors }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const startX = Math.random() * width;
  const endX = startX + (Math.random() - 0.5) * 100;
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = Math.random() * 8 + 6;
  const duration = Math.random() * 2000 + 2500;
  const rotations = Math.random() * 4 + 2;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height + 50,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: endX - startX,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: rotations,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: duration * 0.8,
        delay: duration * 0.2,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size / 2,
        transform: [{ translateY }, { translateX }, { rotate: spin }],
        opacity,
      }}
    />
  );
};

const ErrorParticle = ({ index, colors }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const startX = Math.random() * width;
  const endX = startX + (Math.random() - 0.5) * 100;
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = Math.random() * 6 + 4;
  const duration = Math.random() * 2000 + 2500;
  const rotations = Math.random() * 4 + 2;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height + 50,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: endX - startX,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: rotations,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: duration * 0.8,
        delay: duration * 0.2,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size / 2,
        transform: [{ translateY }, { translateX }, { rotate: spin }],
        opacity,
      }}
    />
  );
};

export default function PaymentResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();
  const { forceRefresh } = useSubscription();

  // Récupérer le statut depuis les paramètres de la route
  const isSuccess = route.params?.success ?? true;

  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const iconShake = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;

  const confettiColors = [
    COLORS.primary,
    COLORS.secondary,
    "#22c55e",
    "#3b82f6",
    "#f59e0b",
    "#ec4899",
  ];

  const errorColors = [
    "#EF4444",
    "#DC2626",
    "#F87171",
    "#FCA5A5",
  ];

  useEffect(() => {
    // Animation de l'icône
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    if (isSuccess) {
      // Animation de rotation pour le succès
      Animated.timing(iconRotate, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Animation de shake pour l'erreur
      Animated.sequence([
        Animated.timing(iconShake, {
          toValue: 10,
          duration: 100,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(iconShake, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(iconShake, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(iconShake, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Animations de fade in et slide up
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 800,
      delay: 500,
      useNativeDriver: true,
    }).start();

    Animated.timing(slideUp, {
      toValue: 0,
      duration: 800,
      delay: 500,
      useNativeDriver: true,
    }).start();
  }, [isSuccess]);

  const rotateInterpolate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-10deg", "0deg"],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB" }]}>
      {/* Afficher les confettis seulement en cas de succès */}
      {isSuccess ? (
        Array.from({ length: 80 }).map((_, index) => (
          <Confetti key={index} index={index} colors={confettiColors} />
        ))
      ) : null}

      <View style={styles.content}>
        <Animated.View
          style={{
            transform: isSuccess
              ? [{ scale: iconScale }, { rotate: rotateInterpolate }]
              : [{ scale: iconScale }, { translateX: iconShake }],
          }}
        >
          <View style={[
            styles.iconCircle,
            {
              backgroundColor: isSuccess ? "#22c55e15" : "#EF444415",
              borderColor: isSuccess ? "#22c55e" : "#EF4444",
            }
          ]}>
            <MaterialIcons
              name={isSuccess ? "check" : "close"}
              size={80}
              color={isSuccess ? "#22c55e" : "#EF4444"}
            />
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
            alignItems: "center",
            width: "100%",
          }}
        >
          <Text style={[
            styles.title,
            { color: isSuccess ? COLORS.primary : "#EF4444" }
          ]}>
            {isSuccess
              ? (t("subscriptionConfirmed") || "Abonnement activé !")
              : (t("subscriptionFailed") || "Activation échouée")
            }
          </Text>

          <Text style={[styles.subtitle, { color: isDarkMode ? "rgba(255, 255, 255, 0.7)" : "#4B5563" }]}>
            {isSuccess
              ? (t("subscriptionSuccessful") || "Merci pour votre confiance")
              : (t("subscriptionError") || "Une erreur s'est produite. Veuillez réessayer.")
            }
          </Text>

          {/* Benefits section - only for success */}
          {isSuccess && (
            <View style={[
              styles.benefitsContainer,
              {
                backgroundColor: isDarkMode ? "#27272A" : "#FFFFFF",
                borderColor: isDarkMode ? "#3F3F46" : "#E5E7EB",
              }
            ]}>
              <Text style={[
                styles.benefitsTitle,
                { color: isDarkMode ? "#FFFFFF" : "#000000" }
              ]}>
                {t("vous_pouvez_maintenant") || "Vous pouvez maintenant"} :
              </Text>

              <View style={styles.benefitItem}>
                <View style={[styles.benefitIconContainer, { backgroundColor: COLORS.primary + "20" }]}>
                  <MaterialIcons name="flash-on" size={20} color={COLORS.primary} />
                </View>
                <Text style={[styles.benefitText, { color: isDarkMode ? "#E5E7EB" : "#4B5563" }]}>
                  {t("creer_evenements_illimites") || "Créer des événements illimités"}
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <View style={[styles.benefitIconContainer, { backgroundColor: COLORS.primary + "20" }]}>
                  <MaterialIcons name="star" size={20} color={COLORS.primary} />
                </View>
                <Text style={[styles.benefitText, { color: isDarkMode ? "#E5E7EB" : "#4B5563" }]}>
                  {t("acceder_fonctionnalites_premium") || "Accéder aux fonctionnalités premium"}
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <View style={[styles.benefitIconContainer, { backgroundColor: COLORS.primary + "20" }]}>
                  <MaterialIcons name="people" size={20} color={COLORS.primary} />
                </View>
                <Text style={[styles.benefitText, { color: isDarkMode ? "#E5E7EB" : "#4B5563" }]}>
                  {t("rejoindre_communaute_premium") || "Rejoindre la communauté premium"}
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <View style={[styles.benefitIconContainer, { backgroundColor: COLORS.primary + "20" }]}>
                  <MaterialIcons name="support-agent" size={20} color={COLORS.primary} />
                </View>
                <Text style={[styles.benefitText, { color: isDarkMode ? "#E5E7EB" : "#4B5563" }]}>
                  {t("support_prioritaire") || "Bénéficier du support prioritaire"}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      <View style={styles.buttonContainer}>
        {isSuccess && (
          <Text style={[styles.restartNotice, { color: isDarkMode ? "#94A3B8" : "#64748B" }]}>
            {t("app_will_restart")}
          </Text>
        )}
        <Pressable
          onPress={async () => {
            if (isSuccess) {
              try {
                // Forcer la synchronisation avec RevenueCat via le contexte centralisé
                await forceRefresh();
                // Retourner au profil
                navigation.navigate("Profile");
              } catch (error) {
                console.error("Erreur lors de la mise à jour de l'abonnement:", error);
                navigation.goBack();
              }
            } else {
              // En cas d'erreur, retourner à AllOffers pour réessayer
              navigation.goBack();
            }
          }}
          style={[
            styles.button,
            { backgroundColor: isSuccess ? COLORS.primary : "#EF4444" }
          ]}
        >
          {!isSuccess && (
            <MaterialIcons name="refresh" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.buttonText}>
            {isSuccess ? "OK" : (t("retry") || "Réessayer")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    borderWidth: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 32,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  restartNotice: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginBottom: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  benefitsContainer: {
    width: "100%",
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitsTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
    textAlign: "center",
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
});
