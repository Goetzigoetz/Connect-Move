import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { auth, db } from "../../config/firebase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "../ThemeProvider";
import { collection, getDocs } from "@react-native-firebase/firestore";
import { COLORS } from "../styles/colors";

// Composant d'une activité
const ActivityItem = React.memo(({ item, isDarkMode, t, index }) => {
  const addressMatch = item.location.match(/^(.*?),\s*(.*?),\s*(.*?),\s*(\d+)$/);
  const { city, country } = addressMatch
    ? { city: addressMatch[2], country: addressMatch[3] }
    : { city: "", country: "" };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 50)}
      exiting={FadeOut}
      style={styles.itemWrapper}
    >
      <View
        style={[
          styles.eventCard,
          { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" },
        ]}
      >
        <View style={styles.avatarContainer}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#F3F4F6" },
              ]}
            >
              <MaterialCommunityIcons
                name="calendar"
                size={28}
                color={isDarkMode ? "#4B5563" : "#9CA3AF"}
              />
            </View>
          )}
        </View>

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
                  { backgroundColor: item.status === "Terminée" ? "#EF444420" : "#10B98120" },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: item.status === "Terminée" ? "#EF4444" : "#10B981" },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tagsContainer}>
           
            <View
              style={[
                styles.tag,
                { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" },
              ]}
            >
              <MaterialCommunityIcons name="clock-outline" size={12} color={isDarkMode ? "#D1D5DB" : "#6B7280"} />
              <Text
                style={[
                  styles.tagText,
                  { color: isDarkMode ? "#D1D5DB" : "#6B7280" },
                ]}
              >
                {item.date} {t("a")} {item.time}
              </Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: isDarkMode ? "#93C5FD" : "#1E40AF" }]}>
                {t("présence")}
              </Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: item.presence
                      ? isDarkMode
                        ? "#4ADE80"
                        : "#16A34A"
                      : isDarkMode
                      ? "#F87171"
                      : "#DC2626",
                  },
                ]}
              >
                {item.presence ? t("oui") : t("non")}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: isDarkMode ? "#93C5FD" : "#1E40AF" }]}>
                {t("implication")}
              </Text>
              <Text style={[styles.implicationValue, { color: isDarkMode ? "#93C5FD" : "#1E40AF" }]}>
                {item.implication}%
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

const History = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJoinedActivities = useCallback(async () => {
    try {
      const userId = auth.currentUser.uid;
      const [activitiesSnapshot, conversationsSnapshot, messagesSnapshot] = await Promise.all([
        getDocs(collection(db, "activities")),
        getDocs(collection(db, "conversations")),
        getDocs(collection(db, "messages")),
      ]);

      const joinedActivities = [];

      activitiesSnapshot.forEach((doc) => {
        const activity = doc.data();
        activity.id = doc.id;

        if (Array.isArray(activity.participants)) {
          const participant = activity.participants.find(
            (p) => p?.userId === userId && p.active === true
          );

          if (participant) {
            const conversation = conversationsSnapshot.docs.find(
              (convDoc) => convDoc.data().activityId === activity.id
            );
            const conversationId = conversation ? conversation.id : null;

            const messages = conversationId
              ? messagesSnapshot.docs.filter(
                  (msgDoc) => msgDoc.data().conversationId === conversationId
                )
              : [];

            const totalMessages = messages.length;
            const userMessagesCount = messages.filter(
              (msg) => msg.data().senderId === userId
            ).length;

            const presenceScore = participant.here ? 1 : 0;
            const implication =
              ((userMessagesCount / (totalMessages || 1)) * 0.5 + presenceScore * 0.5) * 100;

            joinedActivities.push({
              id: activity.id,
              joinedAt: participant.joinedAt || new Date().toISOString(),
              title: activity.title || "",
              photo: activity.images?.[0] || "",
              date: activity.date || "erreur",
              time: activity.time || "erreur",
              description: activity.description || "erreur",
              location: (activity.endPointName || "") + (activity.location || ""),
              status:
                new Date(activity.date.split("/").reverse().join("-")) < new Date()
                  ? "Terminée"
                  : "À venir",
              implication: Math.round(implication),
              presence: participant.here,
            });
          }
        }
      });

      joinedActivities.sort(
        (a, b) =>
          new Date(b.date.split("/").reverse().join("-")) -
          new Date(a.date.split("/").reverse().join("-"))
      );

      setActivities(joinedActivities);
    } catch (error) {
      console.error("Erreur lors de la récupération des activités :", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJoinedActivities();
  }, [fetchJoinedActivities]);

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>
          {t("chargement_des_activites")}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
      ]}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.flex}>
        <View
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
                ? t("évènements")
                : t("évènement")}
            </Text>
          </View>
        </View>

        <FlatList
          data={activities}
          renderItem={({ item, index }) => (
            <ActivityItem item={item} isDarkMode={isDarkMode} t={t} index={index} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <View
                    style={[
                      styles.emptyIconGradient,
                      { backgroundColor: isDarkMode ? `${COLORS.primary}20` : `${COLORS.primary}10` },
                    ]}
                  >
                    <MaterialCommunityIcons name="calendar" size={48} color={COLORS.primary} />
                  </View>
                </View>
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                  ]}
                >
                  {t("aucun_évènement")}
                </Text>
                <Text
                  style={[
                    styles.emptyDescription,
                    { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  {t("vous_navez_pas_encore_rejoint_dévènement")}
                </Text>
              </Animated.View>
            </View>
          )}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 12 },
  statsHeader: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  statsContent: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  statsCount: { fontSize: 28, fontFamily: "Inter_700Bold" },
  statsLabel: { fontSize: 16, fontFamily: "Inter_400Regular" },
  listContent: { paddingVertical: 8 },
  itemWrapper: { paddingHorizontal: 16 },
  eventCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  avatarContainer: { position: "relative", marginRight: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  eventInfo: { flex: 1, justifyContent: "center" },
  eventHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 8 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  eventTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  tag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  tagText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  statsContainer: { flexDirection: "row", gap: 12, marginTop: 4 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  statValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  implicationValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyState: { alignItems: "center", paddingHorizontal: 32 },
  emptyIconContainer: { marginBottom: 24 },
  emptyIconGradient: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 22, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  emptyDescription: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, marginBottom: 24 },
});

export default History;
