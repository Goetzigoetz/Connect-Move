import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  InputAccessoryView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
  FadeInDown,
} from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import { useThemeContext } from "../../../ThemeProvider";
import { collection, getDocs } from "@react-native-firebase/firestore";
import { db } from "../../../../config/firebase";
import { COLORS } from "../../../styles/colors";

const { width, height } = Dimensions.get("window");

const OnboardingStep4 = ({ userData, onNext, onBack }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();
  const [interests, setInterests] = useState(userData.interests || []);
  const [allInterests, setAllInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const searchScale = useSharedValue(1);
  const inputAccessoryViewID = "onboardingStep4Accessory";

  // Animations
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);
  const float4 = useSharedValue(0);
  const float5 = useSharedValue(0);
  const float6 = useSharedValue(0);
  const float7 = useSharedValue(0);
  const float8 = useSharedValue(0);
  const rotate = useSharedValue(0);
  const rotate2 = useSharedValue(0);
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    float1.value = withRepeat(withTiming(40, { duration: 3500, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float2.value = withRepeat(withTiming(-35, { duration: 4200, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float3.value = withRepeat(withTiming(28, { duration: 5000, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float4.value = withRepeat(withTiming(-22, { duration: 3800, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float5.value = withRepeat(withTiming(32, { duration: 4500, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float6.value = withRepeat(withTiming(-30, { duration: 4100, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float7.value = withRepeat(withTiming(25, { duration: 3600, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    float8.value = withRepeat(withTiming(-28, { duration: 4700, easing: Easing.bezier(0.42, 0, 0.58, 1) }), -1, true);
    rotate.value = withRepeat(withTiming(360, { duration: 20000, easing: Easing.linear }), -1, false);
    rotate2.value = withRepeat(withTiming(-360, { duration: 18000, easing: Easing.linear }), -1, false);
    fadeAnim.value = withTiming(1, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });

    fetchInterests();
  }, []);

  const circle1Style = useAnimatedStyle(() => ({ transform: [{ translateY: float1.value }, { translateX: float1.value * 0.5 }, { rotate: `${rotate.value}deg` }] }));
  const circle2Style = useAnimatedStyle(() => ({ transform: [{ translateY: float2.value }, { translateX: float2.value * -0.3 }, { rotate: `${-rotate.value}deg` }] }));
  const circle3Style = useAnimatedStyle(() => ({ transform: [{ translateY: float3.value }, { translateX: float3.value * 0.7 }] }));
  const circle4Style = useAnimatedStyle(() => ({ transform: [{ translateY: float4.value }, { translateX: float4.value * -0.5 }] }));
  const circle5Style = useAnimatedStyle(() => ({ transform: [{ translateY: float5.value }, { translateX: float5.value * 0.4 }, { scale: interpolate(float5.value, [0, 32], [1, 1.15]) }] }));
  const circle6Style = useAnimatedStyle(() => ({ transform: [{ translateY: float6.value }, { translateX: float6.value * 0.6 }, { rotate: `${rotate.value}deg` }] }));
  const circle7Style = useAnimatedStyle(() => ({ transform: [{ translateY: float7.value }, { translateX: float7.value * -0.4 }, { rotate: `${rotate2.value}deg` }] }));
  const circle8Style = useAnimatedStyle(() => ({ transform: [{ translateY: float8.value }, { translateX: float8.value * 0.3 }, { scale: interpolate(float8.value, [-28, 0], [1.1, 1]) }] }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value, transform: [{ translateY: interpolate(fadeAnim.value, [0, 1], [20, 0]) }] }));

  const fetchInterests = async () => {
    try {
      const interestsSnapshot = await getDocs(collection(db, "interests"));
      const dbInterests = interestsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Find custom interests that don't exist in the database
      const dbInterestNames = dbInterests.map(i => i.name);
      const customInterests = interests
        .filter(name => !dbInterestNames.includes(name))
        .map(name => ({
          id: `custom_${name}`,
          name: name
        }));

      // Merge database interests with custom interests
      setAllInterests([...dbInterests, ...customInterests]);
    } catch (error) {
      console.error("Erreur lors de la récupération des intérêts :", error);
      showMessage({
        message: "Erreur lors du chargement des activités",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interestName) => {
    setInterests((prev) => {
      if (prev.includes(interestName)) {
        return prev.filter((i) => i !== interestName);
      } else {
        return [...prev, interestName];
      }
    });
  };

  const addCustomInterest = () => {
    const interestToAdd = searchQuery.trim();
    if (!interestToAdd) return;

    // Check if interest already exists
    const existingInterest = allInterests.find(
      (interest) => interest.name.toLowerCase() === interestToAdd.toLowerCase()
    );

    if (existingInterest) {
      // If it exists, just select it
      if (!interests.includes(existingInterest.name)) {
        setInterests([...interests, existingInterest.name]);
      }
    } else {
      // Add to allInterests array
      const newInterest = {
        id: `custom_${Date.now()}`,
        name: interestToAdd,
      };
      setAllInterests([...allInterests, newInterest]);

      // Automatically select it
      setInterests([...interests, interestToAdd]);
    }

    // Reset search but keep focus
    setSearchQuery("");
    if (searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  };

  const handleFocus = () => {
    setIsSearchFocused(true);
    searchScale.value = withTiming(1.02, {
      damping: 15,
      stiffness: 150,
    });
  };

  const handleBlur = () => {
    setIsSearchFocused(false);
    searchScale.value = withTiming(1, {
      damping: 15,
      stiffness: 150,
    });
  };

  const animatedSearchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));

  const handleContinue = () => {
    if (interests.length === 0) {
      showMessage({
        message: t("onboarding_step4_error"),
        type: "warning",
      });
      return;
    }

    onNext({ interests });
  };

  const filteredInterests = allInterests
    .filter((interest) =>
      interest.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aSelected = interests.includes(a.name);
      const bSelected = interests.includes(b.name);

      // Les sélectionnés en premier
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });

  return (
    <View style={styles.container}>
      {/* Animated sport icons background */}
      <Animated.View style={[styles.sportShape, styles.shape1, circle1Style]}>
        <Ionicons name="basketball-outline" size={90} color={isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.28)"} />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape2, circle2Style]}>
        <Ionicons name="football-outline" size={110} color={isDarkMode ? "rgba(255, 255, 255, 0.13)" : "rgba(255, 255, 255, 0.25)"} />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape3, circle3Style]}>
        <Ionicons name="bicycle-outline" size={75} color={isDarkMode ? "rgba(255, 255, 255, 0.11)" : "rgba(255, 255, 255, 0.22)"} />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape4, circle4Style]}>
        <Ionicons name="tennisball-outline" size={70} color={isDarkMode ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.26)"} />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape5, circle5Style]}>
        <Ionicons name="barbell-outline" size={85} color={isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.24)"} />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape6, circle6Style]}>
        <Ionicons name="american-football-outline" size={65} color={isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.23)"} />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape7, circle7Style]}>
        <Ionicons name="baseball-outline" size={60} color={isDarkMode ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.27)"} />
      </Animated.View>
      <Animated.View style={[styles.sportShape, styles.shape8, circle8Style]}>
        <Ionicons name="golf-outline" size={55} color={isDarkMode ? "rgba(255, 255, 255, 0.11)" : "rgba(255, 255, 255, 0.21)"} />
      </Animated.View>


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
          bounces={false}
        >
        <Animated.View style={[styles.content, contentStyle]}>
{/* Title */}
          {!isSearchFocused && (
            <>
              <Text style={styles.title}>{t("onboarding_step4_title")}</Text>
              <Text style={styles.subtitle}>
                {t("onboarding_step4_subtitle")}
                {interests.length > 0 && ` (${interests.length} ${interests.length > 1 ? t("onboarding_step4_selected_plural") : t("onboarding_step4_selected")})`}
              </Text>
            </>
          )}

          {/* Search Bar */}
          <Animated.View
            style={[
              styles.searchContainer,
              {
                borderColor: isSearchFocused ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)",
              },
              animatedSearchStyle,
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={isSearchFocused ? "#FFFFFF" : "rgba(255, 255, 255, 0.7)"}
            />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder={t("onboarding_step4_search_placeholder")}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={handleFocus}
              onBlur={handleBlur}
              returnKeyType="search"
              autoFocus={true}
              inputAccessoryViewID={inputAccessoryViewID}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color="rgba(255, 255, 255, 0.7)"
                />
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Interests Grid */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.interestsGrid}>
              {filteredInterests.map((interest, index) => {
                const isSelected = interests.includes(interest.name);
                return (
                  <Animated.View
                    key={interest.id}
                    entering={FadeInDown.delay(index * 20)}
                    style={styles.interestWrapper}
                  >
                    <TouchableOpacity
                      style={[
                        styles.interestCard,
                        isSelected && styles.interestCardSelected,
                      ]}
                      onPress={() => toggleInterest(interest.name)}
                      activeOpacity={0.7}
                    >
                      {interest.icon && (
                        <Text style={styles.interestIcon}>{interest.icon}</Text>
                      )}
                      <Text
                        style={[
                          styles.interestName,
                          isSelected && styles.interestNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {interest.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkmark}>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={COLORS.primary}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {/* No results message */}
          {!loading && filteredInterests.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="emoticon-sad-outline"
                size={48}
                color="rgba(255, 255, 255, 0.6)"
              />
              <Text style={styles.emptyText}>
                Aucun intérêt trouvé
              </Text>
              {searchQuery.trim().length > 0 ? (
                <>
                  <Text style={styles.emptySubtext}>
                    Voulez-vous ajouter cet intérêt ?
                  </Text>
                  <TouchableOpacity
                    style={styles.addInterestButton}
                    onPress={addCustomInterest}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="plus-circle"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.addInterestButtonText}>
                      Ajouter "{searchQuery.trim()}"
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.emptySubtext}>
                  Utilisez la recherche pour ajouter votre propre intérêt
                </Text>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Buttons - Fixed */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={styles.continueButtonText}>Continuer</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>

      {/* Input Accessory View pour iOS */}
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={styles.inputAccessory}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  sportShape: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center"
  },
  shape1: { top: height * 0.08, left: width * 0.05 },
  shape2: { top: height * 0.15, right: width * 0.08 },
  shape3: { bottom: height * 0.06, left: width * 0.08 },
  shape4: { bottom: height * 0.08, right: width * 0.15 },
  shape5: { top: height * 0.35, right: width * 0.05 },
  shape6: { bottom: height * 0.2, right: width * 0.6 },
  shape7: { top: height * 0.1, right: width * 0.5 },
  shape8: { bottom: height * 0.22, left: width * 0.35 },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 200
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40
  },
title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 9999,
    borderWidth: 2,
    marginBottom: 24
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    marginLeft: 12,
    paddingVertical: 0,
    color: "#FFFFFF"
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-start"
  },
  interestWrapper: {
    width: "31%"
  },
  interestCard: {
    width: "100%",
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative"
  },
  interestCardSelected: {
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.95)"
  },
  interestIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  interestName: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center"
  },
  interestNameSelected: {
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold"
  },
  checkmark: {
    position: "absolute",
    top: 6,
    right: 6
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center"
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginBottom: 16
  },
  addInterestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 9999,
    gap: 8,
    marginTop: 8,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  addInterestButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: -0.3
  },
  inputAccessory: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    backgroundColor: "#FFFFFF",
    borderTopColor: "#E2E8F0"
  },
  accessoryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 9999,
    gap: 8
  },
  searchButton: {
    backgroundColor: "#3B82F620"
  },
  addButton: {
    backgroundColor: "#3B82F6"
  },
  accessoryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#3B82F6",
    letterSpacing: -0.3
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 5,
    paddingBottom: 0
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 18,
    borderRadius: 9999,
    gap: 8,
    flex: 1
  },
  backButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 17
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    borderRadius: 9999,
    gap: 8,
    flex: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  continueButtonText: {
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
    fontSize: 17
  },
});

export default OnboardingStep4;
