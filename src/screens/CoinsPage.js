import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  UIManager,
  LayoutAnimation,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { doc, getDoc, runTransaction } from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import grantPromotionalEntitlement from "../utils/grantPromotionalEntitlement";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "../ThemeProvider";
import SettingsPageLayout from "../components/SettingsPageLayout";
import { COLORS } from "../styles/colors";
import { useSubscription } from "../contexts/SubscriptionContext";

const CoinBalanceCard = ({ coins, isDarkMode, t }) => (
  <Animated.View
    entering={FadeInDown.duration(500).delay(100)}
    style={[
      styles.balanceCard,
      { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F7F9F9" },
    ]}
  >
    <View style={styles.balanceContent}>
      <View style={styles.balanceTextContainer}>
        <Text
          style={[
            styles.balanceLabel,
            { color: isDarkMode ? "#94A3B8" : "#64748B" },
          ]}
        >
          {t("solde_actuel")}
        </Text>
        <Text
          style={[
            styles.balanceAmount,
            { color: isDarkMode ? "#FFFFFF" : "#000000" },
          ]}
        >
          {coins}
        </Text>
        <Text
          style={[
            styles.balanceUnit,
            { color: isDarkMode ? "#94A3B8" : "#64748B" },
          ]}
        >
          {t("pieces")}
        </Text>
      </View>
      <View style={styles.balanceIconContainer}>
        <MaterialCommunityIcons name="bitcoin" size={40} color="#F59E0B" />
      </View>
    </View>
  </Animated.View>
);

// Composant pour une option d'échange
const ExchangeOptionCard = ({
  item,
  index,
  onPressExchange,
  userCoins,
  isExchanging,
  exchangingItemId,
  isDarkMode,
  t,
}) => {
  const isCurrentlyExchanging = isExchanging && exchangingItemId === item.id;
  const isAnyExchanging = isExchanging && exchangingItemId !== null;
  const isDisabled =
    item.cost === null || userCoins < item.cost || isAnyExchanging;
  const showLoading = isCurrentlyExchanging;

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(200 + index * 100)}
      style={styles.exchangeCard}
    >
      <View
        style={[
          styles.exchangeIconContainer,
          { backgroundColor: item.bgColor },
        ]}
      >
        <MaterialCommunityIcons name={item.icon} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.exchangeTextContainer}>
        <Text
          style={[
            styles.exchangeTitle,
            { color: isDarkMode ? "#FFFFFF" : "#000000" },
          ]}
        >
          {item.name}
        </Text>
        <Text
          style={[
            styles.exchangeCost,
            { color: isDarkMode ? "#F59E0B" : "#D97706" },
          ]}
        >
          {item.cost !== null ? `${item.cost} ${t("pieces")}` : t("chargement")}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => onPressExchange(item.id, item.cost)}
        disabled={isDisabled || showLoading}
        style={[
          styles.exchangeButton,
          {
            backgroundColor:
              isDisabled && !showLoading
                ? isDarkMode
                  ? "#4B5563"
                  : "#9CA3AF"
                : showLoading
                ? isDarkMode
                  ? "#1E3A8A"
                  : "#93C5FD"
                : "#3B82F6",
            opacity: isDisabled && !showLoading ? 0.5 : 1,
          },
        ]}
      >
        {showLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.exchangeButtonText}>{t("échanger")}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Composant pour une question FAQ (Accordion)
