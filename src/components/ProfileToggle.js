import React, { useState, useEffect } from "react";
import { View, Text, Switch, ActivityIndicator, Pressable } from "react-native";
import { doc, getDoc, updateDoc } from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import i18n from "../../i18n";
import { useThemeContext } from "../ThemeProvider";
import { COLORS } from "../styles/colors";

const ProfileToggle = () => {
  const { isDarkMode } = useThemeContext();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;
  const userDocRef = user ? doc(db, "users", user.uid) : null;

  // Charger la valeur initiale showMyProfile
  useEffect(() => {
    const fetchProfileVisibility = async () => {
      if (!userDocRef) return;
      setLoading(true);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsVisible(!!data.showMyProfile);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfileVisibility();
  }, [userDocRef]);

  // Toggle et update Firestore
  const toggleSwitch = async () => {
    if (!userDocRef) return;
    const newValue = !isVisible;
    setIsVisible(newValue);
    setLoading(true);
    try {
      await updateDoc(userDocRef, {
        showMyProfile: newValue,
      });
    } catch (error) {
      console.error("Erreur toggle showMyProfile:", error);
      setIsVisible(!newValue); // revert si erreur
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: isDarkMode ? "#D1D5DB" : "#374151" }}>
          {i18n.t("utilisateur_non_connecte")}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={toggleSwitch}
      disabled={loading}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? "#374151" : "#E5E7EB",
        backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 16,
            color: isDarkMode ? "#D1D5DB" : "#374151",
          }}
        >
          {i18n.t("afficher_mon_profil")}
        </Text>
      </View>

        <Switch
          value={isVisible}
          onValueChange={toggleSwitch}
          thumbColor={isVisible ? "#ff9f43" : "#f4f3f4"}
          trackColor={{ false: "#767577", true: "#f4f3f4" }}
        />

    </Pressable>
  );
};

export default ProfileToggle;
