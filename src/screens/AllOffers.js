import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import Purchases from "react-native-purchases";
import { doc, updateDoc, serverTimestamp } from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { API_URL } from "@env";
import { COLORS } from "../styles/colors";
import { useThemeContext } from "../ThemeProvider";
import { useSubscription } from "../contexts/SubscriptionContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const AllOffers = ({ navigation }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();
  const { subscription, onPurchaseComplete, syncWithRevenueCat } = useSubscription();

  const [activeTab, setActiveTab] = useState("premium");
  // subscription est maintenant géré par le contexte (subscription)
  const [offerings, setOfferings] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processingPackageId, setProcessingPackageId] = useState(null);
  const scrollViewRef = useRef(null);
  const previousIndexRef = useRef(0);

  // Shared values pour chaque plan
  const scrollYPremium = useSharedValue(0);
  const scrollYPro = useSharedValue(0);
  const currentIndexShared = useSharedValue(0);

  // Plan configurations matching HowItsWork
  const planConfigs = {
    premium: {
      gradient: ["#3B82F6", "#2563EB"],
      iconName: "star",
      title: "Premium",
      badge: "Populaire",
    },
    pro: {
      gradient: ["#8B5CF6", "#7C3AED"],
      iconName: "briefcase",
      title: "Pro",
    },
  };

  // L'état d'abonnement est maintenant géré par le SubscriptionContext
  // On initialise l'onglet actif basé sur l'abonnement actuel
  useEffect(() => {
    if (subscription && subscription !== "gratuit") {
      setActiveTab(subscription);
    }
  }, [subscription]);

  const fetchOfferings = async () => {
    try {
      const fetchedOfferings = await Purchases.getOfferings();
      if (fetchedOfferings.current) {
        setOfferings(fetchedOfferings.current);
      } else {
        console.log("Aucune offre disponible.");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des offres :", error);
    }
  };

  useEffect(() => {
    // Sync subscription et récupérer les offres au montage
    syncWithRevenueCat();
    fetchOfferings();
  }, []);

  const handlePurchase = async (packageToPurchase) => {
  // Empêcher les double-clics
  if (processingPackageId) return;

  setProcessingPackageId(packageToPurchase.identifier);
  // Feedback haptique lors de la sélection d'une offre
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  try {
    const purchaserInfo = await Purchases.purchasePackage(packageToPurchase);

    if (purchaserInfo.customerInfo.entitlements.active) {
      const activeEntitlement = Object.keys(
        purchaserInfo.customerInfo.entitlements.active
      )[0];

      const userUID = auth.currentUser?.uid;

      if (!userUID) {
        navigation.navigate("PaymentResultScreen", { success: false });
        return;
      }

      // Mettre à jour l'abonnement via le contexte centralisé
      await onPurchaseComplete(purchaserInfo.customerInfo);

      // Envoyer l'email de confirmation d'abonnement
      try {
        const user = auth.currentUser;
        const userEmail = user?.email;
        const userName = user?.displayName || "Cher(e) abonné(e)";

        // Récupérer les informations du package
        const packagePrice = packageToPurchase.product.priceString;
        const packageTitle = packageToPurchase.product.title;
        const packagePeriod = packageToPurchase.identifier.includes("year") ? "annuel" : "mensuel";

        if (userEmail) {
          const response = await fetch(`${API_URL}/abonnement_confirmed.php`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: userEmail,
              userName: userName,
              planName: activeEntitlement.charAt(0).toUpperCase() + activeEntitlement.slice(1),
              planPrice: packagePrice,
              planPeriod: packagePeriod,
              packageTitle: packageTitle,
            }),
          });

          if (!response.ok) {
            console.warn("Email de confirmation non envoyé:", await response.text());
            Alert.alert(
              t("attention") || "Attention",
              t("email_confirmation_erreur") || "Votre abonnement est actif mais l'email de confirmation n'a pas pu être envoyé.",
              [{ text: "OK" }]
            );
          }
        }
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email:", emailError);
        Alert.alert(
          t("attention") || "Attention",
          t("email_confirmation_erreur") || "Votre abonnement est actif mais l'email de confirmation n'a pas pu être envoyé.",
          [{ text: "OK" }]
        );
      }

      // Navigate to success screen
      navigation.navigate("PaymentResultScreen", { success: true });
    }
  } catch (error) {
    if (!error.userCancelled) {
      console.error("Erreur lors de l'achat :", error);
      // Navigate to error screen
      navigation.navigate("PaymentResultScreen", { success: false });
    }
  } finally {
    setProcessingPackageId(null);
  }
};

  const manageSubscription = async () => {
    try {
      await Purchases.showManageSubscriptions();
    } catch (error) {
      console.error("Erreur lors de l'ouverture des paramètres d'abonnement:", error);
      showMessage({
        message: t("erreur"),
        description: t("impossible_douvrir_les_parametres_dabonnement"),
        type: "danger",
      });
    }
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);

    // Déclencher le feedback haptique lors du changement de tab
    if (index !== previousIndexRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      previousIndexRef.current = index;
    }

    setCurrentIndex(index);
    currentIndexShared.value = index;

    const plans = ["premium", "pro"];
    if (plans[index]) {
      setActiveTab(plans[index]);
    }
  };

  const cardAnimatedStylePremium = useAnimatedStyle(() => {
    const height = interpolate(
      scrollYPremium.value,
      [0, 150],
      [420, 0],
      "clamp"
    );

    const opacity = interpolate(
      scrollYPremium.value,
      [0, 120],
      [1, 0],
      "clamp"
    );

    return {
      height,
      opacity,
    };
  });

  const cardAnimatedStylePro = useAnimatedStyle(() => {
    const height = interpolate(
      scrollYPro.value,
      [0, 150],
      [420, 0],
      "clamp"
    );

    const opacity = interpolate(
      scrollYPro.value,
      [0, 120],
      [1, 0],
      "clamp"
    );

    return {
      height,
      opacity,
    };
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    // Utiliser currentIndexShared pour sélectionner le bon scrollY
    const scrollY = currentIndexShared.value === 0 ? scrollYPremium.value : scrollYPro.value;

    const opacity = interpolate(
      scrollY,
      [120, 160],
      [0, 1],
      "clamp"
    );

    const translateY = interpolate(
      scrollY,
      [120, 160],
      [-20, 0],
      "clamp"
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const getPlanData = (type) => {
    const config = planConfigs[type];

    let monthlyPkg = null;
    let yearlyPkg = null;
    let monthlySavings = null;

    if (offerings) {
      const filteredPackages = offerings.availablePackages.filter((pkg) =>
        type === "premium" ? pkg.identifier.includes("premium") : pkg.identifier.includes("pro")
      );

      monthlyPkg = filteredPackages.find((pkg) =>
        pkg.identifier.includes("monthly") || pkg.identifier.includes("month")
      );
      yearlyPkg = filteredPackages.find((pkg) => pkg.identifier.includes("year"));

      // Diviser par 14 car 12 mois payés + 2 mois d'essai gratuit
      const yearlyMonthlyEquivalent = yearlyPkg
        ? (parseFloat(yearlyPkg.product.price) / 14).toFixed(2)
        : null;

      monthlySavings = monthlyPkg && yearlyMonthlyEquivalent
        ? ((parseFloat(monthlyPkg.product.price) - parseFloat(yearlyMonthlyEquivalent)) / parseFloat(monthlyPkg.product.price) * 100).toFixed(0)
        : null;
    }

    return { config, monthlyPkg, yearlyPkg, monthlySavings };
  };

  const renderStickyHeader = () => {
    const { config, monthlyPkg, yearlyPkg } = getPlanData(activeTab);

    return (
      <Animated.View
        style={[
          styles.stickyHeader,
          stickyHeaderStyle,
          { backgroundColor: isDarkMode ? COLORS.bgDark + "F5" : "#FFFFFFF5" }
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.stickyContent}>
          <View style={styles.stickyLeft}>
            <View style={[styles.stickyIcon, { backgroundColor: config.gradient[0] + "20" }]}>
              <Ionicons name={config.iconName} size={24} color={config.gradient[0]} />
            </View>
            <View style={styles.stickyInfo}>
              <Text style={[styles.stickyTitle, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                {config.title}
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                {monthlyPkg && (
                  <Text style={[styles.stickyPrice, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
                    {monthlyPkg.product.priceString}/mois
                  </Text>
                )}
                {monthlyPkg && yearlyPkg && (
                  <Text style={[styles.stickyPrice, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
                    •
                  </Text>
                )}
                {yearlyPkg && (
                  <Text style={[styles.stickyPrice, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
                    {yearlyPkg.product.priceString}/an (2 mois d'essai gratuit)
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Croix pour gérer l'abonnement si l'utilisateur est abonné */}
          {subscription === activeTab && (
            <TouchableOpacity
              onPress={manageSubscription}
              style={[
                styles.stickyCloseButton,
                {
                  backgroundColor: isDarkMode ? "#27272A" : "#F3F4F6",
                }
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={isDarkMode ? "#FFFFFF" : "#000000"}
              />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderPlanCard = (type, index) => {
    const { config, monthlyPkg, yearlyPkg, monthlySavings } = getPlanData(type);

    if (!offerings) {
      return (
        <View style={[styles.planCard, { width: SCREEN_WIDTH - 32 }]}>
          <Text style={[styles.loadingText, { color: isDarkMode ? "#94A3B8" : "#64748B" }]}>
            {t("chargement")}
          </Text>
        </View>
      );
    }

    return (
      <Animated.View
        key={type}
        entering={FadeInDown.duration(500).delay(index * 100)}
        style={styles.planCardContainer}
      >
        <View style={[
          styles.planCard,
          { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
        ]}>
          {/* Icon at top */}
          <View style={[styles.mainIconContainer, { backgroundColor: config.gradient[0] + "20" }]}>
            <Ionicons name={config.iconName} size={48} color={config.gradient[0]} />
          </View>

          {/* Plan title and Cancel button */}
          <View style={styles.planTitleRow}>
            <Text style={[styles.planCardTitle, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
              {config.title}
            </Text>

            {/* Bouton Résilier si abonné à ce plan */}
            {subscription === type && (
              <TouchableOpacity
                onPress={manageSubscription}
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: isDarkMode ? "#27272A" : "#F3F4F6",
                    borderColor: isDarkMode ? "#3F3F46" : "#E5E7EB",
                  }
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="settings-outline"
                  size={16}
                  color={isDarkMode ? "#FFFFFF" : "#000000"}
                />
                <Text style={[
                  styles.cancelButtonText,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" }
                ]}>
                  {t("gerer_ou_resilier")}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Plan badge (si applicable) */}
          {config.badge && (
            <View style={[styles.popularBadge, { backgroundColor: config.gradient[0] + "15" }]}>
              <Text style={[styles.popularBadgeText, { color: config.gradient[0] }]}>
                {config.badge}
              </Text>
            </View>
          )}

          {/* Pricing options */}
          <View style={styles.pricingOptionsContainer}>
            {/* Monthly pricing */}
            {monthlyPkg && (
              <Pressable
                onPress={() => handlePurchase(monthlyPkg)}
                disabled={processingPackageId !== null}
                style={({ pressed }) => ({
                  backgroundColor: isDarkMode ? "#27272A" : "#F9FAFB",
                  borderColor: isDarkMode ? "#3F3F46" : "#E5E7EB",
                  borderWidth: 2,
                  borderRadius: 16,
                  padding: 18,
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: processingPackageId !== null ? 0.5 : (pressed ? 0.6 : 1),
                })}
              >
                {processingPackageId === monthlyPkg.identifier ? (
                  <ActivityIndicator size="small" color={config.gradient[0]} />
                ) : (
                  <View>
                    <Text style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 4,
                      color: isDarkMode ? "#A1A1AA" : "#71717A"
                    }}>
                      {t("mensuel") || "Mensuel"}
                    </Text>
                    <Text style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 28,
                      letterSpacing: -0.5,
                      color: isDarkMode ? "#FFFFFF" : "#000000"
                    }}>
                      {monthlyPkg.product.priceString}
                      <Text style={{
                        fontFamily: "Inter_400Regular",
                        fontSize: 16,
                        color: isDarkMode ? "#71717A" : "#A1A1AA"
                      }}>
                        {" "}/mois
                      </Text>
                    </Text>
                  </View>
                )}
              </Pressable>
            )}

            {/* Annual pricing with savings badge */}
            {yearlyPkg && (
              <Pressable
                onPress={() => handlePurchase(yearlyPkg)}
                disabled={processingPackageId !== null}
                style={({ pressed }) => [
                  styles.pricingOptionHighlight,
                  { opacity: processingPackageId !== null ? 0.5 : (pressed ? 0.6 : 1) }
                ]}
              >
                <LinearGradient
                  colors={config.gradient}
                  style={styles.pricingOptionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {processingPackageId === yearlyPkg.identifier ? (
                    <View style={styles.pricingOptionContent}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.pricingOptionContent}>
                      <View style={styles.pricingOptionLeft}>
                        <View style={styles.annualHeaderRow}>
                          <Text style={styles.pricingLabelHighlight}>
                            {t("annuel") || "Annuel"}
                          </Text>
                          {monthlySavings && (
                            <View style={styles.savingsBadge}>
                              <Text style={styles.savingsBadgeText}>
                                {t("periode_essai_2_mois") || "2 mois d'essai gratuit"}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.pricingValueHighlight}>
                          {yearlyPkg.product.priceString}
                          <Text style={styles.pricingPeriodHighlight}>
                            {" "}/an
                          </Text>
                        </Text>
                        {monthlySavings && (
                          <Text style={styles.savingsText}>
                            Économisez {monthlySavings}%
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderPageContent = (planType, index) => {
    // Sélectionner le bon scroll handler et style en fonction du plan
    const scrollY = planType === "premium" ? scrollYPremium : scrollYPro;
    const cardStyle = planType === "premium" ? cardAnimatedStylePremium : cardAnimatedStylePro;

    const scrollHandler = useAnimatedScrollHandler({
      onScroll: (event) => {
        scrollY.value = event.contentOffset.y;
      },
    });

    // Style animé pour les features qui compense la hauteur de la carte
    const featuresAnimatedStyle = useAnimatedStyle(() => {
      // Calculer la hauteur de la carte pour un espacement homogène
      // Éléments qui ajoutent de la hauteur :
      // - Badge "Populaire" sur Premium : ~36px
      // - Bouton "Gérer ou résilier" si abonné à ce plan : ~44px

      let basePadding = 24;
      let targetPadding = 444;

      // Calculer la hauteur totale des éléments supplémentaires pour chaque plan
      const isPremiumPlan = planType === "premium";
      const isSubscribedToThisPlan = subscription === planType;

      // Hauteur de base de la carte : ~400px
      // Premium avec badge : +36px
      // Plan avec bouton Gérer : +44px

      if (isPremiumPlan && isSubscribedToThisPlan) {
        // Premium abonné : badge + bouton = +80px
        basePadding = 80;
        targetPadding = 540;
      } else if (isPremiumPlan && !isSubscribedToThisPlan) {
        // Premium non abonné : juste le badge = +36px
        basePadding = 44;
        targetPadding = 500;
      } else if (!isPremiumPlan && isSubscribedToThisPlan) {
        // Pro abonné : juste le bouton = +44px
        basePadding = 48;
        targetPadding = 504;
      } else {
        // Pro non abonné : rien
        basePadding = 24;
        targetPadding = 480;
      }

      const paddingTop = interpolate(
        scrollY.value,
        [0, 150],
        [basePadding, targetPadding],
        "clamp"
      );

      return {
        paddingTop,
      };
    });

    return (
      <Animated.ScrollView
        key={planType}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.pageScrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan Card */}
        <View style={styles.cardWrapper}>
          <Animated.View style={cardStyle}>
            {renderPlanCard(planType, index)}
          </Animated.View>
        </View>

        {/* Features Section */}
        <Animated.View style={[styles.featuresContent, featuresAnimatedStyle]}>

          <Animated.View entering={FadeInDown.duration(500).delay(300)}>
            {planType === "premium" && (
              <View style={styles.featuresGrid}>
                {t("plan_premium_features", { returnObjects: true }).map((text, idx) => {
                  const icons = ["checkmark-circle", "flash", "star", "trophy", "gift"];
                  const showNew = idx !== 0 && idx !== t("plan_premium_features", { returnObjects: true }).length - 1;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.featureCard,
                        { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F9FAFB" }
                      ]}
                    >
                      <View style={[styles.featureIconBg, { backgroundColor: planConfigs.premium.gradient[0] + "20" }]}>
                        <Ionicons name={icons[idx % icons.length]} size={20} color={planConfigs.premium.gradient[0]} />
                      </View>
                      <Text style={[styles.featureCardText, { color: isDarkMode ? "#E5E7EB" : "#374151" }]}>
                        {text}
                      </Text>
                      {showNew && (
                        <View style={styles.newBadgeSmall}>
                          <Text style={styles.newBadgeSmallText}>{t("new")}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {planType === "pro" && (
              <View style={styles.featuresGrid}>
                {t("plan_business_features", { returnObjects: true }).map((feature, idx) => {
                  const icons = ["business", "analytics", "people", "shield-checkmark", "rocket"];
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.featureCard,
                        { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F9FAFB" }
                      ]}
                    >
                      <View style={[styles.featureIconBg, { backgroundColor: planConfigs.pro.gradient[0] + "20" }]}>
                        <Ionicons name={icons[idx % icons.length]} size={20} color={planConfigs.pro.gradient[0]} />
                      </View>
                      <Text style={[styles.featureCardText, { color: isDarkMode ? "#E5E7EB" : "#374151" }]}>
                        {feature}
                      </Text>
                      {idx !== 0 && (
                        <View style={styles.newBadgeSmall}>
                          <Text style={styles.newBadgeSmallText}>{t("new")}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </Animated.ScrollView>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" },
      ]}
    >
      {/* Sticky Header */}
      {renderStickyHeader()}

      {/* Page Indicators */}
      <View style={styles.pageIndicators} pointerEvents="none">
        {["premium", "pro"].map((planName, index) => (
          <View
            key={index}
            style={[
              styles.pageIndicator,
              {
                backgroundColor: currentIndex === index
                  ? planConfigs[planName].gradient[0]
                  : isDarkMode ? "#3F3F46" : "#E5E7EB",
                width: currentIndex === index ? 24 : 8,
              }
            ]}
          />
        ))}
      </View>

      {/* Horizontal Swipeable Pages */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.horizontalPager}
      >
        {["premium", "pro"].map((planType, index) => (
          <View key={planType} style={styles.pageContainer}>
            {renderPageContent(planType, index)}
          </View>
        ))}
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  horizontalPager: {
    flex: 1,
  },
  pageContainer: {
    width: SCREEN_WIDTH,
  },
  pageScrollView: {
    flex: 1,
  },
  cardWrapper: {
    marginBottom: 0,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  stickyContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stickyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  stickyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyInfo: {
    flex: 1,
  },
  stickyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  stickyPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  stickyPrice: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: -0.1,
  },
  stickyPriceSeparator: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  stickyPriceAnnual: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: -0.1,
  },
  horizontalScroll: {
    flexGrow: 0,
    height: 420,
  },
  horizontalScrollContent: {
    paddingHorizontal: 0,
  },
  planSlide: {
    width: SCREEN_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
  planCardContainer: {
    paddingHorizontal: 16,
    width: SCREEN_WIDTH,
  },
  planCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    minHeight: 380,
  },
  mainIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  planCardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 8,
  },
  popularBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 20,
  },
  popularBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  pricingOptionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  freePlanInfo: {
    padding: 20,
    alignItems: "center",
  },
  freePlanText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    textAlign: "center",
  },
  pricingOption: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
  },
  pricingOptionHighlight: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  pricingOptionGradient: {
    padding: 18,
  },
  pricingOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pricingOptionLeft: {
    flex: 1,
    minWidth: 0,
  },
  annualHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  pricingLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pricingLabelHighlight: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  pricingValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  pricingValueHighlight: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: -0.5,
    color: "#FFFFFF",
  },
  pricingPeriod: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },
  pricingPeriodHighlight: {
    fontFamily: "Inter_500Medium",
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
  },
  savingsBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#FFFFFF",
  },
  savingsText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 4,
  },
  pageIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingTop: 8,
  },
  pageIndicator: {
    height: 8,
    borderRadius: 4,
    transition: "all 0.3s ease",
  },
  featuresContent: {
    paddingHorizontal: 16,
    marginTop: 80,
    paddingTop: 24,
    paddingBottom: 40,
  },
  featuresTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.3,
    marginBottom: 16,
    marginTop: 8,
  },
  featuresGrid: {
    gap: 10,
  },
  featureCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCardText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 18,
  },
  newBadgeSmall: {
    backgroundColor: "#10B981",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  newBadgeSmallText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: "#FFFFFF",
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  planTitleRow: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    gap: 6,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  stickyCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AllOffers;
