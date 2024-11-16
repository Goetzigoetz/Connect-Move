import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { useState, useEffect } from "react";
import { LogBox, StatusBar, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import Navigator from "./src/navigation/Navigator";

import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { REVENUE_CAT_PUBLIC_KEY } from "@env";
import ConnectionError from "./src/components/ConnectionError";
// import Purchases from "react-native-purchases";
import "./i18n";

export default function App() {
  const [connected, setConnected] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    LogBox.ignoreAllLogs();
    // Platform.OS !== "web" && purchaseRevenueCat();
    checkAuth();
    const unsubscribe = NetInfo.addEventListener((state) => {
      setConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const purchaseRevenueCat = async () => {
    // Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    Purchases.configure({ apiKey: `${REVENUE_CAT_PUBLIC_KEY}` });
  };

  const checkAuth = async () => {
    const unsusbcribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
      setLoaded(true);
    });
    return () => unsusbcribe();
  };

  const [fontsLoaded, error] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  if (!loaded || !fontsLoaded || error) {
    return null;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!connected ? <ConnectionError /> : <Navigator />}
    </GestureHandlerRootView>
  );
}
