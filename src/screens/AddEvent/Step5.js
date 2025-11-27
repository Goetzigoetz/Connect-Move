import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import moment from "moment";
import { COLORS } from "../../styles/colors";
import Animated, { FadeInUp } from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import * as ImageManipulator from "expo-image-manipulator";
import updateUserCoins from "../../utils/updateUserCoins";
import i18n from "../../../i18n";
import { auth, db, storage } from "../../../config/firebase";
import { useThemeContext } from "../../ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "@react-native-firebase/storage";

const Step5 = ({ previousData, onComplete, onPrevious, userSUB, initialData }) => {
  const { isDarkMode } = useThemeContext();

  const [images, setImages] = useState(initialData?.images || []);
  const [uploading, setUploading] = useState(false);

  // Fonction pour demander l'autorisation et sélectionner des images
  const selectImage = async () => {
    if (images.length >= 4) {
      showMessage({
        message: "Limite atteinte",
        description: "Vous ne pouvez ajouter que 4 images.",
        type: "warning",
      });
      return;
    }

    // Demander les permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showMessage({
        message: "Permission refusée",
        description:
          "Vous devez autoriser l'accès à votre galerie pour sélectionner des images.",
        type: "warning",
      });
      return;
    }

    // Sélectionner une image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    // Vérifier si une image a été sélectionnée
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages((prev) =>
        [...prev, ...result.assets.map((asset) => asset.uri)].slice(0, 4)
      );
    }
  };

  // Fonction pour supprimer une image
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (!images || !Array.isArray(images)) {
      throw new Error("Le paramètre 'images' doit être un tableau défini");
    }

    try {
      setUploading(true);

      const uploadPromises = images.map(async (imageUri) => {
        const compressedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const response = await fetch(compressedImage.uri);
        const blob = await response.blob();

        const filename = compressedImage.uri.split("/").pop();
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

        const url = await getDownloadURL(storageRef);
        return url;
      });

      const urls = await Promise.all(uploadPromises);
      setUploading(false);
      return urls;
    } catch (error) {
      setUploading(false);
      console.error("Erreur lors de l'upload des images :", error);
      throw error;
    }
  };

  // Fonction pour publier dans Firestore
  const publishActivity = async () => {
    try {
      if (images.length === 0) {
        Alert.alert(
          "Avertissement",
          "Êtes-vous sûr de vouloir continuer sans ajouter d'image ?",
          [
            {
              text: "Non",
              onPress: () => {},
              style: "cancel",
            },
            {
              text: "Oui",
              onPress: async () => {
                await handlePublish();
              },
            },
          ]
        );
        return;
      }

      await handlePublish();
    } catch (error) {
      console.error("Erreur lors de la publication de l'activité :", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la publication.");
    }
  };

  // Fonction séparée pour gérer la logique principale de publication
  const handlePublish = async () => {
    try {
      const imageUrls = images.length > 0 ? await uploadImages() : null;

      const activityData = {
        ...previousData,
        price: previousData.price ? Number(previousData.price) : 0,
        images: imageUrls,
        participants: [
          { userId: auth.currentUser.uid, active: true, here: false },
        ],
        creatorId: auth.currentUser.uid,
        createdAt: moment().format(),
      };

      const { title, description } = activityData;

      if (!title || !description) {
        showMessage({
          message: "Veuillez remplir tous les champs nécessaires",
          type: "warning",
        });
        return;
      }

      const activityRef = await addDoc(
        collection(db, "activities"),
        activityData
      );
      const activityId = activityRef.id;

      const conversationData = {
        activityId: activityId,
        createdAt: serverTimestamp(),
        messages: [],
        participants: [auth.currentUser.uid],
      };

      await addDoc(collection(db, "conversations"), conversationData);

      showMessage({
        message: "Votre évènement a été publié",
        description:
          "Tous les utilisateurs pourront le voir et le rejoindre à tout moment",
        type: "success",
      });

      const pointsDoc = await getDoc(doc(db, "admin", "defispoint"));
      const pointsConfig = pointsDoc.data();

      updateUserCoins(auth.currentUser.uid, pointsConfig.create_new_event)
        .then(() =>
          Alert.alert(
            "Des pièces en plus",
            `Vous avez reçu ${pointsConfig.create_new_event} pièces pour avoir créé un nouvel evènement.`
          )
        )
        .catch((err) => console.error("Échec de l'ajout de pièces:", err));

      onComplete();
    } catch (error) {
      console.error("Erreur lors de la publication :", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la publication.");
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
            {i18n.t("ajoutez_des_photos")}
          </Text>
          <Text
            style={[
              styles.mainSubtitle,
              { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
            ]}
          >
            {i18n.t(
              "mettez_des_images_qui_donneront_envie_de_vous_rejoindre_dans_votre_aventure"
            )}
          </Text>
        </View>

        {/* Section Images */}
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
              <Ionicons name="images-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                Photos ({images.length}/4)
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                Ajoutez jusqu'à 4 photos pour illustrer votre événement
              </Text>
            </View>
          </View>

          {/* Grille d'images */}
          {images.length > 0 && (
            <View style={styles.imagesGrid}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.image} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.4)"]}
                      style={styles.removeButtonGradient}
                    >
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Bouton d'ajout */}
          {images.length < 4 && (
            <TouchableOpacity
              onPress={selectImage}
              activeOpacity={0.7}
              style={[
                styles.addImageButton,
                {
                  backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#F9FAFB",
                  borderColor: isDarkMode ? "#2F3336" : "#D1D5DB",
                },
              ]}
            >
              <View
                style={[
                  styles.addImageIcon,
                  { backgroundColor: `${COLORS.primary}15` },
                ]}
              >
                <Ionicons name="add" size={28} color={COLORS.primary} />
              </View>
              <Text
                style={[
                  styles.addImageText,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                Ajouter une photo
              </Text>
              <Text
                style={[
                  styles.addImageSubtext,
                  { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
                ]}
              >
                {4 - images.length} restante{4 - images.length > 1 ? "s" : ""}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bouton Publier */}
        <TouchableOpacity
          style={[styles.publishButton, uploading && { opacity: 0.5 }]}
          onPress={publishActivity}
          activeOpacity={0.85}
          disabled={uploading}
        >
          <LinearGradient
            colors={[COLORS.primary, `${COLORS.primary}DD`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.publishButtonGradient}
          >
            {uploading ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={[styles.publishButtonText, { marginLeft: 8 }]}>
                  Publication en cours...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={[styles.publishButtonText, { marginLeft: 8 }]}>
                  Publier l'événement
                </Text>
              </>
            )}
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
  image: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  removeButtonGradient: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
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
  publishButton: {
    marginTop: 12,
    borderRadius: 9999,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  publishButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  publishButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
});

export default Step5;
