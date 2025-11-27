import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  TextInput,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { COLORS } from "../../styles/colors";
import Animated, { FadeInUp } from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import i18n from "../../../i18n";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { validateStep3 } from "../../utils/formValidation";
import { collection, getDocs } from "@react-native-firebase/firestore";
import { db } from "../../../config/firebase";
import { useThemeContext } from "../../ThemeProvider";

const Step3 = ({ onNext, onPrevious, initialData }) => {
  const { isDarkMode } = useThemeContext();

  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialData?.categoryId || "");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const querySnapshot = await getDocs(collection(db, "categories"));
      const fetchedCategories = [];
      querySnapshot.forEach((doc) => {
        fetchedCategories.push({ id: doc.id, ...doc.data() });
      });
      // Sort alphabetically by name
      const sortedCategories = fetchedCategories.sort((a, b) =>
        a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
      );
      setCategories(sortedCategories);
      setFilteredCategories(sortedCategories);
      setLoadingCategories(false);
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories :", error);
      setLoadingCategories(false);
      showMessage({
        message: i18n.t("erreur"),
        description: i18n.t("impossible_charger_categories"),
        type: "danger",
      });
    }
  };

  // Filter categories based on search query
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

  const handleCategorySelect = (categoryId) => {
    const validation = validateStep3({ categoryId });

    if (validation.isValid) {
      setSelectedCategory(categoryId);
      setErrors({});
      // Auto-advance to next step
      onNext({ categoryId });
    } else {
      setErrors(validation.errors);
      showMessage({
        message: i18n.t("erreur"),
        description: validation.errors.categoryId,
        type: "warning",
      });
    }
  };

  const CategoryItem = ({ item, isSelected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.categoryItem,
        {
          backgroundColor: isSelected
            ? COLORS.primary
            : isDarkMode
            ? COLORS.bgDarkTertiary
            : "#FFFFFF",
          borderColor: isSelected
            ? COLORS.primary
            : isDarkMode
            ? "#2F3336"
            : "#E5E7EB",
        },
      ]}
    >
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      )}

      <Text
        style={[
          styles.categoryText,
          {
            color: isSelected
              ? "#FFFFFF"
              : isDarkMode
              ? "#FFFFFF"
              : "#1F2937",
            fontFamily: isSelected ? "Inter_700Bold" : "Inter_600SemiBold",
          },
        ]}
        numberOfLines={1}
      >
        {item.name}
      </Text>

      {isSelected && (
        <View style={styles.checkmarkContainer}>
          <MaterialCommunityIcons name="check-circle" size={22} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );

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
            {i18n.t("selectionnez_une_categorie")}
          </Text>
          <Text
            style={[
              styles.mainSubtitle,
              { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
            ]}
          >
            {i18n.t("donnez_tous_les_details")}
          </Text>
        </View>

        {/* Search Input */}
        <View
          style={[
            styles.searchCard,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderColor: isDarkMode ? "#2F3336" : "#E5E7EB",
            },
          ]}
        >
          <View
            style={[
              styles.searchInputWrapper,
              {
                borderColor: focusedField === "search"
                  ? COLORS.primary
                  : isDarkMode
                  ? "#1F2937"
                  : "#D1D5DB",
                backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFFF",
              },
            ]}
          >
            <Ionicons
              name="search"
              size={18}
              color={isDarkMode ? "#6B7280" : "#9CA3AF"}
              style={{ marginRight: 8 }}
            />
            <TextInput
              ref={searchInputRef}
              style={[
                styles.searchInput,
                { color: isDarkMode ? "#FFFFFF" : "#111827", flex: 1 },
              ]}
              placeholder={i18n.t("rechercher_categorie")}
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setFocusedField("search")}
              onBlur={() => setFocusedField(null)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section Catégorie */}
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
              <Ionicons name="grid-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {i18n.t("categorie")}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {i18n.t("choisir_categorie")}
              </Text>
            </View>
          </View>

          {loadingCategories ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text
                style={[
                  styles.loadingText,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {i18n.t("chargement_categories")}
              </Text>
            </View>
          ) : filteredCategories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={48}
                color={isDarkMode ? "#6B7280" : "#9CA3AF"}
              />
              <Text
                style={[
                  styles.emptyText,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {i18n.t("aucune_categorie")}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CategoryItem
                  item={item}
                  isSelected={selectedCategory === item.id}
                  onPress={() => handleCategorySelect(item.id)}
                />
              )}
              scrollEnabled={false}
              contentContainerStyle={styles.categoriesList}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )}

          {errors.categoryId && (
            <Text style={styles.errorText}>{errors.categoryId}</Text>
          )}
        </View>
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  categoriesList: {
    paddingTop: 8,
  },
  categoryItem: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  categoryText: {
    fontSize: 15,
    flex: 1,
    letterSpacing: 0.2,
  },
  checkmarkContainer: {
    marginLeft: 8,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 12,
  },
});

export default Step3;
