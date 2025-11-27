import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
  Linking,
} from "react-native";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import Header from "../components/Header";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { COLORS } from "../styles/colors";
import { FontAwesome } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as Constants from "expo-constants";
import * as Device from "expo-device";
import { openSettings } from "../utils/allFunctions";
import sendNotifs from "../utils/sendNotifs";
import FlashMessage, { showMessage } from "react-native-flash-message";
import { useThemeContext } from "../ThemeProvider";
import { useSubscription, SUBSCRIPTION_TYPES } from "../contexts/SubscriptionContext";
import InfoCard from "../components/InfoCard";
import InfoCardModal from "../components/InfoCardModal";
import PageLoader from "../components/Loaders/PageLoader";
import { getDistance } from "geolib";
import Loader from "../components/Loader";
import LoginPromptModal from "../components/LoginPromptModal";
import CommentsModal from "../components/CommentsModal";
import ActivityCard from "../components/ActivityCard";
import i18n from "../../i18n";
import { useTabBar } from "../contexts/TabBarContext";
import { checkVersion } from "react-native-store-version";
import SwipeHandTutorial from "../components/SwipeHandTutorial";
import PermissionsModal from "../components/PermissionsModal";
import AsyncStorage from "@react-native-async-storage/async-storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// --- Constantes ---
// Utiliser SUBSCRIPTION_TYPES du contexte pour la cohérence
const ENTITLEMENT_LEVELS = SUBSCRIPTION_TYPES;
const AVERAGE_SPEED_KMH = 60;
const EARTH_RADIUS_KM = 6371;

