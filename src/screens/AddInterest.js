import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  TextInput,
  Dimensions,
  InputAccessoryView,
  Platform,
  Keyboard,
  Modal,
} from "react-native";

import { auth, db } from "../../config/firebase";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "../ThemeProvider";
import { COLORS } from "../styles/colors";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "@react-native-firebase/firestore";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 8;
const CARDS_PER_ROW = 3;
const CARD_SIZE = (width - 32 - CARD_MARGIN * (CARDS_PER_ROW + 1)) / CARDS_PER_ROW;

// Composant Skeleton amélioré
const SkeletonCard = ({ index }) => {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withSpring(1, {
      damping: 20,
      stiffness: 90,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmerValue.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30)}
      style={[styles.skeletonWrapper, animatedStyle]}
    >
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonContent} />
      </View>
    </Animated.View>
  );
};

// Composant en-tête avec instructions
const WelcomeHeader = ({ isDarkMode, t, selectedCount }) => (
  <Animated.View entering={FadeIn.duration(600)} style={styles.welcomeSection}>
    <Text
      style={[
        styles.welcomeTitle,
        { color: isDarkMode ? "#FFFFFF" : "#000000" },
      ]}
    >
      {t("centres_dinteret")}
    </Text>
    <Text
      style={[
        styles.welcomeSubtitle,
        { color: isDarkMode ? "#94A3B8" : "#64748B" },
      ]}
    >
      {t("selectionnez_les_activites_qui_vous_passionnent")}
    </Text>
    {selectedCount > 0 && (
      <View style={styles.progressIndicator}>
        <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
        <Text style={styles.progressText}>
          {selectedCount} {selectedCount > 1 ? t("interets") : t("interet")}{" "}
          {selectedCount > 1 ? t("selectionnes") : t("selectionne")}
        </Text>
      </View>
    )}
  </Animated.View>
);

