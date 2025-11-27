import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { auth, db } from "../../config/firebase";
import moment from "moment";
import Animated, { FadeIn } from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import i18n from "../../i18n";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/colors";
import { doc, getDoc } from "@react-native-firebase/firestore";
import { useThemeContext } from "../ThemeProvider";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MyCard = () => {
  const { isDarkMode } = useThemeContext();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUser({ id: userDocSnap.id, ...userDocSnap.data() });
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données utilisateur :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const age = currentUser?.birthDate
    ? moment().diff(moment(currentUser.birthDate), "years")
    : null;

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: isDarkMode ? "#FFFFFF" : "#6B7280" }]}>
          {i18n.t("chargement_de_votre_profil")}
        </Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" }]}>
        <Text style={[styles.emptyText, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>
          {i18n.t("impossible_de_charger_votre_profil")}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" }]}>
      {/* Carte style Partners */}
      <View style={styles.cardsContainer}>
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.card, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }]}
        >
          {/* Image de profil */}
          <View style={styles.imageContainer}>
            <Image
              style={styles.cardImage}
              source={{ uri: currentUser.photoURL }}
              contentFit="cover"
              transition={150}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.5)"]}
              style={styles.imageGradient}
              pointerEvents="none"
            />
          </View>

          {/* Infos utilisateur */}
          <View style={styles.cardContent}>
            {/* Nom et âge */}
            <View style={styles.nameSection}>
              <Text style={[styles.username, { color: isDarkMode ? "#FFFFFF" : "#1F2937" }]} numberOfLines={1}>
                @{currentUser.username}
              </Text>
              {age && (
                <View style={styles.ageBadge}>
                  <Text style={styles.ageText}>{age} {i18n.t("ans")}</Text>
                </View>
              )}
            </View>

            {/* Bio */}
            {currentUser.biography && (
              <Text style={[styles.biography, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]} numberOfLines={2}>
                {currentUser.biography}
              </Text>
            )}

            {/* Localisation */}
            {currentUser.location?.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color={COLORS.primary} />
                <Text style={[styles.infoText, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}>{currentUser.location.address}</Text>
              </View>
            )}

            {/* Intérêts */}
            {(currentUser.interests?.length > 0 || currentUser.interest?.length > 0) && (
              <View style={styles.interestsSection}>
                <View style={styles.interestsHeader}>
                  <Ionicons name="heart" size={14} color={COLORS.primary} />
                  <Text style={[styles.interestsTitle, { color: isDarkMode ? "#6B7280" : "#374151" }]}>
                    {i18n.t("mes_interets")}
                  </Text>
                </View>
                <View style={styles.interestsGrid}>
                  {(currentUser.interests || currentUser.interest || []).slice(0, 4).map((interest, idx) => (
                    <View key={idx} style={styles.interestChip}>
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))}
                  {(currentUser.interests || currentUser.interest || []).length > 4 && (
                    <View style={styles.interestChip}>
                      <Text style={styles.interestText}>
                        +{(currentUser.interests || currentUser.interest).length - 4}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Boutons d'action (désactivés car c'est sa propre carte) */}
            <View style={styles.actionsRow}>
              <View style={styles.rejectButton}>
                <LinearGradient
                  colors={["#EF4444", "#DC2626"]}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </LinearGradient>
              </View>

              <View style={styles.likeButton}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.secondary]}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="heart" size={28} color="#FFFFFF" />
                </LinearGradient>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Badge indicateur */}
      <View style={styles.previewBadge}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.previewBadgeGradient}
        >
          <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
          <Text style={styles.previewBadgeText}>{i18n.t("apercu_de_votre_profil")}</Text>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  cardsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.68,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  imageContainer: {
    width: "100%",
    height: "45%",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "30%",
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  nameSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  username: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#1F2937",
    flex: 1,
  },
  ageBadge: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ageText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.primary,
  },
  biography: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#6B7280",
  },
  interestsSection: {
    marginBottom: 16,
  },
  interestsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  interestsTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#374151",
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  interestChip: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  interestText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.primary,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  rejectButton: {
    borderRadius: 28,
    overflow: "hidden",
    opacity: 0.5,
  },
  likeButton: {
    borderRadius: 28,
    overflow: "hidden",
    opacity: 0.5,
  },
  actionButtonGradient: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  previewBadge: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  previewBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  previewBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});

export default MyCard;
