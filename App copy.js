import React, { useState, useEffect, useCallback } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  LogBox,
  Platform,
  Text,
  Linking,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import Navigator from "./src/navigation/Navigator";
import ConnectionError from "./src/components/ConnectionError";
import AuthNavigator from "./src/navigation/AuthNavigator";
import AnimatedSplashScreen from "./src/components/AnimatedSplashScreen";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
} from "@expo-google-fonts/inter";
import FlashMessage from "react-native-flash-message";
import {
  NavigationContainer,
  DefaultTheme as NavDefaultTheme,
  DarkTheme as NavDarkTheme,
} from "@react-navigation/native";
import { ThemeProvider, useThemeContext } from "./src/ThemeProvider";
import moment from "moment";
import "moment/locale/fr";
moment.locale("fr");
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { Calendar, LocaleConfig } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  REVENUE_CAT_PUBLIC_KEY_IOS,
  REVENUE_CAT_PUBLIC_KEY_ANDROID,
  STRIPE_PUBLIC_KEY,
} from "@env";
import { StripeProvider } from "@stripe/stripe-react-native";
import * as SplashScreen from "expo-splash-screen";
import { Entypo } from "@expo/vector-icons";
import * as Font from "expo-font";
import { auth, db } from "./config/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from "@react-native-firebase/firestore";
import { onAuthStateChanged } from "@react-native-firebase/auth";
import { showMessage } from "react-native-flash-message";
import { TabBarProvider } from "./src/contexts/TabBarContext";
import {
  SubscriptionProvider,
  useSubscription,
} from "./src/contexts/SubscriptionContext";

SplashScreen.preventAutoHideAsync();
Purchases.setLogLevel(Purchases.LOG_LEVEL.ERROR);
LocaleConfig.locales["fr"] = {
  monthNames: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ],
  monthNamesShort: [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ],
  dayNames: [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ],
  dayNamesShort: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
  today: "aujourd'hui",
};
LocaleConfig.defaultLocale = "fr";
globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