const FaqItem = ({ item, onPress, isExpanded, isDarkMode }) => {
  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onPress();
  };

  return (
    <View
      style={[
        styles.faqCard,
        { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F7F9F9" },
      ]}
    >
      <TouchableOpacity
        onPress={toggleExpand}
        style={styles.faqHeader}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.faqQuestion,
            { color: isDarkMode ? "#FFFFFF" : "#000000" },
          ]}
        >
          {item.question}
        </Text>
        <MaterialCommunityIcons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={24}
          color={isExpanded ? "#3B82F6" : isDarkMode ? "#71717A" : "#A1A1AA"}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View
          style={[
            styles.faqContent,
            {
              borderTopColor: isDarkMode ? "#2F3336" : "#E5E7EB",
            },
          ]}
        >
          {item.answers.map((answer, index) => (
            <View key={index} style={styles.faqAnswerItem}>
              <View style={styles.faqBullet} />
              <Text
                style={[
                  styles.faqAnswerText,
                  { color: isDarkMode ? "#CBD5E1" : "#475569" },
                ]}
              >
                {answer}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// --- Page Principale ---

const CoinsPage = ({ navigation }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();
  const { forceRefresh } = useSubscription();

  const [userCoins, setUserCoins] = useState(0);
  const [subscriptionPrices, setSubscriptionPrices] = useState({
    premium_month: null,
    premium_year: null,
    pro_month: null,
    pro_year: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangingItemId, setExchangingItemId] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      const userUID = auth.currentUser?.uid;

      if (userUID) {
        try {
          const userDocPromise = getDoc(doc(db, "users", userUID));
          const exchangeDocPromise = getDoc(doc(db, "admin", "exchangepoints"));

          const [userDoc, exchangeDoc] = await Promise.all([
            userDocPromise,
            exchangeDocPromise,
          ]);

          if (userDoc.exists()) {
            setUserCoins(userDoc.data()?.pieces || 0);
          } else {
            setUserCoins(0);
          }

          if (exchangeDoc.exists()) {
            const pricesData = exchangeDoc.data();
            setSubscriptionPrices({
              premium_month: pricesData?.premium_month ?? null,
              premium_year: pricesData?.premium_year ?? null,
              pro_month: pricesData?.pro_month ?? null,
              pro_year: pricesData?.pro_year ?? null,
            });
          } else {
            console.warn(
              "Document 'exchangepoints' non trouvé dans la collection 'admin'."
            );
            setSubscriptionPrices({
              premium_month: null,
              premium_year: null,
              pro_month: null,
              pro_year: null,
            });
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des données :", error);
          setUserCoins(0);
          setSubscriptionPrices({
            premium_month: null,
            premium_year: null,
            pro_month: null,
            pro_year: null,
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log("Utilisateur non connecté.");
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Structure des options d'échange
  const exchangeOptions = [
    {
      id: "premium_month",
      name: t("abonnement_premium_1_mois"),
      cost: subscriptionPrices.premium_month,
      icon: "crown",
      bgColor: "#8B5CF6",
    },
    {
      id: "pro_month",
      name: t("abonnement_pro_1_mois"),
      cost: subscriptionPrices.pro_month,
      icon: "rocket",
      bgColor: "#10B981",
    },
    {
      id: "premium_year",
      name: t("abonnement_premium_1_an"),
      cost: subscriptionPrices.premium_year,
      icon: "calendar-star",
      bgColor: "#6366F1",
    },
    {
      id: "pro_year",
      name: t("abonnement_pro_1_an"),
      cost: subscriptionPrices.pro_year,
      icon: "flash",
      bgColor: "#14B8A6",
    },
  ];

  // Données pour la section FAQ (inchangées)
  const faqData = [
    {
      id: "earn",
      question: "Comment gagner plus de pièces ?",
      answers: [
        "Invitez des amis via votre lien de parrainage unique.",
        "Complétez votre profil utilisateur à 100%.",
        "Participez aux défis hebdomadaires.",
        "Regardez des vidéos promotionnelles (si disponible).",
      ],
    },
    {
      id: "spend",
      question: "Où puis-je utiliser mes pièces ?",
      answers: [
        "Échangez-les contre des abonnements Premium ou Pro.",
        "Débloquez des fonctionnalités exclusives.",
        "Obtenez des réductions sur certains services partenaires.",
      ],
    },
    {
      id: "value",
      question: "Quelle est la valeur d'une pièce ?",
      answers: [
        "La valeur d'échange des pièces est déterminée par les récompenses disponibles.",
        "Les pièces n'ont pas de valeur monétaire directe et ne peuvent être achetées.",
      ],
    },
  ];

  const handleToggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  // --- Mapper itemId aux détails de l'entitlement ---
  const getEntitlementDetails = (itemId) => {
    switch (itemId) {
      case "premium_month":
        return {
          entitlementId: "premium",
          durationDays: 31,
          duration: "monthly",
        };
      case "premium_year":
        return {
          entitlementId: "premium",
          durationDays: 365,
          duration: "yearly",
        };
      case "pro_month":
        return { entitlementId: "pro", durationDays: 31, duration: "monthly" };
      case "pro_year":
        return { entitlementId: "pro", durationDays: 365, duration: "yearly" };
      default:
        return null; // ID non reconnu
    }
  };

  // Fonction à appeler lors du clic sur "Échanger"
  const handleExchangePress = async (itemId, itemCost) => {
    if (itemCost === null) {
      Alert.alert(t("erreur"), t("cout_article_indisponible"));
      return;
    }

    const userUID = auth.currentUser?.uid;
    if (!userUID) {
      Alert.alert(t("erreur"), t("utilisateur_non_authentifie"));
      return;
    }

    // 1. Vérifier si assez de pièces (déjà fait par disabled, mais double check)
    if (userCoins < itemCost) {
      Alert.alert(
        t("pieces_insuffisantes"),
        t("vous_navez_pas_assez_de_pieces")
      );
      return;
    }

    const entitlementDetails = getEntitlementDetails(itemId);
    if (!entitlementDetails) {
      Alert.alert(t("erreur"), t("type_abonnement_non_reconnu"));
      return;
    }

    // Démarrer l'indicateur de chargement pour cet item
    setExchangingItemId(itemId);
    setIsExchanging(true);

    try {
      const { entitlementId, durationDays, duration } = entitlementDetails;

      // IMPORTANT: Accorder l'entitlement AVANT de déduire les pièces
      // Cela évite que l'utilisateur perde ses pièces sans recevoir l'abonnement
      const grantResult = await grantPromotionalEntitlement(
        entitlementId,
        durationDays,
        duration
      );

      if (!grantResult.success) {
        throw new Error(grantResult.error || t("erreur_accord_abonnement"));
      }

      console.log("Entitlement accordé avec succès via le backend/RevenueCat.");

      // Une fois l'entitlement accordé, déduire les pièces via transaction Firestore
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userUID);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error(t("document_utilisateur_non_trouve"));
        }

        const currentPoints = userDoc.data()?.pieces || 0;

        if (currentPoints < itemCost) {
          throw new Error(t("pieces_insuffisantes"));
        }

        const newPoints = currentPoints - itemCost;
        transaction.update(userRef, { pieces: newPoints });

        console.log(`Transaction Firestore réussie: ${currentPoints} -> ${newPoints} pièces`);
      });

      // Mettre à jour l'état local des pièces
      setUserCoins((prevCoins) => prevCoins - itemCost);

      // Synchroniser avec le contexte centralisé
      await forceRefresh();

      Alert.alert(
        t("echange_reussi"),
        t("echange_reussi_message", {
          cost: itemCost,
          entitlement: entitlementId,
          duration: duration
        })
      );
      navigation.goBack();
    } catch (error) {
      console.error("Erreur lors de l'échange :", error);
      Alert.alert(
        t("echec_echange"),
        error.message || t("erreur_survenue_reessayer")
      );
    } finally {
      setIsExchanging(false);
      setExchangingItemId(null);
    }
  };

  // Afficher un indicateur de chargement pendant la récupération des données
  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" },
        ]}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text
          style={[
            styles.loadingText,
            { color: isDarkMode ? "#94A3B8" : "#64748B" },
          ]}
        >
          {t("chargement")}...
        </Text>
      </View>
    );
  }

  // Afficher la page une fois les données chargées
  return (
    <SettingsPageLayout
      title={t("mes_pieces")}
      subtitle={t("gerez_et_echangez_vos_pieces")}
    >
      {/* Section Solde */}
      <View style={styles.section}>
        <CoinBalanceCard coins={userCoins} isDarkMode={isDarkMode} t={t} />
      </View>

      {/* Section Échanger les pièces */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? "#FFFFFF" : "#000000" },
          ]}
        >
          {t("echanger_mes_pieces")}
        </Text>
        {exchangeOptions.map((item, index) => (
          <ExchangeOptionCard
            key={item.id}
            item={item}
            index={index}
            onPressExchange={handleExchangePress}
            userCoins={userCoins}
            isExchanging={isExchanging}
            exchangingItemId={exchangingItemId}
            isDarkMode={isDarkMode}
            t={t}
          />
        ))}
      </View>

      {/* Section FAQ */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? "#FFFFFF" : "#000000" },
          ]}
        >
          {t("comment_ca_marche")}
        </Text>
        {faqData.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInDown.duration(500).delay(400 + index * 100)}
            style={styles.faqItem}
          >
            <FaqItem
              item={item}
              onPress={() => handleToggleFaq(item.id)}
              isExpanded={expandedFaq === item.id}
              isDarkMode={isDarkMode}
            />
          </Animated.View>
        ))}
      </View>
    </SettingsPageLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginTop: 12,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  // Balance Card
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
  },
  balanceContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceTextContainer: {
    flex: 1,
  },
  balanceLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 48,
    letterSpacing: -1,
  },
  balanceUnit: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    marginTop: 4,
  },
  balanceIconContainer: {
    marginLeft: 16,
  },
  // Exchange Card
  exchangeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 12,
    marginBottom: 12,
  },
  exchangeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  exchangeTextContainer: {
    flex: 1,
  },
  exchangeTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  exchangeCost: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  exchangeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  exchangeButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  // FAQ Card
  faqItem: {
    marginBottom: 12,
  },
  faqCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  faqQuestion: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    letterSpacing: -0.3,
    flex: 1,
    marginRight: 12,
  },
  faqContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  faqAnswerItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  faqBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3B82F6",
    marginTop: 7,
    marginRight: 12,
  },
  faqAnswerText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
});

export default CoinsPage;