import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  StyleSheet,
  Pressable,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { COLORS } from "../../styles/colors";
import Animated, { FadeInUp } from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import i18n from "../../../i18n";
import { useThemeContext } from "../../ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { validateStep4 } from "../../utils/formValidation";

const Step4 = ({ onNext, initialData }) => {
  const { isDarkMode } = useThemeContext();

  const [address, setAddress] = useState(initialData?.location || "");
  const [endPointName, setEndPointName] = useState(initialData?.endPointName || "");
  const [coordinates, setCoordinates] = useState(
    initialData?.coordinates || {
      latitude: null,
      longitude: null,
    }
  );

  const [suggestions, setSuggestions] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(initialData?.location || "");
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);

  const addressInputRef = useRef(null);

  const GOOGLE_API_KEY = "AIzaSyCPitKRbKMI7MZtibTQe-RxuUdf1s-fJog";

  // Récupérer les suggestions
  const fetchSuggestions = async (input) => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${GOOGLE_API_KEY}&types=address`
      );
      const data = await response.json();
      if (data.status === "OK") {
        const detailedSuggestions = await Promise.all(
          data.predictions.map(async (prediction) => {
            const detailResponse = await fetch(
              `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${GOOGLE_API_KEY}`
            );
            const detailData = await detailResponse.json();
            const postalCode =
              detailData?.result?.address_components?.find((comp) =>
                comp.types.includes("postal_code")
              )?.long_name || "";
            const location = detailData?.result?.geometry?.location;
            return {
              ...prediction,
              postalCode,
              coordinates: location
                ? { latitude: location.lat, longitude: location.lng }
                : null,
            };
          })
        );
        setSuggestions(detailedSuggestions);
      } else {
        setSuggestions([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setLoading(false);
      showMessage({
        message: i18n.t("erreur"),
        description: i18n.t("impossible_charger_suggestions"),
        type: "danger",
      });
    }
  };

  const handleNext = () => {
    const validation = validateStep4({
      location: selectedAddress,
      coordinates,
      endPointName,
    });

    if (validation.isValid) {
      onNext({ location: selectedAddress, coordinates, endPointName });
    } else {
      setErrors(validation.errors);
      showMessage({
        message: i18n.t("erreur"),
        description: Object.values(validation.errors)[0],
        type: "warning",
      });
    }
  };

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
            {i18n.t("nom_du_lieu_et_son_adresse")}
          </Text>
          <Text
            style={[
              styles.mainSubtitle,
              { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
            ]}
          >
            {i18n.t("preciser_lieu")}
          </Text>
        </View>

        {/* Section Nom du lieu */}
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
              <Ionicons name="location-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {i18n.t("nom_lieu")}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {i18n.t("nom_reconnaissable")}
              </Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text
              style={[
                styles.inputLabel,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              {i18n.t("nom_lieu_optionnel")}
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: errors.endPointName
                    ? "#EF4444"
                    : focusedField === "endPointName"
                    ? COLORS.primary
                    : isDarkMode
                    ? "#1F2937"
                    : "#D1D5DB",
                  backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF",
                },
              ]}
            >
              <TextInput
                style={[
                  styles.textInput,
                  { color: isDarkMode ? "#FFFFFF" : "#111827" },
                ]}
                placeholder={i18n.t("ex_parc")}
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={endPointName}
                onChangeText={(text) => {
                  setEndPointName(text);
                  setErrors((prev) => ({ ...prev, endPointName: "" }));
                }}
                onFocus={() => setFocusedField("endPointName")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {errors.endPointName && (
              <Text style={styles.errorText}>{errors.endPointName}</Text>
            )}
          </View>
        </View>

        {/* Section Adresse */}
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
              <Ionicons name="map-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {i18n.t("adresse")}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {i18n.t("tapez_une_adresse_et_selectionnez_parmi_les_suggestions")}
              </Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text
              style={[
                styles.inputLabel,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              {i18n.t("adresse_complete")}
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: errors.location
                    ? "#EF4444"
                    : focusedField === "address"
                    ? COLORS.primary
                    : isDarkMode
                    ? "#1F2937"
                    : "#D1D5DB",
                  backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF",
                },
              ]}
            >
              <Ionicons
                name="search"
                size={18}
                color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                style={{ marginRight: 8 }}
              />
              <TextInput
                ref={addressInputRef}
                style={[
                  styles.textInput,
                  { color: isDarkMode ? "#FFFFFF" : "#111827", flex: 1 },
                ]}
                placeholder={i18n.t("rechercher_adresse")}
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  setErrors((prev) => ({ ...prev, location: "" }));
                  fetchSuggestions(text);
                }}
                onFocus={() => setFocusedField("address")}
                onBlur={() => {
                  setTimeout(() => setFocusedField(null), 200);
                }}
              />
            </View>
            {errors.location && (
              <Text style={styles.errorText}>{errors.location}</Text>
            )}
            {errors.coordinates && (
              <Text style={styles.errorText}>{errors.coordinates}</Text>
            )}
          </View>

          {/* Liste des suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.place_id}
                keyboardShouldPersistTaps="always"
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <Pressable
                    onPress={() => {
                      setSelectedAddress(`${item.description}, ${item.postalCode}`);
                      setAddress(`${item.description}, ${item.postalCode}`);
                      setCoordinates(item.coordinates);
                      setSuggestions([]);
                      Keyboard.dismiss();
                      setErrors((prev) => ({ ...prev, location: "", coordinates: "" }));
                    }}
                    style={[
                      styles.suggestionItem,
                      {
                        backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#F9FAFB",
                        borderTopWidth: index > 0 ? 1 : 0,
                        borderTopColor: isDarkMode ? "#2F3336" : "#E5E7EB",
                      },
                    ]}
                  >
                    <Ionicons
                      name="location"
                      size={18}
                      color={COLORS.primary}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.suggestionText,
                          { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                        ]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                      {item.postalCode && (
                        <Text
                          style={[
                            styles.suggestionCode,
                            { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
                          ]}
                        >
                          {item.postalCode}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                )}
              />
            </View>
          )}

          {/* Afficher l'adresse sélectionnée */}
          {selectedAddress && !suggestions.length && (
            <View
              style={[
                styles.selectedAddressContainer,
                {
                  backgroundColor: isDarkMode ? `${COLORS.primary}15` : `${COLORS.primary}08`,
                  borderColor: COLORS.primary,
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text
                style={[
                  styles.selectedAddressText,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {selectedAddress}
              </Text>
            </View>
          )}
        </View>

        {/* Bouton Suivant */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={loading}
        >
          <LinearGradient
            colors={[COLORS.primary, `${COLORS.primary}DD`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.nextButtonGradient, loading && { opacity: 0.5 }]}
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
  inputContainer: {
    marginVertical: 0,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  textInput: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    paddingVertical: 14,
    lineHeight: 20,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
  },
  suggestionsContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: 300,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  suggestionCode: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  selectedAddressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  selectedAddressText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
    lineHeight: 18,
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

export default Step4;
