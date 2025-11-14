import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "@react-native-firebase/firestore";
import { showMessage } from "react-native-flash-message";
import { Ionicons } from "@expo/vector-icons";
import sendNotifs from "../utils/sendNotifs";
import { auth, db } from "../../config/firebase";
import i18n from "../../i18n";
const Participants = ({ route }) => {
  const { activityId } = route.params; // ID de l'activité
  const [participants, setParticipants] = useState([]);
  const [creatorID, setCreatorID] = useState("");
  const [loading, setLoading] = useState(true);
  const [usernames, setUsernames] = useState({}); // Stocker les usernames
  const [pushTokens, setPushTokens] = useState({});

  // Charger les participants
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const activityDocRef = doc(db, "activities", activityId);
        const activityDocSnap = await getDoc(activityDocRef);

        if (activityDocSnap.exists()) {
          const data = activityDocSnap.data();
          setCreatorID(data.creatorId);
          setParticipants(data.participants || []);
          fetchUsernames(data.participants || []);
          fetchPushTokens(data.participants || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des participants :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [activityId]);

  const fetchUsernames = async (participants) => {
    try {
      const usernamesMap = {};
      for (const participant of participants) {
        const userDocSnap = await getDoc(doc(db, "users", participant.userId));
        if (userDocSnap.exists()) {
          usernamesMap[participant.userId] =
            userDocSnap.data().username || "Inconnu";
        }
      }
      setUsernames(usernamesMap);
    } catch (error) {
      console.error("Erreur lors du chargement des usernames :", error);
    }
  };

  const fetchPushTokens = async (participants) => {
    try {
      const tokensMap = {};
      for (const participant of participants) {
        const userDocSnap = await getDoc(doc(db, "users", participant.userId));
        if (userDocSnap.exists()) {
          tokensMap[participant.userId] =
            userDocSnap.data().expoPushToken || null;
        }
      }
      setPushTokens(tokensMap);
    } catch (error) {
      console.error("Erreur lors du chargement des tokens Expo Push :", error);
    }
  };

  const handleAcceptRequest = async (participant) => {
    try {
      const updatedParticipant = { ...participant, active: true };
      const activityDocRef = doc(db, "activities", activityId);

      await updateDoc(activityDocRef, {
        participants: arrayRemove(participant),
      });

      await updateDoc(activityDocRef, {
        participants: arrayUnion(updatedParticipant),
      });

      const message = {
        title: "Demande acceptée",
        desc: "Que l'aventure commence !",
      };
      const token = pushTokens[participant.userId];
      if (token) {
        sendNotifs({ expoPushToken: token }, message);
      }

      showMessage({
        message: "Demande acceptée avec succès.",
        type: "success",
      });

      setParticipants((prev) =>
        prev.map((p) =>
          p.userId === participant.userId ? updatedParticipant : p
        )
      );
    } catch (error) {
      console.error("Erreur lors de l'acceptation de la demande :", error);
    }
  };

  const handleRemoveParticipant = async (participant) => {
    try {
      const activityDocRef = doc(db, "activities", activityId);

      await updateDoc(activityDocRef, {
        participants: arrayRemove(participant),
      });

      const message = {
        title: "Fin de l'aventure",
        desc: "Quelqu'un a décidé de mettre fin à votre magnifique aventure",
      };
      const token = pushTokens[participant.userId];
      if (token) {
        sendNotifs({ expoPushToken: token }, message);
      }

      showMessage({
        message: "Participant supprimé avec succès.",
        type: "info",
      });

      setParticipants((prev) =>
        prev.filter((p) => p.userId !== participant.userId)
      );
    } catch (error) {
      console.error("Erreur lors de la suppression du participant :", error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <Text className="text-gray-500 dark:text-gray-400">
          {i18n.t("chargement")}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-4">
      {participants.length === 0 ? (
        <Text className="text-gray-500 dark:text-gray-400">
          {i18n.t("aucun_participant_trouve")}
        </Text>
      ) : (
        <FlatList
          data={participants}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <View className="flex-row justify-between items-center py-4 px-4 bg-gray-50 dark:bg-gray-800 rounded mb-3">
              {/* Informations utilisateur */}
              <View>
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  {usernames[item.userId] || "Inconnu"}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {item.active ? "Actif" : "En attente"}
                </Text>
              </View>

              {/* Actions */}
              <View className="flex-row space-x-3">
                {/* Bouton Accepter */}
                {!item.active && auth.currentUser.uid === creatorID && (
                  <TouchableOpacity
                    onPress={() => handleAcceptRequest(item)}
                    className="bg-green-500 p-2 rounded-full  active:opacity-80"
                  >
                    <Ionicons
                      name="checkmark-outline"
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                )}

                {/* Bouton Refuser/Supprimer */}
                {auth.currentUser.uid === creatorID && (
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        "Supprimer le participant",
                        "Êtes-vous sûr de vouloir supprimer ce participant ?",
                        [
                          { text: "Annuler", style: "cancel" },
                          {
                            text: "Supprimer",
                            onPress: () => handleRemoveParticipant(item),
                            style: "destructive",
                          },
                        ]
                      )
                    }
                    className="bg-red-500 ml-2 p-2 rounded-full  active:opacity-80"
                  >
                    <Ionicons name="close-outline" size={24} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default Participants;
