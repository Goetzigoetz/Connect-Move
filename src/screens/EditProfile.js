import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import * as Clipboard from 'expo-clipboard';
import { doc, getDoc, setDoc, serverTimestamp } from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/colors";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { useThemeContext } from "../ThemeProvider";

const EditProfile = ({ route, navigation }) => {
  const newProfile = route.params?.newProfile || false;
  const MAX_LENGTH = 500;
  const user = auth.currentUser;
  const { isDarkMode } = useThemeContext();
  const { t } = useTranslation();

  // États pour le chargement
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // États pour les champs modifiables
  const [userName, setUserName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [biography, setBiography] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [expertiseLevel, setExpertiseLevel] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [interests, setInterests] = useState([]);

  // États pour les champs en lecture seule
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [subscription, setSubscription] = useState("");
  const [age, setAge] = useState(0);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: !newProfile,
    });
  }, [navigation, newProfile]);

  // Fonction pour calculer l'âge à partir de la date de naissance
  const calculateAge = (birthDateString) => {
    if (!birthDateString) return 0;
    const birth = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Récupérer les données existantes de l'utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();

          // Champs modifiables
          setUserName(data.username || "");
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setBiography(data.biography || "");
          setBirthDate(data.birthDate || "");
          setGender(data.gender || "");
          setExpertiseLevel(data.expertiseLevel || "");
          setAddress(data.location?.address || "");
          setCity(data.location?.city || "");
          setCountry(data.location?.country || "");
          setInterests(data.interests || []);

          // Champs en lecture seule
          setEmail(data.email || user.email || "");
          setPhoneNumber(data.phoneNumber || "");
          setReferralCode(data.referralCode || "");
          setSubscription(data.sub || "gratuit");

          // Calcul de l'âge
          if (data.birthDate) {
            setAge(calculateAge(data.birthDate));
          }

          // Formatage de la date de création
          if (data.createdAt) {
            const date = new Date(data.createdAt);
            setCreatedAt(date.toLocaleDateString());
          }
        }
      } catch (error) {
        console.error("Erreur fetchUserData:", error);
        showMessage({
          message: t("impossible_de_charger_votre_profil"),
          type: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fonction pour copier le code de parrainage
  const copyReferralCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    showMessage({
      message: t("code_copie"),
      type: "success",
      duration: 2000,
    });
  };


  // Fonction pour sauvegarder les données
  const handleSave = async () => {
    if (!userName || !firstName || !lastName) {
      Alert.alert(t("erreur"), t("tous_les_champs_sont_obligatoires"));
      return;
    }

    setSaving(true);
    try {
      // Recalculer l'âge si la date de naissance a changé
      const newAge = birthDate ? calculateAge(birthDate) : age;

      await setDoc(
        doc(db, "users", user.uid),
        {
          username: userName,
          firstName,
          lastName,
          birthDate,
          age: newAge,
          gender,
          expertiseLevel,
          location: {
            address,
            city,
            country,
          },
          interests,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (newProfile) {
        navigation.navigate("AddInterest", { newProfile: true });
        return;
      }

      showMessage({
        message: t("informations_personnelles_mises_a_jour"),
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

  // Écran de chargement
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
          {t("chargement_de_votre_profil")}
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
              {t("modifier_le_profil")}
            </Text>
            <Text style={[styles.headerSubtitle, { color: isDarkMode ? "#71717A" : "#71717A" }]}>
              {t("ces_informations_nous_aident_a_personnaliser_votre_experience")}
            </Text>
          </View>

          {/* SECTION INFORMATIONS EN LECTURE SEULE */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F9FAFB" }]}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
              {t("informations_personnelles")}
            </Text>

            {/* Email */}
            <View style={styles.readOnlyField}>
              <View style={styles.fieldHeader}>
                <Ionicons name="mail-outline" size={20} color={isDarkMode ? "#A1A1AA" : "#71717A"} />
                <Text style={[styles.fieldLabel, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
                  {t("adresse_email")}
                </Text>
              </View>
              <Text style={[styles.fieldValue, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                {email}
              </Text>
            </View>

            {/* Numéro de téléphone */}
            <View style={styles.readOnlyField}>
              <View style={styles.fieldHeader}>
                <Ionicons name="call-outline" size={20} color={isDarkMode ? "#A1A1AA" : "#71717A"} />
                <Text style={[styles.fieldLabel, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
                  {t("numero_de_telephone")}
                </Text>
              </View>
              <View style={styles.phoneNumberContainer}>
                <Text style={[styles.fieldValue, { color: phoneNumber ? (isDarkMode ? "#FFFFFF" : "#000000") : (isDarkMode ? "#A1A1AA" : "#71717A"), flex: 1 }]}>
                  {phoneNumber || t("ajouter_numero_telephone")}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate("AddPhoneNumberPage")} style={styles.editButton}>
                  <Ionicons name="pencil" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Code de parrainage */}
            <View style={styles.readOnlyField}>
              <View style={styles.fieldHeader}>
                <Ionicons name="gift-outline" size={20} color={isDarkMode ? "#A1A1AA" : "#71717A"} />
                <Text style={[styles.fieldLabel, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
                  {t("votre_code_de_parrainage")}
                </Text>
              </View>
              <View style={styles.referralCodeContainer}>
                <Text style={[styles.fieldValue, { color: isDarkMode ? "#FFFFFF" : "#000000", flex: 1, paddingLeft: 28 }]}>
                  {referralCode}
                </Text>
                <TouchableOpacity onPress={copyReferralCode} style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Type d'abonnement */}
            <View style={styles.readOnlyField}>
              <View style={styles.fieldHeader}>
                <Ionicons name="star-outline" size={20} color={isDarkMode ? "#A1A1AA" : "#71717A"} />
                <Text style={[styles.fieldLabel, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
                  {t("abonnement")}
                </Text>
              </View>
              <Text style={[styles.fieldValue, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                {subscription === "gratuit" ? t("formule_gratuite") : subscription === "premium" ? t("formule_premium") : "Formule Pro"}
              </Text>
            </View>

            {/* Date de création */}
            {createdAt && (
              <View style={styles.readOnlyField}>
                <View style={styles.fieldHeader}>
                  <Ionicons name="calendar-outline" size={20} color={isDarkMode ? "#A1A1AA" : "#71717A"} />
                  <Text style={[styles.fieldLabel, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
                    {t("membre_depuis")}
                  </Text>
                </View>
                <Text style={[styles.fieldValue, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                  {createdAt}
                </Text>
              </View>
            )}
          </View>

          {/* SECTION INFORMATIONS MODIFIABLES */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }]}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
              {t("informations_personnelles")}
            </Text>

            {/* Prénom */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDarkMode ? "#E4E4E7" : "#3F3F46" }]}>
                {t("prenom")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB",
                    borderColor: isDarkMode ? "#27272A" : "#E4E4E7",
                    color: isDarkMode ? "#FFFFFF" : "#000000",
                  },
                ]}
                placeholder={t("prenom")}
                placeholderTextColor={isDarkMode ? "#52525B" : "#A1A1AA"}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            {/* Nom */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDarkMode ? "#E4E4E7" : "#3F3F46" }]}>
                {t("nom")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB",
                    borderColor: isDarkMode ? "#27272A" : "#E4E4E7",
                    color: isDarkMode ? "#FFFFFF" : "#000000",
                  },
                ]}
                placeholder={t("nom")}
                placeholderTextColor={isDarkMode ? "#52525B" : "#A1A1AA"}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            {/* Nom d'utilisateur */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDarkMode ? "#E4E4E7" : "#3F3F46" }]}>
                {t("nom_dutilisateur")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB",
                    borderColor: isDarkMode ? "#27272A" : "#E4E4E7",
                    color: isDarkMode ? "#FFFFFF" : "#000000",
                  },
                ]}
                placeholder={t("votre_nom_utilisateur")}
                placeholderTextColor={isDarkMode ? "#52525B" : "#A1A1AA"}
                value={userName}
                onChangeText={setUserName}
              />
            </View>

            {/* Âge (calculé automatiquement, affiché en lecture seule) */}
            {age > 0 && (
              <View style={styles.readOnlyField}>
                <View style={styles.fieldHeader}>
                  <Ionicons name="person-outline" size={20} color={isDarkMode ? "#A1A1AA" : "#71717A"} />
                  <Text style={[styles.fieldLabel, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
                    Âge
                  </Text>
                </View>
                <Text style={[styles.fieldValue, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                  {age} ans
                </Text>
              </View>
            )}

            {/* Genre */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDarkMode ? "#E4E4E7" : "#3F3F46" }]}>
                Genre
              </Text>
              <View style={styles.genderContainer}>
                {[
                  { value: "male", label: "Homme", icon: "male" },
                  { value: "female", label: "Femme", icon: "female" },
                  { value: "non-binary", label: "Non binaire", icon: "transgender" },
                  { value: "unspecified", label: "Non précisé", icon: "remove-circle-outline" }
                ].map((g) => (
                  <TouchableOpacity
                    key={g.value}
                    style={[
                      styles.genderButton,
                      {
                        backgroundColor: gender === g.value ? COLORS.primary : (isDarkMode ? COLORS.bgDark : "#F9FAFB"),
                        borderColor: gender === g.value ? COLORS.primary : (isDarkMode ? "#27272A" : "#E4E4E7"),
                      },
                    ]}
                    onPress={() => setGender(g.value)}
                  >
                    <Ionicons
                      name={g.icon}
                      size={18}
                      color={gender === g.value ? "#FFFFFF" : (isDarkMode ? "#A1A1AA" : "#71717A")}
                    />
                    <Text
                      style={[
                        styles.genderText,
                        { color: gender === g.value ? "#FFFFFF" : (isDarkMode ? "#A1A1AA" : "#71717A") },
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Niveau d'expertise */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDarkMode ? "#E4E4E7" : "#3F3F46" }]}>
                Niveau d'expertise
              </Text>
              <View style={styles.expertiseContainer}>
                {["debutant", "intermediaire", "avance", "expert"].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.expertiseButton,
                      {
                        backgroundColor: expertiseLevel === level ? COLORS.primary : (isDarkMode ? COLORS.bgDark : "#F9FAFB"),
                        borderColor: expertiseLevel === level ? COLORS.primary : (isDarkMode ? "#27272A" : "#E4E4E7"),
                      },
                    ]}
                    onPress={() => setExpertiseLevel(level)}
                  >
                    <Text
                      style={[
                        styles.expertiseText,
                        { color: expertiseLevel === level ? "#FFFFFF" : (isDarkMode ? "#A1A1AA" : "#71717A") },
                      ]}
                    >
                      {t(`onboarding_step3_expertise_${level}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Localisation */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDarkMode ? "#E4E4E7" : "#3F3F46" }]}>
                {t("votre_localisation")}
              </Text>
              <TouchableOpacity
                style={[
                  styles.locationButton,
                  {
                    backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB",
                    borderColor: isDarkMode ? "#27272A" : "#E4E4E7",
                  },
                ]}
                onPress={() => navigation.navigate("AddLocation")}
              >
                <View style={styles.locationContent}>
                  <Ionicons name="location-outline" size={20} color={isDarkMode ? "#A1A1AA" : "#71717A"} />
                  <View style={{ flex: 1 }}>
                    {address || city || country ? (
                      <>
                        {address && (
                          <Text style={[styles.locationText, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                            {address}
                          </Text>
                        )}
                        {(city || country) && (
                          <Text style={[styles.locationSubtext, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
                            {[city, country].filter(Boolean).join(", ")}
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text style={[styles.locationText, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
                        {t("definissez_votre_emplacement_pour_trouver_des_activites_pres_de_chez_vous")}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons name="pencil" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Centres d'intérêt */}
            {interests.length > 0 && (
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: isDarkMode ? "#E4E4E7" : "#3F3F46" }]}>
                  {t("centres_dinteret")}
                </Text>
                <View style={styles.interestsContainer}>
                  {interests.map((interest, index) => (
                    <View
                      key={index}
                      style={[
                        styles.interestChip,
                        {
                          backgroundColor: isDarkMode ? "#27272A" : "#EFF3F4",
                        },
                      ]}
                    >
                      <Text style={[styles.interestText, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                        {interest}
                      </Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate("AddInterest")}
                  style={styles.editInterestsButton}
                >
                  <Ionicons name="pencil" size={16} color={COLORS.primary} />
                  <Text style={[styles.editInterestsText, { color: COLORS.primary }]}>
                    Modifier mes centres d'intérêt
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Biographie - En dernier */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: isDarkMode ? "#E4E4E7" : "#3F3F46" }]}>
                {t("parlez_nous_un_peu_de_vous")}
              </Text>
              <TouchableOpacity
                style={[
                  styles.bioButton,
                  {
                    backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB",
                    borderColor: isDarkMode ? "#27272A" : "#E4E4E7",
                  },
                ]}
                onPress={() => navigation.navigate("EditBio")}
              >
                <View style={styles.bioContent}>
                  <Ionicons name="document-text-outline" size={20} color={isDarkMode ? "#A1A1AA" : "#71717A"} />
                  <View style={{ flex: 1 }}>
                    {biography ? (
                      <Text
                        style={[styles.bioText, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}
                        numberOfLines={3}
                      >
                        {biography}
                      </Text>
                    ) : (
                      <Text style={[styles.bioPlaceholder, { color: isDarkMode ? "#A1A1AA" : "#71717A" }]}>
                        {t("parlez_nous_un_peu_de_vous")}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons name="pencil" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bouton de sauvegarde */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: COLORS.primary,
                opacity: saving || (!userName || !firstName || !lastName) ? 0.5 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={saving || !userName || !firstName || !lastName}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {!newProfile ? t("enregistrer") : t("continuer_btn")}
                </Text>
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
    paddingBottom: 200,
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
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    marginBottom: 16,
  },
  readOnlyField: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  fieldValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    paddingLeft: 28,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  textArea: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 120,
  },
  characterCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 8,
    textAlign: "right",
  },
  referralCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
  },
  phoneNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
  },
  genderContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genderButton: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: "48%",
    gap: 8,
  },
  genderText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  locationText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    flex: 1,
  },
  locationSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  expertiseContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  expertiseButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  expertiseText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  interestText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  editInterestsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  editInterestsText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
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
  bioButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 80,
  },
  bioContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  bioText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
  },
  bioPlaceholder: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
});

export default EditProfile;
