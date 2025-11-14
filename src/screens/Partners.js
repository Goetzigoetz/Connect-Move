import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import Swiper from "react-native-deck-swiper";
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
} from "@react-native-firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import sendNotifs from "../utils/sendNotifs";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import i18n from "../../i18n";
import { COLORS } from "../styles/colors";

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

const Partners = ({ navigation }) => {
  const height = Dimensions.get("window").height;
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [pageTitle, setPageTitle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(10); // Rayon en kilomètres
  const [showFilterModal, setShowFilterModal] = useState(false);
  const swiperRef = useRef(null);
  const [forceUpdate, setForceUpdate] = useState(false); // Ajout d'un état pour forcer le re-render

  // Ajouter une icône de filtre dans le header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Trouver des partenaires",
      // headerRight: () => (
      //   <TouchableOpacity
      //     onPress={() => navigation.navigate("Friends")}
      //     className="flex items-center justify-center rounded-full  mr-2"
      //   >
      //     <Text
      //       style={{ fontFamily: "Inter_500Medium" }}
      //       className="text-lg text-red-500"
      //     >
      //       bloquer
      //     </Text>
      //   </TouchableOpacity>
      // ),
    });
  }, [navigation, pageTitle]);

  const fetchUsers = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUserId(currentUser.uid);

        // Récupérer les données de l'utilisateur connecté
        const currentUserDocRef = doc(db, "users", currentUser.uid);
        const currentUserDocSnap = await getDoc(currentUserDocRef);

        if (currentUserDocSnap.exists()) {
          const currentUserData = currentUserDocSnap.data();
          setCurrentUser(currentUserData);
          setCurrentUserLocation(currentUserData.location);
        }

        // Récupérer les IDs des utilisateurs déjà swipés
        const swipesQuery = query(
          collection(db, "swipes"),
          where("swiperId", "==", currentUser.uid)
        );
        const swipesSnapshot = await getDocs(swipesQuery);
        const swipedUserIds = swipesSnapshot.docs.map(
          (doc) => doc.data().swipedId
        );

        // Récupérer les utilisateurs avec showMyProfile:true
        const usersQuery = query(
          collection(db, "users"),
          where("showMyProfile", "==", true)
        );
        const usersSnapshot = await getDocs(usersQuery);

        const filteredUsers = usersSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (user) =>
              user.id !== currentUser.uid &&
              !swipedUserIds.includes(user.id) &&
              user.username &&
              user.location?.address &&
              user.photoURL
          );

        setUsers(filteredUsers);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs :", error);
    } finally {
      setLoading(false);
    }
  }, [userId, radius, forceUpdate]);

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [fetchUsers])
  );

  const toggleModal = () => {
    setShowFilterModal(!showFilterModal);
  };

  const getCommonInterests = (currentUserInterests, otherUserInterests) => {
    return currentUserInterests.filter((interest) =>
      otherUserInterests.includes(interest)
    );
  };

  const handleSwipe = async (swipedUser, direction) => {
    try {
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

      fetchUsers();

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
          // Ajouter un match et un salon
          const currentUserDocRef = doc(db, "users", userId);
          const currentUserDocSnap = await getDoc(currentUserDocRef);
          const currentUserData = currentUserDocSnap.data();

          const commonInterests = getCommonInterests(
            currentUserData.interests || [],
            swipedUser.interests || []
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

          const messageNotif = {
            title: `Match`,
            desc: `Vous avez matché avec quelqu'un`,
            type: `match`,
          };
          sendNotifs(currentUserData, messageNotif);
          sendNotifs(swipedUser, messageNotif);

          showMessage({
            message: "Match",
            type: "success",
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors du traitement du swipe :", error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View className="flex-1 p-10 justify-center items-center bg-gray-100 dark:bg-gray-900">
        <Text
          style={{ fontFamily: "Inter_500Medium" }}
          className="text-gray-400 text-center text-lg"
        >
          {i18n.t("aucun_partenaire_disponible_pour_le_moment")}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setForceUpdate((prev) => !prev); // Force le re-render et donc le fetchUsers
          }}
          className="mt-4 bg-blue-500 px-4 py-2 rounded"
        >
          <Text
            style={{ fontFamily: "Inter_500Medium" }}
            className="text-white"
          >
            {i18n.t("recharger")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="bg-gray-100 dark:bg-gray-900">
      <Swiper
        ref={swiperRef}
        cards={users}
        renderCard={(user) => {
          const commonInterests = currentUser
            ? getCommonInterests(
                user?.interests || [],
                currentUser?.interests || []
              )
            : [];
          const distance =
            currentUserLocation && user?.location
              ? calculateDistance(
                  currentUserLocation.latitude,
                  currentUserLocation.longitude,
                  user?.location?.latitude,
                  user?.location?.longitude
                ).toFixed(1)
              : null;

          return (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              key={user.id}
              className="relative bg-white dark:bg-gray-800"
            >
              <View style={{ height: height }} className="relative">
                <Animated.View entering={FadeIn.duration(400)}>
                  <Image
                    style={{ width: "100%", height: "80%" }}
                    source={user.photoURL}
                    contentFit="cover"
                  />
                  <BlurView
                    className="rounded"
                    intensity={60}
                    tint="dark"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: 16,
                      borderRadius: 24,
                      margin: 10,
                    }}
                  >
                    <Text
                      style={{ fontFamily: "Inter_500Medium" }}
                      className="text-3xl text-white"
                    >
                      {`@${user?.username}`}
                    </Text>
                    <View>
                      <Text
                        style={{ fontFamily: "Inter_500Medium" }}
                        className="text-gray-200 text-lg mt-2"
                      >
                        {user?.biography || ""}
                      </Text>
                      {distance && (
                        <Text
                          style={{ fontFamily: "Inter_500Medium" }}
                          className="text-lg text-white"
                        >
                          à {`${distance} km de votre position`}
                        </Text>
                      )}
                      {commonInterests?.length > 0 && (
                        <View className="mb-4">
                          <Text
                            style={{ fontFamily: "Inter_500Medium" }}
                            className=" text-xl mb-2 text-white"
                          >
                            {i18n.t("interets_communs:")}
                          </Text>
                          <View className="flex-row flex-wrap">
                            {commonInterests?.map((interest, index) => (
                              <View
                                key={index}
                                className="bg-blue-600 mr-3 px-4 py-2 rounded-full"
                              >
                                <Text
                                  style={{ fontFamily: "Inter_500Medium" }}
                                  className="text-white"
                                >
                                  {interest}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                    <View className="flex-row justify-between">
                      <TouchableOpacity
                        className="bg-red-500 rounded-full p-4 w-16 h-16 justify-center items-center"
                        onPress={() => handleSwipe(user, "left")}
                      >
                        <Ionicons name="close" size={26} color={COLORS.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-green-500 rounded-full p-4 w-16 h-16 justify-center items-center"
                        onPress={() => handleSwipe(user, "right")}
                      >
                        <Ionicons name="heart" size={26} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  </BlurView>
                </Animated.View>
              </View>
            </Animated.View>
          );
        }}
        onSwipedLeft={(cardIndex) => handleSwipe(users[cardIndex], "left")}
        onSwipedRight={(cardIndex) => handleSwipe(users[cardIndex], "right")}
        onSwipedAll={() => {
          console.log("Plus de cartes à afficher !");
          setForceUpdate((prev) => !prev); // Force le re-render et donc le fetchUsers
        }}
        cardIndex={0}
        backgroundColor="transparent"
        stackSize={1}
        cardVerticalMargin={0}
        cardHorizontalMargin={0}
        disableBottomSwipe
        disableTopSwipe
        disableLeftSwipe
        disableRightSwipe
        overlayOpacityHorizontalThreshold={0.5}
        overlayOpacityVerticalThreshold={1}
        animateCardOpacity
        animateOverlayLabels
        containerStyle={{ flex: 1 }}
        cardStyle={{ flex: 1 }}
      />
    </View>
  );
};

export default Partners;
