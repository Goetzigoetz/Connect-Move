import React, {
  useCallback,
  useLayoutEffect,
  useState,
} from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";
import moment from "moment";
import { auth, db } from "../../config/firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  where,
  writeBatch,
  deleteDoc,
} from "@react-native-firebase/firestore";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, FadeInRight } from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import { useFocusEffect } from "@react-navigation/native";
import "moment/locale/fr";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import i18n from "../../i18n";
import { COLORS } from "../styles/colors";
import { useThemeContext } from "../ThemeProvider";

moment.locale("fr");

const Friends = ({ navigation }) => {
  const [friends, setFriends] = useState([]);
  const [salons, setSalons] = useState([]);
  const [salonID, setSalonID] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useThemeContext();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF",
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? COLORS.borderDark : "#F3F4F6",
      },
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("Partners")}
          style={styles.headerButton}
        >
          <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, friends, isDarkMode]);

  useFocusEffect(
    useCallback(() => {
      const fetchFriendsFromSalons = async () => {
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const userId = currentUser.uid;

            // Récupérer les salons où l'utilisateur est participant
            const salonsQuery = query(
              collection(db, "salons"),
              where("participants", "array-contains", userId)
            );
            const salonsSnapshot = await getDocs(salonsQuery);
            let friendIds = [];
            let salonsData = [];

            salonsSnapshot.docs.forEach((doc) => {
              setSalonID(doc.id);
              const participants = doc.data().participants || [];
              friendIds.push(...participants.filter((id) => id !== userId));
              salonsData.push({ id: doc.id, ...doc.data() });
            });

            // Supprimer doublons
            friendIds = [...new Set(friendIds)];

            // Récupérer données des amis
            const friendsPromises = friendIds.map((friendId) =>
              getDoc(doc(db, "users", friendId))
            );
            const friendsDocs = await Promise.all(friendsPromises);

            // Filtrer et formater
            const friendsData = friendsDocs
              .filter((doc) => doc.exists())
              .map((doc) => ({ id: doc.id, ...doc.data() }));

            setFriends(friendsData);
            setSalons(salonsData);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des amis :", error);
        } finally {
          setLoading(false);
        }
      };

      fetchFriendsFromSalons();
    }, [])
  );

  const deleteSalonAndMessages = async (friendId) => {
    Alert.alert(
      "Supprimer le partenaire",
      "Êtes-vous sûr de vouloir supprimer ce partenaire et tous vos messages ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const currentUserId = auth.currentUser.uid;

              // Trouver les salons où sont présents currentUser et friendId
              const relatedSalons = salons.filter(
                (salon) =>
                  salon.participants.includes(currentUserId) &&
                  salon.participants.includes(friendId)
              );

              for (const salon of relatedSalons) {
                const salonId = salon.id;

                // Récupérer tous les messages du salon
                const messagesQuery = query(
                  collection(db, "friendsMessages"),
                  where("salonId", "==", salonId)
                );
                const messagesSnapshot = await getDocs(messagesQuery);

                // Supprimer les messages en batch
                const batch = writeBatch(db);
                messagesSnapshot.docs.forEach((doc) => {
                  batch.delete(doc.ref);
                });
                await batch.commit();

                // Supprimer le salon
                await deleteDoc(doc(db, "salons", salonId));

                // Mettre à jour l'état local pour suppression
                setSalons((prevSalons) =>
                  prevSalons.filter((s) => s.id !== salonId)
                );
              }

              showMessage({
                message: "Partenaire supprimé",
                type: "success",
              });

              // Mettre à jour la liste des amis localement
              setFriends((prevFriends) =>
                prevFriends.filter((friend) => friend.id !== friendId)
              );
            } catch (error) {
              console.error(
                "Erreur lors de la suppression des salons et des messages associés :",
                error
              );
              showMessage({
                message: "Erreur lors de la suppression",
                type: "danger",
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const isOnline = (lastLogin) => {
    if (!lastLogin) return false;
    const now = moment();
    const lastLoginMoment = moment(lastLogin);
    const diffMinutes = now.diff(lastLoginMoment, "minutes");
    return diffMinutes < 5; // En ligne si connecté il y a moins de 5 minutes
  };

  const renderDeleteAction = (item) => (
    <Animated.View entering={FadeInRight.duration(200)} style={styles.deleteActionContainer}>
      <TouchableOpacity
        onPress={() => deleteSalonAndMessages(item.id)}
        style={styles.deleteButton}
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFriendItem = ({ item, index }) => {
    const online = isOnline(item.lastLogin);
    const lastSeen = item.lastLogin
      ? moment(item.lastLogin).fromNow()
      : i18n.t("inconnu");

    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(index * 50)}
        style={styles.itemWrapper}
      >
        <Swipeable
          renderRightActions={() => renderDeleteAction(item)}
          overshootRight={false}
          friction={2}
        >
          <Pressable
            onPress={() =>
              salonID &&
              navigation.navigate("ChatWithFriend", {
                salonId: salonID,
                friend: item,
              })
            }
            style={[
              styles.friendCard,
              {
                backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              },
            ]}
            android_ripple={{
              color: isDarkMode ? COLORS.borderDark : "#F3F4F6",
            }}
          >
            {/* Avatar avec badge en ligne */}
            <View style={styles.avatarContainer}>
              <Image
                style={styles.avatar}
                source={
                  item.photoURL
                    ? { uri: item.photoURL }
                    : require("../../assets/img/user.png")
                }
                contentFit="cover"
              />
              {online && (
                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                </View>
              )}
            </View>

            {/* Infos du friend */}
            <View style={styles.friendInfo}>
              <View style={styles.friendHeader}>
                <Text
                  style={[
                    styles.friendName,
                    { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                  ]}
                  numberOfLines={1}
                >
                  {item.username}
                </Text>
                {online && (
                  <View style={styles.onlineChip}>
                    <Text style={styles.onlineText}>En ligne</Text>
                  </View>
                )}
              </View>

              {/* Intérêts communs */}
              {item.interests && item.interests.length > 0 && (
                <View style={styles.interestsRow}>
                  <Ionicons
                    name="heart"
                    size={14}
                    color={COLORS.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.interestsText,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                    numberOfLines={1}
                  >
                    {item.interests.slice(0, 3).join(", ")}
                  </Text>
                </View>
              )}

              {/* Dernière connexion */}
              {!online && item.lastLogin && (
                <View style={styles.lastSeenRow}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.lastSeenText,
                      { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
                    ]}
                  >
                    {lastSeen}
                  </Text>
                </View>
              )}
            </View>

            {/* Chevron */}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDarkMode ? "#4B5563" : "#D1D5DB"}
            />
          </Pressable>
        </Swipeable>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text
          style={[
            styles.loadingText,
            { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
          ]}
        >
          Chargement...
        </Text>
      </View>
    );
  }

  if (friends.length === 0) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
        ]}
      >
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <LinearGradient
              colors={[`${COLORS.primary}20`, `${COLORS.primary}10`]}
              style={styles.emptyIconGradient}
            >
              <Ionicons name="people-outline" size={48} color={COLORS.primary} />
            </LinearGradient>
          </View>
          <Text
            style={[
              styles.emptyTitle,
              { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
            ]}
          >
            Aucun partenaire
          </Text>
          <Text
            style={[
              styles.emptyDescription,
              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {i18n.t("aucun_partenaire_disponible_pour_le_moment")}
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("Partners")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Ajouter un partenaire</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
      ]}
    >
      {/* Header avec compteur */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          styles.statsHeader,
          {
            backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
            borderBottomColor: isDarkMode ? COLORS.borderDark : "#F3F4F6",
          },
        ]}
      >
        <View style={styles.statsContent}>
          <Text
            style={[
              styles.statsCount,
              { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
            ]}
          >
            {friends.length}
          </Text>
          <Text
            style={[
              styles.statsLabel,
              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {friends.length === 1 ? "Partenaire" : "Partenaires"}
          </Text>
        </View>
      </Animated.View>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriendItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
      />
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
  },
  headerButton: {
    marginHorizontal: 16,
    padding: 4,
  },
  statsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  statsContent: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  statsCount: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  statsLabel: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  listContent: {
    paddingVertical: 8,
  },
  itemWrapper: {
    paddingHorizontal: 16,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
  },
  friendInfo: {
    flex: 1,
    justifyContent: "center",
  },
  friendHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  friendName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  onlineChip: {
    backgroundColor: "#10B98120",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  onlineText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#10B981",
  },
  interestsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  interestsText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  lastSeenRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastSeenText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  deleteActionContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginVertical: 4,
    marginRight: 16,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  addButton: {
    borderRadius: 24,
    overflow: "hidden",
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});

export default Friends;
