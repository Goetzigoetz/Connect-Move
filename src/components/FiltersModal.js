import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from "react-native";
import { useThemeContext } from "../ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../styles/colors";
import i18n from "../../i18n";

const FiltersModal = ({ visible, onClose, filters, onApplyFilters }) => {
  const { isDarkMode } = useThemeContext();

  const [localFilters, setLocalFilters] = useState(filters);

  // Sync localFilters with external filters when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation - plus rapide et plus fluide
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const distanceOptions = [
    { label: "5 km", value: 5 },
    { label: "10 km", value: 10 },
    { label: "25 km", value: 25 },
    { label: "50 km", value: 50 },
  ];

  const genderOptions = [
    { label: i18n.t("tous"), value: "all" },
    { label: i18n.t("homme"), value: "male" },
    { label: i18n.t("femme"), value: "female" },
  ];

  const commonInterestsOptions = [
    { label: "Au moins 1", value: 1 },
    { label: "Au moins 2", value: 2 },
    { label: "Au moins 3", value: 3 },
    { label: "Au moins 5", value: 5 },
  ];

  const expertiseLevelOptions = [
    { label: i18n.t("debutant"), value: "beginner" },
    { label: i18n.t("intermediaire"), value: "intermediate" },
    { label: i18n.t("avance"), value: "advanced" },
    { label: i18n.t("expert"), value: "expert" },
  ];

  const ageRangeOptions = [
    { label: "18-25", range: [18, 25] },
    { label: "26-35", range: [26, 35] },
    { label: "36-45", range: [36, 45] },
    { label: "46-55", range: [46, 55] },
    { label: "56-65", range: [56, 65] },
    { label: i18n.t("tous"), range: [18, 65] },
  ];

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters = {
      maxDistance: 50,
      ageRange: [18, 65],
      gender: "all",
      minCommonInterests: 1,
      expertiseLevels: [],
    };
    setLocalFilters(defaultFilters);
  };

  const toggleExpertiseLevel = (level) => {
    const currentLevels = localFilters.expertiseLevels || [];
    if (currentLevels.includes(level)) {
      setLocalFilters({
        ...localFilters,
        expertiseLevels: currentLevels.filter((l) => l !== level),
      });
    } else {
      setLocalFilters({
        ...localFilters,
        expertiseLevels: [...currentLevels, level],
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text
              style={[
                styles.modalTitle,
                { color: isDarkMode ? "#FAFAFA" : "#1F2937" },
              ]}
            >
              {i18n.t("filtres")}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={28}
                color={isDarkMode ? "#A1A1AA" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
            bounces={true}
            alwaysBounceVertical={true}
            contentContainerStyle={styles.scrollViewContent}
          >
            {/* Distance maximale */}
            <View style={styles.filterSection}>
              <Text
                style={[
                  styles.filterLabel,
                  { color: isDarkMode ? "#FAFAFA" : "#374151" },
                ]}
              >
                {i18n.t("distance_maximale")}
              </Text>
              <View style={styles.distanceButtons}>
                {distanceOptions.map((option) => {
                  const isSelected = localFilters.maxDistance === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() =>
                        setLocalFilters({
                          ...localFilters,
                          maxDistance: option.value,
                        })
                      }
                      activeOpacity={0.7}
                      style={styles.chipButton}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={[COLORS.primary, COLORS.secondary]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.chipGradient}
                        >
                          <Text style={styles.chipTextSelected}>
                            {option.label}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View
                          style={[
                            styles.chipInactive,
                            {
                              backgroundColor: isDarkMode
                                ? "#27272A"
                                : "#F3F4F6",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipTextInactive,
                              { color: isDarkMode ? "#A1A1AA" : "#6B7280" },
                            ]}
                          >
                            {option.label}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tranche d'âge */}
            <View style={styles.filterSection}>
              <Text
                style={[
                  styles.filterLabel,
                  { color: isDarkMode ? "#FAFAFA" : "#374151" },
                ]}
              >
                {i18n.t("tranche_age")}
              </Text>

              <View style={styles.optionsGrid}>
                {ageRangeOptions.map((option) => {
                  const isSelected =
                    localFilters.ageRange[0] === option.range[0] &&
                    localFilters.ageRange[1] === option.range[1];
                  return (
                    <TouchableOpacity
                      key={option.label}
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor: isDarkMode ? "#27272A" : "#FFFFFF",
                          borderColor: isDarkMode ? "#3F3F46" : "#E5E7EB",
                        },
                      ]}
                      onPress={() =>
                        setLocalFilters({
                          ...localFilters,
                          ageRange: option.range,
                        })
                      }
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <LinearGradient
                          colors={[COLORS.primary, COLORS.secondary]}
                          style={styles.optionButtonGradient}
                        />
                      )}
                      <Text
                        style={[
                          styles.optionButtonText,
                          {
                            color: isSelected
                              ? "#FFFFFF"
                              : isDarkMode
                              ? "#FAFAFA"
                              : "#374151",
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Genre */}
            <View style={styles.filterSection}>
              <Text
                style={[
                  styles.filterLabel,
                  { color: isDarkMode ? "#FAFAFA" : "#374151" },
                ]}
              >
                {i18n.t("genre")}
              </Text>
              <View style={styles.genderButtons}>
                {genderOptions.map((option) => {
                  const isSelected = localFilters.gender === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() =>
                        setLocalFilters({
                          ...localFilters,
                          gender: option.value,
                        })
                      }
                      activeOpacity={0.7}
                      style={styles.chipButton}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={[COLORS.primary, COLORS.secondary]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.chipGradient}
                        >
                          <Text style={styles.chipTextSelected}>
                            {option.label}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View
                          style={[
                            styles.chipInactive,
                            {
                              backgroundColor: isDarkMode
                                ? "#27272A"
                                : "#F3F4F6",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipTextInactive,
                              { color: isDarkMode ? "#A1A1AA" : "#6B7280" },
                            ]}
                          >
                            {option.label}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Intérêts communs minimum */}
            <View style={styles.filterSection}>
              <Text
                style={[
                  styles.filterLabel,
                  { color: isDarkMode ? "#FAFAFA" : "#374151" },
                ]}
              >
                {i18n.t("interets_communs_minimum")}
              </Text>
              <View style={styles.interestsButtons}>
                {commonInterestsOptions.map((option) => {
                  const isSelected =
                    localFilters.minCommonInterests === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() =>
                        setLocalFilters({
                          ...localFilters,
                          minCommonInterests: option.value,
                        })
                      }
                      activeOpacity={0.7}
                      style={styles.chipButton}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={[COLORS.primary, COLORS.secondary]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.chipGradient}
                        >
                          <Text style={styles.chipTextSelected}>
                            {option.label}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View
                          style={[
                            styles.chipInactive,
                            {
                              backgroundColor: isDarkMode
                                ? "#27272A"
                                : "#F3F4F6",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipTextInactive,
                              { color: isDarkMode ? "#A1A1AA" : "#6B7280" },
                            ]}
                          >
                            {option.label}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Niveau d'expertise (optionnel) */}
            <View style={[styles.filterSection, { marginBottom: 24 }]}>
              <View style={styles.labelRow}>
                <Text
                  style={[
                    styles.filterLabel,
                    { color: isDarkMode ? "#FAFAFA" : "#374151" },
                  ]}
                >
                  {i18n.t("niveau_expertise")}
                </Text>
                <Text
                  style={[
                    styles.optionalLabel,
                    { color: isDarkMode ? "#71717A" : "#9CA3AF" },
                  ]}
                >
                  (Optionnel)
                </Text>
              </View>
              <View style={styles.expertiseButtons}>
                {expertiseLevelOptions.map((option) => {
                  const isSelected = (localFilters.expertiseLevels || []).includes(
                    option.value
                  );
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => toggleExpertiseLevel(option.value)}
                      activeOpacity={0.7}
                      style={styles.chipButton}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={[COLORS.primary, COLORS.secondary]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.chipGradient}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#FFFFFF"
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.chipTextSelected}>
                            {option.label}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View
                          style={[
                            styles.chipInactive,
                            {
                              backgroundColor: isDarkMode
                                ? "#27272A"
                                : "#F3F4F6",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipTextInactive,
                              { color: isDarkMode ? "#A1A1AA" : "#6B7280" },
                            ]}
                          >
                            {option.label}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer buttons */}
          <View
            style={[
              styles.modalFooter,
              {
                borderTopColor: isDarkMode ? "#27272A" : "#E5E7EB",
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleReset}
              style={[
                styles.resetButton,
                { backgroundColor: isDarkMode ? "#27272A" : "#F3F4F6" },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.resetButtonText,
                  { color: isDarkMode ? "#FAFAFA" : "#374151" },
                ]}
              >
                {i18n.t("reinitialiser")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              style={styles.applyButton}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.applyButtonGradient}
              >
                <Text style={styles.applyButtonText}>{i18n.t("appliquer")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  scrollViewContent: {
    paddingBottom: 12,
  },
  filterSection: {
    marginBottom: 28,
  },
  filterLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  rangeValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  optionalLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  distanceButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genderButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestsButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  expertiseButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1.5,
    minWidth: 90,
  },
  optionButtonGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  optionButtonText: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  chipButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  chipGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipInactive: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  chipTextInactive: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  resetButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  applyButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  applyButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});

export default FiltersModal;
