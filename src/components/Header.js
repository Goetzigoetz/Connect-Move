import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../ThemeProvider";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../../config/firebase";
import { collection, query, where, onSnapshot, getDocs } from "@react-native-firebase/firestore";
import { COLORS } from "../styles/colors";
import { useSubscription } from "../contexts/SubscriptionContext";

const Header = ({ scrollY, isScrollingValue, scrollDirectionValue }) => {
  const [count, setCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const navigation = useNavigation();
  const user = auth.currentUser;
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useThemeContext();
  const { isPremiumOrPro } = useSubscription();

  // Animations
  const badgePulse = useSharedValue(1);
  const headerScrollY = scrollY || useSharedValue(0);

  // Animation de compression/expansion du header basée sur la position et direction de scroll
  const headerAnimatedStyle = useAnimatedStyle(() => {
    'worklet';

    // Si l'utilisateur est en train de scroller
    if (isScrollingValue?.value) {
      // Scroll vers le bas (compression)
      if (scrollDirectionValue?.value === 1) {
        const scale = interpolate(
          headerScrollY.value,
          [0, 150],  // Plage de scroll pour l'effet
          [1, 0.88], // Compression progressive
          'clamp'
        );

        return {
          transform: [{ scaleY: withTiming(scale, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
          }) }],
        };
      }

      // Scroll vers le haut (expansion/étirement)
      if (scrollDirectionValue?.value === -1) {
        const scale = interpolate(
          headerScrollY.value,
          [0, 150],
          [1, 1.06], // Expansion légère
          'clamp'
        );

        return {
          transform: [{ scaleY: withTiming(scale, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
          }) }],
        };
      }
    }

    // Quand l'utilisateur arrête de scroller, revenir doucement à la normale
    return {
      transform: [{ scaleY: withTiming(1, {
        duration: 600,  // Animation plus longue pour le retour
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      }) }],
    };
  });

  // Animation de réduction du padding
  const animatedPaddingBottom = useAnimatedStyle(() => {
    'worklet';
    if (isScrollingValue?.value && scrollDirectionValue?.value === 1) {
      return {
        paddingBottom: withTiming(
          interpolate(
            headerScrollY.value,
            [0, 200],  // Même plage que scaleY
            [8, 2],    // Réduction plus subtile (2px au lieu de 0)
            'clamp'
          ),
          {
            duration: 600,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
          }
        ),
      };
    }
    return {
      paddingBottom: withTiming(8, {
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      })
    };
  });

  // Animation des icônes sport: opacité réduite au scroll vers le bas
  const sportIconsOpacityStyle = useAnimatedStyle(() => {
    'worklet';
    if (isScrollingValue?.value && scrollDirectionValue?.value === 1) {
      return {
        opacity: withTiming(
          interpolate(
            headerScrollY.value,
            [0, 200],  // Même plage pour cohérence
            [1, 0.5],  // Opacité minimum légèrement plus élevée
            'clamp'
          ),
          {
            duration: 600,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
          }
        ),
      };
    }
    return {
      opacity: withTiming(1, {
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      })
    };
  });

  // Le titre reste statique et toujours visible
  const titleAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: 1,
      transform: [{ translateY: 0 }],
    };
  });

  // Sport icons animations
  const sport1Y = useSharedValue(0);
  const sport2Y = useSharedValue(0);
  const sport3Y = useSharedValue(0);
  const sport4Y = useSharedValue(0);
  const sport5Y = useSharedValue(0);
  const sport6Y = useSharedValue(0);
  const sport1Rotate = useSharedValue(0);
  const sport2Rotate = useSharedValue(0);
  const sport3Rotate = useSharedValue(0);
  const sport4Rotate = useSharedValue(0);
  const sport5Rotate = useSharedValue(0);
  const sport6Rotate = useSharedValue(0);

  useEffect(() => {
    // Badge pulse when there are notifications
    if (count > 0) {
      badgePulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      badgePulse.value = 1;
    }

    // Sport icons floating animations
    sport1Y.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    sport2Y.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    sport3Y.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    sport4Y.value = withRepeat(
      withSequence(
        withTiming(-9, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    sport5Y.value = withRepeat(
      withSequence(
        withTiming(-11, { duration: 3800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    sport6Y.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 4200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Rotation animations
    sport1Rotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    sport2Rotate.value = withRepeat(
      withTiming(-360, { duration: 25000, easing: Easing.linear }),
      -1,
      false
    );

    sport3Rotate.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );

    sport4Rotate.value = withRepeat(
      withTiming(-360, { duration: 22000, easing: Easing.linear }),
      -1,
      false
    );

    sport5Rotate.value = withRepeat(
      withTiming(360, { duration: 28000, easing: Easing.linear }),
      -1,
      false
    );

    sport6Rotate.value = withRepeat(
      withTiming(-360, { duration: 24000, easing: Easing.linear }),
      -1,
      false
    );
  }, [count]);

  // L'abonnement est maintenant géré par le SubscriptionContext (isPremiumOrPro)

  // Écoute en temps réel des notifications
  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("isNew", "==", true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCount(snapshot.docs.length);
      },
      (error) => {
        console.error("Erreur lors de l'écoute des notifications :", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Écoute en temps réel des messages non lus (pour premium/pro)
  useEffect(() => {
    if (!user || !isPremiumOrPro) {
      setUnreadMessages(0);
      return;
    }

    const fetchUnreadMessages = async () => {
      try {
        // Récupérer les activités où l'utilisateur participe
        const activitiesSnapshot = await getDocs(collection(db, "activities"));
        const userActivities = activitiesSnapshot.docs.filter((doc) => {
          const participants = doc.data().participants || [];
          return participants.some(
            (p) => p.userId === user.uid && p.active === true
          );
        });

        if (userActivities.length === 0) {
          setUnreadMessages(0);
          return;
        }

        const activityIds = userActivities.map((doc) => doc.id);

        // Récupérer les conversations liées à ces activités
        const conversationsSnapshot = await getDocs(
          query(
            collection(db, "conversations"),
            where("activityId", "in", activityIds)
          )
        );

        const conversationIds = conversationsSnapshot.docs.map((doc) => doc.id);

        if (conversationIds.length === 0) {
          setUnreadMessages(0);
          return;
        }

        // Écouter les messages non lus
        const unsubscribes = conversationIds.map((convId) => {
          const messagesQuery = query(
            collection(db, "messages"),
            where("conversationId", "==", convId),
            where("senderId", "!=", user.uid)
          );

          return onSnapshot(messagesQuery, async (snapshot) => {
            // Calculer le nombre total de messages non lus
            let totalUnread = 0;

            for (const convId of conversationIds) {
              const lastReadKey = `lastRead_${convId}`;
              const lastReadTimestamp = await AsyncStorage.getItem(lastReadKey);
              const lastReadDate = lastReadTimestamp ? new Date(parseInt(lastReadTimestamp)) : new Date(0);

              const messagesSnap = await getDocs(
                query(
                  collection(db, "messages"),
                  where("conversationId", "==", convId),
                  where("senderId", "!=", user.uid)
                )
              );

              messagesSnap.docs.forEach((doc) => {
                const messageDate = doc.data().createdAt?.toDate();
                if (messageDate && messageDate > lastReadDate) {
                  totalUnread++;
                }
              });
            }

            setUnreadMessages(totalUnread);
          });
        });

        return () => {
          unsubscribes.forEach((unsub) => unsub && unsub());
        };
      } catch (error) {
        console.error("Erreur lors de la récupération des messages non lus:", error);
      }
    };

    fetchUnreadMessages();
  }, [user, isPremiumOrPro]);

  // Animated styles
  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgePulse.value }],
  }));

  const sport1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: sport1Y.value },
      { rotate: `${sport1Rotate.value}deg` },
    ],
  }));

  const sport2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: sport2Y.value },
      { rotate: `${sport2Rotate.value}deg` },
    ],
  }));

  const sport3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: sport3Y.value },
      { rotate: `${sport3Rotate.value}deg` },
    ],
  }));

  const sport4AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: sport4Y.value },
      { rotate: `${sport4Rotate.value}deg` },
    ],
  }));

  const sport5AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: sport5Y.value },
      { rotate: `${sport5Rotate.value}deg` },
    ],
  }));

  const sport6AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: sport6Y.value },
      { rotate: `${sport6Rotate.value}deg` },
    ],
  }));


  return (
    <View style={[styles.headerContainer, {
      backgroundColor: isDarkMode ? COLORS.bgDark : COLORS.secondary
    }]}>
      <Animated.View style={[headerAnimatedStyle, animatedPaddingBottom]}>
        <LinearGradient
          colors={isDarkMode
            ? [COLORS.bgDarkSecondary, COLORS.bgDark]
            : [COLORS.primary, COLORS.secondary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { paddingTop: insets.top + 6 }]}
        >
        {/* Floating sport icons */}
        <Animated.View style={[styles.floatingIcon, styles.floatingIcon1, sport1AnimatedStyle, sportIconsOpacityStyle]}>
          <Ionicons name="basketball-outline" size={28} color="rgba(255, 255, 255, 0.22)" />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, styles.floatingIcon2, sport2AnimatedStyle, sportIconsOpacityStyle]}>
          <Ionicons name="barbell-outline" size={26} color="rgba(255, 255, 255, 0.2)" />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, styles.floatingIcon3, sport3AnimatedStyle, sportIconsOpacityStyle]}>
          <Ionicons name="football-outline" size={30} color="rgba(255, 255, 255, 0.2)" />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, styles.floatingIcon4, sport4AnimatedStyle, sportIconsOpacityStyle]}>
          <Ionicons name="bicycle-outline" size={24} color="rgba(255, 255, 255, 0.18)" />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, styles.floatingIcon5, sport5AnimatedStyle, sportIconsOpacityStyle]}>
          <Ionicons name="tennisball-outline" size={24} color="rgba(255, 255, 255, 0.2)" />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, styles.floatingIcon6, sport6AnimatedStyle, sportIconsOpacityStyle]}>
          <Ionicons name="walk-outline" size={29} color="rgba(255, 255, 255, 0.2)" />
        </Animated.View>

        <View style={styles.content}>
          {/* Left side - Notifications button */}
          <View style={styles.leftIconContainer}>
            {user ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("Notifications");
                }}
                style={({ pressed }) => [
                  styles.iconButton,
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <View style={styles.iconCircle}>
                  <Feather
                    name="bell"
                    size={20}
                    color="#FFFFFF"
                  />
                  {count > 0 && (
                    <Animated.View
                      entering={FadeIn.duration(300)}
                      exiting={FadeOut.duration(300)}
                      style={[styles.badge, badgeAnimatedStyle]}
                    >
                      <Text style={styles.badgeText}>
                        {count > 9 ? '9+' : count}
                      </Text>
                    </Animated.View>
                  )}
                </View>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("Login");
                }}
                style={({ pressed }) => [
                  styles.iconButton,
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <View style={styles.iconCircle}>
                  <Feather
                    name="log-in"
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
              </Pressable>
            )}
          </View>

          {/* Logo centered */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            {/* Title below logo */}
            <Animated.Text style={[styles.title, titleAnimatedStyle]}>
              CONNECT & MOVE
            </Animated.Text>
          </View>

          {/* Right side - Chat and Calendar buttons (premium/pro only) */}
          <View style={styles.rightIconContainer}>
            {user && isPremiumOrPro && (
              <>
                {/* Chat/Conversations button */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate("Conversations");
                  }}
                  style={({ pressed }) => [
                    styles.iconButton,
                    { opacity: pressed ? 0.7 : 1 }
                  ]}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={20}
                      color="#FFFFFF"
                    />
                    {unreadMessages > 0 && (
                      <Animated.View
                        entering={FadeIn.duration(300)}
                        exiting={FadeOut.duration(300)}
                        style={[styles.badge, badgeAnimatedStyle]}
                      >
                        <Text style={styles.badgeText}>
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </Text>
                      </Animated.View>
                    )}
                  </View>
                </Pressable>

                {/* Calendar/MyEvents button */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate("MyEvents");
                  }}
                  style={({ pressed }) => [
                    styles.iconButton,
                    { opacity: pressed ? 0.7 : 1, marginLeft: 8 }
                  ]}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderBottomWidth: 0,
  },
  gradient: {
    paddingBottom: 8,
    paddingHorizontal: 20,
    width: '100%',
  },
  floatingIcon: {
    position: 'absolute',
    zIndex: 0,
  },
  floatingIcon1: {
    top: 20,
    left: 15,
  },
  floatingIcon2: {
    top: 35,
    right: 25,
  },
  floatingIcon3: {
    bottom: 10,
    right: 60,
  },
  floatingIcon4: {
    bottom: 12,
    left: 30,
  },
  floatingIcon5: {
    bottom: 10,
    left: 65,
  },
  floatingIcon6: {
    top: 25,
    right: 95,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 10,
  },
  leftIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 88,
  },
  rightIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 88,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 2,
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  iconButton: {
    borderRadius: 20,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: '#FFFFFF',
    lineHeight: 10,
  },
});

export default Header;