const Home = ({ route }) => {
  // --- Hooks et Thème ---
  const { isDarkMode } = useThemeContext();
  const { subscription, syncWithRevenueCat } = useSubscription();
  const navigation = useNavigation();
  const currentUser = auth.currentUser;
  const selectedCategory = route?.params?.selectedCategory || null;
  const user = auth.currentUser;
  const { setIsTabBarVisible } = useTabBar();
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef(null);
  const scrollDistance = useRef(0);
  const headerScrollY = useSharedValue(0);

  // --- États ---
  const [notif, setNotif] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [parrain, setParrain] = useState(true);
  // entitlement est maintenant géré par useSubscription (variable: subscription)
  const [userLocation, setUserLocation] = useState(null);
  const [userPostalCode, setUserPostalCode] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  const [
    showNotificationPermissionWarning,
    setShowNotificationPermissionWarning,
  ] = useState(false);
  const [currentInfoCardIndex, setCurrentInfoCardIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [scrollCount, setScrollCount] = useState(0);
  const [dismissedModals, setDismissedModals] = useState(new Set());
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptAction, setLoginPromptAction] = useState("like");
  const [showComments, setShowComments] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [storeUrl, setStoreUrl] = useState(null);
  const [showSwipeTutorial, setShowSwipeTutorial] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // --- Shared values pour les animations ---
  const floatingButtonsTranslateX = useSharedValue(0);
  const isScrollingValue = useSharedValue(false);
  const scrollDirectionValue = useSharedValue(0); // 0 = none, 1 = down, -1 = up
  const lastScrollYForDirection = useRef(0);
  const filterButtonScale = useSharedValue(1);
  const filterButtonOpacity = useSharedValue(1);
  const filterButtonTimeoutRef = useRef(null);

  // --- Références pour les listeners de notification ---
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        const checkUser = async () => {
          const user = auth.currentUser;
          if (!user) return;

          try {
            await user.reload();

            // La vérification d'email et du compte bloqué sont maintenant gérées par le Navigator
            // via VerifyEmail avec le système de code de vérification et BloqueCompte

            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();

              // Vérifier si le profil est complet
              if (!data?.interests || !data?.location?.address) {
                navigation.navigate("Profil", {
                  screen: "EditProfile",
                  params: { newProfile: true },
                });
                return;
              }
            }
          } catch {
            Alert.alert(i18n.t("erreur"), i18n.t("impossible_verifier_compte"));
          }
        };

        checkUser();
      }, 500);

      return () => clearTimeout(timer);
    }, [navigation])
  );

  const getUserLocationAndPostalCode = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setShowLocationWarning(true);
        return;
      }
      setShowLocationWarning(false);

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);

      let address = await Location.reverseGeocodeAsync(location.coords);
      if (address && address.length > 0 && address[0]?.postalCode) {
        setUserPostalCode(address[0].postalCode);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la localisation :",
        error
      );
      setShowLocationWarning(true);
    }
  }, []);

  const fetchInitialUserData = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        setUserInfo(userDoc.data());
      }

      // L'abonnement est maintenant géré par le SubscriptionContext
      // On peut déclencher une sync si nécessaire
      await syncWithRevenueCat();
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données initiales utilisateur :",
        error
      );
    }
  }, [currentUser, syncWithRevenueCat]);

  const registerForPushNotificationsAsync = useCallback(async () => {
    if (!Device.isDevice) return null;

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        setShowNotificationPermissionWarning(true);
        return null;
      }
      setShowNotificationPermissionWarning(false);

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      return token.data;
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement pour les notifications push:",
        error
      );
      return null;
    }
  }, []);

  const addExpoPushTokenToUser = useCallback(async (token, currentUser) => {
    if (!token || !currentUser) return;

    try {
      await setDoc(
        doc(db, "users", currentUser.uid),
        { expoPushToken: token },
        { merge: true }
      );
    } catch (error) {
      console.error("Erreur lors de l'ajout du token Expo Push :", error);
    }
    // Le tracking est maintenant géré via PermissionsModal
  }, []);

  const calculateTravelTime = useCallback((lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = EARTH_RADIUS_KM;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const radLat1 = toRad(lat1);
    const radLat2 = toRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(radLat1) *
        Math.cos(radLat2) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    const estimatedTimeHours = distance / AVERAGE_SPEED_KMH;

    const totalMinutes = Math.round(estimatedTimeHours * 60);

    if (totalMinutes < 60) {
      return `+${totalMinutes}min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `+${hours}h${minutes > 0 ? String(minutes).padStart(2, "0") : ""}`;
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let q = collection(db, "activities");

      if (selectedCategory?.id && selectedCategory.id !== "all") {
        q = query(q, where("categoryId", "==", selectedCategory.id));
      }

      q = query(q, orderBy("date", "desc"));
      const activitiesSnapshot = await getDocs(q);

      const activitiesDataPromises = activitiesSnapshot.docs.map(
        async (docSnap) => {
          const activityData = docSnap.data();
          const userId = activityData.creatorId;

          let creatorData = {
            username: "Inconnu",
            sub: ENTITLEMENT_LEVELS.GRATUIT,
            photoURL: null,
          };

          try {
            const userDocSnap = await getDoc(doc(db, "users", userId));
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              creatorData = {
                username: userData.username || i18n.t("utilisateur"),
                sub: userData.sub || ENTITLEMENT_LEVELS.GRATUIT,
                photoURL: userData.photoURL,
              };
            }
          } catch (userError) {
            console.warn(
              `Impossible de récupérer les infos pour l'utilisateur ${userId}:`,
              userError
            );
          }

          const dateString = activityData.date;
          const dateParts = dateString.split("/").map(Number);
          const activityDate = new Date(
            dateParts[2],
            dateParts[1] - 1,
            dateParts[0]
          );

          if (activityDate < today) {
            return null;
          }

          return {
            id: docSnap.id,
            ...activityData,
            activityDate,
            creatorName: creatorData.username,
            creatorSub: creatorData.sub,
            creatorAvatar: creatorData.photoURL,
          };
        }
      );

      const resolvedActivitiesData = await Promise.all(activitiesDataPromises);
      const validActivities = resolvedActivitiesData.filter((a) => a !== null);

      const activitiesWithDistance = validActivities.map((activity) => {
        if (
          userLocation?.coords &&
          activity.coordinates?.latitude &&
          activity.coordinates?.longitude
        ) {
          const travelTime = calculateTravelTime(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            activity.coordinates.latitude,
            activity.coordinates.longitude
          );
          const distanceForSort = getDistance(
            {
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            },
            {
              latitude: activity.coordinates.latitude,
              longitude: activity.coordinates.longitude,
            }
          );
          return { ...activity, travelTime, distanceForSort };
        }
        return { ...activity, travelTime: null, distanceForSort: Infinity };
      });

      const sortedActivities = userLocation
        ? [...activitiesWithDistance].sort(
            (a, b) => a.distanceForSort - b.distanceForSort
          )
        : activitiesWithDistance;

      setActivities(sortedActivities);
    } catch (error) {
      console.error("Erreur lors de la récupération des évènements :", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, userLocation, calculateTravelTime]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <Header scrollY={headerScrollY} isScrollingValue={isScrollingValue} scrollDirectionValue={scrollDirectionValue} />,
    });
  }, [navigation, headerScrollY, isScrollingValue, scrollDirectionValue]);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDarkMode ? "light-content" : "dark-content");

      // Réafficher la tab bar quand on revient sur l'écran Home
      setIsTabBarVisible(true);
    }, [isDarkMode, setIsTabBarVisible])
  );

  useFocusEffect(
    useCallback(() => {
      fetchInitialUserData();
      return () => {};
    }, [fetchInitialUserData])
  );

  // Update push token every time we come to Home screen
  useFocusEffect(
    useCallback(() => {
      const updatePushToken = async () => {
        if (!currentUser) return;

        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await addExpoPushTokenToUser(token, currentUser);
          }
        } catch (error) {
          console.error('Erreur lors de la mise à jour du token push:', error);
        }
      };

      updatePushToken();
      return () => {};
    }, [currentUser, registerForPushNotificationsAsync, addExpoPushTokenToUser])
  );

  useEffect(() => {
    getUserLocationAndPostalCode();
  }, [getUserLocationAndPostalCode]);

  // Vérifier si on doit afficher le modal de permissions
  useEffect(() => {
    const checkPermissionsFlow = async () => {
      try {
        const hasCompletedFlow = await AsyncStorage.getItem('hasCompletedPermissionsFlow');
        if (!hasCompletedFlow && !loading) {
          // Afficher le modal après un petit délai pour que la page soit chargée
          setTimeout(() => {
            setShowPermissionsModal(true);
          }, 1500);
        } else {
          // Si le flow est déjà terminé, gérer les tokens normalement
          const token = await registerForPushNotificationsAsync();
          if (token) {
            addExpoPushTokenToUser(token);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du flow de permissions:', error);
      }
    };
    checkPermissionsFlow();
  }, [loading, registerForPushNotificationsAsync, addExpoPushTokenToUser]);

  useEffect(() => {
    const checkNotificationPermissions = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === "granted") {
          setNotif(false);
        } else {
          setNotif(true);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des permissions:", error);
      }
    };
    checkNotificationPermissions();
  }, []);

  // Vérifier si le tutoriel de swipe doit être affiché
  useEffect(() => {
    const checkSwipeTutorial = async () => {
      try {
        const hasSeenTutorial = await AsyncStorage.getItem('hasSeenSwipeTutorial');
        if (!hasSeenTutorial && !loading) {
          // Afficher le tutoriel après un petit délai pour que la page soit chargée
          setTimeout(() => {
            setShowSwipeTutorial(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du tutoriel:', error);
      }
    };
    checkSwipeTutorial();
  }, [loading]);

  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification reçue:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Réponse à la notification:", response);
        navigation.navigate("Notifications");
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      // Nettoyer le timeout du bouton filtre
      if (filterButtonTimeoutRef.current) {
        clearTimeout(filterButtonTimeoutRef.current);
        filterButtonTimeoutRef.current = null;
      }
    };
  }, [navigation]);

  useEffect(() => {
    setLoading(true);
    fetchActivities();
    // Le tracking est maintenant demandé via PermissionsModal
  }, [selectedCategory]);

  // Vérifier la version de l'application au montage
  useEffect(() => {
    const checkAppVersion = async () => {
      try {
        const result = await checkVersion({
          iosStoreURL: "https://apps.apple.com/app/id6740539737",
          androidStoreURL: "https://play.google.com/store/apps/details?id=com.connectandmove",
          country: "fr", // Code pays pour le store
        });

        if (result.result === "new") {
          setNeedsUpdate(true);
          // Stocker l'URL du store appropriée selon la plateforme
          if (Platform.OS === "ios") {
            setStoreUrl("https://apps.apple.com/app/id6740539737");
          } else {
            setStoreUrl("https://play.google.com/store/apps/details?id=com.connectandmove");
          }
        }
      } catch (error) {
        console.log("Erreur lors de la vérification de version:", error);
        // En cas d'erreur, on ne fait rien (pas de carte de mise à jour)
      }
    };

    checkAppVersion();
  }, []);

  // Afficher les modals après un certain temps en fonction du contexte
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasScrolled && !showModal && dismissedModals.size === 0) {
        setShowModal(true);
      }
    }, 8000); // 8 secondes pour toutes les modals

    return () => clearTimeout(timer);
  }, [hasScrolled, showModal, dismissedModals]);

  const handleScroll = useCallback(
    (event) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const contentHeight = event.nativeEvent.contentSize.height;
      const layoutHeight = event.nativeEvent.layoutMeasurement.height;

      // Update header scroll animation
      headerScrollY.value = offsetY;

      if (!hasScrolled && offsetY > 100) {
        setHasScrolled(true);
      }

      // Gestion de la tab bar au scroll avec délai
      const currentScrollY = offsetY;
      const scrollDiff = currentScrollY - lastScrollY.current;

      // Vérifier qu'on n'est pas au début ou à la fin (bounce)
      const isAtTop = offsetY <= 0;
      const isAtBottom = offsetY + layoutHeight >= contentHeight - 10;
      const isInBounce = isAtTop || isAtBottom;

      // Déterminer la direction du scroll pour le header uniquement si on scrolle activement et pas dans le bounce
      if (isScrollingValue.value && !isInBounce) {
        const scrollDiffDirection = currentScrollY - lastScrollYForDirection.current;
        // Augmenter le seuil pour éviter les changements trop fréquents
        if (Math.abs(scrollDiffDirection) > 20) {
          const newDirectionValue = scrollDiffDirection > 0 ? 1 : -1; // 1 = down, -1 = up
          if (scrollDirectionValue.value !== newDirectionValue) {
            scrollDirectionValue.value = newDirectionValue;
          }
          lastScrollYForDirection.current = currentScrollY;
        }
      } else if (isInBounce) {
        // Reset la direction si on est dans le bounce
        scrollDirectionValue.value = 0;
      }

      // Déterminer la direction du scroll
      const currentDirection = scrollDiff > 0 ? 'down' : 'up';

      // Si on est tout en haut, toujours afficher la tab bar et réinitialiser
      if (currentScrollY < 50) {
        setIsTabBarVisible(true);
        scrollDirection.current = null;
        scrollDistance.current = 0;
      } else if (Math.abs(scrollDiff) > 2) {
        // Si la direction change, réinitialiser la distance
        if (scrollDirection.current !== currentDirection) {
          scrollDirection.current = currentDirection;
          scrollDistance.current = 0;
        }

        // Accumuler la distance de scroll dans la même direction
        scrollDistance.current += Math.abs(scrollDiff);

        // Masquer la tab bar seulement après avoir scrollé 100px vers le bas
        if (currentDirection === 'down' && scrollDistance.current > 100) {
          setIsTabBarVisible(false);
        }
        // Afficher la tab bar immédiatement lors du scroll vers le haut
        else if (currentDirection === 'up') {
          setIsTabBarVisible(true);
          scrollDistance.current = 0;
        }
      }

      lastScrollY.current = currentScrollY;

      // Afficher la modal tous les 3 scrolls significatifs pour tous les utilisateurs
      if (
        offsetY > 200 * (scrollCount + 1) &&
        !showModal &&
        dismissedModals.size === 0
      ) {
        setScrollCount((prev) => prev + 1);

        if ((scrollCount + 1) % 3 === 0) {
          setShowModal(true);
        }
      }
    },
    [hasScrolled, scrollCount, showModal, dismissedModals, scrollDirectionValue]
  );

  const handleScrollBeginDrag = useCallback(() => {
    // Annuler le timeout de réapparition si l'utilisateur recommence à scroller
    if (filterButtonTimeoutRef.current) {
      clearTimeout(filterButtonTimeoutRef.current);
      filterButtonTimeoutRef.current = null;
    }

    // Quand l'utilisateur commence à scroller avec son doigt
    isScrollingValue.value = true;
    floatingButtonsTranslateX.value = withTiming(-200, {
      duration: 300,
    });

    // Masquer le bouton filtre
    filterButtonScale.value = withTiming(0, { duration: 200 });
    filterButtonOpacity.value = withTiming(0, { duration: 200 });
  }, [floatingButtonsTranslateX, isScrollingValue, filterButtonScale, filterButtonOpacity]);

  const handleScrollEndDrag = useCallback(() => {
    // Quand l'utilisateur relâche son doigt
    isScrollingValue.value = false;
    scrollDirectionValue.value = 0; // Reset à none
    floatingButtonsTranslateX.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });

    // Attendre 1500ms avant de réafficher le bouton filtre (pour voir si l'user va encore scroller)
    filterButtonTimeoutRef.current = setTimeout(() => {
      filterButtonScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      filterButtonOpacity.value = withTiming(1, { duration: 200 });
      filterButtonTimeoutRef.current = null;
    }, 1500);
  }, [floatingButtonsTranslateX, isScrollingValue, scrollDirectionValue, filterButtonScale, filterButtonOpacity]);

  useFocusEffect(
    useCallback(() => {
      const checkCluf = async () => {
        try {
          const accepted = await AsyncStorage.getItem("clufAccepted");
          if (accepted !== "true") {
            navigation.navigate("ClufPage");
          }
        } catch (e) {}
      };
      setTimeout(() => {
        checkCluf();
      }, 500);
    }, [navigation])
  );

  useEffect(() => {
    if (showLocationWarning) {
      showMessage({
        message: i18n.t("acces_localisation_necessaire_tri"),
        type: "warning",
        duration: 5000,
      });
    }
  }, [showLocationWarning]);

  useEffect(() => {
    if (showNotificationPermissionWarning) {
      showMessage({
        message: i18n.t("permissions_notification_requises"),
        type: "warning",
        duration: 5000,
      });
    }
  }, [showNotificationPermissionWarning]);

  // Gestion du style animé des boutons flottants
  const floatingButtonsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: floatingButtonsTranslateX.value }],
  }));

  // Style animé pour le bouton filtre
  const filterButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: filterButtonScale.value }],
    opacity: filterButtonOpacity.value,
  }));

  // Composant InfoCard pour chaque carte d'information (Full Width avec hauteur fixe)
  const InfoActionCard = React.memo(({ icon, title, subtitle, onPress, color = "#F97316", iconLib = "MaterialCommunityIcons", width }) => {
    const Icon = iconLib === "Ionicons" ? Ionicons : MaterialCommunityIcons;

    return (
      <View style={{ width, paddingHorizontal: 16 }}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => ({
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <View
            style={{
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              padding: 18,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: isDarkMode ? `${color}4D` : `${color}33`,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 4,
              minHeight: 110, // Hauteur minimale fixe pour toutes les cartes
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? `${color}26` : `${color}1A`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <Icon name={icon} size={24} color={color} />
              </View>

              <View style={{ flex: 1, marginRight: 12 }}>
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 16,
                    color: isDarkMode ? "#FFFFFF" : "#0F172A",
                    letterSpacing: -0.4,
                    marginBottom: 3,
                  }}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 14,
                    color: isDarkMode ? "#94A3B8" : "#64748B",
                    letterSpacing: -0.2,
                    lineHeight: 20,
                  }}
                  numberOfLines={2}
                >
                  {subtitle}
                </Text>
              </View>

              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: color,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </Pressable>
      </View>
    );
  });

  // Composant principal - Section scrollable d'informations avec pagination
  const QuickActionsSection = React.memo(() => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const flatListRef = React.useRef(null);
    const screenWidth = Dimensions.get('window').width;
    const cards = [];

    // Card 0: Mise à jour disponible (priorité absolue)
    if (needsUpdate && storeUrl) {
      cards.push({
        id: 'update',
        icon: 'refresh',
        iconLib: 'Ionicons',
        title: i18n.t("mise_a_jour_disponible") || "Mise à jour disponible",
        subtitle: i18n.t("telecharger_derniere_version") || "Téléchargez la dernière version de l'application",
        color: "#EF4444",
        onPress: () => {
          Linking.openURL(storeUrl).catch((err) => {
            console.error("Erreur lors de l'ouverture du store:", err);
            Alert.alert(
              i18n.t("erreur"),
              i18n.t("impossible_ouvrir_store") || "Impossible d'ouvrir le store"
            );
          });
        },
      });
    }

    // Card 1: Connexion (si non connecté)
    if (!currentUser) {
      cards.push({
        id: 'login',
        icon: 'medal',
        iconLib: 'MaterialCommunityIcons',
        title: i18n.t("rejoignez_la_communaute"),
        subtitle: i18n.t("interagissez_avec_sportifs"),
        color: "#F97316",
        onPress: () => navigation.navigate("Login"),
      });
    }

    // Card 2: Notifications désactivées
    if (currentUser && showNotificationPermissionWarning) {
      cards.push({
        id: 'notifications',
        icon: 'notifications-off',
        iconLib: 'Ionicons',
        title: i18n.t("activer_notifications") || "Activer les notifications",
        subtitle: i18n.t("restez_informe_activites") || "Restez informé des nouvelles activités",
        color: "#EF4444",
        onPress: () => openSettings(),
      });
    }

    // Card 3: Localisation désactivée
    if (currentUser && showLocationWarning) {
      cards.push({
        id: 'location',
        icon: 'location-off',
        iconLib: 'Ionicons',
        title: i18n.t("activer_localisation") || "Activer la localisation",
        subtitle: i18n.t("trouvez_activites_proximite") || "Trouvez des activités près de vous",
        color: "#3B82F6",
        onPress: () => openSettings(),
      });
    }

    // Card 4: Profil incomplet (si certaines infos manquent)
    if (currentUser && userInfo && (!userInfo.interests || !userInfo.location?.address)) {
      cards.push({
        id: 'profile',
        icon: 'account-edit',
        iconLib: 'MaterialCommunityIcons',
        title: i18n.t("completer_profil") || "Complétez votre profil",
        subtitle: i18n.t("ameliorez_experience") || "Améliorez votre expérience",
        color: "#8B5CF6",
        onPress: () => navigation.navigate("Profil", { screen: "EditProfile" }),
      });
    }

    // Card 5: Parrainage (toujours affiché si connecté)
    if (currentUser) {
      cards.push({
        id: 'referral',
        icon: 'gift',
        iconLib: 'Ionicons',
        title: i18n.t("parrainez_amis") || "Parrainez vos amis",
        subtitle: i18n.t("gagnez_recompenses") || "Gagnez des récompenses ensemble",
        color: "#10B981",
        onPress: () => navigation.navigate("Profil", { screen: "ReferralPage" }),
      });
    }

    // Card 6: Offres premium (si non abonné)
    if (currentUser && subscription === ENTITLEMENT_LEVELS.GRATUIT) {
      cards.push({
        id: 'premium',
        icon: 'crown',
        iconLib: 'MaterialCommunityIcons',
        title: i18n.t("decouvrez_premium") || "Découvrez Premium",
        subtitle: i18n.t("acces_offres_exclusives") || "Accédez à des offres exclusives",
        color: "#F59E0B",
        onPress: () => navigation.navigate("Profil", { screen: "AllOffers" }),
      });
    }

    // Card 7: Code promo (si connecté)
    if (currentUser) {
      cards.push({
        id: 'promo',
        icon: 'ticket-percent',
        iconLib: 'MaterialCommunityIcons',
        title: i18n.t("code_promo") || "Code promo",
        subtitle: i18n.t("entrez_code_promo_reductions") || "Entrez un code promo pour des réductions",
        color: "#EC4899",
        onPress: () => navigation.navigate("Profil", { screen: "CodePromo" }),
      });
    }

    // Card 8: Comment ça marche (toujours affiché)
    cards.push({
      id: 'howItWorks',
      icon: 'help-circle',
      iconLib: 'Ionicons',
      title: i18n.t("comment_ca_marche") || "Comment ça marche ?",
      subtitle: i18n.t("decouvrez_fonctionnement_app") || "Découvrez le fonctionnement de l'application",
      color: "#06B6D4",
      onPress: () => navigation.navigate("Profil", { screen: "HowItsWork" }),
    });

    if (cards.length === 0) return null;

    const onViewableItemsChanged = React.useRef(({ viewableItems }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    }).current;

    const viewabilityConfig = React.useRef({
      itemVisiblePercentThreshold: 50,
    }).current;

    // Auto-scroll functionality
    React.useEffect(() => {
      if (cards.length <= 1) return; // Pas de scroll automatique s'il n'y a qu'une seule carte

      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % cards.length;
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }, 5000); // Auto-scroll toutes les 5 secondes

      return () => clearInterval(interval);
    }, [cards.length]);

    return (
      <View style={{ marginBottom: 16, marginTop: 8 }}>
        <FlatList
          ref={flatListRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={cards}
          keyExtractor={(item) => item.id}
          snapToInterval={screenWidth}
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => (
            <InfoActionCard
              icon={item.icon}
              iconLib={item.iconLib}
              title={item.title}
              subtitle={item.subtitle}
              color={item.color}
              onPress={item.onPress}
              width={screenWidth}
            />
          )}
        />

        {cards.length > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
            {cards.map((_, index) => (
              <View
                key={index}
                style={{
                  width: currentIndex === index ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: currentIndex === index
                    ? '#F97316'
                    : isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                  marginHorizontal: 3,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </View>
        )}
      </View>
    );
  });

  const handleLoginRequired = (actionType = "like") => {
    setLoginPromptAction(actionType);
    setShowLoginPrompt(true);
  };

  const renderActivity = useCallback(
    ({ item }) => (
      <ActivityCard
        activity={item}
        userInfo={userInfo}
        userPostalCode={userPostalCode}
        onLoginRequired={handleLoginRequired}
      />
    ),
    [userInfo, userPostalCode]
  );

  if (loading) {
    return (
      <View className="flex-1">
        <Loader />
      </View>
    );
  }

  // Configuration des InfoCards - toutes sont fermables pour une UX non intrusive
  const infoCards = [
    {
      isVisible: parrain && !!user,
      iconName: "gift",
      title: i18n.t("invitez_vos_amis_gagnez_ensemble"),
      description: i18n.t("partagez_code_avantages_exclusifs"),
      buttonText: i18n.t("parrainer"),
      buttonBgClass: "bg-emerald-500 dark:bg-orange-600",
      onButtonPress: () => {
        navigation.navigate("Profil");
        setTimeout(() => {
          navigation.navigate("Profil", { screen: "ReferralPage" });
        }, 100);
      },
      canDismiss: true,
    },
    {
      isVisible: !userLocation && !!user,
      iconName: "location",
      title: i18n.t("activez_votre_localisation"),
      description: i18n.t("activez_localisation_voir_evenements_proches"),
      buttonText: i18n.t("activer_la_localisation"),
      buttonBgClass: "bg-yellow-500 dark:bg-yellow-600",
      onButtonPress: openSettings,
      canDismiss: true,
    },
    {
      isVisible: notif && !!user,
      iconName: "notifications",
      title: i18n.t("notifications"),
      description: i18n.t("recevez_alertes_nouveautes_evenements"),
      buttonText: i18n.t("activer_les_notifications"),
      buttonBgClass: "bg-orange-500 dark:bg-orange-600",
      onButtonPress: openSettings,
      canDismiss: true,
    },
  ];

  // Filtrage simple - toutes les cartes visibles et non fermées
  const visibleCards = infoCards.filter(
    (card) => card.isVisible && !dismissedModals.has(card.iconName)
  );

  const currentModalCard = visibleCards.length > 0 ? visibleCards[0] : null;

  const handleCloseModal = () => {
    // Toutes les modals peuvent être fermées pour une UX fluide
    if (currentModalCard) {
      setDismissedModals(
        (prev) => new Set([...prev, currentModalCard.iconName])
      );
      setShowModal(false);
    }
  };

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: isDarkMode ? COLORS.bgDark : "#F8FAFC",
      }}
    >
      <FlatList
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}
        ListHeaderComponent={() => (
          <View>
            <QuickActionsSection />

            <View className="px-4 pt-5 pb-2">
              {selectedCategory && (
                <View className="mb-4">
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      letterSpacing: -0.2,
                      color: isDarkMode ? "#94A3B8" : "#64748B",
                      marginBottom: 8,
                    }}
                  >
                    {activities.length} {i18n.t("resultats_pour", { defaultValue: activities.length > 1 ? "résultats pour" : "résultat pour" })} :
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter_800ExtraBold",
                        letterSpacing: -1,
                        lineHeight: 34,
                        fontSize: 28,
                        color: isDarkMode ? "#FFFFFF" : "#0F172A",
                      }}
                      numberOfLines={1}
                    >
                      {selectedCategory.name}
                    </Text>
                    <Pressable
                      onPress={() => navigation.setParams({ selectedCategory: null })}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.6 : 1,
                        backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 12,
                      })}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={18}
                        color="#EF4444"
                      />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
        data={activities}
        ListEmptyComponent={() =>
          !loading ? (
            <View className="flex-1 items-center justify-center px-4 py-24">
              <View className="items-center text-center">
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    backgroundColor: isDarkMode
                      ? "rgba(249, 115, 22, 0.12)"
                      : "rgba(249, 115, 22, 0.08)",
                    borderWidth: 2,
                    borderColor: isDarkMode
                      ? "rgba(249, 115, 22, 0.2)"
                      : "rgba(249, 115, 22, 0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={44}
                    color="#F97316"
                  />
                </View>

                <Text
                  style={{
                    fontFamily: "Inter_800ExtraBold",
                    letterSpacing: -0.8,
                    fontSize: 26,
                    marginBottom: 10,
                    color: isDarkMode ? "#FFFFFF" : "#0F172A",
                  }}
                >
                  {selectedCategory
                    ? i18n.t("aucun_evenement_trouve")
                    : i18n.t("rien_a_afficher")}
                </Text>

                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 16,
                    lineHeight: 24,
                    letterSpacing: -0.3,
                    color: isDarkMode ? "#94A3B8" : "#64748B",
                    textAlign: "center",
                    maxWidth: 320,
                  }}
                >
                  {selectedCategory
                    ? i18n.t("essayez_autre_categorie_ou_retirez_filtre")
                    : i18n.t("revenez_plus_tard_ou_explorez")}
                </Text>

                {selectedCategory && (
                  <Pressable
                    onPress={() =>
                      navigation.setParams({ selectedCategory: null })
                    }
                    style={({ pressed }) => ({
                      marginTop: 24,
                      paddingVertical: 14,
                      paddingHorizontal: 28,
                      borderRadius: 20,
                      backgroundColor: "#F97316",
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                      shadowColor: "#F97316",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                      elevation: 5,
                  })}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 16,
                      letterSpacing: -0.3,
                      color: "#FFFFFF",
                    }}
                  >
                    {i18n.t("retirer_le_filtre")}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
          ) : null
        }
        renderItem={renderActivity}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary, COLORS.secondary]}
            tintColor={COLORS.primary}
            progressBackgroundColor={isDarkMode ? "#1E293B" : "#FFFFFF"}
            titleColor={isDarkMode ? "#94A3B8" : "#64748B"}
          />
        }
      />

      {/* Bouton flottant filtre */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          {
            position: "absolute",
            bottom: 100,
            right: 20,
            zIndex: 999999,
          },
          filterButtonAnimatedStyle,
        ]}
      >
        <Pressable
          onPress={() => {
            selectedCategory
              ? navigation.setParams({ selectedCategory: null })
              : navigation.navigate("FilterScreen");
          }}
        >
          {({ pressed }) => (
            <View style={{ position: "relative" }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: selectedCategory ? "#EF4444" : "#F97316",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 6,
                  elevation: 6,
                  opacity: pressed ? 0.9 : 1,
                }}
              >
                <MaterialCommunityIcons
                  name={selectedCategory ? "close" : "tune-variant"}
                  size={22}
                  color="#FFFFFF"
                />
              </View>
              {selectedCategory && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: "#EF4444",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 11,
                      color: "#EF4444",
                    }}
                  >
                    1
                  </Text>
                </View>
              )}
            </View>
          )}
        </Pressable>
      </Animated.View>

      {/* Modal pour les InfoCards - Non intrusive */}
      {currentModalCard && (
        <InfoCardModal
          visible={showModal}
          iconName={currentModalCard.iconName}
          title={currentModalCard.title}
          description={currentModalCard.description}
          buttonText={currentModalCard.buttonText}
          buttonBgClass={currentModalCard.buttonBgClass}
          onButtonPress={currentModalCard.onButtonPress}
          onClose={handleCloseModal}
        />
      )}

      {/* Modal de connexion pour actions sociales */}
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        actionType={loginPromptAction}
      />

      {/* Modal de commentaires */}
      <CommentsModal
        visible={showComments}
        onClose={() => {
          setShowComments(false);
          setSelectedActivityId(null);
        }}
        activityId={selectedActivityId}
      />

      {/* Modal de permissions séquentielles - affiché au premier lancement */}
      <PermissionsModal
        visible={showPermissionsModal}
        onComplete={async () => {
          setShowPermissionsModal(false);
          // Après la complétion, gérer les tokens de notifications
          try {
            const token = await registerForPushNotificationsAsync();
            if (token) {
              await addExpoPushTokenToUser(token);
            }
            // Rafraîchir les états de permissions
            const { status } = await Notifications.getPermissionsAsync();
            setNotif(status !== "granted");
          } catch (error) {
            console.error('Erreur lors de la gestion post-permissions:', error);
          }
        }}
      />

      {/* Tutoriel de swipe - affiché une seule fois */}
      {showSwipeTutorial && (
        <SwipeHandTutorial
          onComplete={async () => {
            setShowSwipeTutorial(false);
            try {
              await AsyncStorage.setItem('hasSeenSwipeTutorial', 'true');
            } catch (error) {
              console.error('Erreur lors de la sauvegarde du tutoriel:', error);
            }
          }}
        />
      )}
    </View>
  );
};

export default Home;