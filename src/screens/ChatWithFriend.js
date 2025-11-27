import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { View, ActivityIndicator, Text, TextInput, Image, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView } from "react-native";
import { GiftedChat, Bubble } from "react-native-gifted-chat";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import sendNotifs from "../utils/sendNotifs";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../ThemeProvider";
import { COLORS } from "../styles/colors";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import "dayjs/locale/fr";
import i18n from "../../i18n";
import { useTabBar } from "../contexts/TabBarContext";

dayjs.extend(calendar);
dayjs.locale("fr");

const ChatWithFriend = ({ navigation, route }) => {
  const { salonId, friend } = route?.params || {};
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const { isDarkMode } = useThemeContext();
  const { setIsTabBarVisible } = useTabBar();

  useLayoutEffect(() => {
    // Masquer la tab bar
    setIsTabBarVisible(false);

    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <Image
            source={{ uri: friend.photoURL }}
            style={styles.headerAvatar}
            resizeMode="cover"
          />
        </View>
      ),
      headerTitle: friend.username || "partenaire",
    });

    // Réafficher la tab bar lors du démontage
    return () => {
      setIsTabBarVisible(true);
    };
  }, [navigation, setIsTabBarVisible]);

  useEffect(() => {
  const q = query(
    collection(db, "friendsMessages"),
    where("salonId", "==", salonId),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const messagesData = snapshot.docs.map((doc) => ({
          _id: doc.id,
          text: doc.data().message,
          createdAt: doc.data().createdAt?.toDate(),
          user: {
            _id: doc.data().senderId,
            name: doc.data().senderName || i18n.t("utilisateur"),
          },
        }));
        setMessages(messagesData);
      } else {
        console.log("Aucun message trouvé.");
        setMessages([]);
      }
      setLoading(false);
    },
    (error) => {
      console.error("Erreur lors de la récupération des messages :", error);
      setLoading(false);
    }
  );

  return () => unsubscribe();
}, [salonId]);