const AddInterest = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();

  const newProfile = route?.params?.newProfile || false;
  const user = auth.currentUser;
  const [allInterests, setAllInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchScale = useSharedValue(1);
  const scrollViewRef = useRef(null);
  const searchInputRef = useRef(null);
  const inputAccessoryViewID = "addInterestAccessory";
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  // Configure navigation header with info icon
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowHowItWorksModal(true)}
          style={styles.headerInfoButton}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={24}
            color={isDarkMode ? "#93C5FD" : "#3B82F6"}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isDarkMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all interests from the database
        const interestsSnapshot = await getDocs(collection(db, "interests"));
        const dbInterests = interestsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch user's selected interests
        const userDoc = await getDoc(doc(db, "users", user.uid));
        let userInterests = [];

        if (userDoc.exists()) {
          const userData = userDoc.data();
          userInterests = userData.interests || [];
          setSelectedInterests(userInterests);
        }

        // Find custom interests that don't exist in the database
        const dbInterestNames = dbInterests.map(i => i.name);
        const customInterests = userInterests
          .filter(name => !dbInterestNames.includes(name))
          .map(name => ({
            id: `custom_${name}`,
            name: name
          }));

        // Merge database interests with custom interests
        setAllInterests([...dbInterests, ...customInterests]);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleInterest = async (interest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isSelected = selectedInterests.includes(interest);

    const updatedInterests = isSelected
      ? selectedInterests.filter((item) => item !== interest)
      : [...selectedInterests, interest];

    setSelectedInterests(updatedInterests);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        interests: updatedInterests,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour des intérêts :", error);
    }
  };

  const addCustomInterest = async () => {
    const interestToAdd = searchQuery.trim();
    if (!interestToAdd) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Check if interest already exists
    const existingInterest = allInterests.find(
      (interest) => interest.name.toLowerCase() === interestToAdd.toLowerCase()
    );

    if (existingInterest) {
      // If it exists, just select it
      if (!selectedInterests.includes(existingInterest.name)) {
        const updatedInterests = [...selectedInterests, existingInterest.name];
        setSelectedInterests(updatedInterests);

        try {
          await updateDoc(doc(db, "users", user.uid), {
            interests: updatedInterests,
          });
        } catch (error) {
          console.error("Erreur lors de la mise à jour des intérêts :", error);
        }
      }
    } else {
      // Add to allInterests array
      const newInterest = {
        id: `custom_${Date.now()}`,
        name: interestToAdd,
      };
      setAllInterests([...allInterests, newInterest]);

      // Automatically select it
      const updatedInterests = [...selectedInterests, interestToAdd];
      setSelectedInterests(updatedInterests);

      try {
        await updateDoc(doc(db, "users", user.uid), {
          interests: updatedInterests,
        });
      } catch (error) {
        console.error("Erreur lors de l'ajout de l'intérêt personnalisé :", error);
      }
    }

    // Reset search but keep focus
    setSearchQuery("");
    // Keep the input focused
    if (searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  };


  const handleFocus = () => {
    setIsSearchFocused(true);
    searchScale.value = withSpring(1.02, {
      damping: 15,
      stiffness: 150,
    });
  };

  const handleBlur = () => {
    setIsSearchFocused(false);
    searchScale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  };

  const animatedSearchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));

  const filteredInterests = allInterests
    .filter((interest) =>
      interest.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aSelected = selectedInterests.includes(a.name);
      const bSelected = selectedInterests.includes(b.name);

      // Les sélectionnés en premier
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" },
        ]}
      >
        <View style={styles.contentContainer}>
          <WelcomeHeader isDarkMode={isDarkMode} t={t} selectedCount={0} />
          <View style={styles.interestsGrid}>
            {[...Array(12)].map((_, index) => (
              <SkeletonCard key={index} index={index} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" },
      ]}
    >
      <View style={styles.flex}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.contentContainer}>
            {/* En-tête avec bienvenue */}
            {!isSearchFocused && (
              <WelcomeHeader
                isDarkMode={isDarkMode}
                t={t}
                selectedCount={selectedInterests.length}
              />
            )}

            {/* Barre de recherche */}
            <Animated.View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC",
                  borderColor: isSearchFocused
                    ? "#3B82F6"
                    : isDarkMode
                    ? "#1E293B"
                    : "#E2E8F0",
                },
                animatedSearchStyle,
              ]}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={22}
                color={isSearchFocused ? "#3B82F6" : isDarkMode ? "#64748B" : "#94A3B8"}
              />
              <TextInput
                ref={searchInputRef}
                style={[
                  styles.searchInput,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
                placeholder={t("rechercher_interets") || "Rechercher..."}
                placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={handleFocus}
                onBlur={handleBlur}
                inputAccessoryViewID={inputAccessoryViewID}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color={isDarkMode ? "#64748B" : "#94A3B8"}
                  />
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Grille d'intérêts */}
            <View style={styles.interestsSection}>
              <View style={styles.interestsGrid}>
                {filteredInterests.map((interest, index) => {
                  const isSelected = selectedInterests.includes(interest.name);

                  return (
                    <Animated.View
                      key={interest.id}
                      entering={FadeInDown.delay(index * 20)}
                      style={styles.interestWrapper}
                    >
                      <TouchableOpacity
                        style={[
                          styles.interestCard,
                          isSelected
                            ? styles.selectedCard
                            : {
                                backgroundColor: isDarkMode
                                  ? "#0F172A"
                                  : "#F8FAFC",
                                borderWidth: 2,
                                borderColor: isDarkMode ? "#1E293B" : "#E2E8F0",
                              },
                        ]}
                        onPress={() => toggleInterest(interest.name)}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <View style={styles.checkIcon}>
                            <MaterialCommunityIcons
                              name="check"
                              size={14}
                              color="#FFFFFF"
                            />
                          </View>
                        )}
                        <Text
                          style={[
                            styles.interestText,
                            {
                              color: isSelected
                                ? "#FFFFFF"
                                : isDarkMode
                                ? "#E2E8F0"
                                : "#334155",
                            },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {interest.name}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Message si aucun résultat */}
              {filteredInterests.length === 0 && (
                <Animated.View
                  entering={FadeInDown.duration(300)}
                  style={styles.emptyContainer}
                >
                  <View
                    style={[
                      styles.emptyIconContainer,
                      {
                        backgroundColor: isDarkMode ? "#0F172A" : "#F0F9FF",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="emoticon-sad-outline"
                      size={48}
                      color="#3B82F6"
                    />
                  </View>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: isDarkMode ? "#94A3B8" : "#64748B" },
                    ]}
                  >
                    {t("aucun_interet_trouve") || "Aucun intérêt trouvé"}
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtext,
                      { color: isDarkMode ? "#64748B" : "#94A3B8" },
                    ]}
                  >
                    Essayez avec d'autres mots-clés
                  </Text>
                </Animated.View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bouton fixe en bas */}
        {newProfile && (
          <View
            style={[
              styles.bottomContainer,
              {
                backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF",
                borderTopColor: isDarkMode ? "#1E293B" : "#F1F5F9",
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.continueButton,
                {
                  backgroundColor:
                    selectedInterests.length === 0 ? "#94A3B8" : "#3B82F6",
                },
              ]}
              onPress={() =>
                navigation.navigate("AddLocation", { newProfile: true })
              }
              disabled={selectedInterests.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>{t("continuer")}</Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Input Accessory View pour iOS */}
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View
            style={[
              styles.inputAccessory,
              {
                backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                borderTopColor: isDarkMode ? "#1E293B" : "#E2E8F0",
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.accessoryButton,
                styles.searchButton,
                { opacity: searchQuery.trim().length === 0 ? 0.5 : 1 },
              ]}
              onPress={() => Keyboard.dismiss()}
              disabled={searchQuery.trim().length === 0}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#3B82F6"
              />
              <Text style={styles.accessoryButtonText}>Rechercher</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.accessoryButton,
                styles.addButton,
                { opacity: searchQuery.trim().length === 0 ? 0.5 : 1 },
              ]}
              onPress={addCustomInterest}
              disabled={searchQuery.trim().length === 0}
            >
              <MaterialCommunityIcons
                name="plus-circle"
                size={20}
                color="#FFFFFF"
              />
              <Text style={[styles.accessoryButtonText, { color: "#FFFFFF" }]}>
                Ajouter "{searchQuery.trim().substring(0, 15)}
                {searchQuery.trim().length > 15 ? "..." : ""}"
              </Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}

      {/* Modal "Comment ça fonctionne" */}
      <Modal
        visible={showHowItWorksModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHowItWorksModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowHowItWorksModal(false)}
        >
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF" },
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalIconContainer}>
                  <MaterialCommunityIcons
                    name="lightbulb-on"
                    size={28}
                    color="#3B82F6"
                  />
                </View>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#1E293B" },
                  ]}
                >
                  {t("comment_ca_marche")}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowHowItWorksModal(false)}
                  style={styles.modalCloseButton}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={isDarkMode ? "#94A3B8" : "#64748B"}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalStepRow}>
                  <View style={styles.modalStepNumber}>
                    <Text style={styles.modalStepNumberText}>1</Text>
                  </View>
                  <Text
                    style={[
                      styles.modalStepText,
                      { color: isDarkMode ? "#CBD5E1" : "#475569" },
                    ]}
                  >
                    Explorez et sélectionnez vos centres d'intérêt favoris
                  </Text>
                </View>
                <View style={styles.modalStepRow}>
                  <View style={styles.modalStepNumber}>
                    <Text style={styles.modalStepNumberText}>2</Text>
                  </View>
                  <Text
                    style={[
                      styles.modalStepText,
                      { color: isDarkMode ? "#CBD5E1" : "#475569" },
                    ]}
                  >
                    Utilisez la recherche pour trouver rapidement vos activités
                  </Text>
                </View>
                <View style={styles.modalStepRow}>
                  <View style={styles.modalStepNumber}>
                    <Text style={styles.modalStepNumberText}>3</Text>
                  </View>
                  <Text
                    style={[
                      styles.modalStepText,
                      { color: isDarkMode ? "#CBD5E1" : "#475569" },
                    ]}
                  >
                    Cliquez pour sélectionner ou désélectionner un intérêt
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 400,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Welcome Section
  welcomeSection: {
    alignItems: "flex-start",
    paddingVertical: 8,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  progressIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  progressText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#10B981",
    marginLeft: 6,
  },

  // Header Info Button
  headerInfoButton: {
    padding: 8,
    marginRight: 8,
  },

  // Search Container
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 9999,
    borderWidth: 2,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    marginLeft: 12,
    paddingVertical: 0,
  },

  // Interests Section
  interestsSection: {
    marginBottom: 80,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_MARGIN,
  },
  interestWrapper: {
    width: CARD_SIZE,
  },
  interestCard: {
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: "relative",
  },
  selectedCard: {
    backgroundColor: "#3B82F6",
    borderWidth: 2,
    borderColor: "#2563EB",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  interestText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    textAlign: "center",
    letterSpacing: -0.3,
    lineHeight: 18,
  },

  // Input Accessory View
  inputAccessory: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
  },
  accessoryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 9999,
    gap: 8,
  },
  searchButton: {
    backgroundColor: "#3B82F620",
  },
  addButton: {
    backgroundColor: "#3B82F6",
  },
  accessoryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#3B82F6",
    letterSpacing: -0.3,
  },

  // Skeleton
  skeletonWrapper: {
    width: CARD_SIZE,
  },
  skeletonCard: {
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonContent: {
    width: "80%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "#D1D5DB",
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },

  // Bottom Container
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  continueButton: {
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  continueButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 8,
  },
  modalBody: {
    gap: 16,
  },
  modalStepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  modalStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  modalStepNumberText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  modalStepText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 2,
  },
});

export default AddInterest;
