import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Share,
  StyleSheet,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useThemeContext } from "../ThemeProvider";
import firestore from "@react-native-firebase/firestore";
import { db, auth } from "../../config/firebase";
import i18n from "../../i18n";

/**
 * Composant SocialActions - Actions sociales style Apple/Twitter
 * Affiche les boutons like, commentaire et partage avec animations fluides
 */
const SocialActions = ({
  activityId,
  onLoginRequired,
  onCommentsPress,
  compact = false,
}) => {
  const { isDarkMode } = useThemeContext();
  const currentUser = auth.currentUser;

  const [likes, setLikes] = useState([]);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation pour le like
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchSocialData();
  }, [activityId]);

  const fetchSocialData = async () => {
    try {
      const activityDoc = await firestore()
        .collection("activities")
        .doc(activityId)
        .get();
      if (activityDoc.exists) {
        const data = activityDoc.data();
        const activityLikes = data.likes || [];
        setLikes(activityLikes);
        setLikesCount(activityLikes.length);
        setIsLiked(
          currentUser ? activityLikes.includes(currentUser.uid) : false
        );

        // Compter les commentaires
        const commentsDoc = await firestore()
          .collection("comments")
          .doc(activityId)
          .get();
        if (commentsDoc.exists) {
          const commentsData = commentsDoc.data();
          setCommentsCount(commentsData.comments?.length || 0);
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données sociales:",
        error
      );
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      onLoginRequired();
      return;
    }

    if (isAnimating) return;

    setIsAnimating(true);

    // Animation du like
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setIsAnimating(false));

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(newIsLiked ? likesCount + 1 : likesCount - 1);

    try {
      const activityRef = firestore().collection("activities").doc(activityId);

      if (newIsLiked) {
        await activityRef.update({
          likes: firestore.FieldValue.arrayUnion(currentUser.uid),
        });
      } else {
        await activityRef.update({
          likes: firestore.FieldValue.arrayRemove(currentUser.uid),
        });
      }
    } catch (error) {
      // Rollback en cas d'erreur
      setIsLiked(!newIsLiked);
      setLikesCount(newIsLiked ? likesCount - 1 : likesCount + 1);
      console.error("Erreur lors du like:", error);
    }
  };

  const handleComment = () => {
    if (!currentUser) {
      onLoginRequired();
      return;
    }
    onCommentsPress();
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: i18n.t("partage_activite_message", {
          activityId,
          defaultValue: `Découvrez cette activité sur Connectmove ! ID: ${activityId}`,
        }),
        title: i18n.t("partager_activite"),
      });
    } catch (error) {
      console.error("Erreur lors du partage:", error);
    }
  };

  const ActionButton = ({ icon, count, onPress, isActive, activeColor }) => {
    const displayCount = count > 999 ? `${(count / 1000).toFixed(1)}k` : count;

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionButton,
          {
            opacity: pressed ? 0.6 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <View style={styles.buttonContent}>
          <Animated.View style={{ transform: icon === "heart" && isActive ? [{ scale: scaleAnim }] : [] }}>
            <AntDesign
              name={icon}
              size={19}
              color={
                isActive && activeColor
                  ? activeColor
                  : isDarkMode
                  ? "#9CA3AF"
                  : "#6B7280"
              }
            />
          </Animated.View>
          {count > 0 && (
            <Text
              style={[
                styles.countText,
                {
                  color:
                    isActive && activeColor
                      ? activeColor
                      : isDarkMode
                      ? "#9CA3AF"
                      : "#6B7280",
                },
              ]}
            >
              {displayCount}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ marginRight: 10 }}>
        <ActionButton
          icon={isLiked ? "heart" : "hearto"}
          count={likesCount}
          onPress={handleLike}
          isActive={isLiked}
          activeColor="#EF4444"
        />
      </View>

      <ActionButton
        icon="message1"
        count={commentsCount}
        onPress={handleComment}
        isActive={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    minWidth: 24,
    minHeight: 24,
  },
  countText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: -0.3,
    marginLeft: 6,
  },
});

export default React.memo(SocialActions);
