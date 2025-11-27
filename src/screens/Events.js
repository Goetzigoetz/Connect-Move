import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  SafeAreaView,
} from "react-native";
import moment from "moment";
import { collection, query, where, getDocs, FieldPath } from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useFocusEffect } from "@react-navigation/native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { COLORS } from "../styles/colors";
import EventsSkeleton from "../components/EventsSkeleton";
import i18n from "../../i18n";
import { useThemeContext } from "../ThemeProvider";

// Configuration de la localisation en français
LocaleConfig.locales["fr"] = {
  monthNames: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ],
  monthNamesShort: [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ],
  dayNames: [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ],
  dayNamesShort: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
  today: "aujourd'hui",
};
LocaleConfig.defaultLocale = "fr";

const Events = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD")
  );

  const { isDarkMode } = useThemeContext();

  const fetchSavedActivities = useCallback(async () => {
    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const savedSnapshot = await getDocs(
        query(collection(db, "saved"), where("userId", "==", currentUser.uid))
      );

      if (savedSnapshot.empty) {
        setEvents([]);
        setMarkedDates({});
        setLoading(false);
        return;
      }

      const activityIds = savedSnapshot.docs.map((doc) => doc.data().activityId);

      // Limite de 10 IDs par requête Firestore avec 'in'
      const chunkSize = 10;
      const chunks = [];
      for (let i = 0; i < activityIds.length; i += chunkSize) {
        chunks.push(activityIds.slice(i, i + chunkSize));
      }

      const activities = [];
      for (const chunk of chunks) {
        const q = query(
          collection(db, "activities"),
          where(FieldPath.documentId(), "in", chunk)
        );
        const snapshot = await getDocs(q);
        activities.push(
          ...snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      }

      setEvents(activities);

      const marked = activities.reduce((acc, event) => {
        const date = moment(event.date, "DD/MM/YYYY").format("YYYY-MM-DD");
        acc[date] = {
          marked: true,
          dotColor: COLORS.primary,
          selected: date === selectedDate,
          selectedColor: COLORS.primary,
        };
        return acc;
      }, {});

      setMarkedDates(marked);

      // Filtrer les événements pour la date sélectionnée
      const filteredEvents = activities.filter(
        (event) =>
          moment(event.date, "DD/MM/YYYY").format("YYYY-MM-DD") === selectedDate
      );
      setSelectedDateEvents(filteredEvents);
    } catch (error) {
      console.error("Erreur lors de la récupération des activités sauvegardées :", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchSavedActivities();
    }, [fetchSavedActivities])
  );

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
    const filteredEvents = events.filter(
      (event) =>
        moment(event.date, "DD/MM/YYYY").format("YYYY-MM-DD") === day.dateString
    );
    setSelectedDateEvents(filteredEvents);
  };

  if (loading) {
    return <EventsSkeleton isDarkMode={isDarkMode} />;
  }

  // État vide amélioré - Aucun événement sauvegardé
  if (!events.length) {
    return (
      <SafeAreaView
        style={[
          styles.emptyContainer,
          { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
        ]}
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.emptyContent}>
          {/* Icône animée */}
          <View style={styles.emptyIconContainer}>
            <LinearGradient
              colors={[`${COLORS.primary}20`, `${COLORS.secondary}15`]}
              style={styles.emptyIconGradient}
            >
              <Ionicons name="calendar-outline" size={64} color={COLORS.primary} />
            </LinearGradient>
          </View>

          {/* Titre */}
          <Text
            style={[
              styles.emptyTitle,
              { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
            ]}
          >
            {i18n.t("aucun_evenement_sauvegarde")}
          </Text>

          {/* Description */}
          <Text
            style={[
              styles.emptyDescription,
              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {i18n.t("explorez_activites_sauvegardez")}
          </Text>

          {/* Bouton action */}
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate("Activités")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.exploreButtonGradient}
            >
              <Ionicons name="compass" size={20} color="#FFFFFF" />
              <Text style={styles.exploreButtonText}>{i18n.t("explorer_les_activites")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
      ]}
    >
      <FlatList
        ListHeaderComponent={() => (
          <>
            {/* Titre de la page */}
            <View
              style={[
                styles.pageHeader,
                { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
              ]}
            >
              <Text
                style={[
                  styles.pageTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {i18n.t("mes_evenements")}
              </Text>
            </View>

            {/* Calendrier amélioré */}
            <Animated.View entering={FadeInDown.duration(500)}>
              <View
                style={[
                  styles.calendarContainer,
                  {
                    backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                    borderBottomColor: isDarkMode ? "#27272A" : "#F3F4F6",
                  },
                ]}
              >
                <Calendar
                  onDayPress={handleDayPress}
                  markedDates={markedDates}
                  theme={
                    isDarkMode
                      ? {
                          backgroundColor: COLORS.bgDarkSecondary,
                          calendarBackground: COLORS.bgDarkSecondary,
                          textSectionTitleColor: COLORS.primary,
                          selectedDayBackgroundColor: COLORS.primary,
                          selectedDayTextColor: "#FFFFFF",
                          todayTextColor: COLORS.primary,
                          dayTextColor: "#E5E7EB",
                          textDisabledColor: "#52525B",
                          dotColor: COLORS.primary,
                          selectedDotColor: "#FFFFFF",
                          arrowColor: COLORS.primary,
                          monthTextColor: "#F3F4F6",
                          textDayFontFamily: "Inter_600SemiBold",
                          textMonthFontFamily: "Inter_700Bold",
                          textDayHeaderFontFamily: "Inter_600SemiBold",
                          textDayFontSize: 15,
                          textMonthFontSize: 18,
                          textDayHeaderFontSize: 13,
                        }
                      : {
                          backgroundColor: "#FFFFFF",
                          calendarBackground: "#FFFFFF",
                          textSectionTitleColor: COLORS.primary,
                          selectedDayBackgroundColor: COLORS.primary,
                          selectedDayTextColor: "#FFFFFF",
                          todayTextColor: COLORS.primary,
                          dayTextColor: "#374151",
                          textDisabledColor: "#D1D5DB",
                          dotColor: COLORS.primary,
                          selectedDotColor: "#FFFFFF",
                          arrowColor: COLORS.primary,
                          monthTextColor: "#1F2937",
                          textDayFontFamily: "Inter_600SemiBold",
                          textMonthFontFamily: "Inter_700Bold",
                          textDayHeaderFontFamily: "Inter_600SemiBold",
                          textDayFontSize: 15,
                          textMonthFontSize: 18,
                          textDayHeaderFontSize: 13,
                        }
                  }
                />
              </View>
            </Animated.View>

            {/* Section header améliorée */}
            <View
              style={[
                styles.sectionHeader,
                { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
              ]}
            >
              <View style={styles.sectionHeaderContent}>
                <Ionicons
                  name="calendar"
                  size={20}
                  color={isDarkMode ? "#FFFFFF" : "#1F2937"}
                />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                  ]}
                >
                  {selectedDateEvents.length > 0
                    ? `${selectedDateEvents.length} ${
                        selectedDateEvents.length > 1 ? i18n.t("evenements_pluriel") : i18n.t("evenement_singulier")
                      }`
                    : i18n.t("aucun_evenement")}
                </Text>
              </View>
              <Text
                style={[
                  styles.selectedDateText,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {moment(selectedDate).format("DD MMMM YYYY")}
              </Text>
            </View>
          </>
        )}
        data={selectedDateEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 200 }]}
        renderItem={({ item: event, index }) => (
          <Animated.View
            entering={FadeInDown.duration(400).delay(index * 100)}
            style={styles.cardWrapper}
          >
            <Pressable
              onPress={() =>
                navigation.navigate("Activités", {
                  screen: "ActivityDetails",
                  params: { activityId: event.id },
                })
              }
              style={({ pressed }) => [
                styles.eventCard,
                {
                  backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              {/* Image ou design alternatif */}
              {event.images && event.images.length > 0 ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: event.images[0] }}
                    style={styles.eventImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0, 0, 0, 0.6)"]}
                    style={styles.imageGradient}
                  />
                </View>
              ) : (
                <View style={styles.noImageContainer}>
                  <LinearGradient
                    colors={[
                      isDarkMode ? "rgba(249, 115, 22, 0.15)" : "rgba(249, 115, 22, 0.08)",
                      isDarkMode ? "rgba(139, 92, 246, 0.12)" : "rgba(139, 92, 246, 0.06)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.noImageGradient}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={40}
                      color={isDarkMode ? COLORS.primary : COLORS.primary}
                      style={{ opacity: 0.5 }}
                    />
                  </LinearGradient>
                </View>
              )}

              {/* Content */}
              <View style={styles.eventContent}>
                {/* Titre */}
                <Text
                  style={[
                    styles.eventTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                  ]}
                  numberOfLines={2}
                >
                  {event.title}
                </Text>

                {/* Info row 1: Heure et participants */}
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(249, 115, 22, 0.15)"
                            : "rgba(249, 115, 22, 0.1)",
                        },
                      ]}
                    >
                      <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                    </View>
                    <Text
                      style={[
                        styles.infoText,
                        { color: isDarkMode ? "#D1D5DB" : "#6B7280" },
                      ]}
                    >
                      {event.time || i18n.t("heure_non_specifiee")}
                    </Text>
                  </View>

                  <View style={styles.infoItem}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(139, 92, 246, 0.15)"
                            : "rgba(139, 92, 246, 0.1)",
                        },
                      ]}
                    >
                      <Ionicons name="people-outline" size={16} color={COLORS.secondary} />
                    </View>
                    <Text
                      style={[
                        styles.infoText,
                        { color: isDarkMode ? "#D1D5DB" : "#6B7280" },
                      ]}
                    >
                      {event?.participants?.filter((p) => p.active === true).length || 0}/{event.maxParticipants}
                    </Text>
                  </View>
                </View>

                {/* Info row 2: Location */}
                <View style={styles.locationRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isDarkMode
                          ? "rgba(59, 130, 246, 0.15)"
                          : "rgba(59, 130, 246, 0.1)",
                      },
                    ]}
                  >
                    <Ionicons name="location-outline" size={16} color="#3B82F6" />
                  </View>
                  <Text
                    style={[
                      styles.locationText,
                      { color: isDarkMode ? "#60A5FA" : "#2563EB" },
                    ]}
                    numberOfLines={1}
                  >
                    {event.location?.split(",")[1]?.trim() || event.location}
                  </Text>
                </View>

                {/* Badge de statut */}
                <View style={styles.badgeContainer}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.statusBadge}
                  >
                    <Ionicons name="bookmark" size={12} color="#FFFFFF" />
                    <Text style={styles.statusBadgeText}>{i18n.t("sauvegarde")}</Text>
                  </LinearGradient>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}
        ListEmptyComponent={() => (
          <Animated.View
            entering={FadeIn.duration(500)}
            style={styles.emptyDateContainer}
          >
            <View style={styles.emptyDateIconContainer}>
              <LinearGradient
                colors={[`${COLORS.primary}15`, `${COLORS.secondary}10`]}
                style={styles.emptyDateIconGradient}
              >
                <Ionicons name="calendar-outline" size={48} color={COLORS.primary} />
              </LinearGradient>
            </View>
            <Text
              style={[
                styles.emptyDateTitle,
                { color: isDarkMode ? "#E5E7EB" : "#4B5563" },
              ]}
            >
              {i18n.t("aucun_evenement_ce_jour")}
            </Text>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: "Inter_800ExtraBold",
    letterSpacing: -0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyContent: {
    alignItems: "center",
    maxWidth: 320,
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
  exploreButton: {
    borderRadius: 24,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  exploreButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  calendarContainer: {
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  selectedDateText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginLeft: 28,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  eventCard: {
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageContainer: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "40%",
  },
  noImageContainer: {
    width: "100%",
    height: 120,
  },
  noImageGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  badgeContainer: {
    flexDirection: "row",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  emptyDateContainer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyDateIconContainer: {
    marginBottom: 20,
  },
  emptyDateIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyDateTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDateDescription: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default Events;
