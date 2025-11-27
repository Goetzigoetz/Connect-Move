import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, Share } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../ThemeProvider";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import CommentPreview from "./CommentPreview";
import SocialActions from "./SocialActions";
import i18n from "../../i18n";
import { getDistance } from "geolib";
import { auth } from "../../config/firebase";
import { COLORS } from "../styles/colors";

/**
 * ActivityCard - Carte d'activité refactorisée avec architecture claire
 *
 * Structure:
 * 1. Header: Avatar + Nom de l'auteur + Menu
 * 2. Image: Photo de l'activité avec overlay gradient
 * 3. Info Bar: Date + Localisation à gauche, Like + Partage à droite
 * 4. Description: Titre + Description
 * 5. Footer: Aperçu commentaire + Input commentaire
 */
const ActivityCard = ({
  activity,
  userInfo,
  userPostalCode,
  onLoginRequired,
}) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeContext();

  // Données de l'activité
  const imageUrl = activity.images?.[0];
  const creatorName = activity.creatorName || "Anonyme";
  const creatorAvatar = activity.creatorAvatar;

  // Calculer les jours restants
  const calculateDaysRemaining = (dateString) => {
    if (!dateString) return "";
    try {
      let eventDate;
      // Si c'est déjà un objet Date (activityDate)
      if (activity.activityDate instanceof Date) {
        eventDate = activity.activityDate;
      } else {
        // Sinon parser le format DD/MM/YYYY
        const parts = dateString.split("/");
        eventDate = new Date(parts[2], parts[1] - 1, parts[0]);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);

      const diffTime = eventDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Aujourd'hui";
      if (diffDays === 1) return "Demain";
      if (diffDays > 1) return `Dans ${diffDays} jours`;
      return eventDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Formater la localisation
  const formatLocationText = (location) => {
    if (!location) return "";
    // Si c'est une string, la retourner directement
    if (typeof location === "string") return location;
    // Si c'est un objet avec city et postalCode
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.postalCode) parts.push(location.postalCode);
    return parts.join(", ");
  };

  // Calculer la distance si possible
  const calculateDistance = () => {
    // Si l'activité a déjà une distance calculée (distanceForSort), l'utiliser
    if (
      activity.distanceForSort !== null &&
      activity.distanceForSort !== undefined &&
      activity.distanceForSort !== Infinity &&
      !isNaN(activity.distanceForSort)
    ) {
      const distanceInKm = (activity.distanceForSort / 1000).toFixed(1);
      return distanceInKm;
    }
    return null;
  };

  const daysRemaining = calculateDaysRemaining(activity.date);
  const locationText = formatLocationText(activity.location);
  const distance = calculateDistance();

  const handleCardPress = () => {
    navigation.navigate("ActivityDetails", { activity });
  };

  const handleCommentPress = () => {
    // Vérifier si l'utilisateur est connecté
    const { auth } = require("../../config/firebase");
    const currentUser = auth.currentUser;

    if (!currentUser) {
      onLoginRequired("comment");
      return;
    }

    navigation.navigate("AddComment", { activityId: activity.id });
  };

  const handleViewAllComments = () => {
    // TODO: Créer CommentsModal pour afficher tous les commentaires
    // Pour l'instant, ouvrir AddComment
    handleCommentPress();
  };

  const handleOptionsPress = () => {
    const currentUser = auth.currentUser;
    const isOwner = currentUser && currentUser.uid === activity.creatorId;

    const options = isOwner
      ? [
          { text: i18n.t("modifier", { defaultValue: "Modifier" }), onPress: () => handleEditActivity() },
          { text: i18n.t("supprimer", { defaultValue: "Supprimer" }), onPress: () => handleDeleteActivity(), style: "destructive" },
          { text: i18n.t("partager", { defaultValue: "Partager" }), onPress: () => handleShareActivity() },
          { text: i18n.t("annuler", { defaultValue: "Annuler" }), style: "cancel" },
        ]
      : [
          { text: i18n.t("signaler", { defaultValue: "Signaler" }), onPress: () => handleReportActivity() },
          { text: i18n.t("partager", { defaultValue: "Partager" }), onPress: () => handleShareActivity() },
          { text: i18n.t("annuler", { defaultValue: "Annuler" }), style: "cancel" },
        ];

    Alert.alert(
      i18n.t("options", { defaultValue: "Options" }),
      "",
      options
    );
  };

  const handleEditActivity = () => {
    navigation.navigate("EditEvent", { activityId: activity.id });
  };

  const handleDeleteActivity = () => {
    Alert.alert(
      i18n.t("confirmation", { defaultValue: "Confirmation" }),
      i18n.t("confirmer_suppression_activite", { defaultValue: "Êtes-vous sûr de vouloir supprimer cette activité ?" }),
      [
        { text: i18n.t("annuler", { defaultValue: "Annuler" }), style: "cancel" },
        {
          text: i18n.t("supprimer", { defaultValue: "Supprimer" }),
          style: "destructive",
          onPress: async () => {
            try {
              const { db } = require("../../config/firebase");
              const { doc, deleteDoc } = require("firebase/firestore");
              await deleteDoc(doc(db, "activities", activity.id));
              Alert.alert(i18n.t("succes", { defaultValue: "Succès" }), i18n.t("activite_supprimee", { defaultValue: "Activité supprimée avec succès" }));
            } catch (error) {
              console.error("Erreur lors de la suppression:", error);
              Alert.alert(i18n.t("erreur", { defaultValue: "Erreur" }), i18n.t("erreur_suppression", { defaultValue: "Impossible de supprimer l'activité" }));
            }
          },
        },
      ]
    );
  };

  const handleReportActivity = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      onLoginRequired("report");
      return;
    }
    navigation.navigate("ReportReasonScreen", {
      activityId: activity.id,
      type: "activity"
    });
  };

  const handleShareActivity = async () => {
    try {
      await Share.share({
        message: `${activity.title}\n\n${activity.description}\n\nDécouvrez cette activité sur Connectmove !`,
        title: activity.title,
      });
    } catch (error) {
      console.error("Erreur lors du partage:", error);
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify().damping(18)}
      exiting={FadeOutDown.duration(300)}
      style={[
        styles.card,
        {
          backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
          shadowColor: isDarkMode ? COLORS.bgDark : "#0F172A",
        },
      ]}
    >
      {/* ========== HEADER: Auteur ========== */}
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            navigation.navigate("Profile", { userId: activity.creatorId })
          }
          style={styles.authorInfo}
        >
          <Image
            source={{ uri: creatorAvatar || "https://via.placeholder.com/40" }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View>
            <Text
              style={[
                styles.authorName,
                { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
              ]}
            >
              {creatorName}
            </Text>
            <Text
              style={[
                styles.authorSubtitle,
                { color: isDarkMode ? "#64748B" : "#94A3B8" },
              ]}
            >
              {daysRemaining}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={handleOptionsPress}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            padding: 8,
          })}
        >
          <MaterialCommunityIcons
            name="dots-horizontal"
            size={24}
            color={isDarkMode ? "#94A3B8" : "#64748B"}
          />
        </Pressable>
      </View>

      {/* ========== IMAGE avec overlay (si image disponible) ========== */}
      {imageUrl ? (
        <Pressable onPress={handleCardPress} style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
          />

          {/* Overlay gradient pour le titre */}
          <LinearGradient
            colors={["transparent", "rgba(0, 0, 0, 0.7)"]}
            style={styles.imageOverlay}
          >
            <Text style={styles.activityTitle} numberOfLines={2}>
              {activity.title}
            </Text>
          </LinearGradient>

          {/* Badge PRO/PERSO */}
          {activity.creatorSub && (
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor:
                    activity.creatorSub === "pro" ||
                    activity.creatorSub === "premium"
                      ? "rgba(16, 185, 129, 0.95)"
                      : "rgba(59, 130, 246, 0.95)",
                },
              ]}
            >
              <Text style={styles.categoryText}>
                {activity.creatorSub === "pro" ||
                activity.creatorSub === "premium"
                  ? "PRO"
                  : "PERSO"}
              </Text>
            </View>
          )}
        </Pressable>
      ) : (
        /* ========== TITRE SANS IMAGE (version alternative) ========== */
        <Pressable onPress={handleCardPress}>
          <View
            style={[
              styles.titleContainerNoImage,
              {
                backgroundColor: isDarkMode
                  ? "rgba(249, 115, 22, 0.08)"
                  : "rgba(249, 115, 22, 0.04)",
              },
            ]}
          >
            <LinearGradient
              colors={[
                isDarkMode ? "rgba(249, 115, 22, 0.15)" : "rgba(249, 115, 22, 0.08)",
                isDarkMode ? "rgba(139, 92, 246, 0.12)" : "rgba(139, 92, 246, 0.06)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.titleGradientNoImage}
            >
              <Text
                style={[
                  styles.activityTitleNoImage,
                  { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
                ]}
                numberOfLines={3}
              >
                {activity.title}
              </Text>

              {/* Badge PRO/PERSO pour version sans image */}
              {activity.creatorSub && (
                <View
                  style={[
                    styles.categoryBadgeNoImage,
                    {
                      backgroundColor:
                        activity.creatorSub === "pro" ||
                        activity.creatorSub === "premium"
                          ? "#10B981"
                          : "#3B82F6",
                    },
                  ]}
                >
                  <Text style={styles.categoryText}>
                    {activity.creatorSub === "pro" ||
                    activity.creatorSub === "premium"
                      ? "PRO"
                      : "PERSO"}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </Pressable>
      )}

      {/* ========== INFO BAR: Date + Localisation | Like + Partage ========== */}
      <View
        style={[
          styles.infoBar,
          {
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
            borderTopWidth: 1,
            borderTopColor: isDarkMode
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.04)",
          },
        ]}
      >
        {/* Gauche: Infos */}
        <View style={styles.infoLeft}>
          {locationText && (
            <View
              style={[
                styles.infoItem,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(249, 115, 22, 0.12)"
                    : "rgba(249, 115, 22, 0.08)",
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="map-marker"
                size={14}
                color="#F97316"
              />
              <Text
                style={[
                  styles.infoText,
                  { color: isDarkMode ? "#FCA5A5" : "#F97316" },
                ]}
                numberOfLines={1}
              >
                {locationText}
              </Text>
            </View>
          )}

          {distance && (
            <View
              style={[
                styles.infoItem,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(16, 185, 129, 0.12)"
                    : "rgba(16, 185, 129, 0.08)",
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="clock-fast"
                size={14}
                color="#10B981"
              />
              <Text
                style={[
                  styles.infoText,
                  { color: isDarkMode ? "#6EE7B7" : "#10B981" },
                ]}
              >
                {distance} km
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ========== DESCRIPTION ========== */}
      {activity.description && (
        <View style={styles.descriptionContainer}>
          <Text
            style={[
              styles.description,
              { color: isDarkMode ? "#CBD5E1" : "#475569" },
            ]}
            numberOfLines={3}
          >
            {activity.description}
          </Text>
        </View>
      )}

      {/* ========== SOCIAL ACTIONS ========== */}
      <View
        style={[
          styles.socialActionsContainer,
          {
            borderTopColor: isDarkMode
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.05)",
          },
        ]}
      >
        <SocialActions
          activityId={activity.id}
          onLoginRequired={onLoginRequired}
          onCommentsPress={handleCommentPress}
        />
      </View>

      {/* ========== APERÇU COMMENTAIRE ========== */}
      <View style={styles.commentPreviewContainer}>
        <CommentPreview
          activityId={activity.id}
          onViewAll={handleViewAllComments}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    paddingBottom: 12,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
    borderWidth: 2,
    borderColor: "rgba(249, 115, 22, 0.3)",
  },
  authorName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: -0.4,
  },
  authorSubtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: -0.1,
    marginTop: 2,
  },

  // Image
  imageContainer: {
    position: "relative",
    height: 220,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    justifyContent: "flex-end",
    padding: 20,
  },
  activityTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 20,
    color: "#FFFFFF",
    letterSpacing: -0.6,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  categoryBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  categoryText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 1.2,
  },

  // Version sans image
  titleContainerNoImage: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 14,
    marginBottom: 8,
  },
  titleGradientNoImage: {
    padding: 20,
    paddingVertical: 24,
    position: "relative",
  },
  activityTitleNoImage: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 22,
    letterSpacing: -0.8,
    lineHeight: 28,
  },
  categoryBadgeNoImage: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },

  // Info Bar
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    flexWrap: "wrap",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  infoText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: -0.1,
  },

  // Social Actions
  socialActionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },

  // Description
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
  },

  // Comment Preview
  commentPreviewContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});

export default React.memo(ActivityCard);
