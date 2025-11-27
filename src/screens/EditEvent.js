import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Pressable,
  Keyboard,
  Image,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Calendar } from "react-native-calendars";
import { Picker } from "@react-native-picker/picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, runTransaction } from "@react-native-firebase/firestore";
import { auth } from "../../config/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "@react-native-firebase/storage";
import { COLORS } from "../styles/colors";
import { showMessage } from "react-native-flash-message";
import { db, storage } from "../../config/firebase";
import i18n from "../../i18n";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Progress from "react-native-progress";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useThemeContext } from "../ThemeProvider";

const EditEvent = ({ route, navigation }) => {
  const { isDarkMode } = useThemeContext();
  const { eventId } = route?.params || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 5;
  const progress = currentStep / (totalSteps - 1);

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    maxParticipants: 2,
    price: "0",
    date: "",
    time: "",
    categoryId: "",
    location: "",
    endPointName: "",
    coordinates: { latitude: null, longitude: null },
    images: [],
  });

  // Original data for comparison
  const [originalData, setOriginalData] = useState(null);
  const [userSUB, setUserSUB] = useState("free");

  // UI states
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const allowedParticipants = userSUB === "pro" ? 20 : 5;
  const GOOGLE_API_KEY = "AIzaSyCPitKRbKMI7MZtibTQe-RxuUdf1s-fJog";

  const titleInputRef = useRef(null);

  // Fetch event data
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const eventDoc = await getDoc(doc(db, "activities", eventId));
        if (eventDoc.exists()) {
          const data = eventDoc.data();

          // Vérifier que l'utilisateur actuel est le créateur
          if (data.creatorId !== auth.currentUser?.uid) {
            showMessage({
              message: i18n.t("erreur"),
              description: "Vous n'êtes pas autorisé à modifier cet événement.",
              type: "danger",
            });
            navigation.goBack();
            return;
          }

          const eventFormData = {
            title: data.title || "",
            description: data.description || "",
            maxParticipants: data.maxParticipants || 2,
            price: data.price?.toString() || "0",
            date: data.date || "",
            time: data.time || "",
            categoryId: data.categoryId || "",
            location: data.location || "",
            endPointName: data.endPointName || "",
            coordinates: data.coordinates || { latitude: null, longitude: null },
            images: data.images || [],
          };
          setFormData(eventFormData);
          setOriginalData(eventFormData);
        } else {
          showMessage({
            message: i18n.t("erreur"),
            description: "Événement introuvable.",
            type: "danger",
          });
          navigation.goBack();
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        showMessage({
          message: i18n.t("erreur"),
          description: "Impossible de charger les données de l'événement",
          type: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
    fetchCategories();
  }, [eventId]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const querySnapshot = await getDocs(collection(db, "categories"));
      const fetchedCategories = [];
      querySnapshot.forEach((doc) => {
        fetchedCategories.push({ id: doc.id, ...doc.data() });
      });
      const sortedCategories = fetchedCategories.sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
      );
      setCategories(sortedCategories);
      setFilteredCategories(sortedCategories);
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Filter categories
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter((category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

  // Header configuration
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: i18n.t("modifier_evenement"),
      headerLeft: () =>
        currentStep > 0 ? (
          <Pressable
            onPress={() => setCurrentStep(currentStep - 1)}
            style={styles.headerBackButton}
          >
            <Ionicons name="chevron-back" size={20} color="#EF4444" />
            <Text style={styles.headerBackText}>{i18n.t("retour")}</Text>
          </Pressable>
        ) : null,
    });
  }, [currentStep, navigation]);

  // Generate time slots
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

  // Address suggestions
  const fetchSuggestions = async (input) => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setAddressLoading(true);
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
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setAddressLoading(false);
    }
  };

  // Image handling
  const selectImage = async () => {
    const totalImages = formData.images.length + newImages.length;
    if (totalImages >= 4) {
      showMessage({
        message: "Limite atteinte",
        description: "Vous ne pouvez ajouter que 4 images.",
        type: "warning",
      });
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showMessage({
        message: "Permission refusée",
        description: "Vous devez autoriser l'accès à votre galerie.",
        type: "warning",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeExistingImage = (index) => {
    const imageUrl = formData.images[index];
    setImagesToDelete((prev) => [...prev, imageUrl]);
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload new images
  const uploadNewImages = async () => {
    if (newImages.length === 0) return [];

    try {
      setUploading(true);
      const uploadPromises = newImages.map(async (imageUri) => {
        const compressedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const response = await fetch(compressedImage.uri);
        const blob = await response.blob();

        const filename = `${Date.now()}_${compressedImage.uri.split("/").pop()}`;
        const storageRef = ref(storage, `activities/${filename}`);

        const uploadTask = uploadBytesResumable(storageRef, blob);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            () => {},
            (error) => reject(error),
            () => resolve()
          );
        });

        return await getDownloadURL(storageRef);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Erreur lors de l'upload des images:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Validation
  const validateStep = (step) => {
    let valid = true;
    let tempErrors = {};

    switch (step) {
      case 0:
        if (!formData.title.trim()) {
          valid = false;
          tempErrors.title = i18n.t("titre_obligatoire");
        }
        if (!formData.description.trim()) {
          valid = false;
          tempErrors.description = i18n.t("description_obligatoire");
        }
        break;
      case 1:
        if (!formData.date) {
          valid = false;
          tempErrors.date = i18n.t("date_obligatoire");
        }
        if (!formData.time) {
          valid = false;
          tempErrors.time = i18n.t("heure_obligatoire");
        }
        break;
      case 2:
        if (!formData.categoryId) {
          valid = false;
          tempErrors.categoryId = i18n.t("categorie_obligatoire");
        }
        break;
      case 3:
        if (!formData.location) {
          valid = false;
          tempErrors.location = i18n.t("adresse_obligatoire");
        }
        break;
    }

    setErrors(tempErrors);
    return valid;
  };

  // Navigation
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    } else {
      showMessage({
        message: i18n.t("erreur"),
        description: i18n.t("veuillez_corriger_erreurs_avant_continuer"),
        type: "warning",
      });
    }
  };

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);

      // Upload new images
      const uploadedUrls = await uploadNewImages();
      const finalImages = [...formData.images, ...uploadedUrls];

      const eventRef = doc(db, "activities", eventId);

      // Utiliser une transaction pour vérifier les droits avant modification
      await runTransaction(db, async (transaction) => {
        const eventSnapshot = await transaction.get(eventRef);

        if (!eventSnapshot.exists()) {
          throw new Error("L'événement n'existe plus.");
        }

        const eventData = eventSnapshot.data();

        // Vérifier que l'utilisateur actuel est bien le créateur
        if (eventData.creatorId !== auth.currentUser?.uid) {
          throw new Error("Vous n'êtes pas autorisé à modifier cet événement.");
        }

        // Vérifier que maxParticipants n'est pas inférieur au nombre de participants actifs
        const activeParticipants = (eventData.participants || []).filter((p) => p.active === true).length;
        if (formData.maxParticipants < activeParticipants) {
          throw new Error(`Le nombre maximum ne peut pas être inférieur au nombre de participants actuels (${activeParticipants}).`);
        }

        transaction.update(eventRef, {
          title: formData.title,
          description: formData.description,
          maxParticipants: formData.maxParticipants,
          price: Number(formData.price) || 0,
          date: formData.date,
          time: formData.time,
          categoryId: formData.categoryId,
          location: formData.location,
          endPointName: formData.endPointName,
          coordinates: formData.coordinates,
          images: finalImages,
          updatedAt: serverTimestamp(),
        });
      });

      showMessage({
        message: i18n.t("evenement_modifie_succes"),
        type: "success",
      });

      navigation.goBack();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      showMessage({
        message: i18n.t("erreur"),
        description: error.message || "Une erreur s'est produite lors de la mise à jour.",
        type: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  // Render Step 1: Details
  const renderStep1 = () => (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      extraHeight={150}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }}
    >
      <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContainer}>
        <View style={styles.headerSection}>
          <Text style={[styles.mainTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
            {i18n.t("details")}
          </Text>
          <Text style={[styles.mainSubtitle, { color: isDarkMode ? "#6B7280" : "#9CA3AF" }]}>
            {i18n.t("donner_envie_de_ne_pas_rater_evenement")}
          </Text>
        </View>

        {/* Title & Description Card */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF", borderColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="create-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                {i18n.t("informations")}
              </Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>
              {i18n.t("titre")} *
            </Text>
            <View style={[styles.inputWrapper, { borderColor: errors.title ? "#EF4444" : focusedField === "title" ? COLORS.primary : isDarkMode ? "#1F2937" : "#D1D5DB", backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF" }]}>
              <TextInput
                ref={titleInputRef}
                style={[styles.textInput, { color: isDarkMode ? "#FFFFFF" : "#111827" }]}
                placeholder={i18n.t("exemple_gravir_everest")}
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={formData.title}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, title: text }));
                  setErrors((prev) => ({ ...prev, title: "" }));
                }}
                onFocus={() => setFocusedField("title")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>
              {i18n.t("description")} *
            </Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper, { borderColor: errors.description ? "#EF4444" : focusedField === "description" ? COLORS.primary : isDarkMode ? "#1F2937" : "#D1D5DB", backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF" }]}>
              <TextInput
                style={[styles.textInput, styles.textArea, { color: isDarkMode ? "#FFFFFF" : "#111827" }]}
                placeholder={i18n.t("donnez_plus_de_details")}
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={formData.description}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, description: text }));
                  setErrors((prev) => ({ ...prev, description: "" }));
                }}
                onFocus={() => setFocusedField("description")}
                onBlur={() => setFocusedField(null)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>
        </View>

        {/* Participants Card */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF", borderColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="people-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                {i18n.t("participants")}
              </Text>
            </View>
          </View>

          <View style={styles.participantControls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)", opacity: formData.maxParticipants <= 2 ? 0.3 : 1 }]}
              onPress={() => {
                if (formData.maxParticipants > 2) {
                  setFormData((prev) => ({ ...prev, maxParticipants: prev.maxParticipants - 1 }));
                }
              }}
              disabled={formData.maxParticipants <= 2}
            >
              <Ionicons name="remove" size={20} color={isDarkMode ? "#FFFFFF" : "#1F2937"} />
            </TouchableOpacity>

            <View style={styles.countWrapper}>
              <Text style={styles.participantCount}>{formData.maxParticipants}</Text>
              <Text style={[styles.participantLabel, { color: isDarkMode ? "#6B7280" : "#9CA3AF" }]}>
                personnes
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: COLORS.primary, opacity: formData.maxParticipants >= allowedParticipants ? 0.3 : 1 }]}
              onPress={() => {
                if (formData.maxParticipants < allowedParticipants) {
                  setFormData((prev) => ({ ...prev, maxParticipants: prev.maxParticipants + 1 }));
                }
              }}
              disabled={formData.maxParticipants >= allowedParticipants}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Card (Pro only) */}
        {userSUB === "pro" && (
          <View style={[styles.card, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF", borderColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                  {i18n.t("adhesion")}
                </Text>
              </View>
            </View>

            <View style={styles.priceInputContainer}>
              <TextInput
                style={[styles.priceInput, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}
                keyboardType="numeric"
                value={formData.price}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, price: text }))}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={[styles.currencySymbol, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>€</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient colors={[COLORS.primary, `${COLORS.primary}DD`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nextButtonGradient}>
            <Text style={styles.nextButtonText}>{i18n.t("suivant")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAwareScrollView>
  );

  // Render Step 2: Date & Time
  const renderStep2 = () => (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      extraHeight={150}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }}
    >
      <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContainer}>
        <View style={styles.headerSection}>
          <Text style={[styles.mainTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
            {i18n.t("date_et_heure")}
          </Text>
          <Text style={[styles.mainSubtitle, { color: isDarkMode ? "#6B7280" : "#9CA3AF" }]}>
            {i18n.t("il_ny_a_pas_de_meilleurs_moments_pour_se_retrouver")}
          </Text>
        </View>

        {/* Date Card */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF", borderColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                {i18n.t("date")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowCalendar(true)}
            activeOpacity={0.7}
            style={[styles.dateTimeButton, { backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF", borderColor: errors.date ? "#EF4444" : isDarkMode ? "#1F2937" : "#D1D5DB" }]}
          >
            <Ionicons name="calendar" size={20} color={formData.date ? COLORS.primary : isDarkMode ? "#6B7280" : "#9CA3AF"} />
            <Text style={[styles.dateTimeText, { color: formData.date ? (isDarkMode ? "#FFFFFF" : "#111827") : (isDarkMode ? "#6B7280" : "#9CA3AF") }]}>
              {formData.date || "Sélectionnez une date"}
            </Text>
          </TouchableOpacity>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>

        {/* Time Card */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF", borderColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                {i18n.t("heure")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
            style={[styles.dateTimeButton, { backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF", borderColor: errors.time ? "#EF4444" : isDarkMode ? "#1F2937" : "#D1D5DB" }]}
          >
            <Ionicons name="time" size={20} color={formData.time ? COLORS.primary : isDarkMode ? "#6B7280" : "#9CA3AF"} />
            <Text style={[styles.dateTimeText, { color: formData.time ? (isDarkMode ? "#FFFFFF" : "#111827") : (isDarkMode ? "#6B7280" : "#9CA3AF") }]}>
              {formData.time || "Sélectionnez une heure"}
            </Text>
          </TouchableOpacity>
          {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient colors={[COLORS.primary, `${COLORS.primary}DD`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nextButtonGradient}>
            <Text style={styles.nextButtonText}>{i18n.t("suivant")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Calendar Modal */}
      {showCalendar && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }]}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                Sélectionner une date
              </Text>
              <Calendar
                theme={{
                  textDayFontFamily: "Inter_500Medium",
                  textMonthFontFamily: "Inter_600SemiBold",
                  textDayHeaderFontFamily: "Inter_600SemiBold",
                  backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                  calendarBackground: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF",
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
                  setFormData((prev) => ({ ...prev, date: `${date}/${month}/${year}` }));
                  setErrors((prev) => ({ ...prev, date: "" }));
                  setShowCalendar(false);
                }}
                minDate={new Date().toISOString().split("T")[0]}
              />
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]} onPress={() => setShowCalendar(false)}>
                <Text style={[styles.modalButtonText, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>{i18n.t("fermer")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }]}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                Sélectionner une heure
              </Text>
              <Picker
                itemStyle={{ backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF", color: isDarkMode ? "#FFFFFF" : "#1F2937" }}
                style={{ backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF", color: isDarkMode ? "#FFFFFF" : "#1F2937" }}
                selectedValue={formData.time}
                onValueChange={(itemValue) => {
                  if (itemValue) {
                    setFormData((prev) => ({ ...prev, time: itemValue }));
                    setErrors((prev) => ({ ...prev, time: "" }));
                  }
                }}
              >
                <Picker.Item label="Choisir une heure" value="" color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                {timeSlots.map((time) => (
                  <Picker.Item key={time} label={time} value={time} color={isDarkMode ? "#FFFFFF" : "#1F2937"} />
                ))}
              </Picker>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]} onPress={() => setShowTimePicker(false)}>
                <Text style={[styles.modalButtonText, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>{i18n.t("fermer")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAwareScrollView>
  );

  // Render Step 3: Category
  const renderStep3 = () => (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      extraHeight={150}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }}
    >
      <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContainer}>
        <View style={styles.headerSection}>
          <Text style={[styles.mainTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
            {i18n.t("selectionnez_une_categorie")}
          </Text>
        </View>

        {/* Search */}
        <View style={[styles.searchCard, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF", borderColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]}>
          <View style={[styles.searchInputWrapper, { borderColor: focusedField === "search" ? COLORS.primary : isDarkMode ? "#1F2937" : "#D1D5DB", backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF" }]}>
            <Ionicons name="search" size={18} color={isDarkMode ? "#6B7280" : "#9CA3AF"} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: isDarkMode ? "#FFFFFF" : "#111827", flex: 1 }]}
              placeholder={i18n.t("rechercher_categorie")}
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setFocusedField("search")}
              onBlur={() => setFocusedField(null)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF", borderColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="grid-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                {i18n.t("categorie")}
              </Text>
            </View>
          </View>

          {loadingCategories ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setFormData((prev) => ({ ...prev, categoryId: item.id }));
                    setErrors((prev) => ({ ...prev, categoryId: "" }));
                    handleNext();
                  }}
                  activeOpacity={0.7}
                  style={[styles.categoryItem, { backgroundColor: formData.categoryId === item.id ? COLORS.primary : isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF", borderColor: formData.categoryId === item.id ? COLORS.primary : isDarkMode ? "#2F3336" : "#E5E7EB" }]}
                >
                  <Text style={[styles.categoryText, { color: formData.categoryId === item.id ? "#FFFFFF" : isDarkMode ? "#FFFFFF" : "#1F2937", fontFamily: formData.categoryId === item.id ? "Inter_700Bold" : "Inter_600SemiBold" }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {formData.categoryId === item.id && (
                    <MaterialCommunityIcons name="check-circle" size={22} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )}
          {errors.categoryId && <Text style={styles.errorText}>{errors.categoryId}</Text>}
        </View>
      </Animated.View>
    </KeyboardAwareScrollView>
  );

  // Render Step 4: Location
  const renderStep4 = () => (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      extraHeight={150}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }}
    >
      <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContainer}>
        <View style={styles.headerSection}>
          <Text style={[styles.mainTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
            {i18n.t("nom_du_lieu_et_son_adresse")}
          </Text>
        </View>

        {/* Place Name Card */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF", borderColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="location-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                {i18n.t("nom_lieu")}
              </Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>
              {i18n.t("nom_lieu_optionnel")}
            </Text>
            <View style={[styles.inputWrapper, { borderColor: focusedField === "endPointName" ? COLORS.primary : isDarkMode ? "#1F2937" : "#D1D5DB", backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF" }]}>
              <TextInput
                style={[styles.textInput, { color: isDarkMode ? "#FFFFFF" : "#111827" }]}
                placeholder={i18n.t("ex_parc")}
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={formData.endPointName}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, endPointName: text }))}
                onFocus={() => setFocusedField("endPointName")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>
        </View>

        {/* Address Card */}
        <View style={[styles.card, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF", borderColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="map-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                {i18n.t("adresse")}
              </Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>
              {i18n.t("adresse_complete")}
            </Text>
            <View style={[styles.inputWrapper, { borderColor: errors.location ? "#EF4444" : focusedField === "address" ? COLORS.primary : isDarkMode ? "#1F2937" : "#D1D5DB", backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF" }]}>
              <Ionicons name="search" size={18} color={isDarkMode ? "#6B7280" : "#9CA3AF"} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.textInput, { color: isDarkMode ? "#FFFFFF" : "#111827", flex: 1 }]}
                placeholder={i18n.t("rechercher_adresse")}
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={formData.location}
                onChangeText={(text) => {
                  setFormData((prev) => ({ ...prev, location: text }));
                  setErrors((prev) => ({ ...prev, location: "" }));
                  fetchSuggestions(text);
                }}
                onFocus={() => setFocusedField("address")}
                onBlur={() => setTimeout(() => setFocusedField(null), 200)}
              />
            </View>
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>

          {/* Suggestions */}
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
                      setFormData((prev) => ({
                        ...prev,
                        location: `${item.description}, ${item.postalCode}`,
                        coordinates: item.coordinates,
                      }));
                      setSuggestions([]);
                      Keyboard.dismiss();
                    }}
                    style={[styles.suggestionItem, { backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#F9FAFB", borderTopWidth: index > 0 ? 1 : 0, borderTopColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]}
                  >
                    <Ionicons name="location" size={18} color={COLORS.primary} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.suggestionText, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                      {item.postalCode && (
                        <Text style={[styles.suggestionCode, { color: isDarkMode ? "#6B7280" : "#9CA3AF" }]}>
                          {item.postalCode}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                )}
              />
            </View>
          )}

          {/* Selected Address */}
          {formData.location && !suggestions.length && (
            <View style={[styles.selectedAddressContainer, { backgroundColor: isDarkMode ? `${COLORS.primary}15` : `${COLORS.primary}08`, borderColor: COLORS.primary }]}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={[styles.selectedAddressText, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                {formData.location}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient colors={[COLORS.primary, `${COLORS.primary}DD`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nextButtonGradient}>
            <Text style={styles.nextButtonText}>{i18n.t("suivant")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAwareScrollView>
  );

  // Render Step 5: Images
  const renderStep5 = () => {
    const totalImages = formData.images.length + newImages.length;

    return (
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        extraHeight={150}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }}
      >
        <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContainer}>
          <View style={styles.headerSection}>
            <Text style={[styles.mainTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
              {i18n.t("ajoutez_des_photos")}
            </Text>
            <Text style={[styles.mainSubtitle, { color: isDarkMode ? "#6B7280" : "#9CA3AF" }]}>
              {i18n.t("mettez_des_images_qui_donneront_envie_de_vous_rejoindre_dans_votre_aventure")}
            </Text>
          </View>

          {/* Images Card */}
          <View style={[styles.card, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF", borderColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="images-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                  Photos ({totalImages}/4)
                </Text>
                <Text style={[styles.cardSubtitle, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>
                  Ajoutez jusqu'à 4 photos
                </Text>
              </View>
            </View>

            {/* Existing Images */}
            {(formData.images.length > 0 || newImages.length > 0) && (
              <View style={styles.imagesGrid}>
                {formData.images.map((uri, index) => (
                  <View key={`existing-${index}`} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.imagePreview} resizeMode="cover" />
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => removeExistingImage(index)} activeOpacity={0.8}>
                      <LinearGradient colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.4)"]} style={styles.removeImageGradient}>
                        <Ionicons name="close" size={16} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ))}
                {newImages.map((uri, index) => (
                  <View key={`new-${index}`} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.imagePreview} resizeMode="cover" />
                    <View style={styles.newImageBadge}>
                      <Text style={styles.newImageBadgeText}>Nouveau</Text>
                    </View>
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => removeNewImage(index)} activeOpacity={0.8}>
                      <LinearGradient colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.4)"]} style={styles.removeImageGradient}>
                        <Ionicons name="close" size={16} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add Image Button */}
            {totalImages < 4 && (
              <TouchableOpacity onPress={selectImage} activeOpacity={0.7} style={[styles.addImageButton, { backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#F9FAFB", borderColor: isDarkMode ? "#2F3336" : "#D1D5DB" }]}>
                <View style={[styles.addImageIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                  <Ionicons name="add" size={28} color={COLORS.primary} />
                </View>
                <Text style={[styles.addImageText, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]}>
                  Ajouter une photo
                </Text>
                <Text style={[styles.addImageSubtext, { color: isDarkMode ? "#6B7280" : "#9CA3AF" }]}>
                  {4 - totalImages} restante{4 - totalImages > 1 ? "s" : ""}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity style={[styles.saveButton, (saving || uploading) && { opacity: 0.5 }]} onPress={handleSave} activeOpacity={0.85} disabled={saving || uploading}>
            <LinearGradient colors={[COLORS.primary, `${COLORS.primary}DD`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.saveButtonGradient}>
              {saving || uploading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>
                    {uploading ? "Upload des images..." : "Sauvegarde en cours..."}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>
                    {i18n.t("sauvegarder_les_modifications")}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAwareScrollView>
    );
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      case 3:
        return renderStep4();
      case 4:
        return renderStep5();
      default:
        return renderStep1();
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>
          {i18n.t("chargement")}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? COLORS.bgDark : "#FFFFFF"} />

      {/* Progress Bar */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.progressContainer}>
        <Progress.Bar
          progress={progress}
          width={null}
          height={4}
          color={COLORS.primary}
          unfilledColor={isDarkMode ? "#2F3336" : "#E5E7EB"}
          borderWidth={0}
          borderRadius={2}
        />
      </Animated.View>

      {/* Step Content */}
      {renderStepContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  progressContainer: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerBackButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBackText: {
    color: "#EF4444",
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  stepContainer: {
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
    marginBottom: 24,
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
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
    marginVertical: 10,
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
  textAreaWrapper: {
    minHeight: 110,
  },
  textInput: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    paddingVertical: 14,
    lineHeight: 20,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 14,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
  },
  participantControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  countWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  participantCount: {
    fontSize: 40,
    fontFamily: "Inter_800ExtraBold",
    textAlign: "center",
    letterSpacing: -1,
    color: COLORS.primary,
  },
  participantLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 8,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}08`,
    marginVertical: 8,
  },
  priceInput: {
    fontSize: 56,
    fontFamily: "Inter_800ExtraBold",
    textAlign: "center",
    minWidth: 120,
    letterSpacing: -1,
  },
  currencySymbol: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
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
  searchCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  searchInput: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    paddingVertical: 14,
    lineHeight: 20,
  },
  categoryItem: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryText: {
    fontSize: 15,
    flex: 1,
    letterSpacing: 0.2,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
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
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  imageContainer: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  removeImageGradient: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  newImageBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newImageBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  addImageButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addImageIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  addImageText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  addImageSubtext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  saveButton: {
    marginTop: 12,
    borderRadius: 9999,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
});

export default EditEvent;
