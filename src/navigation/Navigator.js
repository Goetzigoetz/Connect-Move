import React, { useCallback, useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, withSpring, withTiming, useSharedValue } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
// Import des écrans
import Home from "../screens/Home";
import Profile from "../screens/Profile";
import EditProfile from "../screens/EditProfile";
import EditBio from "../screens/EditBio";
import AddInterest from "../screens/AddInterest";
import ActivityDetails from "../screens/ActivityDetails";
import Partners from "../screens/Partners";
import AddLocation from "../screens/AddLocation";
import Events from "../screens/Events";
import Conversations from "../screens/Conversations";
import Chat from "../screens/Chat";
import AddPhoneNumberPage from "../screens/AddPhoneNumberPage";
import AddComment from "../screens/AddComment";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Text,
} from "react-native";
import { COLORS } from "../styles/colors";
import MainStepIndicator from "../screens/AddEvent/MainStepIndicator";
import FilterScreen from "../screens/FilterScreen";
import MyEvents from "../screens/MyEvents";
import WriteReview from "../screens/WriteReview";
import EditEvent from "../screens/EditEvent";
import HowItsWork from "../screens/HowItsWork";
import MyCard from "../screens/MyCard";
import History from "../screens/History";
import ReferralPage from "../screens/ReferralPage";
import Friends from "../screens/Friends";
import ChatWithFriend from "../screens/ChatWithFriend";
import Participants from "../screens/Participants";
import AllOffers from "../screens/AllOffers";
import PaymentResultScreen from "../screens/PaymentResultScreen";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import CoinsPage from "../screens/CoinsPage";
import Notifications from "../screens/Notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Statistiques from "../screens/Statistiques";
import Step6 from "../screens/AddEvent/Step6";
import DefisScreen from "../screens/DefisScreen";
import { useThemeContext } from "../ThemeProvider";
import LegalPage from "../screens/LegalPage";
import ClufPage from "../screens/ClufPage";
import ReportReasonScreen from "../screens/ReportReasonScreen";
import { getScreenOptions } from "./screenOptions";
import { doc, getDoc } from "@react-native-firebase/firestore";
import CodePromo from "../screens/CodePromo";
import BloqueCompte from "../screens/Auth/BloqueCompte";
import VerifyEmail from "../screens/Auth/VerifyEmail";
import LanguageSettings from "../screens/LanguageSettings";
import ThemeSettings from "../screens/ThemeSettings";
import OnboardingFlow from "../screens/Auth/OnboardingFlow";
import ContactUs from "../screens/ContactUs";
import DeleteAccountScreen from "../screens/DeleteAccountScreen";
import { auth, db } from "../../config/firebase";
import OnboardingSkeleton from "../components/OnboardingSkeleton";
import CustomTabBar from "../components/CustomTabBar";
import SwipeableTabScreen from "../components/SwipeableTabScreen";

// Context pour forcer le rechargement du Navigator
export const NavigatorRefreshContext = React.createContext(null);

// Déclarez les navigateurs
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Root Stack qui contient le Tab Navigator et l'OnboardingFlow
const RootStack = createNativeStackNavigator();

