import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, updateDoc, arrayRemove } from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "../ThemeProvider";
import { showMessage } from "react-native-flash-message";
import { Image } from "expo-image";
import { COLORS } from "../styles/colors";
import sendNotifs from "../utils/sendNotifs";

const MyEvents = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const user = auth.currentUser;

  const fetchUserActivities = useCallback(async () => {
    try {
      // Récupérer les événements créés par l'utilisateur
      const createdSnapshot = await getDocs(
        query(
          collection(db, "activities"),
          where("creatorId", "==", user.uid)
        )
      );

      const createdActivities = createdSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isCreator: true,
      }));

      // Récupérer les événements où l'utilisateur est participant
      const participatingSnapshot = await getDocs(
        query(
          collection(db, "activities"),
          where("participants", "array-contains", { odooUserId: user.uid, odooPartnerId: user.uid, odooSaleOrderId: user.uid, active: true })
        )
      );

      // Alternative: récupérer tous les événements et filtrer côté client
      const allActivitiesSnapshot = await getDocs(collection(db, "activities"));

      const participatingActivities = allActivitiesSnapshot.docs
        .filter((doc) => {
          const data = doc.data();
          // Vérifier si l'utilisateur est participant actif mais pas le créateur
          const isParticipant = data.participants?.some(
            (p) => p.odooUserId === user.uid && p.active === true
          );
          const isNotCreator = data.creatorId !== user.uid;
          return isParticipant && isNotCreator;
        })
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          isCreator: false,
        }));

      // Combiner et dédupliquer les résultats
      const allActivities = [...createdActivities, ...participatingActivities];

      setActivities(allActivities);
    } catch (error) {
      console.error("Erreur lors de la récupération des évènements :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.uid]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchUserActivities();
    }, [fetchUserActivities])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserActivities();
  }, [fetchUserActivities]);

  const onDelete = async (activityId) => {
    try {
      // Demander confirmation avant de supprimer
      const confirmDelete = await new Promise((resolve) => {
        Alert.alert(
          t("confirmation"),
          t("etes_vous_sur_supprimer_evenement"),
          [
            { text: t("annuler"), onPress: () => resolve(false), style: "cancel" },
            { text: t("supprimer"), onPress: () => resolve(true) },
          ]
        );
      });

      if (!confirmDelete) return;

      const activityRef = doc(db, "activities", activityId);

      // Vérifier que l'utilisateur est bien le créateur avant de supprimer
      const activitySnapshot = await getDoc(activityRef);

      if (!activitySnapshot.exists()) {
        throw new Error(t("activite_nexiste_plus"));
      }

      const activityData = activitySnapshot.data();

      if (activityData.creatorId !== auth.currentUser?.uid) {
        throw new Error(t("non_autorise_supprimer_evenement"));
      }

      await deleteDoc(activityRef);

      // Mettre à jour l'état local
      setActivities((prevActivities) =>
        prevActivities.filter((activity) => activity.id !== activityId)
      );

      showMessage({
        message: t("evenement_supprime_succes"),
        type: "success",
      });
    } catch (error) {
      showMessage({
        message: `${t("erreur")}: ${error.message}`,
        type: "danger",
      });
    }
  };

  const onLeave = async (activityId) => {
    try {
      // Demander confirmation avant de quitter
      const confirmLeave = await new Promise((resolve) => {
        Alert.alert(
          t("confirmation"),
          t("etes_vous_sur_quitter_evenement"),
          [
            { text: t("annuler"), onPress: () => resolve(false), style: "cancel" },
            { text: t("quitter"), onPress: () => resolve(true) },
          ]
        );
      });

      if (!confirmLeave) return;

      const activityRef = doc(db, "activities", activityId);
      const activitySnapshot = await getDoc(activityRef);

      if (!activitySnapshot.exists()) {
        throw new Error(t("activite_nexiste_plus"));
      }

      const activityData = activitySnapshot.data();

      // Trouver le participant à supprimer
      const participantToRemove = activityData.participants?.find(
        (p) => p.odooUserId === user.uid || p.userId === user.uid
      );

      if (participantToRemove) {
        // Supprimer complètement le participant (comme dans ActivityDetails)
        await updateDoc(activityRef, {
          participants: arrayRemove(participantToRemove),
        });

        // Notifier le créateur qu'un participant a quitté
        if (activityData.creatorId && activityData.creatorId !== user.uid) {
          try {
            const creatorDoc = await getDoc(doc(db, "users", activityData.creatorId));
            if (creatorDoc.exists()) {
              const creatorData = { id: creatorDoc.id, ...creatorDoc.data() };
              const messageToAdmin = {
                title: `${activityData.title}`,
                desc: t("participant_quitte"),
                type: `join_demands`,
              };
              await sendNotifs(creatorData, messageToAdmin);
            }
          } catch (notifError) {
            console.warn("Erreur lors de l'envoi de la notification:", notifError);
          }
        }
      }

      // Mettre à jour l'état local
      setActivities((prevActivities) =>
        prevActivities.filter((activity) => activity.id !== activityId)
      );

      showMessage({
        message: t("evenement_quitte_succes"),
        type: "success",
      });
    } catch (error) {
      showMessage({
        message: `${t("erreur")}: ${error.message}`,
        type: "danger",
      });
    }
  };

  // Fonction pour afficher le menu d'actions (comme sur Home et ActivityDetails)
  const handleActionsMenu = (item) => {
    const parseDate = (dateString) => {
      const [day, month, year] = dateString.split("/");
      return new Date(year, month - 1, day);
    };

    const isActive = parseDate(item.date) > new Date();
    const buttons = [];

    if (item.isCreator) {
      // Actions pour le créateur/admin
      buttons.push({
        text: t("gerer_les_participants"),
        onPress: () => navigation.navigate("Participants", { activityId: item.id }),
      });

      buttons.push({
        text: t("modifier"),
        onPress: () => navigation.navigate("EditEvent", { eventId: item.id }),
      });

      buttons.push({
        text: t("supprimer"),
        onPress: () => onDelete(item.id),
        style: "destructive",
      });
    } else {
      // Actions pour un participant
      if (isActive) {
        buttons.push({
          text: t("quitter_levenement"),
          onPress: () => onLeave(item.id),
          style: "destructive",
        });
      }

      buttons.push({
        text: t("signaler"),
        onPress: () => navigation.navigate("ReportReasonScreen", { activityId: item.id }),
      });
    }

    // Bouton annuler
    buttons.push({
      text: t("annuler"),
      style: "cancel",
    });

    Alert.alert(t("actions"), t("choisissez_une_action"), buttons, {
      cancelable: true,
    });
  };

  const ActivityItem = React.memo(({ item, onActionsMenu, index }) => {
    const parseDate = (dateString) => {
      const [day, month, year] = dateString.split("/");
      return new Date(year, month - 1, day);
    };

    const isActive = parseDate(item.date) > new Date();

    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(index * 50)}
        exiting={FadeOut}
        style={styles.itemWrapper}
      >
        <Pressable
          style={[
            styles.eventCard,
            { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" },
          ]}
          onPress={() =>
            navigation.navigate("ActivityDetails", {
              activityId: item.id,
              image: item.images[0],
            })
          }
        >
          {/* Avatar de l'événement */}
          <View style={styles.avatarContainer}>
            {item.images?.[0] ? (
              <Image
                source={{ uri: item.images[0] }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarPlaceholder,
                  { backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#F3F4F6" },
                ]}
              >
                <Ionicons
                  name="calendar"
                  size={28}
                  color={isDarkMode ? "#4B5563" : "#9CA3AF"}
                />
              </View>
            )}
            {/* Badge de statut */}
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? "#10B981" : "#EF4444" },
              ]}
            />
          </View>

          {/* Infos de l'événement */}
          <View style={styles.eventInfo}>
            <View style={styles.eventHeader}>
              <Text
                style={[
                  styles.eventTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <View style={styles.headerRight}>
                <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: isActive ? "#10B98120" : "#EF444420" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: isActive ? "#10B981" : "#EF4444" },
                    ]}
                  >
                    {isActive ? t("actif") : t("termine")}
                  </Text>
                </View>
                {/* Icône 3 points pour le menu */}
                <TouchableOpacity
                  onPress={() => onActionsMenu(item)}
                  style={styles.menuButton}
                  activeOpacity={0.6}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={20}
                    color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tags d'info */}
            <View style={styles.tagsContainer}>
              {item.location && (
                <View
                  style={[
                    styles.tag,
                    { backgroundColor: isDarkMode ? "#1E3A8A" : "#DBEAFE" },
                  ]}
                >
                  <Ionicons name="location-outline" size={12} color="#3B82F6" />
                  <Text style={[styles.tagText, { color: "#3B82F6" }]}>
                    {item?.location?.split(",")[1]?.trim() || item?.location}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.tag,
                  { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={isDarkMode ? "#D1D5DB" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.tagText,
                    { color: isDarkMode ? "#D1D5DB" : "#6B7280" },
                  ]}
                >
                  {item.date}
                </Text>
              </View>
              <View
                style={[
                  styles.tag,
                  { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" },
                ]}
              >
                <Ionicons
                  name="people-outline"
                  size={12}
                  color={isDarkMode ? "#D1D5DB" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.tagText,
                    { color: isDarkMode ? "#D1D5DB" : "#6B7280" },
                  ]}
                >
                  {item?.participants?.filter((p) => p.active === true).length || 0}/{item.maxParticipants}
                </Text>
              </View>
            </View>

            {/* Badge rôle (créateur ou participant) */}
            <View style={styles.roleContainer}>
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: item.isCreator
                      ? (isDarkMode ? "#F9731620" : "#FEF3C7")
                      : (isDarkMode ? "#3B82F620" : "#DBEAFE"),
                  },
                ]}
              >
                <Ionicons
                  name={item.isCreator ? "star" : "people"}
                  size={12}
                  color={item.isCreator ? "#F97316" : "#3B82F6"}
                />
                <Text
                  style={[
                    styles.roleText,
                    { color: item.isCreator ? "#F97316" : "#3B82F6" },
                  ]}
                >
                  {item.isCreator ? t("organisateur") : t("participant")}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  });

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
          {t("chargement")}
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
      {/* Header avec compteur */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          styles.statsHeader,
          {
            backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
            borderBottomColor: isDarkMode ? COLORS.borderDark : "#F3F4F6",
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
            {activities.length}
          </Text>
          <Text
            style={[
              styles.statsLabel,
              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {activities.length === 0 || activities.length > 1
              ? t("evenements")
              : t("evenement")}
          </Text>
        </View>
      </Animated.View>

      <FlatList
        data={activities}
        renderItem={({ item, index }) => (
          <ActivityItem onActionsMenu={handleActionsMenu} item={item} index={index} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <View
                  style={[
                    styles.emptyIconGradient,
                    { backgroundColor: isDarkMode ? `${COLORS.primary}20` : `${COLORS.primary}10` },
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
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
                {t("aucun_evenement")}
              </Text>
              <Text
                style={[
                  styles.emptyDescription,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {t("vous_navez_pas_encore_cree_devenements")}
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
  },
  statsCount: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  statsLabel: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  listContent: {
    paddingVertical: 8,
  },
  itemWrapper: {
    paddingHorizontal: 16,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  eventInfo: {
    flex: 1,
    justifyContent: "center",
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuButton: {
    padding: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  roleContainer: {
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
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
    marginBottom: 24,
  },
});

export default MyEvents;
