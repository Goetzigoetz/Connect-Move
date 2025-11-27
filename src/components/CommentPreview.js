import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeContext } from "../ThemeProvider";
import firestore from "@react-native-firebase/firestore";
import { db } from "../../config/firebase";
import { Image } from "expo-image";
import i18n from "../../i18n";

/**
 * CommentPreview - Affiche le premier commentaire avec "Voir tous les commentaires" si plus d'un
 */
const CommentPreview = ({ activityId, onViewAll }) => {
  const { isDarkMode } = useThemeContext();

  const [firstComment, setFirstComment] = useState(null);
  const [totalComments, setTotalComments] = useState(0);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [activityId]);

  const fetchComments = async () => {
    try {
      const commentsDoc = await firestore().collection("comments").doc(activityId).get();
      if (commentsDoc.exists) {
        const commentsData = commentsDoc.data();
        const comments = commentsData.comments || [];

        if (comments.length > 0) {
          const latest = comments[comments.length - 1]; // Dernier commentaire
          setFirstComment(latest);
          setTotalComments(comments.length);

          // Récupérer les infos de l'utilisateur
          const userDoc = await firestore().collection("users").doc(latest.userId).get();
          if (userDoc.exists) {
            setUserInfo(userDoc.data());
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires:", error);
    }
  };

  const handleViewAll = () => {
    onViewAll();
  };

  if (!firstComment) return null;

  // Formater le temps relatif
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffMs = now - commentTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return i18n.t("a_linstant", { defaultValue: "À l'instant" });
    if (diffMins < 60) return i18n.t("il_y_a_min", { count: diffMins, defaultValue: `il y a ${diffMins} min` });
    if (diffHours < 24) return i18n.t("il_y_a_h", { count: diffHours, defaultValue: `il y a ${diffHours}h` });
    return i18n.t("il_y_a_j", { count: diffDays, defaultValue: `il y a ${diffDays}j` });
  };

  return (
    <View style={styles.container}>
      {/* Format ultra-compact : juste le texte en 1-2 lignes */}
      <Pressable
        onPress={handleViewAll}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={[
            styles.commentTextCompact,
            { color: isDarkMode ? '#94A3B8' : '#64748B' }
          ]}
          numberOfLines={2}
        >
          <Text style={[styles.usernameCompact, { color: isDarkMode ? '#E2E8F0' : '#334155' }]}>
            {userInfo?.firstName || "Utilisateur"}
          </Text>
          {" "}
          {firstComment.text}
          {totalComments > 1 && (
            <Text style={[styles.moreComments, { color: isDarkMode ? '#64748B' : '#94A3B8' }]}>
              {" "}• {i18n.t("voir_plus", { count: totalComments - 1, defaultValue: `+${totalComments - 1}` })}
            </Text>
          )}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  commentTextCompact: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  usernameCompact: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  moreComments: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
});

export default CommentPreview;