import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  Image,
  Alert,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  Linking,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  limit,
  orderBy,
  updateDoc,
} from "@react-native-firebase/firestore";
import Animated, { FadeIn, FadeInLeft } from "react-native-reanimated";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { showMessage } from "react-native-flash-message";
import moment from "moment";
import ImageSlider from "../components/ImageSlider";
import { getFormattedDate } from "../utils/allFunctions";
import { COLORS } from "../styles/colors";
import MapView, { Circle } from "react-native-maps";
import i18n from "../../i18n";
import sendNotifs from "../utils/sendNotifs";

const ActivityDetails = ({ route, userinfo }) => {
  const navigation = useNavigation();
  const { activityId, image, distance, userPostalCode } = route.params;
  const [images, setImages] = useState(null);
  const [activity, setActivity] = useState(null);
  const [messages, setMessages] = useState(null);
  const [userId, setUserId] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [coordinates, setCoordinates] = useState([]);

  useEffect(() => {
    //
  }, [coordinates]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
      headerTitle: "Détails",
      headerRight: () =>
        auth.currentUser && (
          <Pressable
            onPress={handleSaved}
            className="flex items-center justify-center rounded-full  mr-2"
          >
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-base text-blue-500 dark:text-gray-400"
            >
              {saved ? "Supprimer" : "Enregistrer"}
            </Text>
          </Pressable>
        ),
    });
  }, [navigation, activity, isUserParticipant, isActiveParticipant, saved]);

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
    }, [activityId])
  );

  const fetchActivityDetails = async () => {
    try {
      const activityDoc = await getDoc(doc(db, "activities", activityId));

      if (activityDoc.exists()) {
        let activityData = activityDoc.data();
        setImages(activityData.images || []);

        if (!activityData.participants) {
          activityData.participants = [];
        }

        setActivity(activityData);
        setCoordinates({
          ...activityData.coordinates,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });

        const adminParticipant = activityData.creatorId;

        if (adminParticipant) {
          const adminDoc = await getDoc(doc(db, "users", adminParticipant));
          if (adminDoc.exists()) {
            setAdminUser({ id: adminDoc.id, ...adminDoc.data() });
          } else {
            console.log("Admin user not found.");
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
          const conversationData = {
            id: conversationDoc.id,
            ...conversationDoc.data(),
          };

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
        } else {
          console.log("Aucune conversation trouvée pour cette activité.");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'activité :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinActivity = async () => {
    try {
      const newParticipant = {
        userId,
        active: false,
        here: false,
        joinedAt: moment().format(),
      };

      await updateDoc(doc(db, "activities", activityId), {
        participants: arrayUnion(newParticipant),
      });

      const messageToAdmin = {
        title: `${activity.title}`,
        desc: `Vous avez une nouvelle demande`,
        type: `join_demands`,
      };

      sendNotifs(adminUser, messageToAdmin);
      showMessage({
        message:
          "Nous vous tiendrons informé dès que l'admin aura validé votre demande.",
        type: "success",
      });

      fetchActivityDetails();
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande :", error);
      showMessage({
        message: "Impossible d'envoyer votre demande. Veuillez réessayer.",
        type: "danger",
      });
    }

    const messageToCreator = {
      title: `${activity.title}`,
      desc: `Vous avez une nouvelle demande`,
      type: `join_demands`,
    };

    navigation.navigate("Step6", {
      activityId,
      messageToCreator,
      adminUser,
      userinfo,
      activity,
      images,
    });
  };

  const handleLeaveActivity = async () => {
    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir quitter cette activité ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              const participantToRemove = activity.participants.find(
                (participant) => participant.userId === userId
              );

              if (!participantToRemove) {
                showMessage({
                  message: "Vous n'êtes pas participant à cette activité.",
                  type: "danger",
                });
                return;
              }

              await updateDoc(doc(db, "activities", activityId), {
                participants: arrayRemove(participantToRemove),
              });

              showMessage({
                message: "Vous avez quitté l'activité.",
                type: "info",
              });

              fetchActivityDetails();
            } catch (error) {
              console.error("Erreur lors de la sortie de l'activité :", error);
              showMessage({
                message:
                  "Impossible de quitter l'activité. Veuillez réessayer.",
                type: "info",
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleDeleteActivity = async () => {
    try {
      await doc(db, "activities", activityId).delete();

      const conversationsSnapshot = await getDocs(
        query(
          collection(db, "conversations"),
          where("activityId", "==", activityId)
        )
      );

      const batch = db.batch();

      const deleteMessagesInConversation = async (conversationId) => {
        const messagesRef = collection(db, "messages");
        let hasNextPage = true;

        while (hasNextPage) {
          const messagesSnapshot = await getDocs(
            query(
              messagesRef,
              where("conversationId", "==", conversationId),
              limit(500)
            )
          );

          if (!messagesSnapshot.empty) {
            const batchDelete = db.batch();
            messagesSnapshot.forEach((messageDoc) => {
              batchDelete.delete(messageDoc.ref);
            });
            await batchDelete.commit();
          }

          hasNextPage = !messagesSnapshot.empty;
        }
      };

      for (const conversationDoc of conversationsSnapshot.docs) {
        const conversationId = conversationDoc.id;

        await deleteMessagesInConversation(conversationId);

        batch.delete(conversationDoc.ref);
      }

      await batch.commit();

      showMessage({
        message:
          "Cet événement et toutes ses discussions ont bien été supprimés.",
        type: "info",
      });

      navigation.goBack();
    } catch (error) {
      console.error("Erreur lors de la suppression de l'activité :", error);
      showMessage({
        message: "Impossible de supprimer l'événement. Veuillez réessayer.",
        type: "danger",
      });
    }
  };

  const handleReport = () => {
    navigation.navigate("ReportReasonScreen", { activityId });
  };

  const handleOpenMaps = () => {
    const { latitude, longitude } = coordinates;
    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${latitude},${longitude}`,
      android: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });

    Linking.openURL(url).catch((err) =>
      console.error("Erreur d'ouverture:", err)
    );
  };

  const isUserParticipant = activity?.participants?.some(
    (participant) => participant.userId === userId
  );

  const isActiveParticipant = activity?.participants?.some(
    (participant) => participant.userId === userId && participant.active
  );

  const isAdmin = activity?.participants?.[0]?.userId === userId;

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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={COLORS.primary} size={"small"} />
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {images && <ImageSlider images={images} />}
        <View style={{ marginTop: -40 }} className="px-7">
          <Animated.View
            entering={FadeInLeft.delay(400).duration(400)}
            className="flex-1"
          >
            <Image
              source={
                adminUser?.photoURL
                  ? { uri: adminUser?.photoURL }
                  : require("../../assets/img/user.png")
              }
              className="w-20 h-20 rounded-full"
            />
          </Animated.View>

          <View>
            <View className="flex-row items-center justify-between">
              <Text
                className="flex-1 text-xl mt-2 text-gray-900 dark:text-white"
                style={{ fontFamily: "Inter_500Medium" }}
              >
                @{adminUser?.username}
              </Text>

              {/* Badge Nouveauté */}
              {adminUser?.sub == "pro" ? (
                <View className="transform -rotate-10 bg-green-500 px-2 py-1 rounded-full">
                  <Text
                    style={{ fontFamily: "Inter_500Medium" }}
                    className="text-xs text-white tracking-wider"
                  >
                    {i18n.t("entreprise")}
                  </Text>
                </View>
              ) : (
                <View className="transform -rotate-10 bg-blue-500 px-2 py-1 rounded-full">
                  <Text
                    style={{ fontFamily: "Inter_500Medium" }}
                    className="text-xs text-white tracking-wider"
                  >
                    {i18n.t("particulier")}
                  </Text>
                </View>
              )}
            </View>

            <Text
              className="text-base mt-2 text-gray-500 dark:text-white"
              style={{ fontFamily: "Inter_500Medium" }}
            >
              {adminUser?.biography}
            </Text>
            <Text
              className="text-sm text-gray-400 dark:text-gray-300"
              style={{ fontFamily: "Inter_400Regular" }}
            >
              Membre depuis le{" "}
              {moment(adminUser?.createdAt).format("DD/MM/YYYY")}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex-row py-4 px-6"
        >
          {isAdmin && (
            <Pressable
              className="m-2 flex-row items-center justify-center bg-teal-500 px-4 py-2 rounded-full"
              onPress={() =>
                navigation.navigate("Participants", { activityId })
              }
            >
              <Text
                className="text-white text-sm "
                style={{ fontFamily: "Inter_500Medium" }}
              >
                {i18n.t("liste_des_participants")}
              </Text>
            </Pressable>
          )}

          {auth?.currentUser && isUserParticipant && isActiveParticipant && (
            <Pressable
              className="m-2 flex-row items-center justify-center bg-blue-500 px-4 py-2 rounded-full"
              onPress={() => navigation.navigate("Conversations")}
            >
              <Text
                className="text-white text-sm "
                style={{ fontFamily: "Inter_500Medium" }}
              >
                {i18n.t("acceder_a_la_conversation")}
              </Text>
            </Pressable>
          )}

          {auth?.currentUser &&
            !isUserParticipant &&
            activity.participants.length !== activity.maxParticipants && (
              <Pressable
                className="m-2 flex-row items-center justify-center bg-blue-600 px-4 py-2 rounded-full"
                onPress={handleJoinActivity}
              >
                <Text
                  className="text-white text-sm "
                  style={{ fontFamily: "Inter_500Medium" }}
                >
                  Rejoindre l'évènement{": "}
                  {activity?.price && Number(activity?.price) > 0
                    ? Number(activity?.price) + " €"
                    : "gratuit"}
                </Text>
              </Pressable>
            )}

          {auth?.currentUser && isUserParticipant && !isActiveParticipant && (
            <Pressable
              className="m-2 flex-row items-center justify-center bg-yellow-500 px-4 py-2 rounded-full"
              onPress={handleLeaveActivity}
            >
              <Text
                className="text-white text-sm "
                style={{ fontFamily: "Inter_500Medium" }}
              >
                {i18n.t("en_attente_de_validation")}
              </Text>
            </Pressable>
          )}

          {auth?.currentUser &&
            isUserParticipant &&
            isActiveParticipant &&
            !isAdmin && (
              <Pressable
                className="m-2 flex-row items-center justify-center bg-red-500 px-4 py-2 rounded-full"
                onPress={handleLeaveActivity}
              >
                <Text
                  className="text-white text-sm "
                  style={{ fontFamily: "Inter_500Medium" }}
                >
                  {i18n.t("quitter_lactivite")}
                </Text>
              </Pressable>
            )}

          {!auth?.currentUser && (
            <View className="">
              <Pressable
                onPress={() => navigation.navigate("SignInScreen")}
                className="m-2 w-full bg-gray-200 py-2 px-3 rounded-full"
              >
                <Text
                  className="text-gray-700 text-sm text-center"
                  style={{ fontFamily: "Inter_500Medium" }}
                >
                  {i18n.t(
                    "connectez_vous_pour_pouvoir_rejoindre_cet_evenement"
                  )}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
        {/* container global */}
        <View className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
          {/* Header: Titre et sous-titre */}
          <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <Text
              className="text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-tight"
              style={{ fontFamily: "Inter_400Regular" }}
            >
              {activity.title}
            </Text>
            <View className="flex items-center mt-1">
              <Ionicons name="location-outline" size={16} color="#A1A1AA" />
              <Text
                style={{ fontFamily: "Inter_500Medium" }}
                className="ml-1 text-sm text-gray-500 dark:text-gray-400"
              >
                {activity.location}
              </Text>
            </View>
          </View>

          {/* Section: Détails des participants */}
          <View className="px-6 py-4">
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-gray-700 dark:text-gray-200 mb-2"
            >
              Participants :{" "}
              <Text className="font-semibold">
                {activity.participants.length}/{activity.maxParticipants}
              </Text>
            </Text>
            <View className="flex items-center space-x-2 mb-2">
              <Ionicons name="calendar-outline" size={16} color="#A1A1AA" />
              <Text
                style={{ fontFamily: "Inter_500Medium" }}
                className="ml-1 text-sm text-gray-500 dark:text-gray-400"
              >
                {getFormattedDate(activity.date)}
              </Text>
            </View>
            <View className="flex items-center space-x-2">
              <Ionicons name="time-outline" size={16} color="#A1A1AA" />
              <Text
                style={{ fontFamily: "Inter_500Medium" }}
                className="ml-1 text-sm text-gray-500 dark:text-gray-400"
              >
                {activity.time}
              </Text>
            </View>
          </View>

          {/* Section: Carte */}
          <View className="px-6 py-4">
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-gray-700 dark:text-gray-200 mb-2"
            >
              {i18n.t("carte")}
            </Text>
            <Pressable
              onPress={handleOpenMaps}
              className="rounded overflow-hidden"
            >
              <MapView
                pointerEvents="none"
                style={{ width: "100%", height: 200 }}
                region={coordinates}
              >
                <Circle
                  center={coordinates}
                  radius={4000}
                  strokeWidth={2}
                  strokeColor="rgba(0,0,255,0.5)"
                  fillColor="rgba(0,0,255,0.1)"
                />
              </MapView>
            </Pressable>
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-center mt-2 text-sm text-gray-500 dark:text-gray-400"
            >
              {distance && userPostalCode
                ? `${distance} en voiture depuis ${userPostalCode}`
                : ""}
            </Text>
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity
        className="absolute right-4 bottom-0 w-16 h-16 rounded-full"
        onPress={handleReport} // ta fonction pour ouvrir un modal ou naviguer
        accessibilityRole="button"
        accessibilityLabel="Signaler ce profil"
        accessibilityHint="Appuyez pour signaler ce profil à la modération"
        style={{
          marginLeft: 10,
          padding: 6,
          backgroundColor: "#F87171", // rouge clair
          justifyContent: "center",
          alignItems: "center",
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="flag-outline" size={20} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const Badge = ({ label }) => (
  <View className="bg-green-100 dark:bg-green-600 rounded-full px-3 py-1">
    <Text className="text-green-700 dark:text-green-100 text-xs">{label}</Text>
  </View>
);

export default ActivityDetails;
