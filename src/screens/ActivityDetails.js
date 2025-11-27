import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  Image,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { auth, db } from "../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  addDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  limit as firestoreLimit,
  orderBy,
  updateDoc,
  runTransaction,
  increment,
} from "@react-native-firebase/firestore";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { showMessage } from "react-native-flash-message";
import moment from "moment";
import ImageSlider from "../components/ImageSlider";
import { getFormattedDate } from "../utils/allFunctions";
import { COLORS } from "../styles/colors";
import MapView, { Circle } from "react-native-maps";
import i18n from "../../i18n";
import sendNotifs from "../utils/sendNotifs";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useThemeContext } from "../ThemeProvider";

const { width } = Dimensions.get("window");

const ActivityDetails = ({ route, userinfo }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeContext();

  // Support both activityId and activity.id from route params
  const activityId = route?.params?.activityId || route?.params?.activity?.id;
  const { image, distance, userPostalCode } = route.params || {};

  const [images, setImages] = useState(null);
  const [activity, setActivity] = useState(null);
  const [messages, setMessages] = useState(null);
  const [userId, setUserId] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [coordinates, setCoordinates] = useState(null);

  // Vérifications des participants avec useMemo pour éviter les erreurs null
  const isUserParticipant = useMemo(() => {
    if (!activity || !activity.participants || !userId) return false;
    return activity.participants.some(
      (participant) => participant.userId === userId
    );
  }, [activity, userId]);

  const isActiveParticipant = useMemo(() => {
    if (!activity || !activity.participants || !userId) return false;
    return activity.participants.some(
      (participant) => participant.userId === userId && participant.active
    );
  }, [activity, userId]);

  const isAdmin = useMemo(() => {
    if (
      !activity ||
      !activity.participants ||
      !activity.participants[0] ||
      !userId
    )
      return false;
    return activity.participants[0].userId === userId;
  }, [activity, userId]);

  // Compte uniquement les participants actifs (validés par le créateur ou paiement effectué)
  const activeParticipantsCount = useMemo(() => {
    if (!activity || !activity.participants) return 0;
    return activity.participants.filter((p) => p.active === true).length;
  }, [activity]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.customBackButton}
        >
          <BlurView intensity={20} tint="dark" style={styles.backButtonBlur}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </BlurView>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          {auth.currentUser && (
            <TouchableOpacity
              onPress={handleSaved}
              style={styles.customBookmarkButton}
              disabled={!activity}
            >
              <BlurView
                intensity={20}
                tint="dark"
                style={styles.bookmarkButtonBlur}
              >
                <Ionicons
                  name={saved ? "bookmark" : "bookmark-outline"}
                  size={22}
                  color="#FFFFFF"
                />
              </BlurView>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleActionsMenu}
            style={[styles.customMenuButton, !activity && { opacity: 0.5 }]}
            disabled={!activity}
          >
            <BlurView intensity={20} tint="dark" style={styles.menuButtonBlur}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#FFFFFF" />
            </BlurView>
          </TouchableOpacity>
        </View>
      ),
      headerTransparent: true,
      headerStyle: { backgroundColor: "transparent" },
    });
  }, [navigation, saved, activity, handleSaved, handleActionsMenu]);

  useEffect(() => {
    if (!auth.currentUser) {
      return;
    }
    const fetchUserId = () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUserId(currentUser.uid);
      }
      checkIfSaved();
    };
    fetchUserId();
  }, [activityId]);

  useFocusEffect(
    useCallback(() => {
      fetchActivityDetails();
      recordView();
    }, [activityId])
  );

  const fetchActivityDetails = async () => {
    try {
      setLoading(true);

      if (!activityId) {
        setLoading(false);
        return;
      }

      const activityDoc = await getDoc(doc(db, "activities", activityId));

      if (activityDoc.exists()) {
        let activityData = activityDoc.data();
        setImages(activityData.images || []);

        // Assurer que participants existe
        if (!activityData.participants) {
          activityData.participants = [];
        }

        setActivity(activityData);

        if (activityData.coordinates) {
          setCoordinates({
            ...activityData.coordinates,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }

        const adminParticipant = activityData.creatorId;

        if (adminParticipant) {
          const adminDoc = await getDoc(doc(db, "users", adminParticipant));
          if (adminDoc.exists()) {
            setAdminUser({ id: adminDoc.id, ...adminDoc.data() });
          }
        }

        const conversationQuery = query(
          collection(db, "conversations"),
          where("activityId", "==", activityId),
          limit(1)
        );
        const conversationSnapshot = await getDocs(conversationQuery);

        if (!conversationSnapshot.empty) {
          const conversationDoc = conversationSnapshot.docs[0];

          const messagesQuery = query(
            collection(db, "messages"),
            where("conversationId", "==", conversationDoc.id),
            orderBy("createdAt", "desc")
          );
          const messagesSnapshot = await getDocs(messagesQuery);
          const messages = messagesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setMessages(messages);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'activité :", error);
    } finally {
      setLoading(false);
    }
  };

  // Enregistrer une vue unique par utilisateur
  const recordView = async () => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId || !activityId) return;

      // Vérifier si l'utilisateur a déjà vu cette activité
      const viewQuery = query(
        collection(db, "activityViews"),
        where("activityId", "==", activityId),
        where("userId", "==", currentUserId)
      );
      const viewSnapshot = await getDocs(viewQuery);

      // Si l'utilisateur n'a pas encore vu cette activité, enregistrer la vue
      if (viewSnapshot.empty) {
        // Ajouter l'entrée dans activityViews
        await addDoc(collection(db, "activityViews"), {
          activityId: activityId,
          userId: currentUserId,
          viewedAt: moment().format(),
        });

        // Incrémenter le compteur views de l'activité
        await updateDoc(doc(db, "activities", activityId), {
          views: increment(1),
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la vue :", error);
    }
  };

  const handleJoinActivity = async () => {
    // Vérifier si l'activité est complète (basé sur les participants actifs uniquement)
    if (activeParticipantsCount >= activity.maxParticipants) {
      showMessage({
        message: i18n.t("activite_complete"),
        type: "warning",
      });
      return;
    }

    const messageToCreator = {
      title: `${activity.title}`,
      desc: i18n.t("nouvelle_demande"),
      type: `join_demands`,
    };

    // Si l'activité est payante, rediriger vers la page de paiement
    if (activity.price && Number(activity.price) > 0) {
      navigation.navigate("Step6", {
        activityId,
        messageToCreator,
        adminUser,
        userinfo,
        activity,
        images,
      });
      return;
    }

    // Si l'activité est gratuite, utiliser une transaction pour éviter les race conditions
    try {
      const activityRef = doc(db, "activities", activityId);

      await runTransaction(db, async (transaction) => {
        const activitySnapshot = await transaction.get(activityRef);

        if (!activitySnapshot.exists()) {
          throw new Error("L'activité n'existe plus.");
        }

        const activityData = activitySnapshot.data();
        const participants = activityData.participants || [];

        // Vérifier si l'utilisateur est déjà participant (éviter double-join)
        const alreadyJoined = participants.some((p) => p.userId === userId);
        if (alreadyJoined) {
          throw new Error("Vous avez déjà rejoint cette activité.");
        }

        // Vérifier le nombre de participants actifs en temps réel
        const activeCount = participants.filter((p) => p.active === true).length;
        if (activeCount >= activityData.maxParticipants) {
          throw new Error("Cette activité est maintenant complète.");
        }

        const newParticipant = {
          userId,
          active: false,
          here: false,
          joinedAt: moment().format(),
        };

        transaction.update(activityRef, {
          participants: arrayUnion(newParticipant),
        });
      });

      // Envoyer la notification au créateur
      if (adminUser && adminUser.id) {
        const messageToAdmin = {
          title: `${activity.title}`,
          desc: `Vous avez une nouvelle demande`,
          type: `join_demands`,
        };
        await sendNotifs(adminUser, messageToAdmin);
      } else {
        console.warn("adminUser non disponible pour la notification");
      }

      showMessage({
        message: i18n.t("confirmation_demande_envoyee"),
        type: "success",
      });

      fetchActivityDetails();
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande :", error);
      showMessage({
        message: error.message || i18n.t("impossible_envoyer_demande_reessayer"),
        type: "danger",
      });
    }
  };

  const handleLeaveActivity = async () => {
    Alert.alert(
      i18n.t("confirmation"),
      i18n.t("confirmer_quitter_activite"),
      [
        {
          text: i18n.t("annuler"),
          style: "cancel",
        },
        {
          text: i18n.t("confirmer"),
          onPress: async () => {
            try {
              const participantToRemove = activity.participants.find(
                (participant) => participant.userId === userId
              );

              if (!participantToRemove) {
                showMessage({
                  message: i18n.t("pas_participant_activite"),
                  type: "danger",
                });
                return;
              }

              await updateDoc(doc(db, "activities", activityId), {
                participants: arrayRemove(participantToRemove),
              });

              // Notifier le créateur qu'un participant a quitté
              if (adminUser && adminUser.id && adminUser.id !== userId) {
                const messageToAdmin = {
                  title: `${activity.title}`,
                  desc: i18n.t("participant_quitte"),
                  type: `join_demands`,
                };
                await sendNotifs(adminUser, messageToAdmin);
              }

              showMessage({
                message: i18n.t("vous_avez_quitte_activite_succes"),
                type: "info",
              });

              fetchActivityDetails();
            } catch (error) {
              console.error("Erreur lors de la sortie de l'activité :", error);
              showMessage({
                message: i18n.t("impossible_quitter_activite_reessayer"),
                type: "info",
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleReport = () => {
    navigation.navigate("ReportReasonScreen", { activityId });
  };

  const handleActionsMenu = () => {
    if (!activity) {
      console.log("handleActionsMenu: activity is null");
      return;
    }

    console.log("handleActionsMenu called", {
      isAdmin,
      isUserParticipant,
      isActiveParticipant,
      hasAuth: !!auth?.currentUser,
    });

    const buttons = [];

    // Admin: Gérer les participants
    if (isAdmin) {
      buttons.push({
        text: i18n.t("gerer_les_participants"),
        onPress: () => navigation.navigate("Participants", { activityId }),
      });
    }

    // Active participant: Rejoindre la discussion
    if (auth?.currentUser && isUserParticipant && isActiveParticipant) {
      buttons.push({
        text: i18n.t("rejoindre_la_discussion"),
        onPress: () => navigation.navigate("Conversations"),
      });
    }

    // Non-participant: Rejoindre l'événement (si places disponibles basées sur participants actifs)
    if (
      auth?.currentUser &&
      !isUserParticipant &&
      activeParticipantsCount < activity.maxParticipants
    ) {
      buttons.push({
        text: activity?.price && Number(activity?.price) > 0
          ? i18n.t("rejoindre_prix", { price: activity?.price })
          : i18n.t("rejoindre_gratuit"),
        onPress: handleJoinActivity,
      });
    }

    // Pending participant: Demande en attente
    if (auth?.currentUser && isUserParticipant && !isActiveParticipant) {
      buttons.push({
        text: i18n.t("demande_en_attente"),
        onPress: handleLeaveActivity,
      });
    }

    // Active participant (non-admin): Quitter l'événement
    if (
      auth?.currentUser &&
      isUserParticipant &&
      isActiveParticipant &&
      !isAdmin
    ) {
      buttons.push({
        text: i18n.t("quitter_levenement"),
        onPress: handleLeaveActivity,
        style: "destructive",
      });
    }

    // Non-authenticated: Se connecter
    if (!auth?.currentUser) {
      buttons.push({
        text: i18n.t("se_connecter_pour_participer"),
        onPress: () => navigation.navigate("SignInScreen"),
      });
    }

    // Report button - always available
    buttons.push({
      text: i18n.t("signaler"),
      onPress: handleReport,
      style: "destructive",
    });

    // Add cancel button
    buttons.push({
      text: i18n.t("annuler"),
      style: "cancel",
    });

    console.log("Showing alert with buttons:", buttons.length);

    // Use setTimeout to ensure the alert shows after any UI updates
    setTimeout(() => {
      Alert.alert(i18n.t("actions"), i18n.t("choisissez_une_action"), buttons, {
        cancelable: true,
      });
    }, 100);
  };

  const handleOpenMaps = () => {
    if (!coordinates) return;

    const { latitude, longitude } = coordinates;
    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${latitude},${longitude}`,
      android: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });

    Linking.openURL(url).catch((err) =>
      console.error("Erreur d'ouverture:", err)
    );
  };

  const checkIfSaved = async () => {
    try {
      const savedQuery = query(
        collection(db, "saved"),
        where("activityId", "==", activityId),
        where("userId", "==", auth.currentUser?.uid)
      );
      const querySnapshot = await getDocs(savedQuery);

      setSaved(!querySnapshot.empty);
    } catch (error) {
      console.error(
        "Erreur lors de la vérification des activités sauvegardées :",
        error
      );
    }
  };

  const handleSaved = async () => {
    try {
      const savedRef = collection(db, "saved");

      if (saved) {
        const savedQuery = query(
          savedRef,
          where("activityId", "==", activityId),
          where("userId", "==", auth.currentUser?.uid)
        );
        const querySnapshot = await getDocs(savedQuery);

        for (const docSnapshot of querySnapshot.docs) {
          await deleteDoc(doc(db, "saved", docSnapshot.id));
        }

        setSaved(false);
        showMessage({
          message: "Evènement retiré de l'agenda.",
          type: "info",
        });
      } else {
        await addDoc(savedRef, {
          activityId: activityId,
          userId: auth.currentUser?.uid,
          savedAt: moment().format(),
        });

        setSaved(true);
        showMessage({
          message: "Evènement ajouté à l'agenda.",
          type: "info",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la gestion à l'agenda :", error);
      showMessage({
        message: "Une erreur est survenue. Veuillez réessayer.",
        type: "danger",
      });
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
        ]}
      >
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!activity) {
    return (
      <View
        style={[
          styles.centered,
          { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={isDarkMode ? "#6B7280" : "#9CA3AF"}
        />
        <Text
          style={[
            styles.emptyText,
            { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
          ]}
        >
          {i18n.t("activite_introuvable")}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
      ]}
    >
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image Section with Title Overlay OR No Image Header */}
        {images && images.length > 0 ? (
          <View style={styles.heroContainer}>
            <ImageSlider images={images} />

            {/* Dark gradient overlay on bottom */}
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)"]}
              style={styles.imageOverlay}
              pointerEvents="none"
            />

            {/* Title and badges overlay */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(200)}
              style={styles.heroContent}
            >
              <Text style={styles.heroTitle} numberOfLines={2}>
                {activity.title}
              </Text>

              <View style={styles.heroMeta}>
                {/* Participants badge */}
                <View style={styles.metaBadge}>
                  <BlurView intensity={20} tint="dark" style={styles.blurBadge}>
                    <Ionicons name="people" size={14} color="#FFFFFF" />
                    <Text style={styles.badgeText}>
                      {activeParticipantsCount}/{activity.maxParticipants}
                    </Text>
                  </BlurView>
                </View>

                {/* Time badge */}
                {activity.time && (
                  <View style={styles.metaBadge}>
                    <BlurView
                      intensity={20}
                      tint="dark"
                      style={styles.blurBadge}
                    >
                      <Ionicons name="time" size={14} color="#FFFFFF" />
                      <Text style={styles.badgeText}>{activity.time}</Text>
                    </BlurView>
                  </View>
                )}

                {/* Date badge */}
                {activity.date && moment(activity.date).isValid() && (
                  <View style={styles.metaBadge}>
                    <BlurView
                      intensity={20}
                      tint="dark"
                      style={styles.blurBadge}
                    >
                      <Ionicons name="calendar" size={14} color="#FFFFFF" />
                      <Text style={styles.badgeText}>
                        {moment(activity.date).format("DD MMM")}
                      </Text>
                    </BlurView>
                  </View>
                )}

                {/* Price badge */}
                {activity.price && Number(activity.price) > 0 && (
                  <View style={styles.priceBadge}>
                    <LinearGradient
                      colors={[COLORS.primary, `${COLORS.primary}DD`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.priceBadgeGradient}
                    >
                      <Ionicons name="cash" size={14} color="#FFFFFF" />
                      <Text style={styles.priceBadgeText}>
                        {activity.price} €
                      </Text>
                    </LinearGradient>
                  </View>
                )}
              </View>
            </Animated.View>
          </View>
        ) : (
          // Header sans image - titre uniquement
          <Animated.View
            entering={FadeInUp.duration(400)}
            style={[
              styles.noImageHeader,
              {
                backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              },
            ]}
          >
            <Text
              style={[
                styles.noImageTitle,
                { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
              ]}
            >
              {activity.title}
            </Text>
          </Animated.View>
        )}

        {/* Main Content */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(100)}
          style={[
            styles.mainContent,
            !(images && images.length > 0) && styles.mainContentNoImage,
          ]}
        >
          {/* Description Card */}
          {activity.description && (
            <View
              style={[
                styles.descriptionCard,
                {
                  backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                  borderColor: isDarkMode ? "#2F3336" : "#E5E7EB",
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: `${COLORS.primary}15` },
                  ]}
                >
                  <Ionicons
                    name="document-text"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.cardHeaderTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                  ]}
                >
                  {i18n.t("description")}
                </Text>
              </View>
              <Text
                style={[
                  styles.description,
                  { color: isDarkMode ? "#D1D5DB" : "#4B5563" },
                ]}
              >
                {activity.description}
              </Text>
            </View>
          )}

          {/* Quick Info Grid - Seulement affiché quand il n'y a pas d'images */}
          {!(images && images.length > 0) && (
            <View
              style={[
                styles.infoGrid,
                {
                  backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                  borderColor: isDarkMode ? "#2F3336" : "#E5E7EB",
                },
              ]}
            >
              <Animated.View
                entering={FadeIn.duration(400).delay(200)}
                style={styles.infoItem}
              >
                <LinearGradient
                  colors={[`${COLORS.primary}20`, `${COLORS.primary}10`]}
                  style={styles.infoIconContainer}
                >
                  <Ionicons name="time" size={24} color={COLORS.primary} />
                </LinearGradient>
                <View style={styles.infoContent}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {i18n.t("heure")}
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                    ]}
                  >
                    {activity.time}
                  </Text>
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeIn.duration(400).delay(250)}
                style={styles.infoItem}
              >
                <LinearGradient
                  colors={[`${COLORS.primary}20`, `${COLORS.primary}10`]}
                  style={styles.infoIconContainer}
                >
                  <Ionicons name="calendar" size={24} color={COLORS.primary} />
                </LinearGradient>
                <View style={styles.infoContent}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {i18n.t("date")}
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                    ]}
                  >
                    {getFormattedDate(activity.date)}
                  </Text>
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeIn.duration(400).delay(300)}
                style={styles.infoItem}
              >
                <LinearGradient
                  colors={[`${COLORS.primary}20`, `${COLORS.primary}10`]}
                  style={styles.infoIconContainer}
                >
                  <Ionicons name="location" size={24} color={COLORS.primary} />
                </LinearGradient>
                <View style={styles.infoContent}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {i18n.t("lieu")}
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                    ]}
                    numberOfLines={1}
                  >
                    {activity.location}
                  </Text>
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeIn.duration(400).delay(350)}
                style={styles.infoItem}
              >
                <LinearGradient
                  colors={[`${COLORS.primary}20`, `${COLORS.primary}10`]}
                  style={styles.infoIconContainer}
                >
                  <Ionicons name="people" size={24} color={COLORS.primary} />
                </LinearGradient>
                <View style={styles.infoContent}>
                  <Text
                    style={[
                      styles.infoLabel,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {i18n.t("participants")}
                  </Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                    ]}
                  >
                    {activeParticipantsCount}/{activity.maxParticipants}
                  </Text>
                </View>
              </Animated.View>

              {/* Price info item */}
              {activity.price && Number(activity.price) > 0 && (
                <Animated.View
                  entering={FadeIn.duration(400).delay(400)}
                  style={styles.infoItem}
                >
                  <LinearGradient
                    colors={[`${COLORS.primary}20`, `${COLORS.primary}10`]}
                    style={styles.infoIconContainer}
                  >
                    <Ionicons name="cash" size={24} color={COLORS.primary} />
                  </LinearGradient>
                  <View style={styles.infoContent}>
                    <Text
                      style={[
                        styles.infoLabel,
                        { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                      ]}
                    >
                      {i18n.t("prix_evenement")}
                    </Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                      ]}
                    >
                      {activity.price} €
                    </Text>
                  </View>
                </Animated.View>
              )}
            </View>
          )}

          {/* Organizer Card */}
          {adminUser && (
            <Animated.View entering={FadeInUp.duration(400).delay(200)}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.organizerCard,
                  {
                    backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                    borderColor: isDarkMode ? "#2F3336" : "#E5E7EB",
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconBadge,
                      { backgroundColor: `${COLORS.primary}15` },
                    ]}
                  >
                    <Ionicons name="person" size={20} color={COLORS.primary} />
                  </View>
                  <Text
                    style={[
                      styles.cardHeaderTitle,
                      { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                    ]}
                  >
                    Organisateur
                  </Text>
                </View>

                <View style={styles.organizerContent}>
                  <View style={styles.avatarContainer}>
                    <Image
                      source={
                        adminUser?.photoURL
                          ? { uri: adminUser?.photoURL }
                          : require("../../assets/img/user.png")
                      }
                      style={styles.avatar}
                    />
                    {adminUser?.sub === "pro" && (
                      <View style={styles.proIconBadge}>
                        <LinearGradient
                          colors={["#10B981", "#059669"]}
                          style={styles.proIconGradient}
                        >
                          <Ionicons name="star" size={12} color="#FFFFFF" />
                        </LinearGradient>
                      </View>
                    )}
                  </View>

                  <View style={styles.organizerInfo}>
                    <View style={styles.organizerHeader}>
                      <Text
                        style={[
                          styles.organizerName,
                          { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                        ]}
                      >
                        @{adminUser?.username}
                      </Text>
                      {adminUser?.sub === "pro" && (
                        <View style={styles.proBadge}>
                          <LinearGradient
                            colors={["#10B981", "#059669"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.proBadgeGradient}
                          >
                            <Text style={styles.proBadgeText}>PRO</Text>
                          </LinearGradient>
                        </View>
                      )}
                    </View>

                    {adminUser?.biography && (
                      <Text
                        style={[
                          styles.organizerBio,
                          { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                        ]}
                        numberOfLines={2}
                      >
                        {adminUser?.biography}
                      </Text>
                    )}

                    <View style={styles.organizerFooter}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                      />
                      <Text
                        style={[
                          styles.memberSince,
                          { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
                        ]}
                      >
                        {i18n.t("membre_depuis")}{" "}
                        {moment(adminUser?.createdAt).format("MMM YYYY")}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Map Section */}
          {coordinates && (
            <Animated.View entering={FadeInUp.duration(400).delay(350)}>
              <View
                style={[
                  styles.mapCard,
                  {
                    backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                    borderColor: isDarkMode ? "#2F3336" : "#E5E7EB",
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconBadge,
                      { backgroundColor: `${COLORS.primary}15` },
                    ]}
                  >
                    <Ionicons
                      name="location"
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.cardHeaderTitle,
                      { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                    ]}
                  >
                    Localisation
                  </Text>
                </View>

                <TouchableOpacity onPress={handleOpenMaps} activeOpacity={0.8}>
                  <View style={styles.mapContainer}>
                    <MapView
                      pointerEvents="none"
                      style={styles.map}
                      region={coordinates}
                    >
                      <Circle
                        center={coordinates}
                        radius={4000}
                        strokeWidth={2}
                        strokeColor={`${COLORS.primary}80`}
                        fillColor={`${COLORS.primary}20`}
                      />
                    </MapView>

                    <View style={styles.mapOverlay}>
                      <View style={styles.mapButton}>
                        <Ionicons
                          name="navigate"
                          size={18}
                          color={COLORS.primary}
                        />
                        <Text
                          style={[
                            styles.mapButtonText,
                            { color: COLORS.primary },
                          ]}
                        >
                          {i18n.t("ouvrir_dans_maps")}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {distance && userPostalCode && (
                  <View style={styles.distanceInfo}>
                    <Ionicons
                      name="car"
                      size={16}
                      color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                    />
                    <Text
                      style={[
                        styles.distanceText,
                        { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                      ]}
                    >
                      {distance} depuis {userPostalCode}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Hero Section
  heroContainer: {
    width: width,
    height: 400,
    position: "relative",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: "Inter_800ExtraBold",
    color: "#FFFFFF",
    marginBottom: 12,
    lineHeight: 38,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroMeta: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  metaBadge: {
    borderRadius: 20,
    overflow: "hidden",
  },
  blurBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  priceBadge: {
    borderRadius: 20,
    overflow: "hidden",
  },
  priceBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  priceBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },

  // Main Content
  mainContent: {
    padding: 16,
    gap: 16,
    marginTop: -30,
  },
  mainContentNoImage: {
    marginTop: 0,
  },

  // Description Card
  descriptionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  description: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
  },

  // Info Grid
  infoGrid: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  infoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },

  // Organizer Card
  organizerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  organizerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  proIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    borderRadius: 12,
    overflow: "hidden",
  },
  proIconGradient: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  organizerInfo: {
    flex: 1,
    gap: 6,
  },
  organizerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  organizerName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  proBadge: {
    borderRadius: 8,
    overflow: "hidden",
  },
  proBadgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  proBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_800ExtraBold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  organizerBio: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  organizerFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberSince: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  // Map Card
  mapCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  mapContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    height: 200,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: "flex-start",
  },
  mapButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  distanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    justifyContent: "center",
  },
  distanceText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },

  // No Image Header
  noImageHeader: {
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  noImageTitle: {
    fontSize: 28,
    fontFamily: "Inter_800ExtraBold",
    marginBottom: 16,
    lineHeight: 34,
  },
  noImageMeta: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  noImageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  noImageBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  noImagePriceBadge: {
    borderRadius: 12,
    overflow: "hidden",
  },
  noImagePriceGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noImagePriceText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },

  // Custom Header Buttons
  customBackButton: {
    marginLeft: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginRight: 16,
  },
  customBookmarkButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  bookmarkButtonBlur: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  customMenuButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  menuButtonBlur: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ActivityDetails;
