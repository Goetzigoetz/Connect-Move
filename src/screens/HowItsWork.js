import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../ThemeProvider";
import { useTranslation } from "react-i18next";
import firestore from "@react-native-firebase/firestore";
import SettingsPageLayout from "../components/SettingsPageLayout";
import { COLORS } from "../styles/colors";

const HowItWorks = ({ navigation }) => {
  const { isDarkMode } = useThemeContext();
  const { t } = useTranslation();
  const [pricingData, setPricingData] = useState(null);
  const [pointsData, setPointsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Récupérer les données de Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les prix des abonnements
        const exchangepointsDoc = await firestore()
          .collection("admin")
          .doc("exchangepoints")
          .get();

        // Récupérer les points de parrainage
        const defispointDoc = await firestore()
          .collection("admin")
          .doc("defispoint")
          .get();

        if (exchangepointsDoc.exists) {
          setPricingData(exchangepointsDoc.data());
        }

        if (defispointDoc.exists) {
          setPointsData(defispointDoc.data());
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Utiliser les données de Firestore si disponibles, sinon valeurs par défaut
  const plans = [
    {
      gradient: ["#10B981", "#059669"],
      icon: "account-outline",
      titleKey: "plan_free_label",
      title: "Gratuit",
      price: "0€",
      priceLabel: "/mois",
      details: ["plan_free_ideal"],
      featuresKey: "plan_free_features",
      iconName: "person-outline",
      badge: null,
    },
    {
      gradient: ["#3B82F6", "#2563EB"],
      icon: "crown-outline",
      titleKey: "plan_premium_label",
      title: "Premium",
      price: pricingData?.premium_month ? `${(pricingData.premium_month / 100).toFixed(2).replace('.', ',')}€` : "5,50€",
      priceLabel: "/mois",
      yearlyPrice: pricingData?.premium_year ? `${(pricingData.premium_year / 100).toFixed(2).replace('.', ',')}€/an` : "60,00€/an",
      yearlyBadge: "2 mois d'essai gratuit",
      details: ["plan_premium_ideal"],
      featuresKey: "plan_premium_features",
      iconName: "star",
      badge: "⭐ Populaire",
      isPopular: true,
    },
    {
      gradient: ["#8B5CF6", "#7C3AED"],
      icon: "briefcase-outline",
      titleKey: "plan_pro_label",
      title: "Pro",
      price: pricingData?.pro_month ? `${(pricingData.pro_month / 100).toFixed(2).replace('.', ',')}€` : "10,00€",
      priceLabel: "/mois",
      yearlyPrice: pricingData?.pro_year ? `${(pricingData.pro_year / 100).toFixed(2).replace('.', ',')}€/an` : "120,00€/an",
      yearlyBadge: "2 mois d'essai gratuit",
      details: ["plan_pro_ideal"],
      featuresKey: "plan_pro_features",
      iconName: "briefcase",
      badge: null,
    },
  ];

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  const handlePlanPress = (plan) => {
    // Rediriger vers la page AllOffers
    navigation.navigate("AllOffers");
  };

  const renderPlan = (plan, index) => {
    const features = t(plan.featuresKey, { returnObjects: true }) || [];

    return (
      <TouchableOpacity
        key={index}
        onPress={() => handlePlanPress(plan)}
        activeOpacity={0.9}
        style={[
          styles.planCard,
          {
            backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
            borderWidth: plan.isPopular ? 2 : 0,
            borderColor: plan.isPopular ? plan.gradient[0] : "transparent",
          }
        ]}
      >
        {/* Badge Populaire */}
        {plan.badge && (
          <View style={styles.popularBadgeContainer}>
            <LinearGradient
              colors={plan.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.popularBadge}
            >
              <Text style={styles.popularBadgeText}>{plan.badge}</Text>
            </LinearGradient>
          </View>
        )}

        {/* Header avec gradient */}
        <LinearGradient
          colors={plan.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planHeaderGradient}
        >
          <View style={styles.planIconContainerNew}>
            <Ionicons name={plan.iconName} size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.planTitleNew}>
            {t(plan.titleKey) || plan.title}
          </Text>

          {/* Section tarifaire unifiée */}
          <View style={styles.pricingSection}>
            {/* Prix mensuel */}
            <View style={styles.monthlyPriceBlock}>
              <Text style={styles.priceLabel}>Mensuel</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceAmount}>{plan.price}</Text>
                <Text style={styles.pricePeriod}>/mois</Text>
              </View>
            </View>

            {/* Diviseur */}
            {plan.yearlyPrice && (
              <View style={styles.priceDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            {/* Prix annuel avec badge économie */}
            {plan.yearlyPrice && (
              <View style={styles.yearlyPriceBlock}>
                <View style={styles.yearlyPriceHeader}>
                  <Text style={styles.priceLabel}>Annuel</Text>
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsBadgeText}>2 mois d'essai gratuit</Text>
                  </View>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceAmount}>{plan.yearlyPrice.split('/')[0]}</Text>
                  <Text style={styles.pricePeriod}>/an</Text>
                </View>
                <Text style={styles.monthlyEquivalent}>
                  Soit {(parseFloat(plan.yearlyPrice.replace(',', '.')) / 12).toFixed(2).replace('.', ',')}€/mois
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Détails du plan */}
        <View style={styles.planDetailsNew}>

          {plan.details.map((detailKey, idx) => (
            <Text
              key={idx}
              style={[
                styles.planDetailTextNew,
                { color: isDarkMode ? "#A1A1AA" : "#71717A" },
              ]}
            >
              {t(detailKey)}
            </Text>
          ))}
        </View>

        {/* Fonctionnalités avec icônes */}
        <View style={styles.featuresContainerNew}>
          {features.map((feature, idx) => (
            <View key={idx} style={styles.featureItemNew}>
              <View style={styles.featureIconContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={plan.gradient[0]}
                />
              </View>
              <Text
                style={[
                  styles.featureTextNew,
                  { color: isDarkMode ? "#E4E4E7" : "#27272A" },
                ]}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Bouton Voir les offres */}
        <View style={styles.planButtonContainer}>
          <LinearGradient
            colors={plan.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.planButton}
          >
            <Text style={styles.planButtonText}>Voir les offres</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (titleKey, items, iconName = "grid", color = "#3B82F6") => {
    return (
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
        ]}
      >
        <View style={styles.sectionHeaderContainer}>
          <LinearGradient
            colors={[color, `${color}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionIconGradient}
          >
            <Ionicons name={iconName} size={24} color="#FFFFFF" />
          </LinearGradient>
          <Text
            style={[
              styles.sectionTitleNew,
              { color: isDarkMode ? "#FFFFFF" : "#000000" },
            ]}
          >
            {t(titleKey)}
          </Text>
        </View>
        <View style={styles.sectionItemsContainer}>
          {items.map((itemKey, idx) => (
            <View key={idx} style={styles.sectionItemNew}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={color}
                style={styles.sectionItemIcon}
              />
              <Text
                style={[
                  styles.sectionTextNew,
                  { color: isDarkMode ? "#D4D4D8" : "#3F3F46" },
                ]}
              >
                {t(itemKey)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SettingsPageLayout
      title={""}
      subtitle={""}
    >
      {/* Section Tarifs */}
      <View style={styles.plansContainer}>
        {plans.map((plan, index) => renderPlan(plan, index))}
      </View>

      {/* Section Parrainage */}
      <View style={[styles.referralSection, { paddingHorizontal: 16 }]}>
        <View
          style={[
            styles.referralCard,
            { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
          ]}
        >
          {/* Header avec icône */}
          <View style={styles.referralHeader}>
            <LinearGradient
              colors={["#10B981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.referralIconGradient}
            >
              <Ionicons name="gift" size={28} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.referralHeaderText}>
              <Text
                style={[
                  styles.referralTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                {t("parrainage_titre") || "Programme de parrainage"}
              </Text>
              <Text
                style={[
                  styles.referralDescription,
                  { color: isDarkMode ? "#A1A1AA" : "#71717A" },
                ]}
              >
                {t("parrainage_description")}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.referralSubsection}>
            <View style={styles.subsectionHeaderRow}>
              <Ionicons name="flash" size={18} color="#10B981" />
              <Text
                style={[
                  styles.subsectionTitleNew,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                {t("parrainage_actions_titre")}
              </Text>
            </View>

            {/* Inviter un ami non-premium */}
            <View style={styles.referralItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text
                style={[
                  styles.referralItemText,
                  { color: isDarkMode ? "#D4D4D8" : "#3F3F46" },
                ]}
              >
                Inviter un ami non-premium : {pointsData?.parrain_gratuit_point || 20} points
              </Text>
            </View>

            {/* Inviter un ami premium */}
            <View style={styles.referralItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text
                style={[
                  styles.referralItemText,
                  { color: isDarkMode ? "#D4D4D8" : "#3F3F46" },
                ]}
              >
                Inviter un ami premium : {pointsData?.parrain_premium_point || 35} points
              </Text>
            </View>

            {/* Inviter un ami pro */}
            <View style={styles.referralItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text
                style={[
                  styles.referralItemText,
                  { color: isDarkMode ? "#D4D4D8" : "#3F3F46" },
                ]}
              >
                Inviter un ami pro : {pointsData?.parrain_pro_point || 100} points
              </Text>
            </View>
          </View>

          {/* Seuils */}
          <View style={styles.referralSubsection}>
            <View style={styles.subsectionHeaderRow}>
              <Ionicons name="trophy" size={18} color="#F59E0B" />
              <Text
                style={[
                  styles.subsectionTitleNew,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                {t("parrainage_seuils_titre")}
              </Text>
            </View>
            {["parrainage_seuil_1", "parrainage_seuil_2", "parrainage_seuil_3", "parrainage_seuil_4"].map((key, idx) => (
              <View key={idx} style={styles.referralItem}>
                <Ionicons name="checkmark-circle" size={18} color="#F59E0B" />
                <Text
                  style={[
                    styles.referralItemText,
                    { color: isDarkMode ? "#D4D4D8" : "#3F3F46" },
                  ]}
                >
                  {t(key)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Sections Particuliers et Entreprises */}
      <View style={{ paddingHorizontal: 16 }}>
        {renderSection(
          "particuliers_titre",
          [
            "particuliers_feature_1",
            "particuliers_feature_2",
            "particuliers_feature_3",
            "particuliers_feature_4",
          ],
          "person",
          "#3B82F6"
        )}

        {renderSection(
          "entreprises_titre",
          [
            "entreprises_feature_1",
            "entreprises_feature_2",
            "entreprises_feature_3",
            "entreprises_feature_4",
            "entreprises_feature_5",
          ],
          "business",
          "#8B5CF6"
        )}

        {/* Section Communauté */}
        <View
          style={[
            styles.communityCard,
            { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
          ]}
        >
          <View style={styles.communityHeader}>
            <LinearGradient
              colors={["#EF4444", "#DC2626"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.communityIconGradient}
            >
              <Ionicons name="people" size={28} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.communityHeaderText}>
              <Text
                style={[
                  styles.communityTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                {t("communaute_titre")}
              </Text>
              <Text
                style={[
                  styles.communityDescription,
                  { color: isDarkMode ? "#A1A1AA" : "#71717A" },
                ]}
              >
                {t("communaute_description")}
              </Text>
            </View>
          </View>

          <View style={styles.communityItems}>
            {["communaute_point_1", "communaute_point_2", "communaute_point_3"].map((key, idx) => (
              <View key={idx} style={styles.communityItem}>
                <Ionicons name="checkmark-circle" size={18} color="#EF4444" />
                <Text
                  style={[
                    styles.communityItemText,
                    { color: isDarkMode ? "#D4D4D8" : "#3F3F46" },
                  ]}
                >
                  {t(key)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SettingsPageLayout>
  );
};

const styles = StyleSheet.create({
  plansContainer: {
    paddingHorizontal: 16,
    marginVertical: 24,
  },
  mainSectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.8,
    marginBottom: 24,
  },

  // PLAN CARD STYLES
  planCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  popularBadgeContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    borderRadius: 20,
    overflow: "hidden",
  },
  popularBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  popularBadgeText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  planHeaderGradient: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  planIconContainerNew: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  planTitleNew: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 8,
  },
  priceAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 48,
    color: "#FFFFFF",
    letterSpacing: -2,
  },
  pricePeriod: {
    fontFamily: "Inter_500Medium",
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    marginLeft: 4,
  },

  // UNIFIED PRICING SECTION STYLES
  pricingSection: {
    width: "100%",
    gap: 12,
  },
  monthlyPriceBlock: {
    alignItems: "center",
  },
  yearlyPriceBlock: {
    alignItems: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  priceLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  priceDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    maxWidth: 40,
  },
  dividerText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    paddingHorizontal: 4,
  },
  yearlyPriceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 4,
  },
  savingsBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.4)",
  },
  savingsBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#22C55E",
    letterSpacing: 0.3,
  },
  monthlyEquivalent: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
    letterSpacing: -0.2,
  },

  yearlyBadgeContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  yearlyBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  planDetailsNew: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 8,
  },
  yearlyPriceHighlight: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  yearlyPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  yearlyPriceLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  yearlyPriceAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -1,
    textAlign: "center",
    marginBottom: 4,
  },
  yearlySavings: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  planDetailTextNew: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  featuresContainerNew: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  featureItemNew: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIconContainer: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextNew: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  planButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  planButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  planButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },

  // SECTION CARD STYLES
  sectionCard: {
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  sectionIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleNew: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.5,
  },
  sectionItemsContainer: {
    gap: 10,
  },
  sectionItemNew: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  sectionItemIcon: {
    marginTop: 2,
  },
  sectionTextNew: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },

  // REFERRAL SECTION STYLES
  referralSection: {
    marginBottom: 24,
  },
  referralCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  referralHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 14,
  },
  referralIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  referralHeaderText: {
    flex: 1,
  },
  referralTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  referralDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  referralSubsection: {
    marginBottom: 20,
  },
  subsectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  subsectionTitleNew: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    letterSpacing: -0.3,
  },
  referralItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  referralItemText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },

  // COMMUNITY CARD STYLES
  communityCard: {
    marginBottom: 32,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  communityHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 14,
  },
  communityIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  communityHeaderText: {
    flex: 1,
  },
  communityTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  communityDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  communityItems: {
    gap: 10,
  },
  communityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  communityItemText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
});

export default HowItWorks;
