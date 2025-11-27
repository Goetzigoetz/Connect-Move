import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Animated as RNAnimated,
} from "react-native";
import moment from "moment";
import { auth, db } from "../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  doc,
  serverTimestamp,
  deleteDoc,
} from "@react-native-firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSpring,
  runOnJS,
  runOnUI,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { showMessage } from "react-native-flash-message";
import sendNotifs from "../utils/sendNotifs";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../styles/colors";
import PartnersSkeleton from "../components/PartnersSkeleton";
import FiltersModal from "../components/FiltersModal";
import i18n from "../../i18n";
import { useThemeContext } from "../ThemeProvider";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.15; // Seuil plus fluide (15% au lieu de 25%)

// Composant de confettis pour les matchs
const MatchConfetti = ({ index }) => {
  const translateY = useRef(new RNAnimated.Value(-50)).current;
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const rotate = useRef(new RNAnimated.Value(0)).current;
  const opacity = useRef(new RNAnimated.Value(1)).current;

  const startX = Math.random() * SCREEN_WIDTH;
  const endX = startX + (Math.random() - 0.5) * 100;
  const colors = [COLORS.primary, COLORS.secondary, "#22c55e", "#3b82f6", "#f59e0b", "#ec4899"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = Math.random() * 10 + 8;
  const duration = Math.random() * 2000 + 2500;
  const rotations = Math.random() * 4 + 2;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(translateY, {
        toValue: SCREEN_HEIGHT + 50,
        duration: duration,
        useNativeDriver: true,
      }),
      RNAnimated.timing(translateX, {
        toValue: endX - startX,
        duration: duration,
        useNativeDriver: true,
      }),
      RNAnimated.timing(rotate, {
        toValue: rotations,
        duration: duration,
        useNativeDriver: true,
      }),
      RNAnimated.timing(opacity, {
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
    <RNAnimated.View
      style={{
        position: "absolute",
        left: startX,
        top: 0,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size / 2,
        transform: [{ translateY }, { translateX }, { rotate: spin }],
        opacity,
        zIndex: 10000,
      }}
    />
  );
};

// Fonction pour calculer la distance entre deux points (formule de Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance en km
};

// Composant d'icônes flottantes animées
const FloatingIcon = ({ name, duration, startX, startY }) => {
  const translateY = useSharedValue(startY);
  const translateX = useSharedValue(startX);
  const opacity = useSharedValue(0.08);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(startY + 60, {
        duration: duration,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      true
    );
    translateX.value = withRepeat(
      withTiming(startX + 30, {
        duration: duration * 0.8,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      true
    );
    rotate.value = withRepeat(
      withTiming(360, {
        duration: duration * 2,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.floatingIcon, animatedStyle]}>
      <Ionicons name={name} size={40} color={COLORS.primary} />
    </Animated.View>
  );
};

// Composant de carte animée avec gesture
const SwipeableCard = ({ user, currentUser, currentUserLocation, onSwipe, index, isDarkMode }) => {
  // Couleurs adaptées au thème
  const cardBg = isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF";
  const textPrimary = isDarkMode ? "#FFFFFF" : "#1F2937";
  const textSecondary = isDarkMode ? "#9CA3AF" : "#6B7280";
  const textTertiary = isDarkMode ? "#6B7280" : "#374151";
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);

  // Fonction pour animer le swipe programmé (depuis les boutons)
  const animateSwipe = (direction) => {
    'worklet';
    const targetX = direction === "right" ? SCREEN_WIDTH : -SCREEN_WIDTH;
    translateX.value = withSpring(targetX, { velocity: 1000 });
    translateY.value = withSpring(0);
    rotate.value = withSpring(direction === "right" ? 20 : -20);
    runOnJS(onSwipe)(user, direction);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = event.translationY * 0.3;
      rotate.value = event.translationX / 15;
      scale.value = withSpring(0.95);
    })
    .onEnd((event) => {
      scale.value = withSpring(1);

      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Swipe complet
        const direction = event.translationX > 0 ? "right" : "left";
        translateX.value = withSpring(
          event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
          { velocity: event.velocityX }
        );
        translateY.value = withSpring(event.translationY);
        runOnJS(onSwipe)(user, direction);
      } else {
        // Retour à la position initiale
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: 1 - Math.abs(translateX.value) / SCREEN_WIDTH,
  }));

  const leftLabelStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -50 ? Math.abs(translateX.value) / SWIPE_THRESHOLD : 0,
  }));

  const rightLabelStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 50 ? translateX.value / SWIPE_THRESHOLD : 0,
  }));

  const commonInterests = currentUser
    ? (user?.interests || user?.interest || []).filter((interest) =>
        (currentUser?.interests || currentUser?.interest || []).includes(interest)
      )
    : [];

  const distance =
    currentUserLocation &&
    user?.location?.latitude &&
    user?.location?.longitude
      ? Math.round(calculateDistance(
          currentUserLocation.latitude,
          currentUserLocation.longitude,
          user.location.latitude,
          user.location.longitude
        ))
      : null;

  const age = user.birthDate
    ? moment().diff(moment(user.birthDate), "years")
    : null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          cardStyle,
          { zIndex: 1000 - index, backgroundColor: cardBg },
        ]}
      >
        {/* Labels de swipe */}
        <Animated.View style={[styles.swipeLabel, styles.swipeLabelLeft, leftLabelStyle]}>
          <Text style={styles.swipeLabelText}>{i18n.t("non_majuscule")}</Text>
        </Animated.View>
        <Animated.View style={[styles.swipeLabel, styles.swipeLabelRight, rightLabelStyle]}>
          <Text style={styles.swipeLabelText}>{i18n.t("oui_majuscule")}</Text>
        </Animated.View>

        {/* Image de profil */}
        <View style={styles.imageContainer}>
          <Image
            style={styles.cardImage}
            source={{ uri: user.photoURL }}
            contentFit="cover"
            transition={150}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.5)"]}
            style={styles.imageGradient}
            pointerEvents="none"
          />
        </View>

        {/* Infos utilisateur */}
        <View style={styles.cardContent}>
          {/* Nom et âge */}
          <View style={styles.nameSection}>
            <Text style={[styles.username, { color: textPrimary }]} numberOfLines={1}>
              @{user.username}
            </Text>
            {age && (
              <View style={styles.ageBadge}>
                <Text style={styles.ageText}>{age} {i18n.t("ans")}</Text>
              </View>
            )}
          </View>

          {/* Bio */}
          {user.biography && (
            <Text style={[styles.biography, { color: textSecondary }]} numberOfLines={2}>
              {user.biography}
            </Text>
          )}

          {/* Distance */}
          {distance && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={[styles.infoText, { color: textSecondary }]}>À 33 km</Text>
            </View>
          )}

          {/* Intérêts communs */}
          {commonInterests?.length > 0 && (
            <View style={styles.interestsSection}>
              <View style={styles.interestsHeader}>
                <Ionicons name="heart" size={14} color={COLORS.primary} />
                <Text style={[styles.interestsTitle, { color: textTertiary }]}>
                  {commonInterests.length}{" "}
                  {commonInterests.length === 1
                    ? i18n.t("interet_commun_singulier")
                    : i18n.t("interets_communs_pluriel")}
                </Text>
              </View>
              <View style={styles.interestsGrid}>
                {commonInterests.slice(0, 4).map((interest, idx) => (
                  <View key={idx} style={styles.interestChip}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
                {commonInterests.length > 4 && (
                  <View style={styles.interestChip}>
                    <Text style={styles.interestText}>
                      +{commonInterests.length - 4}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Boutons d'action */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => {
                runOnUI(animateSwipe)("left");
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#EF4444", "#DC2626"]}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.likeButton}
              onPress={() => {
                runOnUI(animateSwipe)("right");
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="heart" size={28} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const Partners = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showEmptyState, setShowEmptyState] = useState(true);
  const [debugMode, setDebugMode] = useState(false); // Mode normal par défaut
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: 50,
    ageRange: [18, 65],
    gender: "all",
    minCommonInterests: 1,
    expertiseLevels: [],
  });
  const { isDarkMode } = useThemeContext();

  // Icônes sportives pour l'animation de fond - BEAUCOUP PLUS
  const floatingIcons = [
    { name: "football", x: 30, y: 80, duration: 4000 },
    { name: "basketball", x: SCREEN_WIDTH - 80, y: 120, duration: 4500 },
    { name: "tennisball", x: 50, y: 200, duration: 3800 },
    { name: "bicycle", x: SCREEN_WIDTH - 100, y: 280, duration: 4200 },
    { name: "barbell", x: 70, y: 360, duration: 3600 },
    { name: "fitness", x: SCREEN_WIDTH - 70, y: 440, duration: 4100 },
    { name: "american-football", x: 40, y: 520, duration: 3900 },
    { name: "golf", x: SCREEN_WIDTH - 90, y: 600, duration: 4300 },
    { name: "baseball", x: 60, y: 680, duration: 3700 },
    { name: "trophy", x: SCREEN_WIDTH - 60, y: 50, duration: 4400 },
    { name: "medal", x: SCREEN_WIDTH / 2 - 20, y: 150, duration: 3500 },
    { name: "flash", x: SCREEN_WIDTH / 2 + 40, y: 250, duration: 4000 },
    { name: "flame", x: 20, y: 400, duration: 4200 },
    { name: "heart", x: SCREEN_WIDTH - 50, y: 350, duration: 3800 },
    { name: "star", x: SCREEN_WIDTH / 2 - 40, y: 500, duration: 4100 },
  ];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Fonction pour générer des utilisateurs de test
  const generateFakeUsers = (count = 20) => {
    const firstNames = [
      "Sophie", "Lucas", "Emma", "Thomas", "Léa", "Alexandre", "Chloé", "Maxime",
      "Camille", "Hugo", "Sarah", "Antoine", "Marie", "Nicolas", "Laura", "Pierre",
      "Julie", "Mathieu", "Océane", "Julien", "Manon", "Kevin", "Inès", "Romain"
    ];
    const lastNames = [
      "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand",
      "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David",
      "Bertrand", "Roux", "Vincent", "Fournier", "Morel", "Girard", "André", "Mercier"
    ];
    const cities = [
      "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier",
      "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Étienne", "Toulon", "Grenoble"
    ];
    const interests = [
      "Football", "Basketball", "Tennis", "Natation", "Course à pied", "Yoga", "Musculation",
      "Cyclisme", "Randonnée", "Escalade", "Danse", "Boxe", "Volleyball", "Badminton"
    ];
    const bios = [
      "Passionné de sport et de rencontres 🏃‍♂️",
      "Toujours partant pour de nouvelles aventures sportives ! 💪",
      "À la recherche de partenaires motivés 🎾",
      "Sport et convivialité avant tout 😊",
      "Fan de challenges et de dépassement de soi 🚴‍♀️",
      "Adepte du sport en plein air 🏔️",
      "Ici pour partager ma passion du sport 🏋️‍♂️",
      "Motivé(e) et prêt(e) à bouger ! ⚽"
    ];
    const usernameSuffixes = [
      "_fit", "_sport", "_runner", "_gym", "_active", "_healthy", "_strong", "_power",
      "_team", "_coach", "_pro", "_warrior", "_champ", "_athletic", "_fitness"
    ];

    const fakeUsers = [];
    // Point de référence: Paris (48.8566, 2.3522)
    const baseLatitude = 48.8566;
    const baseLongitude = 2.3522;

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const age = Math.floor(Math.random() * 30) + 20; // 20-50 ans
      const birthDate = moment().subtract(age, 'years').format();

      // Générer un username unique
      const suffix = usernameSuffixes[Math.floor(Math.random() * usernameSuffixes.length)];
      const username = `${firstName.toLowerCase()}${suffix}${Math.floor(Math.random() * 99)}`;

      // Sélectionner 2-5 intérêts aléatoires
      const userInterests = [];
      const numInterests = Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < numInterests; j++) {
        const interest = interests[Math.floor(Math.random() * interests.length)];
        if (!userInterests.includes(interest)) {
          userInterests.push(interest);
        }
      }

      // Générer des coordonnées à 30-50 km de Paris
      // Approche simplifiée : 1 degré de latitude = environ 111 km
      const distanceInKm = 30 + Math.random() * 20; // Entre 30 et 50 km
      const angle = Math.random() * 2 * Math.PI; // Angle aléatoire

      // Conversion en degrés (approximation valide pour de petites distances)
      // 1 degré de latitude ≈ 111 km
      // 1 degré de longitude à Paris (lat ~49°) ≈ 111 * cos(49°) ≈ 73 km
      const latOffset = (distanceInKm / 111) * Math.cos(angle);
      const lonOffset = (distanceInKm / 73) * Math.sin(angle);

      const latitude = baseLatitude + latOffset;
      const longitude = baseLongitude + lonOffset;

      fakeUsers.push({
        id: `fake-user-${i}-${Date.now()}`,
        firstName,
        lastName,
        username,
        photoURL: `https://i.pravatar.cc/400?img=${Math.floor(Math.random() * 70)}`,
        biography: bios[Math.floor(Math.random() * bios.length)],
        birthDate,
        location: {
          address: city,
          latitude,
          longitude,
        },
        interests: userInterests,
        phoneNumber: `+33${Math.floor(Math.random() * 900000000) + 100000000}`,
        isActive: true,
        emailVerified: true,
        showMyProfile: true,
      });
    }
    return fakeUsers;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      console.log("🚀 [Partners] fetchUsers - Début");
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        console.log("👤 [Partners] currentUser:", currentUser?.uid);

        if (currentUser) {
          setUserId(currentUser.uid);

          // Récupérer les données de l'utilisateur connecté
          console.log("📥 [Partners] Récupération des données utilisateur...");
          const currentUserDocRef = doc(db, "users", currentUser.uid);
          const currentUserDocSnap = await getDoc(currentUserDocRef);

          let currentUserData = null;
          if (currentUserDocSnap.exists()) {
            currentUserData = currentUserDocSnap.data();
            console.log("✅ [Partners] Données utilisateur récupérées:", {
              interests: currentUserData?.interests?.length,
              location: currentUserData?.location ? "✓" : "✗",
              gender: currentUserData?.gender,
            });
            setCurrentUser(currentUserData);
            setCurrentUserLocation(currentUserData.location);
          } else {
            console.log("❌ [Partners] Données utilisateur introuvables");
          }

          // MODE DEBUG - Utiliser des faux utilisateurs
          if (debugMode) {
            console.log("🐛 [Partners] Mode DEBUG activé");
            const fakeUsers = generateFakeUsers(50);
            setUsers(fakeUsers);
            setCurrentIndex(0);
            setShowEmptyState(false);
            setLoading(false);
            return;
          }

          // Récupérer les IDs des utilisateurs déjà swipés
          console.log("📊 [Partners] Récupération des swipes...");
          const swipesQuery = query(
            collection(db, "swipes"),
            where("swiperId", "==", currentUser.uid)
          );
          const swipesSnapshot = await getDocs(swipesQuery);
          const swipedUserIds = swipesSnapshot.docs.map(
            (doc) => doc.data().swipedId
          );
          console.log("👉 [Partners] Nombre de swipes:", swipedUserIds.length);

          // Récupérer les IDs des utilisateurs avec lesquels on a déjà matché (salons)
          console.log("💬 [Partners] Récupération des matchs...");
          const salonsQuery = query(
            collection(db, "salons"),
            where("participants", "array-contains", currentUser.uid)
          );
          const salonsSnapshot = await getDocs(salonsQuery);
          const matchedUserIds = salonsSnapshot.docs
            .map((doc) => {
              const participants = doc.data().participants;
              // Retourner l'autre participant (pas moi)
              return participants.find((id) => id !== currentUser.uid);
            })
            .filter(Boolean); // Enlever les undefined/null
          console.log("💑 [Partners] Nombre de matchs:", matchedUserIds.length);

          // Récupérer les utilisateurs avec showMyProfile:true
          console.log("🔍 [Partners] Récupération des utilisateurs disponibles...");
          const usersQuery = query(
            collection(db, "users"),
            where("showMyProfile", "==", true)
          );
          const usersSnapshot = await getDocs(usersQuery);
          console.log("📋 [Partners] Utilisateurs trouvés:", usersSnapshot.docs.length);

          // Filtrer les utilisateurs selon TOUS les critères de validation du ProfileScreen
          console.log("🔧 [Partners] Application des filtres:", filters);
          console.log("📍 [Partners] currentUserData disponible:", !!currentUserData);

          const filteredUsers = usersSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((user, index) => {
              // Ne pas inclure l'utilisateur actuel
              if (user.id === currentUser.uid) {
                console.log(`⏭️ [Partners] User ${index}: Skipped (current user)`);
                return false;
              }

              // Ne pas inclure les utilisateurs déjà swipés
              if (swipedUserIds.includes(user.id)) {
                console.log(`⏭️ [Partners] User ${index}: Skipped (already swiped)`);
                return false;
              }

              // Ne pas inclure les utilisateurs avec lesquels on a déjà matché
              if (matchedUserIds.includes(user.id)) {
                console.log(`⏭️ [Partners] User ${index}: Skipped (already matched)`);
                return false;
              }

              // CRITÈRES DE VALIDATION (conformes à Profile.js lignes 371-383)
              const userInterestsCheck = (user.interests?.length > 0) || (user.interest?.length > 0);
              const requiredFieldsFilled =
                user.firstName?.trim() &&
                user.lastName?.trim() &&
                user.location?.address?.trim() &&
                user.phoneNumber &&
                user.photoURL?.trim() &&
                user.biography?.trim() &&
                user.isActive &&
                user.emailVerified &&
                user.birthDate &&
                userInterestsCheck &&
                user.showMyProfile === true;

              if (!requiredFieldsFilled) {
                // Log détaillé pour déboguer
                console.log(`⏭️ [Partners] User ${index} (${user.username}): Skipped - Missing fields:`, {
                  firstName: !!user.firstName?.trim(),
                  lastName: !!user.lastName?.trim(),
                  location: !!user.location?.address?.trim(),
                  phoneNumber: !!user.phoneNumber,
                  photoURL: !!user.photoURL?.trim(),
                  biography: !!user.biography?.trim(),
                  isActive: !!user.isActive,
                  emailVerified: !!user.emailVerified,
                  birthDate: !!user.birthDate,
                  interests: userInterestsCheck,
                  showMyProfile: user.showMyProfile === true,
                });
                return false;
              }

              // === FILTRES PERSONNALISÉS ===
              console.log(`🎯 [Partners] User ${index} (${user.username}): Applying custom filters...`);

              // 1. Filtre de distance
              if (currentUserData?.location?.latitude && currentUserData?.location?.longitude &&
                  user.location?.latitude && user.location?.longitude) {
                const distance = calculateDistance(
                  currentUserData.location.latitude,
                  currentUserData.location.longitude,
                  user.location.latitude,
                  user.location.longitude
                );
                console.log(`   📏 Distance: ${distance.toFixed(1)}km (max: ${filters.maxDistance}km)`);
                if (distance > filters.maxDistance) {
                  console.log(`   ❌ Rejected: Distance too far`);
                  return false;
                }
              }

              // 2. Filtre d'âge
              if (user.birthDate) {
                const userAge = moment().diff(moment(user.birthDate), "years");
                console.log(`   🎂 Age: ${userAge} (range: ${filters.ageRange[0]}-${filters.ageRange[1]})`);
                if (userAge < filters.ageRange[0] || userAge > filters.ageRange[1]) {
                  console.log(`   ❌ Rejected: Age out of range`);
                  return false;
                }
              }

              // 3. Filtre de genre
              console.log(`   👤 Gender: ${user.gender} (filter: ${filters.gender})`);
              if (filters.gender !== "all" && user.gender !== filters.gender) {
                console.log(`   ❌ Rejected: Gender mismatch`);
                return false;
              }

              // 4. Filtre d'intérêts communs minimum
              // Support pour les deux noms de champ: interests (pluriel) et interest (singulier)
              const currentUserInterests = currentUserData?.interests || currentUserData?.interest || [];
              const userInterests = user.interests || user.interest || [];
              const commonInterests = currentUserInterests.filter(
                (interest) => userInterests.includes(interest)
              );
              console.log(`   ❤️ Common interests: ${commonInterests.length} (min: ${filters.minCommonInterests}) - currentUser: ${currentUserInterests.length}, user: ${userInterests.length}`);
              if (commonInterests.length < filters.minCommonInterests) {
                console.log(`   ❌ Rejected: Not enough common interests`);
                return false;
              }

              // 5. Filtre de niveau d'expertise (optionnel)
              if (filters.expertiseLevels.length > 0 && user.expertiseLevel) {
                console.log(`   🎓 Expertise: ${user.expertiseLevel} (filter: ${filters.expertiseLevels.join(", ")})`);
                if (!filters.expertiseLevels.includes(user.expertiseLevel)) {
                  console.log(`   ❌ Rejected: Expertise level mismatch`);
                  return false;
                }
              }

              console.log(`   ✅ User ${index} (${user.username}): ACCEPTED`);
              return true;
            });

          console.log(`🎉 [Partners] Filtrage terminé: ${filteredUsers.length} utilisateurs conservés`);
          setUsers(filteredUsers);
          setCurrentIndex(0);
          // Réinitialiser showEmptyState quand on charge de nouveaux utilisateurs
          setShowEmptyState(filteredUsers.length === 0);
        }
      } catch (error) {
        console.error("💥 [Partners] ERREUR lors de la récupération des utilisateurs:", error);
        console.error("💥 [Partners] Stack trace:", error.stack);
        showMessage({
          message: "Erreur",
          description: "Impossible de charger les partenaires",
          type: "danger",
        });
      } finally {
        console.log("✅ [Partners] fetchUsers - Fin (loading = false)");
        setLoading(false);
      }
    };

    fetchUsers();
  }, [forceUpdate, filters, debugMode]);

  const handleSwipe = async (swipedUser, direction) => {
    try {
      // En mode debug, on skip les opérations Firebase
      if (debugMode) {
        // Avancer à la prochaine carte immédiatement
        setCurrentIndex((prev) => prev + 1);

        // Simuler un match aléatoire (20% de chance)
        if (direction === "right" && Math.random() < 0.2) {
          setConfettiKey((prev) => prev + 1);

          // Gérer l'affichage de l'état vide si dernière carte
          if (currentIndex + 1 >= users.length) {
            setShowEmptyState(false);
            setTimeout(() => {
              setShowEmptyState(true);
            }, 3000);
          }

          showMessage({
            message: "C'est un match ! 🎉",
            description: `Vous avez matché avec ${swipedUser.firstName}`,
            type: "success",
            duration: 3000,
          });
        }
        return;
      }

      // Mode normal - opérations Firebase
      // Vérifier si un swipe existe déjà
      const existingSwipeQuery = query(
        collection(db, "swipes"),
        where("swiperId", "==", userId),
        where("swipedId", "==", swipedUser.id)
      );
      const existingSwipeSnapshot = await getDocs(existingSwipeQuery);

      if (!existingSwipeSnapshot.empty) {
        console.log("Un swipe existe déjà pour cet utilisateur.");
        return;
      }

      // Ajouter le swipe dans Firestore
      await addDoc(collection(db, "swipes"), {
        swiperId: userId,
        swipedId: swipedUser.id,
        direction,
        date: moment().format(),
      });

      // Avancer à la prochaine carte
      setCurrentIndex((prev) => prev + 1);

      if (direction === "right") {
        // Vérifier si un match mutuel existe
        const mutualSwipeQuery = query(
          collection(db, "swipes"),
          where("swiperId", "==", swipedUser.id),
          where("swipedId", "==", userId),
          where("direction", "==", "right")
        );
        const mutualSwipeSnapshot = await getDocs(mutualSwipeQuery);

        if (!mutualSwipeSnapshot.empty) {
          // Match trouvé !
          const currentUserDocRef = doc(db, "users", userId);
          const currentUserDocSnap = await getDoc(currentUserDocRef);
          const currentUserData = { id: userId, ...currentUserDocSnap.data() };

          const commonInterests = (currentUserData.interests || []).filter(
            (interest) => (swipedUser.interests || []).includes(interest)
          );

          await addDoc(collection(db, "matches"), {
            user1: userId,
            user2: swipedUser.id,
            date: moment().format(),
            commonInterests,
          });

          await addDoc(collection(db, "salons"), {
            participants: [userId, swipedUser.id],
            createdAt: serverTimestamp(),
            commonInterests,
          });

          // Supprimer les swipes maintenant qu'un match existe (optimisation DB)
          // Supprimer le swipe mutuel (l'autre utilisateur vers moi)
          const mutualSwipeDoc = mutualSwipeSnapshot.docs[0];
          await deleteDoc(doc(db, "swipes", mutualSwipeDoc.id));

          // Supprimer mon swipe actuel (moi vers l'autre utilisateur)
          const mySwipeQuery = query(
            collection(db, "swipes"),
            where("swiperId", "==", userId),
            where("swipedId", "==", swipedUser.id)
          );
          const mySwipeSnapshot = await getDocs(mySwipeQuery);
          if (!mySwipeSnapshot.empty) {
            await deleteDoc(doc(db, "swipes", mySwipeSnapshot.docs[0].id));
          }

          const messageNotif = {
            title: "Match",
            desc: "Vous avez matché avec quelqu'un",
            type: "match",
          };
          sendNotifs(currentUserData, messageNotif);
          sendNotifs(swipedUser, messageNotif);

          // Déclencher les confettis avec une nouvelle clé pour forcer le re-render
          setConfettiKey((prev) => prev + 1);

          showMessage({
            message: "C'est un match ! 🎉",
            description: "Vous pouvez maintenant discuter ensemble",
            type: "success",
            duration: 3000,
          });

          // Si c'était la dernière carte, retarder l'affichage de l'écran vide
          // pour laisser les confettis se jouer (3 secondes)
          if (currentIndex + 1 >= users.length) {
            setShowEmptyState(false);
            setTimeout(() => {
              setShowEmptyState(true);
            }, 3000);
          }
        } else {
          // Match mais pas la dernière carte - comportement normal
          if (currentIndex + 1 >= users.length) {
            setTimeout(() => {
              showMessage({
                message: "C'est tout pour le moment !",
                description: "Vous avez vu tous les partenaires disponibles",
                type: "info",
              });
            }, 500);
          }
        }
      } else {
        // Pas de match - vérifier si c'était la dernière carte
        if (currentIndex + 1 >= users.length) {
          // Afficher l'écran vide immédiatement (pas de confettis)
          setShowEmptyState(true);
          setTimeout(() => {
            showMessage({
              message: "C'est tout pour le moment !",
              description: "Vous avez vu tous les partenaires disponibles",
              type: "info",
            });
          }, 500);
        }
      }
    } catch (error) {
      console.error("Erreur lors du traitement du swipe :", error);
      showMessage({
        message: "Erreur",
        description: "Impossible d'enregistrer votre choix",
        type: "danger",
      });
    }
  };

  if (loading) {
    return <PartnersSkeleton isDarkMode={isDarkMode} />;
  }

  if ((users.length === 0 || currentIndex >= users.length) && showEmptyState) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
        ]}
      >
        {/* Confettis lors d'un match - affichés AU-DESSUS de l'écran vide */}
        {confettiKey > 0 &&
          Array.from({ length: 100 }).map((_, index) => (
            <MatchConfetti key={`confetti-${confettiKey}-${index}`} index={index} />
          ))}

        {/* Bouton back custom */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Bouton filtres */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFiltersModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.backButtonGradient}
          >
            <Ionicons name="options-outline" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* FiltersModal */}
        <FiltersModal
          visible={showFiltersModal}
          onClose={() => setShowFiltersModal(false)}
          filters={filters}
          onApplyFilters={(newFilters) => {
            setFilters(newFilters);
          }}
        />

        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <LinearGradient
              colors={[`${COLORS.primary}20`, `${COLORS.primary}10`]}
              style={styles.emptyIconGradient}
            >
              <Ionicons name="people-outline" size={64} color={COLORS.primary} />
            </LinearGradient>
          </View>
          <Text
            style={[
              styles.emptyTitle,
              { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
            ]}
          >
            {i18n.t("aucun_partenaire_disponible")}
          </Text>
          <Text
            style={[
              styles.emptyDescription,
              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {i18n.t("pas_nouveaux_partenaires_zone")}
          </Text>
          <TouchableOpacity
            style={styles.reloadButton}
            onPress={() => setForceUpdate((prev) => !prev)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.reloadButtonGradient}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.reloadButtonText}>{i18n.t("actualiser")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
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
      {/* Icônes flottantes en arrière-plan */}
      {floatingIcons.map((icon, index) => (
        <FloatingIcon
          key={index}
          name={icon.name}
          duration={icon.duration}
          startX={icon.x}
          startY={icon.y}
        />
      ))}

      {/* Confettis lors d'un match */}
      {confettiKey > 0 &&
        Array.from({ length: 100 }).map((_, index) => (
          <MatchConfetti key={`confetti-${confettiKey}-${index}`} index={index} />
        ))}

      {/* Bouton back custom fixe */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.backButtonGradient}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Bouton filtres */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFiltersModal(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.backButtonGradient}
        >
          <Ionicons name="options-outline" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* FiltersModal */}
      <FiltersModal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        filters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
        }}
      />

      {/* Stack de cartes */}
      <View style={styles.cardsContainer}>
        {users.slice(currentIndex, currentIndex + 3).map((user, index) => (
          <SwipeableCard
            key={user.id}
            user={user}
            currentUser={currentUser}
            currentUserLocation={currentUserLocation}
            onSwipe={handleSwipe}
            index={index}
            isDarkMode={isDarkMode}
          />
        ))}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  floatingIcon: {
    position: "absolute",
    zIndex: 0,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 20,
    zIndex: 9999,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButtonGradient: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  filterButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  debugButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  debugButtonGradient: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  debugActiveDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#22c55e",
  },
  cardsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.68,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  swipeLabel: {
    position: "absolute",
    top: 50,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  swipeLabelLeft: {
    left: 30,
    backgroundColor: "#EF4444",
  },
  swipeLabelRight: {
    right: 30,
    backgroundColor: COLORS.primary,
  },
  swipeLabelText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  imageContainer: {
    width: "100%",
    height: "45%",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "30%",
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  nameSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  username: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#1F2937",
    flex: 1,
  },
  ageBadge: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ageText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.primary,
  },
  biography: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#6B7280",
  },
  interestsSection: {
    marginBottom: 16,
  },
  interestsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  interestsTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#374151",
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  interestChip: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  interestText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.primary,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  rejectButton: {
    borderRadius: 28,
    overflow: "hidden",
  },
  likeButton: {
    borderRadius: 28,
    overflow: "hidden",
  },
  actionButtonGradient: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  emptyState: {
    alignItems: "center",
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  reloadButton: {
    borderRadius: 24,
    overflow: "hidden",
  },
  reloadButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  reloadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  debugBadge: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  debugBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  debugBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});

export default Partners;
