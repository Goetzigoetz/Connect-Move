import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { collection, getDocs } from "@react-native-firebase/firestore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import i18n from "../../i18n";
import { db } from "../../config/firebase";
import { useThemeContext } from "../ThemeProvider";
import { CommonActions } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../styles/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Skeleton loader simplifié - Sans animation pour meilleures performances
const CategorySkeleton = React.memo(({ isDarkMode, index }) => {
  const widths = ["85%", "60%", "75%", "90%", "70%", "80%", "65%", "95%"];
  const width = widths[index % widths.length];

  return (
    <View
      style={[
        styles.categoryItem,
        {
          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.02)",
          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
        },
      ]}
    >
      <View
        style={[
          styles.skeletonText,
          {
            width,
            backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
          },
        ]}
      />
    </View>
  );
});

// Composant de catégorie optimisé - Sans animations coûteuses
const CategoryItem = React.memo(({ item, isSelected, onPress, isDarkMode }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryItem,
        {
          backgroundColor: isSelected
            ? "#F97316"
            : isDarkMode
            ? "rgba(255, 255, 255, 0.06)"
            : "#FFFFFF",
          borderColor: isSelected
            ? "#F97316"
            : isDarkMode
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.08)",
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
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
              : "#1C1C1E",
            fontFamily: isSelected ? "Inter_700Bold" : "Inter_600SemiBold",
          },
        ]}
        numberOfLines={1}
      >
        {item.name}
      </Text>

      {isSelected && (
        <View style={styles.checkmarkContainer}>
          <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDarkMode === nextProps.isDarkMode
  );
});

