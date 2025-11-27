import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";
import { Picker } from "@react-native-picker/picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { COLORS } from "../../styles/colors";
import Animated, { FadeInUp } from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import i18n from "../../../i18n";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { validateStep2 } from "../../utils/formValidation";
import { useThemeContext } from "../../ThemeProvider";

const Step2 = ({ onNext, onPrevious, initialData }) => {
  const { isDarkMode } = useThemeContext();

  // Initialisation de la date par défaut au lendemain
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [selectedDate, setSelectedDate] = useState(initialData?.date || formatDate(tomorrow));
  const [selectedTime, setSelectedTime] = useState(initialData?.time || "");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  const handleNext = () => {
    const validation = validateStep2({ date: selectedDate, time: selectedTime });

    if (validation.isValid) {
      onNext({ date: selectedDate, time: selectedTime });
    } else {
      setErrors(validation.errors);
      showMessage({
        message: i18n.t("erreur"),
        description: Object.values(validation.errors)[0],
        type: "warning",
      });
    }
  };

  // Générer les horaires par intervalles de 15 minutes
  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour = String(h).padStart(2, "0");
        const minute = String(m).padStart(2, "0");
        slots.push(`${hour}:${minute}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      extraHeight={150}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }}
    >
      <Animated.View entering={FadeInUp.duration(400)} style={styles.container}>
        {/* Titre principal */}
        <View style={styles.headerSection}>
          <Text
            style={[
              styles.mainTitle,
              { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
            ]}
          >
            {i18n.t("date_et_heure")}
          </Text>
          <Text
            style={[
              styles.mainSubtitle,
              { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
            ]}
          >
            {i18n.t("il_ny_a_pas_de_meilleurs_moments_pour_se_retrouver")}
          </Text>
        </View>

        {/* Section Date */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderColor: isDarkMode ? "#2F3336" : "#E5E7EB",
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {i18n.t("date")}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                Sélectionnez la date de votre événement
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowCalendar(true)}
            activeOpacity={0.7}
            style={[
              styles.dateTimeButton,
              {
                backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF",
                borderColor: errors.date
                  ? "#EF4444"
                  : focusedField === "date"
                  ? COLORS.primary
                  : isDarkMode
                  ? "#1F2937"
                  : "#D1D5DB",
              },
            ]}
          >
            <Ionicons
              name="calendar"
              size={20}
              color={selectedDate ? COLORS.primary : isDarkMode ? "#6B7280" : "#9CA3AF"}
            />
            <Text
              style={[
                styles.dateTimeText,
                {
                  color: selectedDate
                    ? isDarkMode ? "#FFFFFF" : "#111827"
                    : isDarkMode ? "#6B7280" : "#9CA3AF",
                },
              ]}
            >
              {selectedDate || "Sélectionnez une date"}
            </Text>
          </TouchableOpacity>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>

        {/* Section Heure */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderColor: isDarkMode ? "#2F3336" : "#E5E7EB",
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {i18n.t("heure")}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                Choisissez l'heure de début
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
            style={[
              styles.dateTimeButton,
              {
                backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF",
                borderColor: errors.time
                  ? "#EF4444"
                  : focusedField === "time"
                  ? COLORS.primary
                  : isDarkMode
                  ? "#1F2937"
                  : "#D1D5DB",
              },
            ]}
          >
            <Ionicons
              name="time"
              size={20}
              color={selectedTime ? COLORS.primary : isDarkMode ? "#6B7280" : "#9CA3AF"}
            />
            <Text
              style={[
                styles.dateTimeText,
                {
                  color: selectedTime
                    ? isDarkMode ? "#FFFFFF" : "#111827"
                    : isDarkMode ? "#6B7280" : "#9CA3AF",
                },
              ]}
            >
              {selectedTime || "Sélectionnez une heure"}
            </Text>
          </TouchableOpacity>
          {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
        </View>

        {/* Modal Calendrier */}
        {showCalendar && (
          <Modal transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" },
                ]}
              >
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                  ]}
                >
                  Sélectionner une date
                </Text>
                <Calendar
                  theme={{
                    textDayFontFamily: "Inter_500Medium",
                    textMonthFontFamily: "Inter_600SemiBold",
                    textDayHeaderFontFamily: "Inter_600SemiBold",
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 13,
                    backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                    calendarBackground: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF",
                    textSectionTitleColor: isDarkMode ? "#9ca3af" : "#6B7280",
                    selectedDayBackgroundColor: COLORS.primary,
                    selectedDayTextColor: "#FFFFFF",
                    todayTextColor: COLORS.primary,
                    dayTextColor: isDarkMode ? "#d1d5db" : "#1F2937",
                    textDisabledColor: isDarkMode ? "#4b5563" : "#D1D5DB",
                    monthTextColor: isDarkMode ? "#FFFFFF" : "#1F2937",
                    arrowColor: COLORS.primary,
                  }}
                  onDayPress={(day) => {
                    const [year, month, date] = day.dateString.split("-");
                    setSelectedDate(`${date}/${month}/${year}`);
                    setErrors((prev) => ({ ...prev, date: "" }));
                    setShowCalendar(false);
                  }}
                  markedDates={{
                    [new Date().toISOString().split("T")[0]]: {
                      disabled: true,
                      disableTouchEvent: true,
                    },
                  }}
                  minDate={new Date().toISOString().split("T")[0]}
                />

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]}
                  onPress={() => setShowCalendar(false)}
                >
                  <Text style={[styles.modalButtonText, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                    {i18n.t("fermer")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Modal Sélection d'heure */}
        {showTimePicker && (
          <Modal transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" },
                ]}
              >
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                  ]}
                >
                  Sélectionner une heure
                </Text>
                <Picker
                  itemStyle={{
                    backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                    color: isDarkMode ? "#FFFFFF" : "#1F2937",
                    fontFamily: "Inter_500Medium",
                  }}
                  style={{
                    backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                    color: isDarkMode ? "#FFFFFF" : "#1F2937",
                  }}
                  dropdownIconColor={isDarkMode ? "#FFFFFF" : "#1F2937"}
                  selectedValue={selectedTime}
                  onValueChange={(itemValue) => {
                    if (itemValue) {
                      setSelectedTime(itemValue);
                      setErrors((prev) => ({ ...prev, time: "" }));
                    }
                  }}
                >
                  <Picker.Item
                    label="Choisir une heure"
                    value=""
                    color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  />
                  {timeSlots.map((time) => (
                    <Picker.Item
                      key={time}
                      label={time}
                      value={time}
                      color={isDarkMode ? "#FFFFFF" : "#1F2937"}
                    />
                  ))}
                </Picker>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={[styles.modalButtonText, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                    {i18n.t("fermer")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Bouton Suivant */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[COLORS.primary, `${COLORS.primary}DD`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>{i18n.t("suivant")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  container: {
    padding: 20,
    paddingBottom: 100,
    gap: 20,
  },
  headerSection: {
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    opacity: 0.8,
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  dateTimeText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalButton: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  nextButton: {
    marginTop: 12,
    borderRadius: 9999,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
});

export default Step2;