const handleSend = useCallback(
  async (newMessages = []) => {
    if (!user) return;

    const messageToSend = newMessages[0];
    try {
      await addDoc(collection(db, "friendsMessages"), {
        senderId: user.uid,
        senderName: user?.displayName || "Moi",
        salonId,
        message: messageToSend.text,
        createdAt: serverTimestamp(),
      });
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, newMessages)
      );

      const notification = {
        title: `message de ${user?.displayName || "Moi"}`,
        desc: messageToSend.text,
        type: "friendMessage",
      };
      await sendNotifs(friend, notification);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
    }
  },
  [user, salonId, friend]
);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? COLORS.bgDark : "#F8FAFC" }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  // Fonction pour personnaliser les bulles de messages
  const renderBubble = (props) => {
    const isCurrentUser = props.currentMessage.user._id === user?.uid;

    if (isCurrentUser) {
      return (
        <View style={styles.bubbleWrapper}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.bubbleRight]}
          >
            <Text style={styles.messageTextRight}>
              {props.currentMessage.text}
            </Text>
            <Text style={styles.timeTextRight}>
              {props.currentMessage.createdAt ? dayjs(props.currentMessage.createdAt).format("HH:mm") : ""}
            </Text>
          </LinearGradient>
        </View>
      );
    }

    return (
      <View style={styles.bubbleWrapper}>
        <View style={[
          styles.bubble,
          styles.bubbleLeft,
          { backgroundColor: isDarkMode ? "#27272A" : "#F1F5F9" }
        ]}>
          <Text style={[styles.messageTextLeft, { color: isDarkMode ? "#FAFAFA" : "#0F172A" }]}>
            {props.currentMessage.text}
          </Text>
          <Text style={[styles.timeTextLeft, { color: isDarkMode ? "#71717A" : "#64748B" }]}>
            {props.currentMessage.createdAt ? dayjs(props.currentMessage.createdAt).format("HH:mm") : ""}
          </Text>
        </View>
      </View>
    );
  };

  // Fonction pour personnaliser l'input toolbar
  const renderCustomInputToolbar = (props) => {
    return (
      <View style={[
        styles.inputToolbarContainer,
        { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }
      ]}>
        <View style={[
          styles.inputWrapper,
          {
            backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F1F5F9",
            borderColor: isDarkMode ? "#27272A" : "#E2E8F0"
          }
        ]}>
          <TextInput
            style={[
              styles.textInput,
              { color: isDarkMode ? "#FAFAFA" : "#0F172A" }
            ]}
            placeholder={i18n.t("ecrire_un_message")}
            placeholderTextColor={isDarkMode ? "#71717A" : "#94A3B8"}
            value={props.text}
            onChangeText={props.onTextChanged}
            multiline={true}
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={() => {
              if (props.text && props.text.trim().length > 0 && props.onSend) {
                props.onSend({ text: props.text.trim() }, true);
              }
            }}
            activeOpacity={0.7}
            style={styles.sendButtonWrapper}
            disabled={!props.text || props.text.trim().length === 0}
          >
            <LinearGradient
              colors={props.text && props.text.trim().length > 0 ? [COLORS.primary, COLORS.secondary] : ["#CBD5E1", "#94A3B8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButton}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderChatEmpty = () => (
    <View style={[styles.emptyContainer, { transform: [{ scaleY: -1 }] }]}>
      <View style={[
        styles.emptyIconContainer,
        { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
      ]}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyIconGradient}
        >
          <Ionicons name="chatbubbles" size={48} color="#FFFFFF" />
        </LinearGradient>
      </View>
      <Text style={[styles.emptyTitle, { color: isDarkMode ? "#FAFAFA" : "#0F172A" }]}>
        Commencez la conversation
      </Text>
      <Text style={[styles.emptySubtitle, { color: isDarkMode ? "#71717A" : "#64748B" }]}>
        Envoyez votre premier message à {friend.username || "votre partenaire"} 👋
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDark : "#F8FAFC" }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <GiftedChat
        messages={messages}
        onSend={(messages) => handleSend(messages)}
        user={{
          _id: user?.uid || "unknown",
          name: user?.displayName || "Moi",
          avatar: friend.photoURL,
        }}
        placeholder={i18n.t("ecrire_un_message")}
        locale="fr"
        renderBubble={renderBubble}
        renderDay={(props) => {
          const { currentMessage, previousMessage } = props;

          // Ne rien afficher si pas de date sur le message actuel
          if (!currentMessage?.createdAt) return null;

          // Si on a un message précédent, comparer les dates
          if (previousMessage?.createdAt) {
            const currentDay = dayjs(currentMessage.createdAt).format('YYYY-MM-DD');
            const previousDay = dayjs(previousMessage.createdAt).format('YYYY-MM-DD');

            // Ne montrer le badge que si c'est un jour différent
            if (currentDay === previousDay) {
              return null;
            }
          }

          // Afficher le badge de jour seulement si nécessaire
          return (
            <View style={styles.dayContainer}>
              <View style={[
                styles.dayBadge,
                { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
              ]}>
                <Text style={[styles.dayText, { color: isDarkMode ? "#A1A1AA" : "#64748B" }]}>
                  {dayjs(currentMessage.createdAt).calendar(null, {
                    sameDay: i18n.t("aujourdhui"),
                    nextDay: i18n.t("demain"),
                    lastDay: i18n.t("hier"),
                    sameElse: "D MMMM YYYY",
                  })}
                </Text>
              </View>
            </View>
          );
        }}
        renderChatEmpty={renderChatEmpty}
        renderInputToolbar={renderCustomInputToolbar}
        renderAvatar={() => null}
        renderSend={() => null}
        minInputToolbarHeight={70}
        alwaysShowSend
        bottomOffset={0}
        isKeyboardInternallyHandled={false}
        keyboardShouldPersistTaps="never"
        listViewProps={{
          style: {
            backgroundColor: isDarkMode ? COLORS.bgDark : "#F8FAFC",
          },
          keyboardShouldPersistTaps: 'handled',
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRightContainer: {
    marginRight: 16,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  bubbleWrapper: {
    marginVertical: 4,
    marginHorizontal: 12,
    maxWidth: "80%",
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bubbleRight: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleLeft: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageTextRight: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  messageTextLeft: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  timeTextRight: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    alignSelf: "flex-end",
  },
  timeTextLeft: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    alignSelf: "flex-end",
  },
  dayContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  inputToolbarContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButtonWrapper: {
    marginLeft: 8,
    marginBottom: 2,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "transparent",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  emptyIconContainer: {
    marginBottom: 24,
    borderRadius: 80,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 280,
  },
});

export default ChatWithFriend;
