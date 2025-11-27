import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import * as Location from "expo-location";
import {
  doc,
  updateDoc,
  writeBatch,
  collection,
  serverTimestamp,
  increment,
  getDoc,
} from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { showMessage } from "react-native-flash-message";
import { COLORS } from "../styles/colors";
import { useThemeContext } from "../ThemeProvider";
import { useTranslation } from "react-i18next";
import { GOOGLE_MAP_API_GEOCODING } from "@env";

const AddLocation = ({ route, navigation }) => {
  const newProfile = route?.params?.newProfile || false;
  const { isDarkMode } = useThemeContext();
  const { t } = useTranslation();
  const scrollViewRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [existingLocation, setExistingLocation] = useState(null);
  const [location, setLocation] = useState({
    address: "",
    city: "",
    country: "",
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;

        if (!currentUser) return;

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));

        if (userDoc.exists() && userDoc.data().location) {
          const existingLoc = userDoc.data().location;
          setExistingLocation(existingLoc);
          setLocation({
            address: existingLoc.address || "",
            city: existingLoc.city || "",
            country: existingLoc.country || "",
            latitude: existingLoc.latitude || null,
            longitude: existingLoc.longitude || null,
          });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'emplacement :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserLocation();
  }, []);

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
    }, 100);
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Erreur lors de la demande de permission:", error);
      return false;
    }
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAP_API_GEOCODING}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;

        let streetNumber = "";
        let route = "";
        let city = "";
        let country = "";

        addressComponents.forEach((component) => {
          if (component.types.includes("street_number")) {
            streetNumber = component.long_name;
          }
          if (component.types.includes("route")) {
            route = component.long_name;
          }
          if (component.types.includes("locality")) {
            city = component.long_name;
          }
          if (component.types.includes("country")) {
            country = component.long_name;
          }
        });

        const streetAddress = [streetNumber, route].filter(Boolean).join(" ");

        return {
          address: streetAddress,
          city,
          country,
          latitude,
          longitude,
        };
      }
      return null;
    } catch (error) {
      console.error("Erreur lors du géocodage:", error);
      return null;
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoadingLocation(true);

    try {
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        Alert.alert(
          t("onboarding_step5_permission_denied"),
          t("onboarding_step5_permission_message")
        );
        setLoadingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const addressData = await getAddressFromCoordinates(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );

      if (addressData) {
        setLocation(addressData);
        showMessage({
          message: t("onboarding_step5_success"),
          type: "success",
        });
      } else {
        showMessage({
          message: t("onboarding_step5_error_address"),
          type: "warning",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la géolocalisation:", error);
      showMessage({
        message: t("onboarding_step5_error_position"),
        type: "danger",
      });
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!location.address || !location.city) {
      showMessage({
        message: t("onboarding_step5_error"),
        type: "warning",
      });
      return;
    }

    try {
      setLoading(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert(t("erreur"), t("utilisateur_non_connecte"));
        return;
      }

      const userRef = doc(db, "users", currentUser.uid);
      const batch = writeBatch(db);

      batch.update(userRef, {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city,
          country: location.country,
          address: location.address,
        },
      });

      if (newProfile) {
        const pointsDocRef = doc(db, "admin", "defispoint");
        const pointsSnapshot = await getDoc(pointsDocRef);
        const points = Number(pointsSnapshot.data()?.profil_completion_point) || 0;

        const defisRef = collection(db, "defis");
        const newDefiDoc = doc(defisRef);

        batch.set(newDefiDoc, {
          userId: currentUser.uid,
          type: "profil_completion",
          createdAt: serverTimestamp(),
          points: points,
        });

        batch.update(userRef, {
          pieces: increment(points),
        });

        await batch.commit();

        Alert.alert(
          t("des_pieces_en_plus"),
          t("pieces_recues_completion_profil", { points })
        );
      } else {
        await batch.commit();
      }

      if (newProfile) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Profile" }],
        });
        navigation.navigate("Activités", {
          screen: "Home",
          params: { newProfile: true },
        });
        return;
      }

      showMessage({
        message: t("emplacement_mis_a_jour_succes"),
        type: "success",
      });
      navigation.goBack();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      showMessage({
        message: t("echec_enregistrement"),
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
          {t("chargement")}...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                {t("votre_localisation")}
              </Text>
              <Text style={[styles.headerSubtitle, { color: isDarkMode ? "#71717A" : "#71717A" }]}>
                {t("definissez_votre_emplacement_pour_trouver_des_activites_pres_de_chez_vous")}
              </Text>
            </View>

            {/* Existing Location Card */}
            {existingLocation && (
              <View style={[styles.locationCard, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F0F9FF" }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? "#27272A" : "#DBEAFE" }]}>
                    <Ionicons name="location" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={[styles.cardTitle, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                    {t("emplacement_actuel")}
                  </Text>
                </View>

                <View style={styles.locationInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="home-outline" size={20} color={isDarkMode ? "#A1A1AA" : "#71717A"} />
                    <Text style={[styles.infoText, { color: isDarkMode ? "#E4E4E7" : "#3F3F46" }]}>
                      {existingLocation.address}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="business-outline" size={20} color={isDarkMode ? "#A1A1AA" : "#71717A"} />
                    <Text style={[styles.infoText, { color: isDarkMode ? "#E4E4E7" : "#3F3F46" }]}>
                      {existingLocation.city}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="flag-outline" size={20} color={isDarkMode ? "#A1A1AA" : "#71717A"} />
                    <Text style={[styles.infoText, { color: isDarkMode ? "#E4E4E7" : "#3F3F46" }]}>
                      {existingLocation.country}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Geolocation Button */}
            <TouchableOpacity
              style={styles.geoButton}
              onPress={handleUseCurrentLocation}
              disabled={loadingLocation}
              activeOpacity={0.7}
            >
              {loadingLocation ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="navigate-circle" size={24} color={COLORS.primary} />
                  <Text style={[styles.geoButtonText, { color: COLORS.primary }]}>
                    {t("onboarding_step5_use_location")}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: isDarkMode ? "#27272A" : "#E4E4E7" }]} />
              <Text style={[styles.dividerText, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
                {t("onboarding_step5_or")}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: isDarkMode ? "#27272A" : "#E4E4E7" }]} />
            </View>

            {/* Manual Input */}
            <View style={styles.inputsContainer}>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: isDarkMode ? "#E4E4E7" : "#3F3F46" }]}>
                  {t("onboarding_step5_adresse_label")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F9FAFB",
                      borderColor: isDarkMode ? "#27272A" : "#E4E4E7",
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                    },
                  ]}
                  placeholder={t("onboarding_step5_adresse_placeholder")}
                  placeholderTextColor={isDarkMode ? "#52525B" : "#A1A1AA"}
                  value={location.address}
                  onChangeText={(text) => setLocation({ ...location, address: text })}
                  onFocus={handleInputFocus}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: isDarkMode ? "#E4E4E7" : "#3F3F46" }]}>
                  {t("onboarding_step5_ville_label")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F9FAFB",
                      borderColor: isDarkMode ? "#27272A" : "#E4E4E7",
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                    },
                  ]}
                  placeholder={t("onboarding_step5_ville_placeholder")}
                  placeholderTextColor={isDarkMode ? "#52525B" : "#A1A1AA"}
                  value={location.city}
                  onChangeText={(text) => setLocation({ ...location, city: text })}
                  onFocus={handleInputFocus}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: isDarkMode ? "#E4E4E7" : "#3F3F46" }]}>
                  {t("onboarding_step5_pays_label")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F9FAFB",
                      borderColor: isDarkMode ? "#27272A" : "#E4E4E7",
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                    },
                  ]}
                  placeholder={t("onboarding_step5_pays_placeholder")}
                  placeholderTextColor={isDarkMode ? "#52525B" : "#A1A1AA"}
                  value={location.country}
                  onChangeText={(text) => setLocation({ ...location, country: text })}
                  onFocus={handleInputFocus}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: COLORS.primary,
                  opacity: loading || !location.address || !location.city ? 0.5 : 1,
                },
              ]}
              onPress={handleSaveLocation}
              disabled={loading || !location.address || !location.city}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>
                    {newProfile ? t("continuer") : t("enregistrer")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
  },
  locationCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  locationInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    flex: 1,
  },
  geoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    borderRadius: 9999,
    gap: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  geoButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginHorizontal: 16,
  },
  inputsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 9999,
    marginTop: 8,
  },
  saveButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});

export default AddLocation;