const HomeStack = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeContext();
  const { t, i18n } = useTranslation();

  return (
    <Stack.Navigator
      key={i18n.language}
      screenOptions={{
        ...getScreenOptions({ isDarkMode }),
        headerBackTitle: "",
        animation: "slide_from_right",
        gestureEnabled: true,
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="Home"
        component={Home}
        options={{
          title: t("accueil"),
          headerTitle: "",
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="ClufPage"
        component={ClufPage}
        options={{
          animation: "fade_from_bottom",
          title: "",
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="DefisScreen"
        component={DefisScreen}
        options={{
          title: "",
          headerTitle: "",
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="MyEvents"
        component={MyEvents}
        options={{
          title: t("mes_evenements"),
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="Friends"
        component={Friends}
        options={{
          title: "",
          headerTitle: t("partenaires"),
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{
          title: "",
          headerTitle: "",
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="AllOffers"
        component={AllOffers}
        options={{
          title: "",
          headerTitle: "",
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="FilterScreen"
        component={FilterScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: "vertical",
          presentation: "transparentModal",
          animation: "fade",
        }}
      />

      <Stack.Screen
        name="ReportReasonScreen"
        component={ReportReasonScreen}
        options={{
          title: "",
          headerTitle: "",
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="AddComment"
        component={AddComment}
        options={{
          headerShown: false,
          title: "",
          headerTitle: "",
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />

      <Stack.Screen
        name="ActivityDetails"
        component={ActivityDetails}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="Step6"
        component={Step6}
        options={{
          animation: "slide_from_bottom",
          title: t("paiement"),
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="Participants"
        component={Participants}
        options={{
          title: "",
          headerTitle: t("participants"),
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="Conversations"
        component={Conversations}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="Chat"
        component={Chat}
        options={{
          title: t("messages"),
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="EditEvent"
        component={EditEvent}
        options={{
          title: t("modifier"),
          headerBackTitle: "",
        }}
      />
    </Stack.Navigator>
  );
};

const PartenerStack = () => {
  const { isDarkMode } = useThemeContext();
  const { t, i18n } = useTranslation();

  return (
    <Stack.Navigator
      key={i18n.language}
      screenOptions={{
        ...getScreenOptions({ isDarkMode }),
        headerBackTitle: "",
        animation: "slide_from_right",
        gestureEnabled: true,
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="Friends"
        component={Friends}
        options={{
          title: "",
          headerTitle: t("partenaires"),
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="Partners"
        component={Partners}
        options={{
          title: "",
          headerBackTitle: "",
          // headerTitle: t("trouver_des_partenaires"),
        }}
      />

      <Stack.Screen
        name="ChatWithFriend"
        component={ChatWithFriend}
        options={{
          title: "",
          headerTitle: "",
          headerBackTitle: "",
        }}
      />
    </Stack.Navigator>
  );
};

// Créez un stack pour Profile (si besoin de navigation spécifique)
const ProfileStack = () => {
  const { isDarkMode } = useThemeContext();
  const { t, i18n } = useTranslation();

  return (
    <Stack.Navigator
      key={i18n.language}
      initialRouteName="Profile"
      screenOptions={{
        ...getScreenOptions({ isDarkMode }),
        headerBackTitle: "",
        animation: "slide_from_right",
        gestureEnabled: true,
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{
          title: t("mon_profil"),
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="AllOffers"
        component={AllOffers}
        options={{
          title: "",
          headerTitle: "",
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="MyEvents"
        component={MyEvents}
        options={{
          title: t("mes_evenements"),
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="CoinsPage"
        component={CoinsPage}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="WriteReview"
        component={WriteReview}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="HowItsWork"
        component={HowItsWork}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="MyCard"
        component={MyCard}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="History"
        component={History}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="EditEvent"
        component={EditEvent}
        options={{
          title: t("modifier"),
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        initialParams={{ newProfile: false }}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="EditBio"
        component={EditBio}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="AddInterest"
        component={AddInterest}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />

      <Stack.Screen
        name="AddLocation"
        component={AddLocation}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="AddPhoneNumberPage"
        component={AddPhoneNumberPage}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="ReferralPage"
        component={ReferralPage}
        options={{
          title: t("parrainer"),
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="CodePromo"
        component={CodePromo}
        options={{
          title: t("entrer_code_promo"),
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="LegalPage"
        component={LegalPage}
        options={{
          title: t(""),
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="LanguageSettings"
        component={LanguageSettings}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="ThemeSettings"
        component={ThemeSettings}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="ContactUs"
        component={ContactUs}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="DeleteAccountScreen"
        component={DeleteAccountScreen}
        options={{
          title: "",
          headerBackTitle: "",
        }}
      />
    </Stack.Navigator>
  );
};

// Wrappers pour chaque écran de tab avec swipe
const HomeStackWithSwipe = ({ navigation, tabRoutes }) => {
  const currentIndex = tabRoutes.findIndex(route => route === 'Activités');

  return (
    <SwipeableTabScreen
      onSwipeLeft={() => {
        if (currentIndex < tabRoutes.length - 1) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate(tabRoutes[currentIndex + 1]);
        }
      }}
      onSwipeRight={() => {
        if (currentIndex > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate(tabRoutes[currentIndex - 1]);
        }
      }}
    >
      <HomeStack />
    </SwipeableTabScreen>
  );
};

const PartenerStackWithSwipe = ({ navigation, tabRoutes }) => {
  const currentIndex = tabRoutes.findIndex(route => route === 'Partenaires');

  return (
    <SwipeableTabScreen
      onSwipeLeft={() => {
        if (currentIndex < tabRoutes.length - 1) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate(tabRoutes[currentIndex + 1]);
        }
      }}
      onSwipeRight={() => {
        if (currentIndex > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate(tabRoutes[currentIndex - 1]);
        }
      }}
    >
      <PartenerStack />
    </SwipeableTabScreen>
  );
};

const StatistiquesWithSwipe = ({ navigation, tabRoutes }) => {
  const currentIndex = tabRoutes.findIndex(route => route === 'Statistiques');

  return (
    <SwipeableTabScreen
      onSwipeLeft={() => {
        if (currentIndex < tabRoutes.length - 1) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate(tabRoutes[currentIndex + 1]);
        }
      }}
      onSwipeRight={() => {
        if (currentIndex > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate(tabRoutes[currentIndex - 1]);
        }
      }}
    >
      <Statistiques />
    </SwipeableTabScreen>
  );
};

const EventsWithSwipe = ({ navigation, tabRoutes }) => {
  const currentIndex = tabRoutes.findIndex(route => route === 'Événements');

  return (
    <SwipeableTabScreen
      onSwipeLeft={() => {
        if (currentIndex < tabRoutes.length - 1) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate(tabRoutes[currentIndex + 1]);
        }
      }}
      onSwipeRight={() => {
        if (currentIndex > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate(tabRoutes[currentIndex - 1]);
        }
      }}
    >
      <Events navigation={navigation} />
    </SwipeableTabScreen>
  );
};

const ProfileStackWithSwipe = ({ navigation, tabRoutes }) => {
  const currentIndex = tabRoutes.findIndex(route => route === 'Profil');

  return (
    <SwipeableTabScreen
      onSwipeLeft={() => {
        if (currentIndex < tabRoutes.length - 1) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate(tabRoutes[currentIndex + 1]);
        }
      }}
      onSwipeRight={() => {
        if (currentIndex > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate(tabRoutes[currentIndex - 1]);
        }
      }}
    >
      <ProfileStack />
    </SwipeableTabScreen>
  );
};

const MainStepIndicatorWithSwipe = ({ navigation, tabRoutes }) => {
  const route = useRoute();
  const currentIndex = tabRoutes.findIndex(route => route === 'MainStepIndicator');

  return (
    <SwipeableTabScreen
      onSwipeLeft={() => {
        if (currentIndex < tabRoutes.length - 1) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate(tabRoutes[currentIndex + 1]);
        }
      }}
      onSwipeRight={() => {
        if (currentIndex > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate(tabRoutes[currentIndex - 1]);
        }
      }}
    >
      <MainStepIndicator navigation={navigation} route={route} />
    </SwipeableTabScreen>
  );
};

// Créer un contexte pour partager tabRoutes
const TabRoutesContext = React.createContext([]);

// Modifier les wrappers pour utiliser le contexte
const HomeStackSwipeable = ({ navigation }) => {
  const tabRoutes = React.useContext(TabRoutesContext);
  return <HomeStackWithSwipe navigation={navigation} tabRoutes={tabRoutes} />;
};

const PartenerStackSwipeable = ({ navigation }) => {
  const tabRoutes = React.useContext(TabRoutesContext);
  return <PartenerStackWithSwipe navigation={navigation} tabRoutes={tabRoutes} />;
};

const MainStepIndicatorSwipeable = ({ navigation }) => {
  const tabRoutes = React.useContext(TabRoutesContext);
  return <MainStepIndicatorWithSwipe navigation={navigation} tabRoutes={tabRoutes} />;
};

const StatistiquesSwipeable = ({ navigation }) => {
  const tabRoutes = React.useContext(TabRoutesContext);
  return <StatistiquesWithSwipe navigation={navigation} tabRoutes={tabRoutes} />;
};

const EventsSwipeable = ({ navigation }) => {
  const tabRoutes = React.useContext(TabRoutesContext);
  return <EventsWithSwipe navigation={navigation} tabRoutes={tabRoutes} />;
};

const ProfileStackSwipeable = ({ navigation }) => {
  const tabRoutes = React.useContext(TabRoutesContext);
  return <ProfileStackWithSwipe navigation={navigation} tabRoutes={tabRoutes} />;
};

// Navigateur principal avec les tabs
const TabNavigator = ({ sub }) => {
  const userSub = sub;
  const { t, i18n } = useTranslation();

  if (!userSub) {
    return null;
  }

  // Liste des routes pour le swipe (dans l'ordre)
  const tabRoutes = [];

  // Construire la liste des routes selon l'abonnement
  tabRoutes.push('Activités');
  if (userSub !== "pro") tabRoutes.push('Partenaires');
  if (userSub === "premium" || userSub === "pro") tabRoutes.push('MainStepIndicator');
  if (userSub === "pro") tabRoutes.push('Statistiques');
  if (userSub !== "pro") tabRoutes.push('Événements');
  tabRoutes.push('Profil');

  return (
    <TabRoutesContext.Provider value={tabRoutes}>
      <Tab.Navigator
        key={i18n.language}
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Écran Activités (toujours visible) */}
        <Tab.Screen
          name="Activités"
          component={HomeStackSwipeable}
          options={{ title: t("accueil") }}
        />

        {/* Écran Partenaires (visible sauf pour 'pro') */}
        {userSub !== "pro" && (
          <Tab.Screen
            name="Partenaires"
            component={PartenerStackSwipeable}
            options={{ title: t("partenaires") }}
          />
        )}

        {/* Écran Créer (visible pour 'premium' et 'pro') */}
        {(userSub === "premium" || userSub === "pro") && (
          <Tab.Screen
            name="MainStepIndicator"
            component={MainStepIndicatorSwipeable}
            initialParams={{ userSUB: userSub }}
            options={{ title: t("creer") }}
          />
        )}

        {/* Écran Statistiques (visible seulement pour 'pro') */}
        {userSub === "pro" && (
          <Tab.Screen
            name="Statistiques"
            component={StatistiquesSwipeable}
            options={{ title: t("statistiques") }}
          />
        )}

        {/* Écran Événements (visible sauf pour 'pro') */}
        {userSub !== "pro" && (
          <Tab.Screen
            name="Événements"
            component={EventsSwipeable}
            options={{ title: t("agenda") }}
          />
        )}

        {/* Écran Profil (toujours visible) */}
        <Tab.Screen
          name="Profil"
          component={ProfileStackSwipeable}
          options={{ title: t("compte") }}
        />
      </Tab.Navigator>
    </TabRoutesContext.Provider>
  );
};

// Composant Navigator principal qui gère la redirection onboarding
const Navigator = ({ sub }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [shouldShowEmailVerification, setShouldShowEmailVerification] = useState(false);
  const [shouldShowBlockedAccount, setShouldShowBlockedAccount] = useState(false);
  const [onboardingParams, setOnboardingParams] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkOnboardingStatus();
  }, [refreshKey]);

  const checkOnboardingStatus = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        // Pas d'utilisateur connecté - ne devrait pas arriver
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsInitialized(true);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const docSnapshot = await getDoc(userRef);

      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        const isActive = userData.isActive !== false; // true par défaut
        const hasCompletedOnboarding = userData.onboardingCompleted === true;
        const emailVerified = userData.emailVerified === true;

        // VÉRIFICATION 1: Compte bloqué (priorité maximale)
        if (!isActive) {
          console.log("🚫 Compte bloqué - redirection vers BloqueCompte");
          setShouldShowBlockedAccount(true);
          setShouldShowOnboarding(false);
          setShouldShowEmailVerification(false);
          // Pas de délai pour les comptes bloqués
          setIsInitialized(true);
          return;
        }
        // VÉRIFICATION 2: Onboarding incomplet
        else if (!hasCompletedOnboarding) {
          console.log(
            "🔄 Redirection vers OnboardingFlow pour compléter l'inscription"
          );
          setShouldShowOnboarding(true);
          setShouldShowEmailVerification(false);
          setShouldShowBlockedAccount(false);
          setOnboardingParams({
            userId: user.uid,
            email: userData.email || user.email || null,
            phoneNumber: userData.phoneNumber || null,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            photoURL: userData.photoURL || user.photoURL || "",
            loginMethod: userData.loginMethod || "email",
          });
          // Attendre 1 seconde pour afficher le skeleton d'onboarding
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        // VÉRIFICATION 3: Email non vérifié
        else if (hasCompletedOnboarding && !emailVerified) {
          console.log("📧 Email non vérifié - redirection vers VerifyEmail");
          setShouldShowOnboarding(false);
          setShouldShowEmailVerification(true);
          setShouldShowBlockedAccount(false);
          setOnboardingParams({
            email: userData.email || user.email,
          });
          // Pas de délai pour la vérification email
          setIsInitialized(true);
          return;
        }
        // VÉRIFICATION 4: Tout est OK
        else {
          setShouldShowOnboarding(false);
          setShouldShowEmailVerification(false);
          setShouldShowBlockedAccount(false);
          // Pas de délai pour l'accès normal à l'app
          setIsInitialized(true);
          return;
        }
      } else {
        // Pas d'utilisateur ou pas de document - initialiser immédiatement
        setIsInitialized(true);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'onboarding:", error);
      // En cas d'erreur, on initialise immédiatement
      setIsInitialized(true);
    } finally {
      // S'assurer que isInitialized est toujours true à la fin
      setIsInitialized(true);
    }
  };

  // Skeleton seulement si onboarding incomplet
  if (!isInitialized) {
    return <OnboardingSkeleton />;
  }

  // Fonction pour forcer le rechargement du Navigator
  const refreshNavigator = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <NavigatorRefreshContext.Provider value={refreshNavigator}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {shouldShowBlockedAccount ? (
          // Compte bloqué - afficher BloqueCompte et ContactUs
          <>
            <RootStack.Screen
              name="BloqueCompte"
              component={BloqueCompte}
              options={{
                gestureEnabled: false,
              }}
            />
            <RootStack.Screen
              name="ContactUs"
              component={ContactUs}
              options={{
                title: "",
              }}
            />
            <RootStack.Screen
              name="PaymentResultScreen"
              component={PaymentResultScreen}
              options={{
                gestureEnabled: false,
                animation: "fade",
              }}
            />
          </>
        ) : shouldShowOnboarding ? (
          <>
            <RootStack.Screen
              name="OnboardingFlow"
              component={OnboardingFlow}
              initialParams={onboardingParams}
              options={{
                gestureEnabled: false,
              }}
            />
            <RootStack.Screen
              name="VerifyEmail"
              component={VerifyEmail}
              options={{
                gestureEnabled: false,
              }}
            />
            <RootStack.Screen
              name="BloqueCompte"
              component={BloqueCompte}
              options={{
                gestureEnabled: false,
              }}
            />
            <RootStack.Screen
              name="ContactUs"
              component={ContactUs}
              options={{
                title: "",
              }}
            />
            <RootStack.Screen
              name="PaymentResultScreen"
              component={PaymentResultScreen}
              options={{
                gestureEnabled: false,
                animation: "fade",
              }}
            />
          </>
        ) : shouldShowEmailVerification ? (
          <>
            <RootStack.Screen
              name="VerifyEmail"
              component={VerifyEmail}
              initialParams={onboardingParams}
              options={{
                gestureEnabled: false,
              }}
            />
            <RootStack.Screen
              name="BloqueCompte"
              component={BloqueCompte}
              options={{
                gestureEnabled: false,
              }}
            />
            <RootStack.Screen
              name="ContactUs"
              component={ContactUs}
              options={{
                title: "",
              }}
            />
            <RootStack.Screen name="MainTabs">
              {() => <TabNavigator sub={sub} />}
            </RootStack.Screen>
            <RootStack.Screen
              name="PaymentResultScreen"
              component={PaymentResultScreen}
              options={{
                gestureEnabled: false,
                animation: "fade",
              }}
            />
          </>
        ) : (
          <>
            <RootStack.Screen name="MainTabs">
              {() => <TabNavigator sub={sub} />}
            </RootStack.Screen>
            <RootStack.Screen
              name="PaymentResultScreen"
              component={PaymentResultScreen}
              options={{
                gestureEnabled: false,
                animation: "fade",
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigatorRefreshContext.Provider>
  );
};

const styles = StyleSheet.create({
  addButtonContainer: {
    width: 45, // Légèrement plus grand pour un meilleur aspect visuel
    height: 45,
    backgroundColor: COLORS.primary, // Utiliser la couleur primaire définie
    borderRadius: 25, // Rendre parfaitement rond
    justifyContent: "center",
    alignItems: "center",
    bottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default Navigator;
