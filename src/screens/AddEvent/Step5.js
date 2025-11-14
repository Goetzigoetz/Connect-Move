import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import moment from "moment";
import { COLORS } from "../../styles/colors";
import { showMessage } from "react-native-flash-message";
import * as ImageManipulator from "expo-image-manipulator";
import updateUserCoins from "../../utils/updateUserCoins";
import i18n from "../../../i18n";
import { auth, db, storage } from "../../../config/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "@react-native-firebase/storage";

const Step5 = ({ previousData, onComplete, onPrevious, userSUB }) => {
  const [images, setImages] = useState([]);
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
    });

    // Vérifier si une image a été sélectionnée
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages((prev) =>
        [...prev, ...result.assets.map((asset) => asset.uri)].slice(0, 4)
      ); // Limiter à 4 images
    }
  };

 const uploadImages = async () => {
  console.log(images)
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
      console.log(compressedImage)

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
              onPress: () => {
                console.log("L'utilisateur a choisi de ne pas continuer.");
                return;
              },
              style: "cancel",
            },
            {
              text: "Oui",
              onPress: async () => {
                console.log("L'utilisateur a choisi de continuer sans image.");
                await handlePublish(); // Appel à une fonction pour gérer la publication
              },
            },
          ]
        );
        return;
      }

      // Si des images existent, continuez directement
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
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      scrollEnabled
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      extraHeight={150}
      contentContainerClassName="px-7 py-10 pb-32 bg-white dark:bg-gray-900"
      showsVerticalScrollIndicator={false}
    >
      <Text
        className="text-2xl text-gray-900 dark:text-white"
        style={{
          fontFamily: "Inter_500Medium",
        }}
      >
        {i18n.t("ajoutez_des_photos")}
      </Text>
      <Text
        className="mt-2 text-lg text-gray-500 dark:text-gray-400 mb-8"
        style={{
          fontFamily: "Inter_400Regular",
        }}
      >
        {i18n.t(
          "mettez_des_images_qui_donneront_envie_de_vous_rejoindre_dans_votre_aventure"
        )}
      </Text>
      {/* Liste des images sélectionnées */}
      <FlatList
        data={images}
        horizontal
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            className="w-[45vw] h-[45vw] rounded mr-3 border border-gray-300 dark:border-gray-700"
            resizeMode="cover"
          />
        )}
        className="mb-4"
        showsHorizontalScrollIndicator={false}
      />
      {/* Bouton pour sélectionner des images */}
      <TouchableOpacity
        onPress={selectImage}
        className="bg-blue-500 dark:bg-blue-600 py-3 px-6 rounded"
      >
        <Text
          className="text-white text-center text-base"
          style={{ fontFamily: "Inter_400Regular" }}
        >
          Ajouter une image ({images.length}/4)
        </Text>
      </TouchableOpacity>
      {/* Bouton Suivant */}
      <TouchableOpacity
        disabled={uploading}
        style={{
          backgroundColor: COLORS.primary,
          opacity: uploading ? 0.1 : 1,
        }}
        onPress={publishActivity}
        activeOpacity={0.8}
        className="py-3 mt-5 rounded"
      >
        <Text
          className="text-white text-center text-base"
          style={{ fontFamily: "Inter_400Regular" }}
        >
          {uploading ? "Publication..." : "Publier"}
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

export default Step5;
