import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
} from "react";
import {
  View,
  Text,
  Platform,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated as RNAnimated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { auth, db, storage } from "../../config/firebase";
import { COLORS } from "../styles/colors";
import Constants from "expo-constants";
import moment from "moment";
import { useFocusEffect } from "@react-navigation/native";
import { showMessage } from "react-native-flash-message";
import ThemeToggle from "../components/ThemeToggle";
import { useThemeContext } from "../ThemeProvider";
import { useSubscription } from "../contexts/SubscriptionContext";
import i18n from "../../i18n";
import { deleteDoc, doc, getDoc, updateDoc } from "@react-native-firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updateProfile,
} from "@react-native-firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "@react-native-firebase/storage";
import { LinearGradient } from "expo-linear-gradient";
const Profile = ({ navigation }) => {
  const user = auth.currentUser;
  const [profilePhoto, setProfilePhoto] = useState(user?.photoURL);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountIsVisible, setAccountIsVisible] = useState(false);
  const [dangerZoneExpanded, setDangerZoneExpanded] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  const { isDarkMode } = useThemeContext();
  const { subscription, restorePurchases: restorePurchasesFromContext, syncWithRevenueCat } = useSubscription();

  const scrollY = useRef(new RNAnimated.Value(0)).current;

  // Animations pour les icônes de sport dans la couverture
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);
  const float4 = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    float1.value = withRepeat(
      withTiming(30, { duration: 3000, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      -1,
      true
    );
    float2.value = withRepeat(
      withTiming(-25, { duration: 3500, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      -1,
      true
    );
    float3.value = withRepeat(
      withTiming(20, { duration: 4000, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      -1,
      true
    );
    float4.value = withRepeat(
      withTiming(-28, { duration: 3200, easing: Easing.bezier(0.42, 0, 0.58, 1) }),
      -1,
      true
    );
    rotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Styles animés pour les icônes de sport - AVANT tout return conditionnel
  const sportIcon1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: float1.value },
      { translateX: float1.value * 0.5 },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const sportIcon2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: float2.value },
      { translateX: float2.value * -0.3 },
    ],
  }));

  const sportIcon3Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: float3.value },
      { translateX: float3.value * 0.6 },
      { rotate: `${-rotate.value}deg` },
    ],
  }));

  const sportIcon4Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: float4.value },
      { translateX: float4.value * -0.4 },
    ],
  }));

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Fonction pour restaurer les achats via le contexte centralisé
  const restorePurchases = async () => {
    const result = await restorePurchasesFromContext();

    if (result.success) {
      if (result.restored) {
        showMessage({
          message: i18n.t("achats_restaures_avec_succes"),
          description: result.message,
          type: "success",
        });
      } else {
        showMessage({
          message: i18n.t("aucun_achat_a_restaurer"),
          description: i18n.t("nous_navons_trouve_aucun_achat_a_restaurer"),
          type: "info",
        });
      }
    } else {
      showMessage({
        message: i18n.t("erreur_lors_de_la_restauration_des_achats"),
        description: result.message || i18n.t("une_erreur_inattendue_sest_produite"),
        type: "danger",
      });
    }
  };

  const toggleShowMyProfile = async () => {
    if (!user?.uid) return;

    try {
      const newValue = !userInfo?.showMyProfile;
      await updateDoc(doc(db, "users", user.uid), {
        showMyProfile: newValue,
      });

      setUserInfo({ ...userInfo, showMyProfile: newValue });

      showMessage({
        message: newValue
          ? i18n.t("profil_visible_aux_autres")
          : i18n.t("profil_masque_aux_autres"),
        type: "success",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la visibilité :", error);
      showMessage({
        message: i18n.t("erreur"),
        description: i18n.t("impossible_de_modifier_la_visibilite"),
        type: "danger",
      });
    }
  };

  const deleteAccount = () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      showMessage({
        message: i18n.t("erreur"),
        description: i18n.t("aucun_utilisateur_connecte"),
        type: "warning",
      });
      return;
    }

    const askPasswordAndReauth = () => {
      Alert.prompt(
        i18n.t("reauthentification_requise"),
        i18n.t("veuillez_entrer_votre_mot_de_passe"),
        [
          { text: i18n.t("annuler"), style: "cancel" },
          {
            text: i18n.t("valider"),
            onPress: async (password) => {
              if (!password) {
                showMessage({
                  message: i18n.t("erreur"),
                  description: i18n.t("le_mot_de_passe_est_requis"),
                  type: "danger",
                });
                return;
              }
              try {
                const credential = EmailAuthProvider.credential(
                  currentUser.email,
                  password
                );
                await reauthenticateWithCredential(currentUser, credential);
                await performDeleteAccount();
              } catch (reauthError) {
                console.error("Erreur ré-authentification :", reauthError);
                showMessage({
                  message: i18n.t("reauthentification_echouee"),
                  description: i18n.t("mot_de_passe_incorrect"),
                  type: "danger",
                });
              }
            },
          },
        ],
        "secure-text"
      );
    };

    const performDeleteAccount = async () => {
      try {
        // Suppression document Firestore
        await deleteDoc(doc(db, "users", currentUser.uid));
        // Suppression compte Firebase
        await currentUser.delete();

        showMessage({
          message: i18n.t("compte_supprime"),
          description: i18n.t("votre_compte_a_ete_supprime"),
          type: "success",
          duration: 3000,
          onHide: () => {
            auth.signOut().then(() => {
              // navigation.replace("Home"); // à décommenter si besoin
            });
          },
        });
      } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        if (error.code === "auth/requires-recent-login") {
          askPasswordAndReauth();
        } else {
          showMessage({
            message: i18n.t("erreur"),
            description: i18n.t("une_erreur_est_survenue_lors_de_la_suppression"),
            type: "danger",
          });
        }
      }
    };

    Alert.alert(
      i18n.t("supprimer_le_compte"),
      i18n.t("etes_vous_sur_de_vouloir_supprimer_votre_compte"),
      [
        { text: i18n.t("annuler"), style: "cancel" },
        {
          text: i18n.t("supprimer"),
          style: "destructive",
          onPress: performDeleteAccount,
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      // Synchroniser l'abonnement quand on arrive sur Profile
      syncWithRevenueCat();
    }, [syncWithRevenueCat])
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchFirestoreUser = async () => {
        if (!user?.uid) {
          if (isActive) {
            setLoading(false);
            setAccountIsVisible(false);
          }
          return;
        }
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists() && isActive) {
            const userData = userSnap.data();

            // Vérification complète des champs requis
            const requiredFields = [
              { key: 'firstName', label: 'prenom', value: userData.firstName?.trim() },
              { key: 'lastName', label: 'nom', value: userData.lastName?.trim() },
              { key: 'address', label: 'adresse', value: userData.location?.address?.trim() },
              { key: 'phoneNumber', label: 'numero_de_telephone', value: userData.phoneNumber },
              { key: 'photoURL', label: 'photo_de_profil', value: userData.photoURL?.trim() },
              { key: 'biography', label: 'biographie', value: userData.biography?.trim() },
              { key: 'isActive', label: 'compte_actif', value: userData.isActive },
              { key: 'emailVerified', label: 'email_verifie', value: userData.emailVerified },
              { key: 'birthDate', label: 'date_de_naissance', value: userData.birthDate },
              { key: 'interests', label: 'centres_dinteret', value: userData.interests?.length > 0 },
              { key: 'showMyProfile', label: 'profil_visible_aux_autres', value: userData.showMyProfile },
            ];

            const missing = requiredFields.filter(field => !field.value);
            setMissingFields(missing);

            const requiredFieldsFilled = missing.length === 0;
            setUserInfo(userData);
            setAccountIsVisible(!!requiredFieldsFilled);
          } else if (isActive) {
            setAccountIsVisible(false);
          }
        } catch {
          if (isActive) setAccountIsVisible(false);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchFirestoreUser();

      return () => {
        isActive = false; // cleanup on blur/unmount
      };
    }, [user])
  );

  const prepareUriForUpload = (uri) => {
    return Platform.OS === "ios" ? uri.replace("file://", "") : uri;
  };

  const uploadImageToFirebase = async (imageUri, fileName) => {
    try {
      const uploadUri = prepareUriForUpload(imageUri);
      const storageRef = ref(
        storage,
        `users/${auth.currentUser.uid}/${fileName}`
      );

      const response = await fetch(uploadUri);
      const blob = await response.blob();

      const uploadTask = uploadBytesResumable(storageRef, blob);

      // Optionally, listen to upload progress
      uploadTask.on("state_changed", (snapshot) => {
        // Progress handler if needed
      });

      await uploadTask;

      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error) {
      console.error("Erreur lors du téléchargement :", error);
      throw new Error(i18n.t("echec_du_telechargement"));
    }
  };

  const pickImage = async (type) => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showMessage({
          message: i18n.t("une_erreur_est_survenue"),
          type: "error",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "profile" ? [1, 1] : [16, 9],
        quality: 1,
      });

      if (!result.canceled) {
        const selectedImageUri = result.assets[0].uri;
        const fileName = `${type}-${Date.now()}.jpg`;
        const downloadUrl = await uploadImageToFirebase(
          selectedImageUri,
          fileName
        );
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          photoURL: downloadUrl,
        });

        await updateProfile(auth.currentUser, { photoURL: downloadUrl });
        setProfilePhoto(downloadUrl);

        showMessage({
          message: i18n.t("photo_de_profil_mise_a_jour"),
          type: "success",
        });
      } else {
      }
    } catch (error) {
      console.error("Erreur dans pickImage :", error);
      showMessage({
        message: i18n.t("une_erreur_est_survenue"),
        type: "error",
      });
    }
  };

  const removeProfilePhoto = async () => {
    Alert.alert(
      i18n.t("removeProfilePhotoTitle"),
      i18n.t("removeProfilePhotoMessage"),
      [
        {
          text: i18n.t("annuler"),
          style: "cancel",
        },
        {
          text: i18n.t("removePhoto"),
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "users", auth.currentUser.uid), {
                photoURL: null,
              });

              await updateProfile(auth.currentUser, { photoURL: null });
              setProfilePhoto(null);

              showMessage({
                message: i18n.t("profilePhotoRemoved"),
                type: "success",
              });
            } catch (error) {
              console.error("Erreur lors de la suppression de la photo :", error);
              showMessage({
                message: i18n.t("une_erreur_est_survenue"),
                type: "error",
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleProfilePhotoPress = () => {
    const options = [
      {
        text: profilePhoto ? i18n.t("changePhoto") : i18n.t("addPhoto"),
        onPress: () => pickImage("profile"),
      },
      {
        text: i18n.t("annuler"),
        style: "cancel",
      },
    ];

    // Ajouter l'option "Supprimer" seulement si une photo existe
    if (profilePhoto) {
      options.splice(1, 0, {
        text: i18n.t("removePhoto"),
        style: "destructive",
        onPress: removeProfilePhoto,
      });
    }

    Alert.alert(
      i18n.t("profilePhoto"),
      i18n.t("chooseProfilePhotoAction"),
      options,
      { cancelable: true }
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      i18n.t("confirmation"),
      i18n.t("voulez_vous_vraiment_vous_deconnecter"),
      [
        {
          text: i18n.t("annuler"),
          style: "cancel",
        },
        {
          text: i18n.t("ok"),
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              showMessage({
                message: i18n.t("une_erreur_est_survenue"),
                type: "error",
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <View style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cover Photo Skeleton */}
        <View style={[styles.skeletonCover, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F3F4F6" }]}>
          <LinearGradient
            colors={isDarkMode ? ['#1A1A1A', '#2A2A2A', '#1A1A1A'] : ['#F3F4F6', '#E5E7EB', '#F3F4F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* Profile Card Skeleton */}
        <View style={styles.profileSection}>
          <View style={[styles.skeletonCard, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF", borderColor: isDarkMode ? "#2F3336" : "#EFF3F4" }]}>
            {/* Profile Photo Skeleton */}
            <View style={styles.profileHeader}>
              <View style={[styles.skeletonAvatar, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F3F4F6" }]}>
                <LinearGradient
                  colors={isDarkMode ? ['#1A1A1A', '#2A2A2A', '#1A1A1A'] : ['#F3F4F6', '#E5E7EB', '#F3F4F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
              <View style={[styles.skeletonButton, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F3F4F6" }]}>
                <LinearGradient
                  colors={isDarkMode ? ['#1A1A1A', '#2A2A2A', '#1A1A1A'] : ['#F3F4F6', '#E5E7EB', '#F3F4F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
            </View>

            {/* User Info Skeleton */}
            <View style={styles.userInfoSection}>
              <View style={[styles.skeletonText, styles.skeletonTextLarge, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F3F4F6" }]}>
                <LinearGradient
                  colors={isDarkMode ? ['#1A1A1A', '#2A2A2A', '#1A1A1A'] : ['#F3F4F6', '#E5E7EB', '#F3F4F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
              <View style={[styles.skeletonText, styles.skeletonTextMedium, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F3F4F6", marginTop: 8 }]}>
                <LinearGradient
                  colors={isDarkMode ? ['#1A1A1A', '#2A2A2A', '#1A1A1A'] : ['#F3F4F6', '#E5E7EB', '#F3F4F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
              <View style={[styles.skeletonText, styles.skeletonTextSmall, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F3F4F6", marginTop: 12 }]}>
                <LinearGradient
                  colors={isDarkMode ? ['#1A1A1A', '#2A2A2A', '#1A1A1A'] : ['#F3F4F6', '#E5E7EB', '#F3F4F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Settings Skeleton */}
        <View style={styles.settingsSection}>
          <View style={[styles.skeletonText, styles.skeletonTextMedium, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F3F4F6", marginBottom: 16 }]}>
            <LinearGradient
              colors={isDarkMode ? ['#1A1A1A', '#2A2A2A', '#1A1A1A'] : ['#F3F4F6', '#E5E7EB', '#F3F4F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
          <View style={[styles.skeletonCard, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF", borderColor: isDarkMode ? "#2F3336" : "#EFF3F4" }]}>
            {[1, 2, 3, 4, 5].map((_, index) => (
              <View key={index}>
                <View style={styles.skeletonMenuItem}>
                  <View style={[styles.skeletonIcon, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F3F4F6" }]}>
                    <LinearGradient
                      colors={isDarkMode ? ['#1A1A1A', '#2A2A2A', '#1A1A1A'] : ['#F3F4F6', '#E5E7EB', '#F3F4F6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </View>
                  <View style={[styles.skeletonText, styles.skeletonTextMedium, { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F3F4F6", flex: 1 }]}>
                    <LinearGradient
                      colors={isDarkMode ? ['#1A1A1A', '#2A2A2A', '#1A1A1A'] : ['#F3F4F6', '#E5E7EB', '#F3F4F6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </View>
                </View>
                {index < 4 && <View style={[styles.separator, { backgroundColor: isDarkMode ? "#2F3336" : "#EFF3F4" }]} />}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  // Animation du header
  const headerOpacity = scrollY.interpolate({
    inputRange: [100, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [100, 150],
    outputRange: [-50, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }]}>
      {/* Fixed Header - Apparaît au scroll */}
      <RNAnimated.View
        style={[
          styles.fixedHeader,
          {
            backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF",
            borderBottomColor: isDarkMode ? "#2F3336" : "#EFF3F4",
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <LinearGradient
          colors={isDarkMode
            ? ['#000000', 'rgba(0, 0, 0, 0.98)', 'rgba(0, 0, 0, 0.95)']
            : ['#FFFFFF', 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.95)']
          }
          style={styles.fixedHeaderGradient}
        >
          <View style={styles.fixedHeaderContent}>
            <Image
              source={
                profilePhoto
                  ? { uri: profilePhoto }
                  : require("../../assets/img/user.png")
              }
              style={[
                styles.fixedHeaderPhoto,
                {
                  borderColor: isDarkMode ? "#2F3336" : "#EFF3F4",
                  backgroundColor: isDarkMode ? "#27272A" : "#F3F4F6"
                }
              ]}
            />
            <View style={styles.fixedHeaderInfo}>
              <View style={styles.fixedHeaderNameRow}>
                <Text
                  style={[
                    styles.fixedHeaderName,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" }
                  ]}
                  numberOfLines={1}
                >
                  @{userInfo?.username || "user_xxx"}
                </Text>
                {subscription !== "gratuit" && (
                  <View style={[
                    styles.fixedHeaderBadge,
                    {
                      backgroundColor: isDarkMode ? "#1E3A8A" : "#DBEAFE"
                    }
                  ]}>
                    <Text style={[
                      styles.fixedHeaderBadgeText,
                      { color: isDarkMode ? "#93C5FD" : "#1E40AF" }
                    ]}>
                      {subscription}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.fixedHeaderStatsRow}>
                <View style={styles.fixedHeaderStatItem}>
                  <Ionicons name="heart" size={14} color="red" />
                  <Text style={[styles.fixedHeaderStats, { color: "#71717A" }]}>
                    {userInfo?.interests?.length || 0}
                  </Text>
                </View>
                <View style={styles.fixedHeaderStatItem}>
                  <MaterialCommunityIcons name="bitcoin" size={14} color="#FACC15" />
                  <Text style={[styles.fixedHeaderStats, { color: "#71717A" }]}>
                    {userInfo?.pieces || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </RNAnimated.View>

      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        overScrollMode="never"
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Photo de couverture avec gradient orange et icônes de sport animées */}
        <View style={styles.coverPhotoContainer}>
          <LinearGradient
            colors={['#F97316', '#EA580C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Icônes de sport animées */}
          <Animated.View style={[styles.sportIcon, styles.sportIcon1, sportIcon1Style]}>
            <Ionicons name="football-outline" size={50} color="rgba(255, 255, 255, 0.2)" />
          </Animated.View>
          <Animated.View style={[styles.sportIcon, styles.sportIcon2, sportIcon2Style]}>
            <Ionicons name="basketball-outline" size={60} color="rgba(255, 255, 255, 0.15)" />
          </Animated.View>
          <Animated.View style={[styles.sportIcon, styles.sportIcon3, sportIcon3Style]}>
            <Ionicons name="bicycle-outline" size={45} color="rgba(255, 255, 255, 0.18)" />
          </Animated.View>
          <Animated.View style={[styles.sportIcon, styles.sportIcon4, sportIcon4Style]}>
            <Ionicons name="tennisball-outline" size={40} color="rgba(255, 255, 255, 0.22)" />
          </Animated.View>
        </View>

        {/* Section profil - style Twitter/Facebook */}
        <View style={styles.profileSection}>
          <View style={[
            styles.profileCard,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderWidth: 1,
              borderColor: isDarkMode ? "#2F3336" : "#EFF3F4",
              borderRadius: 16,
            }
          ]}>
            {/* Header avec avatar à gauche et bouton éditer à droite */}
            <View style={styles.profileHeader}>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={handleProfilePhotoPress}
                style={styles.profilePhotoWrapper}
              >
                <Image
                  source={
                    profilePhoto
                      ? { uri: profilePhoto }
                      : require("../../assets/img/user.png")
                  }
                  style={[
                    styles.profilePhoto,
                    {
                      borderColor: missingFields.some(mf => mf.key === 'photoURL')
                        ? "#EF4444"
                        : (isDarkMode ? COLORS.bgDark : "#FFFFFF"),
                      backgroundColor: isDarkMode ? "#27272A" : "#F3F4F6"
                    }
                  ]}
                />
                <View style={[
                  styles.cameraButton,
                  missingFields.some(mf => mf.key === 'photoURL') && {
                    backgroundColor: "#EF4444"
                  }
                ]}>
                  <Ionicons
                    name={missingFields.some(mf => mf.key === 'photoURL') ? "alert-circle" : "camera"}
                    size={16}
                    color="white"
                  />
                </View>
                {/* Status indicator dot */}
                <View style={[
                  styles.statusDot,
                  {
                    backgroundColor: accountIsVisible ? "#10B981" : "#EF4444",
                    borderColor: isDarkMode ? COLORS.bgDark : "#FFFFFF"
                  }
                ]} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("EditProfile")}
                style={[styles.editButton, {
                  backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : "#EFF3F4",
                  borderColor: isDarkMode ? "#2F3336" : "#CFD9DE"
                }]}
                activeOpacity={0.6}
              >
                <Ionicons name="create-outline" size={18} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                <Text style={[styles.editButtonText, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                  {i18n.t("modifier_le_profil")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Infos utilisateur */}
            <View style={styles.userInfoSection}>
              <View style={styles.usernameRow}>
                <Text
                  style={[
                    styles.username,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" }
                  ]}
                >
                  @{userInfo?.username || "user_xxx"}
                </Text>
                {subscription !== "gratuit" && (
                  <View style={[
                    styles.premiumBadge,
                    {
                      backgroundColor: isDarkMode ? "#1E3A8A" : "#DBEAFE"
                    }
                  ]}>
                    <Text style={[
                      styles.premiumBadgeText,
                      { color: isDarkMode ? "#93C5FD" : "#1E40AF" }
                    ]}>
                      {subscription}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.biographyContainer}
                onPress={() => navigation.navigate("EditBio")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.biography,
                    { color: "#71717A" }
                  ]}
                >
                  {userInfo?.biography || i18n.t("cest_vide_par_ici")}
                </Text>
                <View style={styles.editBioButton}>
                  <Ionicons name="pencil" size={16} color={COLORS.primary} />
                </View>
              </TouchableOpacity>

              <View style={styles.memberSinceContainer}>
                <Text
                  style={[
                    styles.memberSinceText,
                    { color: "#71717A" }
                  ]}
                >
                  {i18n.t("membre_depuis")}{" "}
                  {moment(userInfo?.createdAt).format("MMMM YYYY")}
                </Text>
              </View>

              {/* Profile status indicator */}
              <View style={styles.profileStatusIndicator}>
                <View style={[
                  styles.statusIndicatorDot,
                  { backgroundColor: accountIsVisible ? "#10B981" : "#EF4444" }
                ]} />
                <Text style={[
                  styles.statusIndicatorText,
                  { color: accountIsVisible ? "#10B981" : "#EF4444" }
                ]}>
                  {accountIsVisible ? i18n.t("profil_visible") : i18n.t("informations_incompletes_profil_non_visible")}
                </Text>
              </View>
            </View>

            {/* Stats Section - Nouvelle section pour remplir l'espace */}
            <View style={[styles.statsContainer, {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#F9FAFB",
              borderTopWidth: 1,
              borderTopColor: isDarkMode ? "#2F3336" : "#EFF3F4",
            }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                  {userInfo?.interests?.length || 0}
                </Text>
                <Text style={[styles.statLabel, { color: "#71717A" }]}>
                  Centres d'intérêt
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]} />
              <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate("CoinsPage")} activeOpacity={0.6}>
                <View style={styles.statValueWithIcon}>
                  <Text style={[styles.statValue, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                    {userInfo?.pieces || 0}
                  </Text>
                  <MaterialCommunityIcons
                    name="bitcoin"
                    size={24}
                    color="#FACC15"
                  />
                </View>
                <Text style={[styles.statLabel, { color: "#71717A" }]}>
                  {i18n.t("pieces")}
                </Text>
              </TouchableOpacity>
              <View style={[styles.statDivider, { backgroundColor: isDarkMode ? "#2F3336" : "#E5E7EB" }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>
                  {subscription}
                </Text>
                <Text style={[styles.statLabel, { color: "#71717A" }]}>
                  {i18n.t("abonnement")}
                </Text>
              </View>
            </View>

            {/* Centres d'intérêt */}
            {userInfo?.interests?.length > 0 && (
              <View style={[
                styles.interestsSection,
                {
                  borderTopColor: isDarkMode ? "#2F3336" : "#EFF3F4"
                }
              ]}>
                <Text
                  style={[
                    styles.interestsTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" }
                  ]}
                >
                  {i18n.t("centres_dinteret")}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.interestsScroll}
                >
                  {userInfo.interests.map((interest, index) => (
                    <View
                      key={index}
                      style={[styles.interestBadge, {
                        backgroundColor: isDarkMode ? "#1E3A8A" : "#DBEAFE"
                      }]}
                    >
                      <Text
                        style={[
                          styles.interestText,
                          { color: isDarkMode ? "#93C5FD" : "#1E40AF" }
                        ]}
                      >
                        {interest}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Section paramètres */}
        <View style={styles.settingsSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? "#FFFFFF" : "#000000" }
            ]}
          >
            {i18n.t("parametres")}
          </Text>

          {/* Groupe: Compte */}
          <Text style={[styles.groupTitle, { color: "#71717A" }]}>
            Compte
          </Text>
          <View style={[
            styles.menuContainer,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderWidth: 1,
              borderColor: isDarkMode ? "#2F3336" : "#EFF3F4",
              borderRadius: 16,
              overflow: "hidden",
            }
          ]}>
            {[
              {
                icon: "person-circle-outline",
                title: i18n.t("informations_personnelles"),
                route: "EditProfile",
                checkFields: ['firstName', 'lastName', 'birthDate'],
              },
              {
                icon: "image-outline",
                title: i18n.t("photo_de_profil"),
                onPress: handleProfilePhotoPress,
                checkFields: ['photoURL'],
              },
              {
                icon: "create-outline",
                title: i18n.t("biographie"),
                route: "EditBio",
                checkFields: ['biography'],
              },
              {
                icon: "call-outline",
                title: i18n.t("numero_de_telephone"),
                route: "AddPhoneNumberPage",
                checkFields: ['phoneNumber'],
              },
              {
                icon: "location-outline",
                title: i18n.t("emplacement"),
                route: "AddLocation",
                checkFields: ['address'],
              },
              subscription !== "pro" && {
                icon: "heart-outline",
                title: i18n.t("centres_dinteret"),
                route: "AddInterest",
                checkFields: ['interests'],
              },
            ]
              .filter(Boolean)
              .map((item, index, arr) => {
                const isMissing = item.checkFields?.some(fieldKey =>
                  missingFields.some(mf => mf.key === fieldKey)
                );

                return (
                  <View key={index}>
                    <TouchableOpacity
                      onPress={() => item.onPress ? item.onPress() : navigation.navigate(item.route)}
                      style={[
                        styles.menuItem,
                        isMissing && {
                          borderLeftWidth: 3,
                          borderLeftColor: "#EF4444",
                        }
                      ]}
                      activeOpacity={0.6}
                    >
                      <View style={styles.menuItemContent}>
                        <Ionicons
                          name={item.icon}
                          size={22}
                          color={isMissing ? "#EF4444" : "#71717A"}
                        />
                        <Text
                          style={[
                            styles.menuItemText,
                            { color: isMissing ? "#EF4444" : (isDarkMode ? "#FFFFFF" : "#000000") }
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                      </View>
                      <View style={styles.menuItemRight}>
                        {isMissing && (
                          <Ionicons
                            name="alert-circle"
                            size={18}
                            color="#EF4444"
                            style={{ marginRight: 8 }}
                          />
                        )}
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#71717A"
                        />
                      </View>
                    </TouchableOpacity>

                    {index < arr.length - 1 && (
                      <View style={[styles.separator, {
                        backgroundColor: isDarkMode ? "#2F3336" : "#EFF3F4"
                      }]} />
                    )}
                  </View>
                );
              })}
          </View>

          {/* Groupe: Préférences */}
          <Text style={[styles.groupTitle, { color: "#71717A" }]}>
            Préférences
          </Text>
          <ThemeToggle />
          <View style={[
            styles.menuContainer,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderWidth: 1,
              borderColor: isDarkMode ? "#2F3336" : "#EFF3F4",
              borderRadius: 16,
              overflow: "hidden",
            }
          ]}>
            {[
              {
                icon: "language-outline",
                title: i18n.t("langue"),
                route: "LanguageSettings",
              },
            ]
              .filter(Boolean)
              .map((item, index, arr) => (
                <View key={index}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate(item.route)}
                    style={styles.menuItem}
                    activeOpacity={0.6}
                  >
                    <View style={styles.menuItemContent}>
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color="#71717A"
                      />
                      <Text
                        style={[
                          styles.menuItemText,
                          { color: isDarkMode ? "#FFFFFF" : "#000000" }
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#71717A"
                    />
                  </TouchableOpacity>

                  {index < arr.length - 1 && (
                    <View style={[styles.separator, {
                      backgroundColor: isDarkMode ? "#2F3336" : "#EFF3F4"
                    }]} />
                  )}
                </View>
              ))}
          </View>

          {/* Groupe: Visibilité du profil */}
          <Text style={[styles.groupTitle, { color: "#71717A" }]}>
            {i18n.t("visibilite")}
          </Text>
          <View style={[
            styles.menuContainer,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderWidth: 1,
              borderColor: isDarkMode ? "#2F3336" : "#EFF3F4",
              borderRadius: 16,
              overflow: "hidden",
            }
          ]}>
            <TouchableOpacity
              onPress={toggleShowMyProfile}
              style={[
                styles.menuItem,
                missingFields.some(mf => mf.key === 'showMyProfile') && {
                  borderLeftWidth: 3,
                  borderLeftColor: "#EF4444",
                }
              ]}
              activeOpacity={0.6}
            >
              <View style={styles.menuItemContent}>
                <Ionicons
                  name="eye-outline"
                  size={22}
                  color={missingFields.some(mf => mf.key === 'showMyProfile') ? "#EF4444" : "#71717A"}
                  style={{ alignSelf: 'flex-start', marginTop: 4 }}
                />
                <View style={styles.toggleTextContainer}>
                  <Text
                    style={[
                      styles.menuItemText,
                      {
                        color: missingFields.some(mf => mf.key === 'showMyProfile') ? "#EF4444" : (isDarkMode ? "#FFFFFF" : "#000000"),
                        marginLeft: 0
                      }
                    ]}
                    numberOfLines={1}
                  >
                    {i18n.t("etre_trouve_par_dautres")}
                  </Text>
                  <Text
                    style={[
                      styles.menuItemSubtext,
                      { color: "#71717A" }
                    ]}
                    numberOfLines={1}
                  >
                    {i18n.t("permettre_aux_autres_de_voir_votre_profil")}
                  </Text>
                </View>
              </View>
              <View style={styles.menuItemRightWithToggle}>
                {missingFields.some(mf => mf.key === 'showMyProfile') && (
                  <Ionicons
                    name="alert-circle"
                    size={18}
                    color="#EF4444"
                    style={{ marginRight: 8 }}
                  />
                )}
                <View
                  style={[
                    styles.toggleSwitch,
                    {
                      backgroundColor: userInfo?.showMyProfile ? COLORS.primary : (isDarkMode ? "#27272A" : "#E4E4E7")
                    }
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      {
                        backgroundColor: "#FFFFFF",
                        transform: [{ translateX: userInfo?.showMyProfile ? 20 : 0 }]
                      }
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Groupe: Abonnement & Offres */}
          <Text style={[styles.groupTitle, { color: "#71717A" }]}>
            Abonnement & Offres
          </Text>
          <View style={[
            styles.menuContainer,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderWidth: 1,
              borderColor: isDarkMode ? "#2F3336" : "#EFF3F4",
              borderRadius: 16,
              overflow: "hidden",
            }
          ]}>
            {[
              {
                icon: "star-outline",
                title: i18n.t("abonnement"),
                route: "AllOffers",
              },
              {
                icon: "refresh-outline",
                title: i18n.t("restaurer_mes_achats"),
                onPress: restorePurchases,
              },
              {
                icon: "pricetag-outline",
                title: i18n.t("code_promo"),
                route: "CodePromo",
              },
              subscription !== "pro" && {
                icon: "flash-outline",
                title: i18n.t("echanger_mes_pieces"),
                route: "CoinsPage",
              },
            ]
              .filter(Boolean)
              .map((item, index, arr) => (
                <View key={index}>
                  <TouchableOpacity
                    onPress={() => item.onPress ? item.onPress() : navigation.navigate(item.route)}
                    style={styles.menuItem}
                    activeOpacity={0.6}
                  >
                    <View style={styles.menuItemContent}>
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color="#71717A"
                      />
                      <Text
                        style={[
                          styles.menuItemText,
                          { color: isDarkMode ? "#FFFFFF" : "#000000" }
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#71717A"
                    />
                  </TouchableOpacity>

                  {index < arr.length - 1 && (
                    <View style={[styles.separator, {
                      backgroundColor: isDarkMode ? "#2F3336" : "#EFF3F4"
                    }]} />
                  )}
                </View>
              ))}
          </View>

          {/* Groupe: Mes contenus (conditionnel pour premium/pro) */}
          {(subscription !== "gratuit" || (accountIsVisible && subscription !== "pro")) && (
            <>
              <Text style={[styles.groupTitle, { color: "#71717A" }]}>
                Mes contenus
              </Text>
              <View style={[
                styles.menuContainer,
                {
                  backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isDarkMode ? "#2F3336" : "#EFF3F4",
                  borderRadius: 16,
                  overflow: "hidden",
                }
              ]}>
                {[
                  subscription === "pro" && {
                    icon: "stats-chart-outline",
                    title: i18n.t("statistiques"),
                    route: "Statistiques",
                  },
                  subscription !== "gratuit" && {
                    icon: "calendar-outline",
                    title: i18n.t("evenenements_publies"),
                    route: "MyEvents",
                  },
                  accountIsVisible &&
                    subscription !== "pro" && {
                      icon: "card-outline",
                      title: i18n.t("voir_ma_carte"),
                      route: "MyCard",
                    },
                ]
                  .filter(Boolean)
                  .map((item, index, arr) => (
                    <View key={index}>
                      <TouchableOpacity
                        onPress={() => navigation.navigate(item.route)}
                        style={styles.menuItem}
                        activeOpacity={0.6}
                      >
                        <View style={styles.menuItemContent}>
                          <Ionicons
                            name={item.icon}
                            size={22}
                            color="#71717A"
                          />
                          <Text
                            style={[
                              styles.menuItemText,
                              { color: isDarkMode ? "#FFFFFF" : "#000000" }
                            ]}
                          >
                            {item.title}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#71717A"
                        />
                      </TouchableOpacity>

                      {index < arr.length - 1 && (
                        <View style={[styles.separator, {
                          backgroundColor: isDarkMode ? "#2F3336" : "#EFF3F4"
                        }]} />
                      )}
                    </View>
                  ))}
              </View>
            </>
          )}

          {/* Groupe: Assistance */}
          <Text style={[styles.groupTitle, { color: "#71717A" }]}>
            Assistance
          </Text>
          <View style={[
            styles.menuContainer,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderWidth: 1,
              borderColor: isDarkMode ? "#2F3336" : "#EFF3F4",
              borderRadius: 16,
              overflow: "hidden",
            }
          ]}>
            {[
              {
                icon: "time-outline",
                title: i18n.t("historique"),
                route: "History",
              },
              {
                icon: "help-circle-outline",
                title: i18n.t("comment_ca_marche"),
                route: "HowItsWork",
              },
              {
                icon: "mail-outline",
                title: i18n.t("contactUsTitle"),
                route: "ContactUs",
              },
              {
                icon: "people-outline",
                title: i18n.t("parrainer_un_ami"),
                route: "ReferralPage",
              },
              {
                icon: "document-text-outline",
                title: i18n.t("legal"),
                route: "LegalPage",
              },
            ]
              .filter(Boolean)
              .map((item, index, arr) => (
                <View key={index}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate(item.route)}
                    style={styles.menuItem}
                    activeOpacity={0.6}
                  >
                    <View style={styles.menuItemContent}>
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color="#71717A"
                      />
                      <Text
                        style={[
                          styles.menuItemText,
                          { color: isDarkMode ? "#FFFFFF" : "#000000" }
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#71717A"
                    />
                  </TouchableOpacity>

                  {index < arr.length - 1 && (
                    <View style={[styles.separator, {
                      backgroundColor: isDarkMode ? "#2F3336" : "#EFF3F4"
                    }]} />
                  )}
                </View>
              ))}
          </View>

          {/* Advanced Settings Section */}
          <Text
            style={[
              styles.sectionTitle,
              styles.advancedSectionTitle,
              { color: isDarkMode ? "#FFFFFF" : "#000000" }
            ]}
          >
            {i18n.t("parametres_avances")}
          </Text>
          <View style={[
            styles.menuContainer,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderWidth: 1,
              borderColor: isDarkMode ? "#2F3336" : "#EFF3F4",
              borderRadius: 16,
              overflow: "hidden",
            }
          ]}>
            {/* Bouton Restaurer mes achats */}
            <TouchableOpacity
              onPress={restorePurchases}
              style={styles.menuItem}
              activeOpacity={0.6}
            >
              <View style={styles.menuItemContent}>
                <Ionicons
                  name="refresh-outline"
                  size={22}
                  color="#1D9BF0"
                />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: "#1D9BF0" }
                  ]}
                  numberOfLines={1}
                >
                  {i18n.t("restaurer_mes_achats")}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#71717A"
              />
            </TouchableOpacity>

            <View style={[styles.separator, {
              backgroundColor: isDarkMode ? "#2F3336" : "#EFF3F4"
            }]} />

            {/* Bouton déconnexion */}
            <TouchableOpacity
              onPress={handleSignOut}
              style={styles.menuItem}
              activeOpacity={0.6}
            >
              <View style={styles.menuItemContent}>
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color="#71717A"
                />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" }
                  ]}
                  numberOfLines={1}
                >
                  {i18n.t("deconnexion")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <Text
            style={[
              styles.sectionTitle,
              styles.advancedSectionTitle,
              { color: isDarkMode ? "#FFFFFF" : "#000000" }
            ]}
          >
            {i18n.t("zone_de_danger")}
          </Text>
          <View style={[
            styles.dangerZoneContainer,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderWidth: 1,
              borderColor: isDarkMode ? "#7F1D1D" : "#FCA5A5",
              borderRadius: 16,
            }
          ]}>
            <TouchableOpacity
              onPress={() => setDangerZoneExpanded(!dangerZoneExpanded)}
              style={styles.dangerZoneHeader}
              activeOpacity={0.6}
            >
              <View style={styles.menuItemContent}>
                <Ionicons
                  name="warning-outline"
                  size={22}
                  color="#EF4444"
                />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: "#EF4444" }
                  ]}
                  numberOfLines={1}
                >
                  {i18n.t("actions_irreversibles")}
                </Text>
              </View>
              <Ionicons
                name={dangerZoneExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#EF4444"
              />
            </TouchableOpacity>

            {dangerZoneExpanded && (
              <>
                <View style={[styles.separator, {
                  backgroundColor: isDarkMode ? "#7F1D1D" : "#FCA5A5",
                  marginLeft: 0,
                }]} />
                <View style={[
                  styles.dangerZoneContent,
                  {
                    backgroundColor: isDarkMode ? "#1A0A0A" : "#FEF2F2",
                  }
                ]}>
                  <Text style={[
                    styles.dangerZoneWarning,
                    { color: isDarkMode ? "#FCA5A5" : "#DC2626" }
                  ]}>
                    {i18n.t("cette_action_est_definitive")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("DeleteAccountScreen")}
                    style={[
                      styles.dangerButton,
                      {
                        backgroundColor: "#DC2626",
                      }
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.dangerButtonText}>
                      {i18n.t("supprimer_definitivement_mon_compte")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Version */}
        <Text
          style={[
            styles.versionText,
            { color: isDarkMode ? "#71717A" : "#9CA3AF" }
          ]}
        >
          Version {Constants.expoConfig?.version || "2.5.0"}
        </Text>
      </RNAnimated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 400,
  },
  // Icônes de sport animées
  sportIcon: {
    position: "absolute",
  },
  sportIcon1: {
    top: 20,
    left: 30,
  },
  sportIcon2: {
    top: 30,
    right: 40,
  },
  sportIcon3: {
    bottom: 25,
    left: 50,
  },
  sportIcon4: {
    bottom: 30,
    right: 60,
  },
  // Skeleton Styles
  skeletonCover: {
    height: 160,
    overflow: "hidden",
  },
  skeletonCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  skeletonAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: "hidden",
  },
  skeletonButton: {
    width: 80,
    height: 36,
    borderRadius: 18,
    marginTop: 8,
    overflow: "hidden",
  },
  skeletonText: {
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  skeletonTextLarge: {
    width: "60%",
    height: 20,
  },
  skeletonTextMedium: {
    width: "80%",
    height: 16,
  },
  skeletonTextSmall: {
    width: "40%",
    height: 14,
  },
  skeletonMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  skeletonIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 12,
    overflow: "hidden",
  },
  // Header styles
  headerTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    letterSpacing: -0.4,
  },
  coinsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinsText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    marginRight: 6,
  },
  coinIcon: {
    backgroundColor: "#FACC15",
    padding: 4,
    borderRadius: 12,
  },
  // Cover photo - style Twitter/Facebook
  coverPhotoContainer: {
    height: 200,
    overflow: "hidden",
    position: "relative",
  },
  // Profile section - style Twitter/Facebook
  profileSection: {
    paddingHorizontal: 16,
    marginTop: -60,
  },
  profileCard: {
    padding: 16,
  },
  // Header style Twitter/Facebook - Avatar à gauche, bouton à droite
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  profilePhotoWrapper: {
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
  },
  cameraButton: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#1D9BF0",
    padding: 8,
    borderRadius: 16,
  },
  statusDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  editButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    letterSpacing: -0.2,
  },
  // User info
  userInfoSection: {
    marginTop: 8,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  username: {
    fontFamily: "Inter_500Medium",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  premiumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
    letterSpacing: -0.1,
  },
  biographyContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 4,
  },
  biography: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
    flex: 1,
  },
  editBioButton: {
    padding: 4,
    marginTop: -2,
  },
  memberSinceContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  memberSinceText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    letterSpacing: -0.1,
  },
  profileStatusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
    borderRadius: 9999,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  statusIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusIndicatorText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: -0.1,
  },
  // Badges
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeVisible: {
    backgroundColor: "#DEF7EC",
  },
  badgeVisibleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#03543F",
    letterSpacing: -0.1,
  },
  badgeNotVisibleContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
  },
  badgeNotVisible: {
    backgroundColor: "#FDE8E8",
  },
  badgeNotVisibleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#9B1C1C",
    letterSpacing: -0.1,
  },
  completeProfileIconButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#FDE8E8",
    justifyContent: "center",
    alignItems: "center",
  },
  // Warning card
  warningCard: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  warningText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  // Stats Section
  statsContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginHorizontal: -16,
    marginBottom: -16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValueWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  coinImage: {
    width: 24,
    height: 24,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    letterSpacing: -0.1,
    marginTop: 4,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: "100%",
    marginHorizontal: 8,
  },
  // Interests
  interestsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  interestsTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  interestsScroll: {
    gap: 8,
  },
  interestBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  interestText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  // Settings section
  settingsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginBottom: 24,
  },
  groupTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  advancedSectionTitle: {
    marginTop: 32,
  },
  // Menu
  menuContainer: {
    marginTop: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  menuItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemRightWithToggle: {
    flexDirection: "row",
    alignItems: "flex-start",
    alignSelf: "flex-start",
    marginTop: 4,
  },
  menuItemText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    letterSpacing: -0.2,
    marginLeft: 12,
    flexShrink: 1,
  },
  toggleTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  separator: {
    height: 0.5,
    marginLeft: 50,
  },
  // Version
  versionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    marginTop: 32,
    marginBottom: 16,
    letterSpacing: -0.1,
  },
  // Fixed Header
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  fixedHeaderGradient: {
    paddingTop: Platform.OS === "ios" ? 50 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  fixedHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  fixedHeaderPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
  },
  fixedHeaderInfo: {
    marginLeft: 16,
    flex: 1,
  },
  fixedHeaderNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  fixedHeaderName: {
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  fixedHeaderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  fixedHeaderBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  fixedHeaderStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  fixedHeaderStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  fixedHeaderStats: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: -0.1,
    fontWeight: "600",
  },
  // Danger Zone
  dangerZoneContainer: {
    marginTop: 12,
    overflow: "hidden",
  },
  dangerZoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  dangerZoneContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dangerZoneWarning: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
    marginBottom: 16,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  dangerButtonText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  // Toggle switch styles
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
    letterSpacing: -0.1,
  },
});

export default Profile;
