// BloqueCompte.js
import React, { useLayoutEffect } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  Alert,
  Linking,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { COLORS } from "../../styles/colors";
import { auth } from "../../../config/firebase";

export default function BloqueCompte({ navigation }) {
useLayoutEffect(() => {
  // Cacher bottom tab via parent (tab navigator)
  navigation.getParent()?.setOptions({
    tabBarStyle: { display: 'none' },
  });

  // Cacher header pour ce screen (stack navigator)
  navigation.setOptions({ headerShown: false });

  return () => {
    navigation.getParent()?.setOptions({
      tabBarStyle: undefined,
    });
    navigation.setOptions({ headerShown: undefined });
  };
}, [navigation]);


  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      Alert.alert("Erreur", "Impossible de se déconnecter.");
    }
  };

  const handleContactSupport = () => {
    Linking.openURL("mailto:support@connectetmove.com");
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        className="bg-white dark:bg-gray-900"
      >
        <Animated.View
          entering={FadeInDown.duration(150)}
          className="flex-1 px-6 pt-12 justify-center items-center"
          style={{ minHeight: 500 }}
        >
          <Ionicons
            name="lock-closed-outline"
            size={72}
            color={COLORS.primary}
            style={{ marginBottom: 24 }}
          />
          <Text
            style={{ fontFamily: "Inter_500Medium" }}
            className="text-2xl text-center text-gray-900 dark:text-white mb-4"
          >
            Compte bloqué
          </Text>
          <Text
            style={{ fontFamily: "Inter_400Regular" }}
            className="text-center text-gray-600 dark:text-gray-300 mb-8 px-4"
          >
            Votre compte a été bloqué. Un e-mail vous a été envoyé avec toutes
            les informations nécessaires. Si vous n'avez rien reçu, vérifiez
            votre dossier spam ou contactez le support.
          </Text>
          <Pressable
            onPress={handleContactSupport}
            style={{ backgroundColor: COLORS.primary }}
            className="py-3 px-10 rounded mb-4"
          >
            <Text className="text-white font-semibold text-lg text-center">
              Contacter le support
            </Text>
          </Pressable>
          <Pressable
            onPress={handleLogout}
            className="py-3 px-10 rounded border border-gray-400"
          >
            <Text className="text-gray-700 dark:text-gray-300 text-lg text-center">
              Retour à la connexion
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
