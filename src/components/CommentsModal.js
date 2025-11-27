import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../ThemeProvider";
import Animated, { FadeIn, FadeOut, SlideInDown } from "react-native-reanimated";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "@react-native-firebase/firestore";
import { db, auth } from "../../config/firebase";
import i18n from "../../i18n";

/**
 * Modal CommentsModal - Affichage et ajout de commentaires
 * Design moderne type Twitter/Instagram avec animations fluides
 */
const CommentsModal = ({ visible, onClose, activityId }) => {
  const { isDarkMode } = useThemeContext();
  const currentUser = auth.currentUser;

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (visible) {
      fetchComments();
    }
  }, [visible, activityId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const commentsDoc = await getDoc(doc(db, "comments", activityId));
      if (commentsDoc.exists()) {
        const data = commentsDoc.data();
        const commentsWithUserData = await Promise.all(
          (data.comments || []).map(async (comment) => {
            try {
              const userDoc = await getDoc(doc(db, "users", comment.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...comment,
                  username: userData.username || i18n.t("utilisateur"),
                  photoURL: userData.photoURL,
                };
              }
            } catch (error) {
              console.error("Erreur lors de la récupération des données utilisateur:", error);
            }
            return {
              ...comment,
              username: i18n.t("utilisateur"),
              photoURL: null,
            };
          })
        );
        setComments(commentsWithUserData.reverse()); // Les plus récents en premier
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || sending) return;

    const commentText = newComment.trim();
    setNewComment("");
    setSending(true);
    Keyboard.dismiss();

    try {
      const comment = {
        userId: currentUser.uid,
        text: commentText,
        timestamp: new Date().toISOString(),
        id: `${currentUser.uid}_${Date.now()}`,
      };

      const commentsRef = doc(db, "comments", activityId);
      const commentsDoc = await getDoc(commentsRef);

      if (commentsDoc.exists()) {
        await updateDoc(commentsRef, {
          comments: arrayUnion(comment),
        });
      } else {
        await setDoc(commentsRef, {
          activityId,
          comments: [comment],
        });
      }

      // Ajouter le commentaire localement avec les données utilisateur
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const userData = userDoc.data();

      setComments([
        {
          ...comment,
          username: userData?.username || i18n.t("utilisateur"),
          photoURL: userData?.photoURL,
        },
        ...comments,
      ]);

      // Scroll vers le haut pour voir le nouveau commentaire
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error) {
      console.error("Erreur lors de l'envoi du commentaire:", error);
      setNewComment(commentText); // Restaurer le texte en cas d'erreur
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return i18n.t("a_linstant");
    if (diffMins < 60) return i18n.t("il_y_a_minutes", { count: diffMins });
    if (diffHours < 24) return i18n.t("il_y_a_heures", { count: diffHours });
    if (diffDays < 7) return i18n.t("il_y_a_jours", { count: diffDays });

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const CommentItem = ({ item }) => {
    const avatarFallback = require("../../assets/img/noimg.jpg");

    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{
          flexDirection: 'row',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode
            ? 'rgba(255, 255, 255, 0.06)'
            : 'rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Avatar */}
        <Image
          source={item.photoURL ? { uri: item.photoURL } : avatarFallback}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isDarkMode ? '#18181B' : '#F9FAFB',
            marginRight: 12,
          }}
        />

        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 15,
                color: isDarkMode ? '#FFFFFF' : '#0F172A',
                letterSpacing: -0.3,
                marginRight: 8,
              }}
            >
              {item.username}
            </Text>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 13,
                color: isDarkMode ? '#64748B' : '#94A3B8',
                letterSpacing: -0.2,
              }}
            >
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>

          {/* Texte du commentaire */}
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 15,
              color: isDarkMode ? '#E2E8F0' : '#334155',
              lineHeight: 22,
              letterSpacing: -0.2,
            }}
          >
            {item.text}
          </Text>
        </View>
      </Animated.View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={onClose}
          />

          <Animated.View
            entering={SlideInDown.springify().damping(20).stiffness(90)}
            style={{
              maxHeight: '85%',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -10 },
              shadowOpacity: 0.3,
              shadowRadius: 30,
              elevation: 20,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: isDarkMode
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#3B82F6',
                    marginRight: 10,
                  }}
                />
                <Text
                  style={{
                    fontFamily: "Inter_800ExtraBold",
                    fontSize: 20,
                    color: isDarkMode ? '#FFFFFF' : '#0F172A',
                    letterSpacing: -0.6,
                  }}
                >
                  {i18n.t("commentaires")}
                </Text>
                {comments.length > 0 && (
                  <View
                    style={{
                      backgroundColor: isDarkMode
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(59, 130, 246, 0.10)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginLeft: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 13,
                        color: '#3B82F6',
                      }}
                    >
                      {comments.length}
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isDarkMode
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={isDarkMode ? '#94A3B8' : '#64748B'}
                />
              </Pressable>
            </View>

            {/* Liste des commentaires */}
            <FlatList
              ref={flatListRef}
              data={comments}
              renderItem={({ item }) => <CommentItem item={item} />}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                paddingBottom: 16,
              }}
              ListEmptyComponent={() => (
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 60,
                    paddingHorizontal: 40,
                  }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: isDarkMode
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(0, 0, 0, 0.03)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons
                      name="chatbubbles-outline"
                      size={32}
                      color={isDarkMode ? '#64748B' : '#94A3B8'}
                    />
                  </View>
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 18,
                      color: isDarkMode ? '#FFFFFF' : '#0F172A',
                      letterSpacing: -0.4,
                      marginBottom: 8,
                      textAlign: 'center',
                    }}
                  >
                    {i18n.t("aucun_commentaire")}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: isDarkMode ? '#94A3B8' : '#64748B',
                      textAlign: 'center',
                      lineHeight: 20,
                    }}
                  >
                    {i18n.t("soyez_premier_commenter")}
                  </Text>
                </View>
              )}
            />

            {/* Input de commentaire */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: isDarkMode
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
                gap: 12,
              }}
            >
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder={i18n.t("ajouter_commentaire")}
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                multiline
                maxLength={500}
                style={{
                  flex: 1,
                  backgroundColor: isDarkMode
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.03)',
                  borderWidth: 1,
                  borderColor: isDarkMode
                    ? 'rgba(255, 255, 255, 0.10)'
                    : 'rgba(0, 0, 0, 0.06)',
                  borderRadius: 20,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  fontFamily: "Inter_500Medium",
                  fontSize: 15,
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  maxHeight: 100,
                  letterSpacing: -0.2,
                }}
              />

              <Pressable
                onPress={handleSendComment}
                disabled={!newComment.trim() || sending}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: newComment.trim()
                    ? '#3B82F6'
                    : isDarkMode
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.8 : 1,
                  shadowColor: newComment.trim() ? '#3B82F6' : 'transparent',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                })}
              >
                <Ionicons
                  name={sending ? "hourglass-outline" : "send"}
                  size={20}
                  color={
                    newComment.trim()
                      ? '#FFFFFF'
                      : isDarkMode
                      ? '#64748B'
                      : '#94A3B8'
                  }
                />
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CommentsModal;