export default function FilterScreen({ navigation, route }) {
  const { isDarkMode } = useThemeContext();

  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const scale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);

  const flatListRef = React.useRef(null);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    contentOpacity.value = withTiming(1, { duration: 400 });
    headerTranslateY.value = withSpring(0, { damping: 20, stiffness: 150 });
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const startTime = Date.now();

      const categoriesSnapshot = await getDocs(collection(db, "categories"));

      const categoriesData = categoriesSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }))
        .filter((cat) => !!cat.name && cat.name.trim() !== "")
        .sort((a, b) => a.name.localeCompare(b.name));

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);

      await new Promise((resolve) => setTimeout(resolve, remainingTime));

      setCategories(categoriesData);
      setFilteredCategories(categoriesData);
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories :", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const searchTerm = searchText.trim().toLowerCase();

    if (!searchTerm) {
      setFilteredCategories(categories);
      return;
    }

    // Fonction pour normaliser le texte (enlever les accents)
    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    };

    const normalizedSearch = normalizeText(searchTerm);

    const filtered = categories
      .filter((cat) => {
        const normalizedName = normalizeText(cat.name);
        return normalizedName.includes(normalizedSearch);
      })
      .sort((a, b) => {
        const normalizedA = normalizeText(a.name);
        const normalizedB = normalizeText(b.name);

        // Priorité 1: Les résultats qui commencent par la recherche
        const aStartsWith = normalizedA.startsWith(normalizedSearch);
        const bStartsWith = normalizedB.startsWith(normalizedSearch);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        // Priorité 2: Ordre alphabétique
        return a.name.localeCompare(b.name);
      });

    setFilteredCategories(filtered);

    // Remonter en haut de la liste quand on tape une recherche
    if (flatListRef.current && filtered.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [searchText, categories]);

  const animateOut = (callback) => {
    contentOpacity.value = withTiming(0, { duration: 200 });
    headerTranslateY.value = withTiming(-50, { duration: 200 });
    scale.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    });
  };

  const handleClose = () => {
    animateOut(() => navigation.goBack());
  };

  const handleCategorySelect = useCallback((category) => {
    // Fermer le clavier
    Keyboard.dismiss();

    // Mettre à jour les params de Home AVANT de fermer FilterScreen
    const state = navigation.getState();
    const homeRoute = state.routes.find(r => r.name === 'Home');

    if (homeRoute) {
      // Utiliser dispatch avec l'action setParams ciblant explicitement la route Home
      navigation.dispatch({
        ...CommonActions.setParams({
          selectedCategory: category,
          timestamp: Date.now(),
        }),
        source: homeRoute.key,
      });
    }

    // Puis animer la sortie et fermer
    animateOut(() => {
      navigation.goBack();
    });
  }, [navigation]);

  const backgroundStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: contentOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
    opacity: contentOpacity.value,
  }));

  return (
    <View style={[styles.fullScreen, { backgroundColor: "rgba(0, 0, 0, 0.6)" }]}>
      {/* Background avec blur */}
      <Animated.View
        style={[
          styles.expandingBackground,
          {
            backgroundColor: isDarkMode ? COLORS.bgDark : "#F5F5F7",
          },
          backgroundStyle,
        ]}
      />

      <Animated.View style={[styles.content, contentStyle]}>
        <SafeAreaView style={styles.container}>
          <View style={{ flex: 1 }}>
            {/* Header élégant */}
            <Animated.View style={[styles.header, headerStyle]}>
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={["#FB923C", "#F97316"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <MaterialCommunityIcons
                      name="tune-variant"
                      size={22}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.titleContainer}>
                    <Text
                      style={[
                        styles.title,
                        { color: isDarkMode ? "#FFFFFF" : "#1C1C1E" },
                      ]}
                    >
                      {i18n.t("filtres", { defaultValue: "Filtres" })}
                    </Text>
                    <Text
                      style={[
                        styles.subtitle,
                        { color: isDarkMode ? "#8E8E93" : "#6C6C70" },
                      ]}
                    >
                      {filteredCategories.length}{" "}
                      {filteredCategories.length > 1 ? "catégories" : "catégorie"}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={handleClose}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  })}
                >
                  <View
                    style={[
                      styles.closeButton,
                      {
                        backgroundColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.05)",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={20}
                      color={isDarkMode ? "#FFFFFF" : "#1C1C1E"}
                    />
                  </View>
                </Pressable>
              </View>
            </Animated.View>

            {/* Barre de recherche redessinée */}
            <View style={styles.searchContainer}>
              <View
                style={[
                  styles.searchInputWrapper,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.08)"
                      : "#FFFFFF",
                    borderColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.12)"
                      : "rgba(0, 0, 0, 0.08)",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={isDarkMode ? "#8E8E93" : "#8E8E93"}
                />
                <TextInput
                  placeholder={i18n.t("rechercher_categorie", {
                    defaultValue: "Rechercher",
                  })}
                  placeholderTextColor={isDarkMode ? "#8E8E93" : "#8E8E93"}
                  value={searchText}
                  onChangeText={setSearchText}
                  style={[
                    styles.searchInput,
                    { color: isDarkMode ? "#FFFFFF" : "#1C1C1E" },
                  ]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchText.length > 0 && (
                  <Pressable
                    onPress={() => setSearchText("")}
                    hitSlop={8}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.5 : 1,
                    })}
                  >
                    <View style={styles.clearButton}>
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={18}
                        color={isDarkMode ? "#8E8E93" : "#8E8E93"}
                      />
                    </View>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Liste des catégories avec lazy loading optimisé */}
            <FlatList
              ref={flatListRef}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              data={isLoading ? Array(8).fill({}) : filteredCategories}
              keyExtractor={(item, index) =>
                isLoading ? `skeleton-${index}` : item.id.toString()
              }
              renderItem={({ item, index }) => {
                if (isLoading) {
                  return <CategorySkeleton isDarkMode={isDarkMode} index={index} />;
                }
                const isSelected = selectedCategory?.id === item.id;
                return (
                  <CategoryItem
                    item={item}
                    isSelected={isSelected}
                    onPress={() => handleCategorySelect(item)}
                    isDarkMode={isDarkMode}
                  />
                );
              }}
              // Optimisations de performance maximales
              removeClippedSubviews={Platform.OS === 'android'}
              maxToRenderPerBatch={8}
              updateCellsBatchingPeriod={50}
              initialNumToRender={15}
              windowSize={10}
              getItemLayout={(data, index) => ({
                length: 56,
                offset: 56 * index,
                index,
              })}
              // Désactiver maintainVisibleContentPosition pour de meilleures performances
              disableVirtualization={false}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <View
                    style={[
                      styles.emptyIconContainer,
                      {
                        backgroundColor: isDarkMode
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.03)",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="filter-off-outline"
                      size={32}
                      color={isDarkMode ? "#8E8E93" : "#8E8E93"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: isDarkMode ? "#8E8E93" : "#6C6C70" },
                    ]}
                  >
                    {i18n.t("aucune_categorie_trouvee", {
                      defaultValue: "Aucune catégorie trouvée",
                    })}
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtext,
                      { color: isDarkMode ? "#636366" : "#AEAEB2" },
                    ]}
                  >
                    Essayez un autre terme de recherche
                  </Text>
                </View>
              )}
            />
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  expandingBackground: {
    position: "absolute",
    width: SCREEN_WIDTH * 3,
    height: SCREEN_HEIGHT * 3,
    borderRadius: SCREEN_WIDTH * 1.5,
    bottom: -(SCREEN_HEIGHT * 1.5) + 126,
    right: -(SCREEN_WIDTH * 1.5) + 46,
  },
  content: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  titleContainer: {
    marginLeft: 14,
    flex: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    letterSpacing: -0.6,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    letterSpacing: -0.1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  clearButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  selectedIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
  },
  categoryText: {
    fontSize: 15,
    letterSpacing: -0.3,
    flex: 1,
  },
  checkmarkContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    letterSpacing: -0.1,
    textAlign: "center",
  },
  skeletonText: {
    height: 20,
    borderRadius: 10,
  },
});