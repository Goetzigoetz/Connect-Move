import React, { useEffect, useLayoutEffect, useState } from "react";
import { useThemeContext } from "../../ThemeProvider";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import {
  useStripe,
} from "@stripe/stripe-react-native";
import Animated, { 
  FadeIn, 
  FadeInUp, 
  FadeInDown,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import { Image } from "expo-image";
import moment from "moment";
import { showMessage } from "react-native-flash-message";
import { auth, db } from "../../../config/firebase";
import sendNotifs from "../../utils/sendNotifs";
import i18n from "../../../i18n";
import {
  collection,
  addDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  writeBatch,
  increment,
  arrayUnion,
  serverTimestamp,
  runTransaction,
} from "@react-native-firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../styles/colors";
import { API_URL } from "@env";

const Step6 = ({ route, navigation }) => {
  const { isDarkMode } = useThemeContext();
  const {
    activityId,
    messageToCreator,
    adminUser,
    userinfo,
    activity,
    images,
  } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentReady, setPaymentReady] = useState(false);
  const IS_FREE = Number(activity.price ? activity?.price : 0) <= 0;

  // Animation values
  const pulseValue = useSharedValue(1);
  const shimmerValue = useSharedValue(-1);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });

    // Cache la bottom tab sur cette page
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: "none" },
      });
    }

    // Restaure la bottom tab quand on quitte la page
    return () => {
      if (parent) {
        parent.setOptions({
          tabBarStyle: undefined,
        });
      }
    };
  }, [navigation]);

  // Pulse animation for free badge
  useEffect(() => {
    if (IS_FREE) {
      pulseValue.value = withRepeat(
        withSequence(
          withSpring(1.05, { damping: 2 }),
          withSpring(1, { damping: 2 })
        ),
        -1,
        false
      );
    }
  }, [IS_FREE]);

  // Shimmer effect for payment button
  useEffect(() => {
    if (paymentReady && !loading) {
      shimmerValue.value = withRepeat(
        withSpring(1, { duration: 2000 }),
        -1,
        false
      );
    }
  }, [paymentReady, loading]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  // Initialisation Stripe
  useEffect(() => {
    const initializePaymentSheet = async () => {
      if (IS_FREE) {
        setLoading(false);
        setPaymentReady(true);
        return;
      }
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/create_payment_intent.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: Number(activity.price) * 100,
              currency: "eur",
              activityId: activityId,
              userId: auth.currentUser?.uid,
            }),
          }
        );

        const responseText = await response.text();
        console.log("API Response:", responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("JSON Parse Error - Raw response:", responseText);
          throw new Error(`Réponse invalide du serveur: ${responseText.substring(0, 200)}`);
        }

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors de la création du paiement");
        }
        const { clientSecret, ephemeralKey, customer } = data;
        setClientSecret(clientSecret);

        const { error } = await initPaymentSheet({
          merchantDisplayName: "Connect & Move",
          paymentIntentClientSecret: clientSecret,
          customerId: customer,
          customerEphemeralKeySecret: ephemeralKey,
          returnURL: "connectmove://stripe-redirect",
          applePay: {
            merchantCountryCode: "FR",
            merchantIdentifier: "merchant.com.connectmove",
          },
        });

        if (error) throw error;
        setPaymentReady(true);
      } catch (err) {
        Alert.alert("Erreur", err.message);
        setPaymentReady(false);
      } finally {
        setLoading(false);
      }
    };

    initializePaymentSheet();
  }, []);

  const handleCardPayment = async () => {
    setLoading(true);
    try {
      const { error } = await presentPaymentSheet();
      if (error) throw error;
      onPaymentSuccess();
    } catch (err) {
      Alert.alert("Erreur", err.message);
    } finally {
      setLoading(false);
    }
  };

  const onPaymentSuccess = async () => {
    try {
      await addDoc(collection(db, "payments"), {
        amount: Number(activity.price),
        userId: auth.currentUser.uid,
        activityId: activityId,
        createdAt: moment().format(),
      });
      handleJoinActivity();
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande :", error);
    }
  };

  const handleJoinActivity = async () => {
    try {
      const currentUserUID = auth.currentUser?.uid;
      if (!currentUserUID) {
        showMessage({ message: "Non connecté.", type: "danger" });
        return;
      }

      const currentDay = new Date().getDay();
      const isWeekend = currentDay === 0 || currentDay === 6;

      const pointsDocRef = doc(db, "admin", "defispoint");
      const pointsDocSnap = await getDoc(pointsDocRef);
      const pointsConfig = pointsDocSnap.exists() ? pointsDocSnap.data() : {};
      const weekendPoints = Number(pointsConfig?.join_weekevent) || 0;
      const basicPoints = Number(pointsConfig?.joint_basic_event_point) || 0;
      const eventPoints = isWeekend ? weekendPoints + basicPoints : basicPoints;

      const existingDefisQuery = query(
        collection(db, "defis"),
        where("userId", "==", currentUserUID),
        where("type", "==", "join_event"),
        where("activityId", "==", activityId)
      );
      const existingDefisSnapshot = await getDocs(existingDefisQuery);

      const activityRef = doc(db, "activities", activityId);

      // Utiliser une transaction pour éviter les race conditions et double-join
      await runTransaction(db, async (transaction) => {
        const activitySnapshot = await transaction.get(activityRef);

        if (!activitySnapshot.exists()) {
          throw new Error("L'activité n'existe plus.");
        }

        const activityData = activitySnapshot.data();
        const participants = activityData.participants || [];

        // Vérifier si l'utilisateur est déjà participant
        const alreadyJoined = participants.some((p) => p.userId === currentUserUID);
        if (alreadyJoined) {
          throw new Error("Vous avez déjà rejoint cette activité.");
        }

        // Vérifier le nombre de participants actifs
        const activeCount = participants.filter((p) => p.active === true).length;
        if (activeCount >= activityData.maxParticipants) {
          throw new Error("Cette activité est maintenant complète.");
        }

        // Ajouter le participant
        transaction.update(activityRef, {
          participants: arrayUnion({
            userId: currentUserUID,
            active: IS_FREE ? false : true,
            here: false,
            joinedAt: moment().format(),
          }),
        });

        // Ajouter les points si applicable
        if (existingDefisSnapshot.empty && eventPoints > 0) {
          const defisRef = doc(collection(db, "defis"));
          transaction.set(defisRef, {
            userId: currentUserUID,
            type: "join_event",
            activityId: activityId,
            createdAt: serverTimestamp(),
            points: eventPoints,
          });

          const userRef = doc(db, "users", currentUserUID);
          transaction.update(userRef, {
            pieces: increment(eventPoints),
          });
        }
      });

      // Afficher l'alerte des points en dehors de la transaction
      if (existingDefisSnapshot.empty && eventPoints > 0) {
        Alert.alert(
          "Des pièces en plus",
          `Vous avez reçu ${eventPoints} pièces pour avoir rejoint cet évènement.`
        );
      }

      const messageToAuthUser = {
        title: `${activity.title}`,
        desc: IS_FREE
          ? `${eventPoints} pièces en +: vous avez rejoint un nouvel évènement`
          : `${eventPoints} pièces en +: paiement réussi, vous avez rejoint un nouvel évènement`,
        type: "join_demands",
      };

      // Envoyer les notifications
      if (adminUser && adminUser.id) {
        await sendNotifs(adminUser, messageToCreator);
      }
      if (userinfo && userinfo.id) {
        await sendNotifs(userinfo, messageToAuthUser);
      }

      showMessage({
        message: IS_FREE
          ? "Nous vous tiendrons informé dès que l'admin aura validé votre demande."
          : "Paiement réussi, vous avez rejoint un nouvel évènement",
        type: "success",
      });

      navigation.goBack();
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande :", error);
      showMessage({
        message: error.message || "Impossible d'envoyer votre demande. Veuillez réessayer.",
        type: "danger",
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F8F9FA" }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

      {/* Header avec avatar et titre */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F8F9FA" }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButtonHeader}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#FFFFFF" : "#1F2937"} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          {images && images.length > 0 ? (
            <Image
              source={{ uri: images[0] }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <View style={[
              styles.avatarImage,
              styles.avatarPlaceholder,
              { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F3F4F6" }
            ]}>
              <Ionicons
                name="calendar"
                size={32}
                color={COLORS.primary}
              />
            </View>
          )}

          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]} numberOfLines={2}>
              {activity.title}
            </Text>
            {IS_FREE && (
              <Animated.View style={[styles.freeBadgeHeader, pulseStyle]}>
                <LinearGradient
                  colors={["#10B981", "#059669", "#047857"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.freeBadgeGradient}
                >
                  <Ionicons name="gift" size={14} color="#FFFFFF" />
                  <Text style={styles.freeBadgeText}>{i18n.t("gratuit")}</Text>
                </LinearGradient>
              </Animated.View>
            )}
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Premium Price Card */}
        <Animated.View entering={FadeInUp.duration(500).delay(600)}>
          <View style={[
            styles.priceCardContainer,
            { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
          ]}>
            <LinearGradient
              colors={IS_FREE 
                ? ["#10B981", "#059669", "#047857"]
                : [COLORS.primary, "#F97316", COLORS.secondary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1.2, y: 1 }}
              style={styles.priceCardGradient}
            >
              <View style={styles.priceCardContent}>
                <View style={styles.priceCardLeft}>
                  <View style={styles.priceIconCircle}>
                    <Ionicons
                      name={IS_FREE ? "gift-outline" : "card-outline"}
                      size={28}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.priceInfo}>
                    <Text style={styles.priceLabel}>
                      {IS_FREE ? i18n.t("acces_gratuit") : i18n.t("prix_evenement")}
                    </Text>
                    <Text style={styles.priceValue}>
                      {IS_FREE ? "0 €" : `${activity.price} €`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Decorative Elements */}
              <View style={styles.decorCircle1} />
              <View style={styles.decorCircle2} />
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Benefits Section with Modern Cards */}
        <Animated.View entering={FadeInUp.duration(500).delay(700)} style={styles.benefitsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons 
              name="sparkles" 
              size={24} 
              color={COLORS.primary} 
            />
            <Text style={[styles.sectionTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
              {i18n.t("inclus_avec_votre_participation")}
            </Text>
          </View>

          <View style={styles.benefitsGrid}>
            {[
              { icon: "calendar-outline", text: i18n.t("lintegralite_de_levenement"), color: "#F97316" },
              { icon: "chatbubbles-outline", text: i18n.t("la_messagerie_du_groupe"), color: "#8B5CF6" },
              { icon: "people-outline", text: i18n.t("acces_communaute_participants"), color: "#10B981" },
            ].map((benefit, index) => (
              <Animated.View
                key={index}
                entering={SlideInRight.duration(400).delay(800 + index * 100)}
              >
                <View style={[
                  styles.benefitCard,
                  { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
                ]}>
                  <LinearGradient
                    colors={[`${benefit.color}15`, `${benefit.color}05`]}
                    style={styles.benefitIconContainer}
                  >
                    <Ionicons name={benefit.icon} size={24} color={benefit.color} />
                  </LinearGradient>
                  <Text style={[
                    styles.benefitText,
                    { color: isDarkMode ? "#E5E7EB" : "#4B5563" }
                  ]}>
                    {benefit.text}
                  </Text>
                  <View style={[styles.benefitCheckmark, { backgroundColor: `${benefit.color}20` }]}>
                    <Ionicons name="checkmark" size={14} color={benefit.color} />
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Trust Indicators */}
        {!IS_FREE && (
          <Animated.View entering={FadeInUp.duration(500).delay(1100)} style={styles.trustSection}>
            <View style={[
              styles.trustCard,
              { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F0F9FF" }
            ]}>
              <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
              <Text style={[styles.trustText, { color: isDarkMode ? "#93C5FD" : "#1E40AF" }]}>
                Paiement 100% sécurisé par Stripe
              </Text>
            </View>
            <View style={[
              styles.trustCard,
              { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F0FDF4" }
            ]}>
              <Ionicons name="lock-closed" size={20} color="#10B981" />
              <Text style={[styles.trustText, { color: isDarkMode ? "#86EFAC" : "#065F46" }]}>
                Vos données sont cryptées
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Disclaimer */}
        {!IS_FREE && (
          <Animated.View entering={FadeIn.duration(500).delay(1200)} style={styles.disclaimerBox}>
            <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
            <Text style={styles.disclaimerText}>
              {i18n.t("cet_achat_est_unique_et_non_remboursable")}
            </Text>
          </Animated.View>
        )}

        {/* Floating Action Button - Now inside ScrollView */}
        <Animated.View 
          entering={FadeInDown.duration(600).delay(1000)}
          style={[
            styles.fabContainer
          ]}
        >
          <TouchableOpacity
            onPress={IS_FREE ? handleJoinActivity : handleCardPayment}
            disabled={!paymentReady || loading}
            activeOpacity={0.9}
            style={styles.fabButton}
          >
            <LinearGradient
              colors={
                loading || !paymentReady
                  ? ["#9CA3AF", "#6B7280"]
                  : [COLORS.primary, "#F97316", COLORS.secondary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fabGradient}
            >
              {loading ? (
                <View style={styles.fabContent}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.fabText}>Chargement...</Text>
                </View>
              ) : (
                <View style={styles.fabContent}>
                  <View style={styles.fabIconCircle}>
                    <Ionicons 
                      name={IS_FREE ? "checkmark-circle" : "card"} 
                      size={24} 
                      color="#FFFFFF" 
                    />
                  </View>
                  <View style={styles.fabTextContainer}>
                    <Text style={styles.fabText}>
                      {IS_FREE ? i18n.t("rejoindre_maintenant") : i18n.t("payer_et_rejoindre")}
                    </Text>
                    {!IS_FREE && (
                      <Text style={styles.fabSubtext}>{activity.price} €</Text>
                    )}
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
    lineHeight: 26,
  },
  freeBadgeHeader: {
    alignSelf: "flex-start",
  },
  freeBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  freeBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  priceCardContainer: {
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  priceCardGradient: {
    padding: 24,
    position: "relative",
    overflow: "hidden",
  },
  priceCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  priceCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  priceIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  priceInfo: {
    marginLeft: 16,
  },
  priceLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 32,
    fontFamily: "Inter_500Medium",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  decorCircle1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  benefitsSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "Inter_500Medium",
  },
  benefitsGrid: {
    gap: 14,
  },
  benefitCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  benefitIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  benefitCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  trustSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  trustCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  trustText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
    lineHeight: 16,
  },
  disclaimerBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    backgroundColor: "rgba(156, 163, 175, 0.1)",
    borderRadius: 16,
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#9CA3AF",
    lineHeight: 18,
  },
  fabContainer: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
    paddingTop: 20,
    paddingBottom: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
  },
  fabButton: {
    width: "100%",
  },
  fabGradient: {
    borderRadius: 20,
    overflow: "hidden",
  },
  fabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
  },
  fabIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  fabTextContainer: {
    flex: 1,
  },
  fabText: {
    fontSize: 17,
    fontFamily: "Inter_500Medium",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  fabSubtext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 2,
  },
});

export default Step6;