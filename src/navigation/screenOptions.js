import { TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { COLORS } from "../styles/colors";

/**
 * Configuration centralisée des options de navigation pour toutes les pages
 *
 * @param {Object} options - Options de configuration
 * @param {boolean} options.isDarkMode - Mode sombre activé
 * @param {string} options.icon - Icône du bouton retour (défaut: "arrow-back")
 * @param {Function} options.onBackPress - Fonction personnalisée pour le bouton retour
 * @param {boolean} options.showHeader - Afficher le header (défaut: true)
 * @param {string} options.headerTitle - Titre personnalisé du header
 * @param {number} options.headerTitleSize - Taille du titre (défaut: 18)
 * @param {string} options.headerTitleWeight - Poids du titre (défaut: "600")
 * @param {Object} options.headerStyle - Style personnalisé du header
 * @param {Object} options.headerTitleStyle - Style personnalisé du titre
 * @param {number} options.backButtonSize - Taille du bouton retour (défaut: 24)
 * @param {Object} options.backButtonStyle - Style du bouton retour
 */
export const getScreenOptions = ({
  isDarkMode = false,
  icon = "arrow-back",
  onBackPress = null,
  showHeader = true,
  headerTitle = null,
  headerTitleSize = 15,
  headerTitleWeight = "600",
  headerStyle = {},
  headerTitleStyle = {},
  backButtonSize = 24,
  backButtonStyle = {},
} = {}) => {
  return ({ navigation, route }) => {
    const isReferralPage = route.name === "ReferralPage";
    const { t } = useTranslation();

    const handlePress = () => {
      // Si une fonction personnalisée est fournie, l'utiliser
      if (onBackPress) {
        onBackPress(navigation, route);
        return;
      }

      // Logique par défaut
      if (isReferralPage) {
        navigation.goBack();
        navigation.reset({
          index: 0,
          routes: [{ name: "Activités", params: { screen: "Home" } }],
        });
      } else {
        navigation.goBack();
      }
    };

    // Style uniforme du header
    const defaultHeaderStyle = {
      backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF",
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 0.5,
      borderBottomColor: isDarkMode ? COLORS.borderDark : "#E5E7EB",
      height: Platform.OS === "ios" ? 94 : 56,
      ...headerStyle,
    };

    // Style uniforme du titre
    const defaultHeaderTitleStyle = {
      fontSize: headerTitleSize,
      fontFamily: headerTitleWeight === "700" ? "Inter_700Bold" :
                 headerTitleWeight === "600" ? "Inter_600SemiBold" :
                 headerTitleWeight === "500" ? "Inter_500Medium" : "Inter_400Regular",
      letterSpacing: -0.3,
      color: isDarkMode ? "#FFFFFF" : "#000000",
      ...headerTitleStyle,
    };

    // Style du bouton retour
    const defaultBackButtonStyle = {
      marginLeft: Platform.OS === "ios" ? 0 : 4,
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderRadius: 20,
      ...backButtonStyle,
    };

    return {
      headerShown: showHeader,
      headerStyle: defaultHeaderStyle,
      headerTintColor: isDarkMode ? COLORS.bgDarkTertiary : "#FFFFF",
      headerTitleStyle: defaultHeaderTitleStyle,
      headerTitle: headerTitle || route.params?.title || "",
      headerTitleAlign: "center",
      headerLeft: () => (
        <TouchableOpacity
          onPress={handlePress}
          style={defaultBackButtonStyle}
          activeOpacity={0.6}
        >
          <Ionicons
            name={icon}
            size={backButtonSize}
            color={isDarkMode ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>
      ),
      // Options de transition pour une navigation fluide
      animation: Platform.OS === "ios" ? "default" : "slide_from_right",
      presentation: "card",
      gestureEnabled: true,
      gestureDirection: "horizontal",
    };
  };
};
