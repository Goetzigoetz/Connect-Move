import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  FlatList,
  Pressable,
} from "react-native";
import moment from "moment";
import { collection, query, where, getDocs, FieldPath } from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { useColorScheme } from "nativewind";

import { Calendar, LocaleConfig } from "react-native-calendars";
import { COLORS } from "../styles/colors";
import i18n from "../../i18n";

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

  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  useEffect(() => {
  const fetchSavedActivities = async () => {
    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const savedSnapshot = await getDocs(
        query(collection(db, "saved"), where("userId", "==", currentUser.uid))
      );
      console.log("savedSnapshot empty:", savedSnapshot.empty);

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
    } catch (error) {
      console.error("Erreur lors de la récupération des activités sauvegardées :", error);
    } finally {
      setLoading(false);
    }
  };

  fetchSavedActivities();
}, [selectedDate]);

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
    const filteredEvents = events.filter(
      (event) =>
        moment(event.date, "DD/MM/YYYY").format("YYYY-MM-DD") === day.dateString
    );
    setSelectedDateEvents(filteredEvents);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!events.length) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
        <Text className="text-gray-500 dark:text-gray-400 mt-4 text-center">
          {i18n.t("aucun_evenement_prevu_pour_cette_date")}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <FlatList
        ListHeaderComponent={() => (
          <>
            <Animated.View
              entering={FadeInDown.duration(500)}
              className="bg-white dark:bg-gray-800 shadow-sm"
            >
              <Calendar
                onDayPress={handleDayPress}
                markedDates={markedDates}
                theme={
                  isDarkMode
                    ? {
                        backgroundColor: "#1F2937",
                        calendarBackground: "#1F2937",
                        textSectionTitleColor: COLORS.primary,
                        selectedDayBackgroundColor: COLORS.primary,
                        selectedDayTextColor: "#1F2937",
                        todayTextColor: COLORS.primary,
                        dayTextColor: "#D1D5DB",
                        textDisabledColor: "#4B5563",
                        dotColor: COLORS.primary,
                        selectedDotColor: "#1F2937",
                        arrowColor: COLORS.primary,
                        monthTextColor: "#D1D5DB",
                        textDayFontFamily: "Inter_500Medium",
                        textMonthFontFamily: "Inter_500Medium",
                        textDayHeaderFontFamily: "Inter_500Medium",
                        textDayFontSize: 16,
                        textMonthFontSize: 18,
                        textDayHeaderFontSize: 14,
                      }
                    : {
                        backgroundColor: "#ffffff",
                        calendarBackground: "#ffffff",
                        textSectionTitleColor: COLORS.primary,
                        selectedDayBackgroundColor: COLORS.primary,
                        selectedDayTextColor: "#ffffff",
                        todayTextColor: COLORS.primary,
                        dayTextColor: "#2d4150",
                        textDisabledColor: "#d9e1e8",
                        dotColor: COLORS.primary,
                        selectedDotColor: "#ffffff",
                        arrowColor: COLORS.primary,
                        monthTextColor: "#2d4150",
                        textDayFontFamily: "Inter_500Medium",
                        textMonthFontFamily: "Inter_500Medium",
                        textDayHeaderFontFamily: "Inter_500Medium",
                        textDayFontSize: 16,
                        textMonthFontSize: 18,
                        textDayHeaderFontSize: 14,
                      }
                }
              />
            </Animated.View>

            <View className="px-4 py-3 bg-gray-50 dark:bg-gray-800">
              <Text className="text-lg font-bold text-gray-800 dark:text-white">
                {selectedDateEvents.length > 0
                  ? `${selectedDateEvents.length} événement${
                      selectedDateEvents.length > 1 ? "s" : ""
                    }`
                  : "Aucun événement"}
              </Text>
            </View>
          </>
        )}
        data={selectedDateEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item: event }) => (
          <Animated.View entering={FadeInDown.duration(400)} className="mb-4">
            <Pressable
              onPress={() =>
                navigation.navigate("Activités", {
                  screen: "ActivityDetails",
                  params: { activityId: event.id },
                })
              }
              className="bg-gray-100 dark:bg-gray-800 rounded overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <Image
                source={{ uri: event.images[0] }}
                className="w-full h-12"
                resizeMode="cover"
              />
              <View className="p-4">
                <Text
                  style={{ fontFamily: "Inter_500Medium" }}
                  className="text-xl text-gray-900 dark:text-white mb-2"
                >
                  {event.title}
                </Text>

                <View className="flex-row items-center  space-x-4 mb-3">
                  <View className="flex-row items-center">
                    <Ionicons name="time" size={18} color="#6B7280" />
                    <Text
                      style={{ fontFamily: "Inter_500Medium" }}
                      className="text-gray-600 dark:text-gray-300 ml-1"
                    >
                      {event.time || "Heure non spécifiée"}
                    </Text>
                  </View>
                  <View className="ml-3 flex-row items-center">
                    <Ionicons name="people" size={18} color="#6B7280" />
                    <Text
                      style={{ fontFamily: "Inter_500Medium" }}
                      className="text-gray-600 dark:text-gray-300 ml-1"
                    >
                      {event?.participants?.length || 0}/{event.maxParticipants}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="location" size={18} color="#2563EB" />
                  <Text
                    style={{ fontFamily: "Inter_500Medium" }}
                    className="text-blue-600 dark:text-blue-400 ml-1 "
                  >
                    {event.location.split(",")[1].trim()}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-12">
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 dark:text-gray-400 mt-4 text-center">
              {i18n.t("aucun_evenement_prevu_pour_cette_date")}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

export default Events;
