import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import {  collection, addDoc, serverTimestamp } from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Rating } from "react-native-elements";
import { useThemeContext } from "../ThemeProvider";
import i18n from "../../i18n";
import { COLORS } from "../styles/colors";

const WriteReview = ({ navigation, route }) => {
  const { isDarkMode } = useThemeContext();
  const MAX_LENGTH = 500;
  const user = auth.currentUser;

  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);

  useEffect(() => {
    console.log(isDarkMode);
  }, []);

  const handleSubmit = async () => {
    if (!message || rating === 0) {
      Alert.alert(i18n.t("erreur"), i18n.t("remplir_champs"));
      return;
    }

    try {
    await addDoc(collection(db, "reviews"), {
  userId: user.uid,
  message,
  rating,
  createdAt: serverTimestamp(),
});

      showMessage({
        message: i18n.t("avis_enregistre"),
        type: "success",
      });
      navigation.goBack();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'avis :", error);
      showMessage({
        message: i18n.t("impossible_enregistrer_avis"),
        type: "danger",
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }}>
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={200}
        style={{ paddingHorizontal: 24 }}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingTop: 32 }}>
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 30,
                fontFamily: "Inter_700Bold",
                color: isDarkMode ? "#FFFFFF" : "#111827",
                marginBottom: 8,
              }}
            >
              {i18n.t("ecrire_un_avis")}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Inter_400Regular",
                color: isDarkMode ? "#9CA3AF" : "#6B7280",
              }}
            >
              {i18n.t("partagez_votre_expérience")}
            </Text>
          </View>

          <View style={{ gap: 24 }}>
            <View>
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  color: isDarkMode ? "#D1D5DB" : "#374151",
                  marginBottom: 8,
                }}
              >
                {i18n.t("note")}
              </Text>
              <Rating
                type="star"
                ratingCount={5}
                imageSize={40}
                onFinishRating={setRating}
                style={{ paddingVertical: 10 }}
                ratingColor="transparent"
                ratingBackgroundColor="black"
              />
            </View>

            <View>
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  color: isDarkMode ? "#D1D5DB" : "#374151",
                  marginBottom: 8,
                }}
              >
                {i18n.t("votre_avis")}
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  style={{
                    backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F9FAFB",
                    color: isDarkMode ? "#FFFFFF" : "#111827",
                    borderRadius: 12,
                    padding: 16,
                    paddingLeft: 48,
                    minHeight: 150,
                    fontSize: 16,
                    fontFamily: "Inter_400Regular",
                  }}
                  placeholder={i18n.t("partagez_experience_placeholder")}
                  placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  value={message}
                  onChangeText={setMessage}
                  maxLength={MAX_LENGTH}
                  multiline
                  textAlignVertical="top"
                />
                <View style={{ position: "absolute", left: 16, top: 16 }}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={24}
                    color={isDarkMode ? "#6B7280" : "#6B7280"}
                  />
                </View>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_400Regular",
                    color: isDarkMode ? "#9CA3AF" : "#6B7280",
                  }}
                >
                  {message.length}/{MAX_LENGTH} {i18n.t("caracteres")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!message || rating === 0}
              style={{
                height: 56,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 16,
                backgroundColor: !message || rating === 0
                  ? (isDarkMode ? "#1E40AF" : "#93C5FD")
                  : "#2563EB",
                opacity: !message || rating === 0 ? 0.7 : 1,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 18,
                  marginRight: 8,
                }}
              >
                {i18n.t("publier_lavis")}
              </Text>
              <Ionicons name="send-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: 14,
              fontFamily: "Inter_400Regular",
              color: isDarkMode ? "#9CA3AF" : "#6B7280",
              textAlign: "center",
              marginTop: 32,
            }}
          >
            {i18n.t("votre_avis_nous_aide_a_ameliorer_lexperience_de_tous_les_utilisateurs")}
          </Text>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default WriteReview;
