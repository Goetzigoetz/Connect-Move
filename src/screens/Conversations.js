import React, { useState, useCallback } from "react";
import { useThemeContext } from "../ThemeProvider";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Alert,
} from "react-native";
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, arrayRemove, getDoc } from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import moment from "moment";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../styles/colors";
import i18n from "../../i18n";
import sendNotifs from "../utils/sendNotifs";
import { showMessage } from "react-native-flash-message";

const Conversations = ({ navigation }) => {
  const { isDarkMode } = useThemeContext();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;

      if (currentUser) {
        const activitiesSnapshot = await getDocs(collection(db, "activities"));

        const filteredActivities = activitiesSnapshot.docs.filter((doc) => {
          const participants = doc.data().participants || [];
          return participants.some(
            (participant) =>
              participant.userId === currentUser.uid &&
              participant.active === true
          );
        });

        const activityIds = filteredActivities.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (activityIds.length > 0) {
          const conversationsSnapshot = await getDocs(
            query(
              collection(db, "conversations"),
              where(
                "activityId",
                "in",
                activityIds.map((activity) => activity.id)
              )
            )
          );

          const conversationsData = await Promise.all(
            conversationsSnapshot.docs.map(async (doc) => {
              const conversation = doc.data();
              const relatedActivity = activityIds.find(
                (activity) => activity.id === conversation.activityId
              );

              const lastMessageSnapshot = await getDocs(
                query(
                  collection(db, "messages"),
                  where("conversationId", "==", doc.id),
                  orderBy("createdAt", "desc"),
                  limit(1)
                )
              );

              let lastMessage = null;
              if (!lastMessageSnapshot.empty) {
                const lastMessageDoc = lastMessageSnapshot.docs[0];
                lastMessage = {
                  id: lastMessageDoc.id,
                  ...lastMessageDoc.data(),
                };
              }

              return {
                id: doc.id,
                ...conversation,
                activity: relatedActivity,
                lastMessage,
              };
            })
          );

          setConversations(conversationsData);
        } else {
          setConversations([]);
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des conversations :",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchConversations();
    }, [fetchConversations])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const handleLeaveGroup = useCallback(async (conversation) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !conversation?.activity) return;

    const activityId = conversation.activity.id;
    const activityData = conversation.activity;

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
          style: "destructive",
          onPress: async () => {
            try {
              const participantToRemove = activityData.participants?.find(
                (participant) => participant.userId === currentUser.uid
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
              const creatorId = activityData.creatorId;
              if (creatorId && creatorId !== currentUser.uid) {
                const adminDoc = await getDoc(doc(db, "users", creatorId));
                if (adminDoc.exists()) {
                  const adminUser = { id: adminDoc.id, ...adminDoc.data() };
                  const messageToAdmin = {
                    title: `${activityData.title}`,
                    desc: i18n.t("participant_quitte"),
                    type: `join_demands`,
                  };
                  await sendNotifs(adminUser, messageToAdmin);
                }
              }

              showMessage({
                message: i18n.t("vous_avez_quitte_activite_succes"),
                type: "info",
              });

              // Rafraîchir la liste des conversations
              fetchConversations();
            } catch (error) {
              console.error("Erreur lors de la sortie du groupe :", error);
              showMessage({
                message: i18n.t("impossible_quitter_activite_reessayer"),
                type: "danger",
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [fetchConversations]);

  const handleActionsMenu = useCallback((conversation) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !conversation?.activity) return;

    const isCreator = conversation.activity.creatorId === currentUser.uid;

    const buttons = [];

    // Voir les détails de l'activité
    buttons.push({
      text: i18n.t("voir_activite"),
      onPress: () => navigation.navigate("ActivityDetails", { activityId: conversation.activity.id }),
    });

    // Quitter le groupe (seulement si pas le créateur)
    if (!isCreator) {
      buttons.push({
        text: i18n.t("quitter_levenement"),
        style: "destructive",
        onPress: () => handleLeaveGroup(conversation),
      });
    }

    // Annuler
    buttons.push({
      text: i18n.t("annuler"),
      style: "cancel",
    });

    Alert.alert(
      conversation.activity.title || i18n.t("actions"),
      i18n.t("choisissez_une_action"),
      buttons,
      { cancelable: true }
    );
  }, [navigation, handleLeaveGroup]);

  const renderConversation = useCallback(({ item, index }) => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 50)}
      style={styles.conversationWrapper}
    >
      <Pressable
        onPress={() => navigation.navigate("Chat", { conversation: item })}
        style={({ pressed }) => [
          styles.conversationCard,
          {
            backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        {/* Bouton 3 points */}
        <TouchableOpacity
          onPress={() => handleActionsMenu(item)}
          style={styles.menuButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={isDarkMode ? "#9CA3AF" : "#6B7280"}
          />
        </TouchableOpacity>
        {/* Avatar de l'activité */}
        <View style={styles.avatarContainer}>
          {item?.activity?.images?.[0] ? (
            <Image
              source={{ uri: item.activity.images[0] }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[
              styles.avatar,
              styles.avatarPlaceholder,
              { backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#F3F4F6" }
            ]}>
              <Ionicons
                name="chatbubbles"
                size={28}
                color={isDarkMode ? "#4B5563" : "#9CA3AF"}
              />
            </View>
          )}
        </View>

        {/* Infos conversation */}
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.conversationTitle,
                { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
              ]}
              numberOfLines={1}
            >
              {item?.activity?.title}
            </Text>
          </View>

          {/* Dernier message */}
          <Text
            style={[
              styles.lastMessage,
              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
            ]}
            numberOfLines={1}
          >
            {item?.lastMessage?.message || i18n.t("commencez_la_discussion")}
          </Text>

          {/* Tags et infos complémentaires */}
          <View style={styles.tagsContainer}>
            {item?.activity?.location && (
              <View style={[styles.tag, { backgroundColor: isDarkMode ? "#1E3A8A" : "#DBEAFE" }]}>
                <Ionicons name="location-outline" size={12} color="#3B82F6" />
                <Text style={[styles.tagText, { color: "#3B82F6" }]}>
                  {item?.activity?.location?.split(",")[1]?.trim() || item?.activity?.location || ""}
                </Text>
              </View>
            )}
            {item?.activity?.date && (
              <View style={[styles.tag, { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" }]}>
                <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                <Text style={[styles.tagText, { color: isDarkMode ? "#D1D5DB" : "#6B7280" }]}>
                  {item?.activity?.date}
                </Text>
              </View>
            )}
            <View style={[styles.tag, { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" }]}>
              <Ionicons name="people-outline" size={12} color="#6B7280" />
              <Text style={[styles.tagText, { color: isDarkMode ? "#D1D5DB" : "#6B7280" }]}>
                {item?.activity?.participants?.filter((p) => p.active === true).length || 0}/{item?.activity?.maxParticipants}
              </Text>
            </View>
          </View>
        </View>

        {/* Indicateur de nouveaux messages */}
        {item?.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unreadCount > 9 ? "9+" : item.unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  ), [isDarkMode, navigation]);

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
            {conversations.length}
          </Text>
          <Text
            style={[
              styles.statsLabel,
              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {conversations.length === 0 || conversations.length > 1
              ? i18n.t("conversations")
              : i18n.t("conversation")}
          </Text>
        </View>
      </Animated.View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
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
                  <Ionicons name="chatbubbles-outline" size={48} color={COLORS.primary} />
                </View>
              </View>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {i18n.t("aucune_conversation")}
              </Text>
              <Text
                style={[
                  styles.emptyDescription,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {i18n.t(
                  "participez_a_des_activites_pour_commencer_a_discuter_avec_dautres_sportifs"
                )}
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  // Naviguer vers le tab Activités
                  if (navigation.getParent()) {
                    navigation.getParent().navigate("Activités");
                  } else {
                    navigation.navigate("Home");
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.addButtonContent}>
                  <Ionicons name="search-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>
                    {i18n.t("decouvrir_des_activites")}
                  </Text>
                </View>
              </TouchableOpacity>
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
  conversationWrapper: {
    paddingHorizontal: 16,
  },
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
    position: "relative",
  },
  menuButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 10,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  conversationInfo: {
    flex: 1,
    justifyContent: "center",
  },
  conversationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
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
  unreadBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
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
  addButton: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: COLORS.primary,
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});

export default Conversations;
