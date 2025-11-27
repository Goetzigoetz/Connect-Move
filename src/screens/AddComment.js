import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  InputAccessoryView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../ThemeProvider";
import firestore from "@react-native-firebase/firestore";
import { db, auth } from "../../config/firebase";
import i18n from "../../i18n";
import { COLORS } from "../styles/colors";

/**
 * AddComment - Écran dédié pour ajouter un commentaire
 * Design épuré avec focus sur le clavier et l'input
 */
const AddComment = ({ route, navigation }) => {
  const { activityId } = route?.params || {};
  const { isDarkMode } = useThemeContext();
  const inputRef = useRef(null);
  const inputAccessoryViewID = "uniqueID"; // ID unique pour l'accessoire

  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Auto-focus sur l'input au montage
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }, []);

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleSubmit = async () => {
  if (!comment.trim() || isSubmitting) return;

  setIsSubmitting(true);

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigation.navigate("Login");
      return;
    }

    const commentData = {
      id: `${currentUser.uid}_${Date.now()}`,
      userId: currentUser.uid,
      text: comment.trim(),
      timestamp: new Date().toISOString(),
    };

    const commentsRef = firestore().collection("comments").doc(activityId);

    await commentsRef.set(
      {
        activityId,
        comments: firestore.FieldValue.arrayUnion(commentData),
      },
      { merge: true }
    );

    navigation.goBack();
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire:", error);
    setIsSubmitting(false);
  }
};


  const canSubmit = comment.trim().length > 0 && !isSubmitting;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF' }
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: isDarkMode
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.08)',
            }
          ]}
        >
          <Pressable onPress={handleCancel} style={styles.cancelButton}>
            <MaterialCommunityIcons
              name="close"
              size={26}
              color={isDarkMode ? '#E2E8F0' : '#1E293B'}
            />
          </Pressable>

          <Text
            style={[
              styles.headerTitle,
              { color: isDarkMode ? '#F1F5F9' : '#0F172A' }
            ]}
          >
            {i18n.t("ajouter_commentaire", { defaultValue: "Ajouter un commentaire" })}
          </Text>

          {/* Espace vide pour centrer le titre */}
          <View style={styles.headerSpacer} />
        </View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            value={comment}
            onChangeText={setComment}
            placeholder={i18n.t("ecrivez_commentaire", { defaultValue: "Écrivez votre commentaire..." })}
            placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
            multiline
            maxLength={500}
            inputAccessoryViewID={inputAccessoryViewID}
            style={[
              styles.input,
              {
                color: isDarkMode ? '#F1F5F9' : '#0F172A',
              }
            ]}
          />

         
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <MaterialCommunityIcons
            name="lightbulb-outline"
            size={18}
            color={isDarkMode ? '#64748B' : '#94A3B8'}
          />
          <Text
            style={[
              styles.tipsText,
              { color: isDarkMode ? '#64748B' : '#94A3B8' }
            ]}
          >
            {i18n.t("commentaire_respectueux", {
              defaultValue: "Soyez respectueux et constructif dans vos commentaires"
            })}
          </Text>
        </View>

        {/* Accessoire de clavier - Bouton Publier */}
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View
            style={[
              styles.keyboardAccessory,
              {
                backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                borderTopColor: isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.08)',
              }
            ]}
          >
            <View style={styles.accessoryContent}>
              <Text
                style={[
                  styles.accessoryCharCount,
                  { color: isDarkMode ? '#64748B' : '#94A3B8' }
                ]}
              >
                {comment.length}/500
              </Text>

              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  styles.accessoryButton,
                  {
                    opacity: pressed ? 0.7 : canSubmit ? 1 : 0.4,
                    backgroundColor: canSubmit ? '#F97316' : '#94A3B8',
                  }
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <View style={styles.accessoryButtonContent}>
                    <Text style={styles.accessoryButtonText}>
                      {i18n.t("publier", { defaultValue: "Publier" })}
                    </Text>
                    <MaterialCommunityIcons
                      name="send"
                      size={18}
                      color={COLORS.primary}
                    />
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </InputAccessoryView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    letterSpacing: -0.4,
  },
  headerSpacer: {
    width: 42, // Même largeur que le bouton cancel pour centrer le titre
  },
  inputContainer: {
    flex: 1,
    padding: 20,
  },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    flex: 1,
  },
  charCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: 'right',
    marginTop: 8,
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tipsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  // Styles pour l'accessoire de clavier
  keyboardAccessory: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  accessoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accessoryCharCount: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  accessoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    minWidth: 100,
    justifyContent: 'center',
  },
  accessoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accessoryButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
});

export default AddComment;