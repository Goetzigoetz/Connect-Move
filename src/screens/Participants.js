import React, { useState, useCallback } from "react";
import { useThemeContext } from "../ThemeProvider";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  runTransaction,
} from "@react-native-firebase/firestore";
import { showMessage } from "react-native-flash-message";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useFocusEffect } from "@react-navigation/native";
import sendNotifs from "../utils/sendNotifs";
import { auth, db } from "../../config/firebase";
import { COLORS } from "../styles/colors";
import i18n from "../../i18n";

const Participants = ({ route }) => {
  const { isDarkMode } = useThemeContext();
  const { activityId } = route?.params || {};
  const [participants, setParticipants] = useState([]);
  const [creatorID, setCreatorID] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usernames, setUsernames] = useState({});
  const [pushTokens, setPushTokens] = useState({});

  const fetchUsernames = async (participants) => {
    try {
      const usernamesMap = {};
      for (const participant of participants) {
        const userDocSnap = await getDoc(doc(db, "users", participant.userId));
        if (userDocSnap.exists()) {
          usernamesMap[participant.userId] =
            userDocSnap.data().username || i18n.t("inconnu");
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

  const fetchParticipants = useCallback(async () => {
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
      setRefreshing(false);
    }
  }, [activityId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchParticipants();
    }, [fetchParticipants])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchParticipants();
  }, [fetchParticipants]);

  const handleAcceptRequest = async (participant) => {
    try {
      const activityDocRef = doc(db, "activities", activityId);

      // Utiliser une transaction pour atomicité et vérification du créateur
      await runTransaction(db, async (transaction) => {
        const activitySnapshot = await transaction.get(activityDocRef);

        if (!activitySnapshot.exists()) {
          throw new Error("L'activité n'existe plus.");
        }

        const activityData = activitySnapshot.data();

        // Vérifier que l'utilisateur actuel est bien le créateur
        if (activityData.creatorId !== auth.currentUser?.uid) {
          throw new Error("Seul le créateur peut accepter les demandes.");
        }

        const currentParticipants = activityData.participants || [];

        // Vérifier que le nombre max n'est pas atteint
        const activeCount = currentParticipants.filter((p) => p.active === true).length;
        if (activeCount >= activityData.maxParticipants) {
          throw new Error("Le nombre maximum de participants est atteint.");
        }

        // Mettre à jour le participant (retirer l'ancien, ajouter le nouveau)
        const updatedParticipants = currentParticipants.map((p) =>
          p.userId === participant.userId ? { ...p, active: true } : p
        );

        transaction.update(activityDocRef, {
          participants: updatedParticipants,
        });
      });

      const updatedParticipant = { ...participant, active: true };

      const message = {
        title: i18n.t("demande_acceptee"),
        desc: i18n.t("que_laventure_commence"),
        type: "join_demands",
      };
      const token = pushTokens[participant.userId] || null;
      await sendNotifs({ id: participant.userId, expoPushToken: token }, message);

      showMessage({
        message: i18n.t("demande_acceptee_avec_succes"),
        type: "success",
      });

      setParticipants((prev) =>
        prev.map((p) =>
          p.userId === participant.userId ? updatedParticipant : p
        )
      );
    } catch (error) {
      console.error("Erreur lors de l'acceptation de la demande :", error);
      showMessage({
        message: error.message || "Erreur lors de l'acceptation.",
        type: "danger",
      });
    }
  };

  const handleRemoveParticipant = async (participant) => {
    try {
      const activityDocRef = doc(db, "activities", activityId);

      // Utiliser une transaction pour vérifier les permissions
      await runTransaction(db, async (transaction) => {
        const activitySnapshot = await transaction.get(activityDocRef);

        if (!activitySnapshot.exists()) {
          throw new Error("L'activité n'existe plus.");
        }

        const activityData = activitySnapshot.data();

        // Vérifier que l'utilisateur actuel est bien le créateur
        if (activityData.creatorId !== auth.currentUser?.uid) {
          throw new Error("Seul le créateur peut supprimer des participants.");
        }

        // Empêcher la suppression du créateur lui-même
        if (participant.userId === activityData.creatorId) {
          throw new Error("Le créateur ne peut pas être supprimé.");
        }

        const currentParticipants = activityData.participants || [];
        const updatedParticipants = currentParticipants.filter(
          (p) => p.userId !== participant.userId
        );

        transaction.update(activityDocRef, {
          participants: updatedParticipants,
        });
      });

      const message = {
        title: i18n.t("fin_de_laventure"),
        desc: i18n.t("quelquun_a_decide_de_mettre_fin"),
        type: "join_demands",
      };
      const token = pushTokens[participant.userId] || null;
      await sendNotifs({ id: participant.userId, expoPushToken: token }, message);

      showMessage({
        message: i18n.t("participant_supprime_avec_succes"),
        type: "info",
      });

      setParticipants((prev) =>
        prev.filter((p) => p.userId !== participant.userId)
      );
    } catch (error) {
      console.error("Erreur lors de la suppression du participant :", error);
      showMessage({
        message: error.message || "Erreur lors de la suppression.",
        type: "danger",
      });
    }
  };

  const renderParticipant = useCallback(
    ({ item, index }) => {
      const isCreator = auth.currentUser.uid === creatorID;
      const isPending = !item.active;
      const isParticipantCreator = item.userId === creatorID;

      return (
        <Animated.View
          entering={FadeInDown.duration(400).delay(index * 50)}
          style={styles.participantWrapper}
        >
          <View
            style={[
              styles.participantCard,
              {
                backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                borderColor: isPending
                  ? isDarkMode
                    ? "#F59E0B"
                    : "#FCD34D"
                  : isDarkMode
                  ? "#27272A"
                  : "#E5E7EB",
                borderWidth: isPending ? 2 : 1,
              },
            ]}
          >
            {/* User icon et info */}
            <View style={styles.userInfoContainer}>
              <View
                style={[
                  styles.avatarContainer,
                  {
                    backgroundColor: isPending
                      ? "#F59E0B20"
                      : isDarkMode
                      ? "#18181B"
                      : "#F3F4F6",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="account"
                  size={28}
                  color={
                    isPending
                      ? "#F59E0B"
                      : isDarkMode
                      ? "#52525B"
                      : "#9CA3AF"
                  }
                />
              </View>

              <View style={styles.userDetails}>
                <Text
                  style={[
                    styles.username,
                    { color: isDarkMode ? "#FAFAFA" : "#18181B" },
                  ]}
                  numberOfLines={1}
                >
                  {usernames[item.userId] || i18n.t("inconnu")}
                </Text>
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isPending ? "#F59E0B" : "#10B981",
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: isPending
                          ? "#F59E0B"
                          : isDarkMode
                          ? "#10B981"
                          : "#059669",
                      },
                    ]}
                  >
                    {isPending ? i18n.t("en_attente") : i18n.t("actif")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions buttons */}
            {isCreator && !isParticipantCreator && (
              <View style={styles.actionsContainer}>
                {isPending && (
                  <TouchableOpacity
                    onPress={() => handleAcceptRequest(item)}
                    style={styles.acceptButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      i18n.t("supprimer_le_participant"),
                      i18n.t("etes_vous_sur_de_vouloir_supprimer_ce_participant"),
                      [
                        { text: i18n.t("annuler"), style: "cancel" },
                        {
                          text: i18n.t("supprimer"),
                          onPress: () => handleRemoveParticipant(item),
                          style: "destructive",
                        },
                      ]
                    )
                  }
                  style={[
                    styles.removeButton,
                    isPending && { marginLeft: 8 },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      );
    },
    [isDarkMode, creatorID, usernames]
  );

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text
          style={[
            styles.loadingText,
            { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
          ]}
        >
          {i18n.t("chargement")}
        </Text>
      </View>
    );
  }

  const activeParticipants = participants.filter((p) => p.active);
  const pendingParticipants = participants.filter((p) => !p.active);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
      ]}
    >
      {/* Header avec compteurs */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          styles.statsHeader,
          {
            backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
            borderBottomColor: isDarkMode ? "#1F1F1F" : "#F3F4F6",
          },
        ]}
      >
        <View style={styles.statsContent}>
          <Text
            style={[
              styles.statsCount,
              { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
            ]}
          >
            {participants.length}
          </Text>
          <Text
            style={[
              styles.statsLabel,
              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {participants.length === 0 || participants.length > 1
              ? i18n.t("participants")
              : i18n.t("participant")}
          </Text>
        </View>

        {/* Stats secondaires */}
        {(activeParticipants.length > 0 || pendingParticipants.length > 0) && (
          <View style={styles.secondaryStats}>
            <View style={styles.statChip}>
              <View style={[styles.statDot, { backgroundColor: "#10B981" }]} />
              <Text
                style={[
                  styles.statChipText,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {activeParticipants.length} {i18n.t("actifs")}
              </Text>
            </View>
            {pendingParticipants.length > 0 && (
              <View style={styles.statChip}>
                <View
                  style={[styles.statDot, { backgroundColor: "#F59E0B" }]}
                />
                <Text
                  style={[
                    styles.statChipText,
                    { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  {pendingParticipants.length} {i18n.t("en_attente")}
                </Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>

      <FlatList
        data={participants}
        keyExtractor={(item) => item.userId}
        renderItem={renderParticipant}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.emptyState}
            >
              <View style={styles.emptyIconContainer}>
                <View
                  style={[
                    styles.emptyIconGradient,
                    {
                      backgroundColor: isDarkMode
                        ? `${COLORS.primary}20`
                        : `${COLORS.primary}10`,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={48}
                    color={COLORS.primary}
                  />
                </View>
              </View>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {i18n.t("aucun_participant")}
              </Text>
              <Text
                style={[
                  styles.emptyDescription,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {i18n.t("aucun_participant_trouve")}
              </Text>
            </Animated.View>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  statsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  statsContent: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 12,
  },
  statsCount: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  statsLabel: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  secondaryStats: {
    flexDirection: "row",
    gap: 12,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  participantWrapper: {
    marginBottom: 0,
  },
  participantCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  actionsContainer: {
    flexDirection: "row",
  },
  acceptButton: {
    backgroundColor: "#10B981",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButton: {
    backgroundColor: "#EF4444",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});

export default Participants;
