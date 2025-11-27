import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Platform,
} from "react-native";
import { doc, getDoc, setDoc, serverTimestamp } from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { showMessage } from "react-native-flash-message";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/colors";
import { useThemeContext } from "../ThemeProvider";
import { useTranslation } from "react-i18next";

const EditBio = ({ navigation }) => {
  const MAX_LENGTH = 500;
  const user = auth.currentUser;
  const { isDarkMode } = useThemeContext();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [biography, setBiography] = useState("");

  useEffect(() => {
    const fetchBiography = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setBiography(data.biography || "");
        }
      } catch (error) {
        console.error("Erreur fetchBiography:", error);
        showMessage({
          message: t("impossible_de_charger_votre_profil"),
          type: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBiography();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          biography,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      showMessage({
        message: t("biographie_mise_a_jour"),
        type: "success",
      });
      navigation.goBack();
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      showMessage({
        message: t("impossible_sauvegarder_modifications"),
        type: "danger",
      });
    } finally {
      setSaving(false);
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
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={150}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* En-tête */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
              {t("modifier_la_biographie")}
            </Text>
            <Text style={[styles.headerSubtitle, { color: isDarkMode ? "#71717A" : "#71717A" }]}>
              {t("parlez_nous_un_peu_de_vous")}
            </Text>
          </View>

          {/* Champ de biographie */}
          <View style={styles.fieldContainer}>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F9FAFB",
                  borderColor: isDarkMode ? "#27272A" : "#E4E4E7",
                  color: isDarkMode ? "#FFFFFF" : "#000000",
                },
              ]}
              placeholder={t("parlez_nous_un_peu_de_vous")}
              placeholderTextColor={isDarkMode ? "#52525B" : "#A1A1AA"}
              value={biography}
              onChangeText={setBiography}
              maxLength={MAX_LENGTH}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            <Text style={[styles.characterCount, { color: isDarkMode ? "#71717A" : "#A1A1AA" }]}>
              {biography.length}/{MAX_LENGTH} {t("caracteres")}
            </Text>
          </View>

          {/* Conseils */}
          <View style={[styles.tipsContainer, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F0F9FF" }]}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={20} color={COLORS.primary} />
              <Text style={[styles.tipTitle, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                {t("conseils")}
              </Text>
            </View>
            <Text style={[styles.tipText, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
              • {t("conseil_bio_1")}
            </Text>
            <Text style={[styles.tipText, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
              • {t("conseil_bio_2")}
            </Text>
            <Text style={[styles.tipText, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
              • {t("conseil_bio_3")}
            </Text>
          </View>

          {/* Bouton de sauvegarde */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: COLORS.primary,
                opacity: saving ? 0.5 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>{t("enregistrer")}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
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
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 16 : 24,
    paddingBottom: 24,
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
  fieldContainer: {
    marginBottom: 20,
  },
  textArea: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 200,
  },
  characterCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 8,
    textAlign: "right",
  },
  tipsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  tipTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  tipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});

export default EditBio;