// Composant interne qui utilise le contexte de thème
function AppContent() {
  console.log("🔵 AppContent - RENDER START");
  const { isDarkMode } = useThemeContext();
  const { subscription, isLoading: subLoading } = useSubscription();
  const [connected, setConnected] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [migrating, setMigrating] = useState(false);



  const handleDeepLink = useCallback(({ url }) => {
    if (url?.includes("stripe")) {
      const { handleURLCallback } = require("@stripe/stripe-react-native");
      handleURLCallback(url);
    }
  }, []);

  useEffect(() => {
    LogBox.ignoreAllLogs();
    const listener = Linking.addEventListener("url", handleDeepLink);
    return () => listener.remove();
  }, []);

  useEffect(() => {
    // Configuration RevenueCat (une seule fois au démarrage)
    Purchases.configure({
      apiKey:
        Platform.OS === "ios"
          ? REVENUE_CAT_PUBLIC_KEY_IOS
          : REVENUE_CAT_PUBLIC_KEY_ANDROID,
      appUserID: null,
    });
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Le SubscriptionProvider gère déjà le login RevenueCat et la sync
        try {
          const userRef = doc(db, "users", user.uid);
          const docSnapshot = await getDoc(userRef);

          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();

            // Vérification complète des données utilisateur
            const hasCompletedOnboarding =
              userData.onboardingCompleted === true;
            // Un profil valide doit avoir soit email, soit phoneNumber, ET un username
            const hasValidProfile =
              (userData.email || userData.phoneNumber) && userData.username;

            // Si l'utilisateur a terminé l'onboarding mais n'a pas de données valides
            // cela signifie que son compte a été partiellement supprimé ou corrompu
            if (hasCompletedOnboarding && !hasValidProfile) {
              console.warn(
                "Compte utilisateur incomplet ou corrompu - déconnexion"
              );
              await auth.signOut();
              await Purchases.logOut();
              setAuthenticated(false);
              setLoading(false);
              return;
            }

            // L'utilisateur est authentifié (que l'onboarding soit terminé ou non)
            // Le Navigator gérera la redirection vers OnboardingFlow si nécessaire
            setAuthenticated(true);

            // Mettre à jour lastLogin uniquement si l'onboarding est terminé
            if (hasCompletedOnboarding) {
              await updateDoc(userRef, { lastLogin: moment().format() });
            }
          } else {
            // Le document n'existe pas alors que l'utilisateur est authentifié
            // Cela peut arriver si le compte a été supprimé de Firestore mais pas de Auth
            // Ou si c'est un tout nouvel utilisateur qui vient juste de s'inscrire

            // Vérifier si c'est un compte récent (créé il y a moins de 5 minutes)
            const userCreationTime = new Date(
              user.metadata.creationTime
            ).getTime();
            const currentTime = new Date().getTime();
            const timeDifference = currentTime - userCreationTime;
            const isRecentAccount = timeDifference < 5 * 60 * 1000; // 5 minutes

            if (isRecentAccount) {
              // Nouvel utilisateur en cours d'onboarding
              console.log("Nouvel utilisateur - création du document initial");
              setAuthenticated(false);
              await setDoc(userRef, {
                createdAt: moment().format(),
                onboardingCompleted: false,
              });
            } else {
              // Compte supprimé de Firestore - déconnecter l'utilisateur
              console.warn(
                "Document Firestore introuvable pour un compte existant - déconnexion"
              );
              await auth.signOut();
              await Purchases.logOut();
              setAuthenticated(false);
            }
          }
        } catch (error) {
          console.error("Erreur lors de la vérification du compte:", error);

          // En cas d'erreur réseau ou permission, on déconnecte par sécurité
          if (
            error.code === "permission-denied" ||
            error.code === "unavailable"
          ) {
            console.warn(
              "Erreur d'accès aux données - déconnexion de sécurité"
            );
            await auth.signOut();
            await Purchases.logOut();
          }

          setAuthenticated(false);
        } finally {
          setLoading(false); // Toujours appelé
        }
      } else {
        await Purchases.logOut();
        setAuthenticated(false);
      }
      setLoading(false);
    });

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      setConnected(state.isConnected);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeNetInfo();
    };
  }, []);

  // const [fontsLoaded] = useFonts({
  //   Inter_400Regular,
  //   Inter_500Medium,
  //   Inter_500Medium,
  // });

  useEffect(() => {
    Font.loadAsync({
      Inter_400Regular: require("./node_modules/@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf"),
      Inter_500Medium: require("./node_modules/@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf"),
      Inter_600SemiBold: require("./node_modules/@expo-google-fonts/dm-sans/600SemiBold/DMSans_600SemiBold.ttf"),
      Inter_700Bold: require("./node_modules/@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf"),
      Inter_800ExtraBold: require("./node_modules/@expo-google-fonts/dm-sans/800ExtraBold/DMSans_800ExtraBold.ttf"),
    }).then(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync(Entypo.font);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(() => {
    if (appIsReady) {
      SplashScreen.hide();
    }
  }, [appIsReady]);

  if (
    !appIsReady ||
    loading ||
    !fontsLoaded ||
    !STRIPE_PUBLIC_KEY ||
    subLoading
  ) {
    return null;
  }
  console.log("🟢 AppContent - PASSED LOADING CHECK");

  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = { fontFamily: "Inter_500Medium" };

  // Afficher la splash screen animée
  if (showSplash) {
    console.log("🟡 AppContent - SHOWING SPLASH SCREEN");
    return (
      <AnimatedSplashScreen
        onFinish={() => {
          console.log("🟢 AnimatedSplashScreen - FINISHED");
          setShowSplash(false);
          SplashScreen.hideAsync();
        }}
      />
    );
  }

  console.log(
    "🟢 AppContent - RENDERING MAIN CONTENT, authenticated:",
    authenticated
  );

  // Thème personnalisé avec fond orange pour éviter le flash blanc
  const CustomDefaultTheme = {
    ...NavDefaultTheme,
    colors: {
      ...NavDefaultTheme.colors,
      background: "#F97316",
    },
  };

  const CustomDarkTheme = {
    ...NavDarkTheme,
    colors: {
      ...NavDarkTheme.colors,
      background: "#F97316",
    },
  };

  return (
    <StripeProvider
      publishableKey={`${STRIPE_PUBLIC_KEY}`}
      merchantIdentifier="merchant.com.connectmove"
      urlScheme="connectmove"
      threeDSecureParams={{
        timeout: 5,
        redirectURL: "connectmove://stripe-redirect",
      }}
      debug={true}
    >
      <TabBarProvider>
        <NavigationContainer
          theme={isDarkMode ? CustomDarkTheme : CustomDefaultTheme}
        >
          <GestureHandlerRootView
            style={{ flex: 1, backgroundColor: "#F97316" }}
            onLayout={onLayoutRootView}
          >
            {!connected ? (
              <ConnectionError />
            ) : authenticated ? (
              <Navigator sub={subscription} />
            ) : (
              <AuthNavigator />
            )}
            <FlashMessage duration={5000} position="top" />
          </GestureHandlerRootView>
        </NavigationContainer>
      </TabBarProvider>
    </StripeProvider>
  );
}

// Composant principal qui encapsule tout avec les Providers
export default function App() {
  return (
    <ThemeProvider>
      <SubscriptionProvider>
        <AppContent />
      </SubscriptionProvider>
    </ThemeProvider>
  );
}
