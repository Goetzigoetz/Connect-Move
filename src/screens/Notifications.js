import React, { useState, useEffect, useCallback } from "react";
import { CommonActions } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  Alert,
  SafeAreaView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import {
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn, FadeInDown, FadeOut, SlideInRight, SlideOutRight } from "react-native-reanimated";
import { Swipeable } from "react-native-gesture-handler";
import { showMessage } from "react-native-flash-message";
import { COLORS } from "../styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../ThemeProvider";
import i18n from "../../i18n";

// Skeleton component pour le chargement
const NotificationSkeleton = ({ isDarkMode }) => {
  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((item) => (
        <Animated.View
          key={item}
          entering={FadeIn.duration(300).delay(item * 50)}
          style={[
            styles.skeletonCard,
            { backgroundColor: isDarkMode ? '#1A1A1A' : '#F9FAFB' }
          ]}
        >
          <View style={styles.skeletonContent}>
            {/* Skeleton icône */}
            <View
              style={[
                styles.skeletonIcon,
                { backgroundColor: isDarkMode ? '#27272A' : '#E5E7EB' }
              ]}
            />
            <View style={styles.skeletonTextContainer}>
              {/* Skeleton titre */}
              <View
                style={[
                  styles.skeletonTitle,
                  { backgroundColor: isDarkMode ? '#27272A' : '#E5E7EB' }
                ]}
              />
              {/* Skeleton description */}
              <View
                style={[
                  styles.skeletonDescription,
                  { backgroundColor: isDarkMode ? '#27272A' : '#E5E7EB' }
                ]}
              />
              {/* Skeleton footer */}
              <View style={styles.skeletonFooter}>
                <View
                  style={[
                    styles.skeletonTime,
                    { backgroundColor: isDarkMode ? '#27272A' : '#E5E7EB' }
                  ]}
                />
                <View
                  style={[
                    styles.skeletonChip,
                    { backgroundColor: isDarkMode ? '#27272A' : '#E5E7EB' }
                  ]}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

const Notifications = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = auth.currentUser;
  const { isDarkMode } = useThemeContext();

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);

      const notificationsData = notificationsSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setNotifications(notificationsData);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des notifications :",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const handleUpdate = async (item) => {
    if (item.isNew) {
      try {
        const notifDocRef = doc(db, "notifications", item.id);
        await updateDoc(notifDocRef, {
          isNew: false,
        });
        fetchNotifications();
      } catch (error) {
        console.error(
          "Erreur lors de la mise à jour de la notification :",
          error
        );
      }
    }

    if (!item.type) return;

    if (item.type === "new_message_group") {
      navigation.navigate("Conversations");
    } else if (item.type === "join_demands") {
      navigation.navigate("MyEvents");
    } else if (item.type === "match") {
      // Navigate to Partners screen via the Partenaires tab
      // Use CommonActions.navigate to ensure we start fresh from Friends then go to Partners
      navigation.dispatch(
        CommonActions.navigate({
          name: "Partenaires",
          params: {
            screen: "Friends",
          },
        })
      );

      // Petit délai pour permettre à Friends de se monter avant de naviguer vers Partners
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.navigate({
            name: "Partenaires",
            params: {
              screen: "Partners",
            },
          })
        );
      }, 100);
    } else if (item.type === "friendMessage") {
      navigation.navigate("Friends");
    }
  };

  const handleDelete = async (notifID) => {
    Alert.alert(
      i18n.t("confirmation"),
      i18n.t("supprimer_la_notification"),
      [
        {
          text: i18n.t("annuler"),
          onPress: () => console.log("Suppression annulée"),
          style: "cancel",
        },
        {
          text: i18n.t("confirmer"),
          onPress: async () => {
            try {
              const notifDocRef = doc(db, "notifications", notifID);
              await deleteDoc(notifDocRef);
              fetchNotifications();
              showMessage({
                message: i18n.t("notification_supprimee"),
                type: "info",
              });
            } catch (error) {
              console.error("Erreur lors de la suppression :", error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };
  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_message_group":
        return "chatbubble";
      case "join_demands":
        return "person-add";
      case "match":
        return "heart";
      case "friendMessage":
        return "mail";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "new_message_group":
        return "#3B82F6"; // Blue
      case "join_demands":
        return "#F59E0B"; // Amber
      case "match":
        return "#EF4444"; // Red
      case "friendMessage":
        return "#10B981"; // Green
      default:
        return COLORS.primary;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "new_message_group":
        return i18n.t("message_type");
      case "join_demands":
        return i18n.t("demande_type");
      case "match":
        return "Match";
      case "friendMessage":
        return i18n.t("message_type");
      default:
        return "";
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notifDate = new Date(timestamp);
    const diffInMs = now - notifDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return i18n.t("a_linstant");
    if (diffInMinutes < 60) return i18n.t("il_y_a_min", { count: diffInMinutes });
    if (diffInHours < 24) return i18n.t("il_y_a_h", { count: diffInHours });
    if (diffInDays < 7) return i18n.t("il_y_a_j", { count: diffInDays });
    return notifDate.toLocaleDateString();
  };

  const NotificationItem = React.memo(({ item }) => {
    const iconName = getNotificationIcon(item.type);
    const color = getNotificationColor(item.type);
    const timeAgo = getTimeAgo(item.createdAt);

    return (
      <Pressable
        onPress={() => handleUpdate(item)}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Animated.View
          entering={FadeInDown.duration(300).delay(50)}
          exiting={SlideOutRight.duration(200)}
          style={[
            styles.notificationCard,
            {
              backgroundColor: isDarkMode ? (item.isNew ? '#1A1A1A' : '#0A0A0A') : (item.isNew ? '#F9FAFB' : '#FFFFFF'),
            }
          ]}
        >
          {/* Barre de couleur à gauche si nouvelle notification */}
          {item.isNew && (
            <View style={[styles.newIndicator, { backgroundColor: color }]} />
          )}

          <View style={styles.notificationContent}>
            {/* Icône */}
            <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
              <Ionicons name={iconName} size={24} color={color} />
            </View>

            {/* Contenu */}
            <View style={styles.textContainer}>
              <View style={styles.header}>
                <Text
                  style={[
                    styles.title,
                    { color: isDarkMode ? '#FAFAFA' : '#18181B' }
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {item.isNew && (
                  <View style={[styles.badge, { backgroundColor: color }]}>
                    <View style={styles.badgeDot} />
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.description,
                  { color: isDarkMode ? '#A1A1AA' : '#71717A' }
                ]}
                numberOfLines={2}
              >
                {item.text}
              </Text>

              <View style={styles.footer}>
                <Text style={[styles.time, { color: isDarkMode ? '#71717A' : '#A1A1AA' }]}>
                  {timeAgo}
                </Text>
                {item.type && (
                  <View style={[styles.typeChip, { backgroundColor: isDarkMode ? '#27272A' : '#F4F4F5' }]}>
                    <Text style={[styles.typeText, { color: color }]}>
                      {getTypeLabel(item.type)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  });

  const renderDeleteAction = (item) => {
    return (
      <Animated.View
        entering={SlideInRight}
        style={styles.deleteAction}
      >
        <Pressable
          onPress={() => handleDelete(item.id)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.deleteText}>{i18n.t("supprimer")}</Text>
        </Pressable>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDark : '#FFFFFF' }]}>
        <View style={styles.headerContainer}>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#FAFAFA' : '#18181B' }]}>
            {i18n.t("notifications")}
          </Text>
        </View>
        <NotificationSkeleton isDarkMode={isDarkMode} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDark : '#FFFFFF' }]}>
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => renderDeleteAction(item)}
            overshootRight={false}
          >
            <NotificationItem item={item} />
          </Swipeable>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
            progressBackgroundColor={isDarkMode ? '#1A1A1A' : '#FFFFFF'}
          />
        }
        ListHeaderComponent={() => (
          <View style={styles.headerContainer}>
            <Text style={[styles.headerTitle, { color: isDarkMode ? '#FAFAFA' : '#18181B' }]}>
              {i18n.t("notifications")}
            </Text>
            {notifications.length > 0 && (
              <Text style={[styles.headerCount, { color: isDarkMode ? '#71717A' : '#A1A1AA' }]}>
                {notifications.filter(n => n.isNew).length} {i18n.t("nouvelles")}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F4F4F5' }]}>
              <Ionicons name="notifications-off-outline" size={48} color={isDarkMode ? '#52525B' : '#A1A1AA'} />
            </View>
            <Text style={[styles.emptyTitle, { color: isDarkMode ? '#FAFAFA' : '#18181B' }]}>
              {i18n.t("aucune_notification")}
            </Text>
            <Text style={[styles.emptyText, { color: isDarkMode ? '#71717A' : '#A1A1AA' }]}>
              {i18n.t("vous_navez_pas_encore_de_notifications")}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  headerCount: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  notificationCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  newIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 14,
    paddingLeft: 18,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    letterSpacing: -0.3,
    flex: 1,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: -0.1,
  },
  deleteAction: {
    justifyContent: 'center',
    marginRight: 16,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    width: 80,
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  deleteText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: '#FFFFFF',
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: 'center',
  },
  // Skeleton styles
  skeletonContainer: {
    paddingHorizontal: 16,
  },
  skeletonCard: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  skeletonContent: {
    flexDirection: 'row',
    padding: 14,
    paddingLeft: 18,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonTitle: {
    height: 16,
    borderRadius: 4,
    width: '70%',
    marginBottom: 8,
  },
  skeletonDescription: {
    height: 14,
    borderRadius: 4,
    width: '90%',
    marginBottom: 8,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonTime: {
    height: 12,
    borderRadius: 4,
    width: 60,
  },
  skeletonChip: {
    height: 20,
    borderRadius: 8,
    width: 70,
  },
});

export default Notifications;
