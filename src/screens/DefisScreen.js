import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "@react-native-firebase/firestore";
import { auth, db } from "../../config/firebase";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { COLORS } from "../styles/colors";
import i18n from "../../i18n";
import { useThemeContext } from "../ThemeProvider";

const DefisScreen = () => {
  const { isDarkMode } = useThemeContext();
  const [defisStatus, setDefisStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  // Configuration modifiable des défis
  const DEFIS_CONFIG = [
    {
      type: "profil_completion",
      title: i18n.t("defi_profil_rempli"),
      description: i18n.t("defi_profil_rempli_description"),
      icon: "person-circle",
      color: "#10B981",
    },
    {
      type: "parrainage",
      title: i18n.t("defi_parrainer_ami"),
      description: i18n.t("defi_parrainer_ami_description"),
      icon: "gift",
      color: "#F59E0B",
    },
    {
      type: "join_event",
      title: i18n.t("defi_rejoindre_evenement"),
      description: i18n.t("defi_rejoindre_evenement_description"),
      icon: "calendar",
      color: "#3B82F6",
    },
  ];

  const fetchDefisStatus = useCallback(async () => {
    try {
      const q = query(collection(db, "defis"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);

      const status = snapshot.docs.reduce((acc, doc) => {
        acc[doc.data().type] = true;
        return acc;
      }, {});

      setDefisStatus(status);
    } catch (error) {
      console.error(i18n.t("erreur_recuperation_defis"), error);
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDefisStatus();
    }, [fetchDefisStatus])
  );

  const ChallengeItem = useCallback(({ type, title, description, icon, color, index }) => {
    const isCompleted = defisStatus[type];

    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(index * 100)}
        style={styles.challengeWrapper}
      >
        <Pressable
          style={[
            styles.challengeCard,
            {
              backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF",
              borderColor: isCompleted
                ? color
                : isDarkMode
                ? "#27272A"
                : "#E5E7EB",
              borderWidth: isCompleted ? 2 : 1,
            },
          ]}
        >
          {/* Icon container */}
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isCompleted
                  ? `${color}15`
                  : isDarkMode
                  ? "#18181B"
                  : "#F3F4F6",
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={32}
              color={isCompleted ? color : isDarkMode ? "#52525B" : "#9CA3AF"}
            />
          </View>

          {/* Content */}
          <View style={styles.challengeContent}>
            <View style={styles.challengeHeader}>
              <Text
                style={[
                  styles.challengeTitle,
                  { color: isDarkMode ? "#FAFAFA" : "#18181B" },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {isCompleted && (
                <View
                  style={[styles.completedBadge, { backgroundColor: color }]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                </View>
              )}
            </View>

            <Text
              style={[
                styles.challengeDescription,
                { color: isDarkMode ? "#A1A1AA" : "#71717A" },
              ]}
              numberOfLines={2}
            >
              {description}
            </Text>

            {/* Progress indicator */}
            {!isCompleted && (
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: isDarkMode ? "#27272A" : "#E5E7EB" },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: color, width: "0%" },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.progressText,
                    { color: isDarkMode ? "#71717A" : "#9CA3AF" },
                  ]}
                >
                  {i18n.t("en_cours")}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  }, [defisStatus, isDarkMode]);

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
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
          {i18n.t("chargement")}
        </Text>
      </View>
    );
  }

  const completedCount = Object.keys(defisStatus).length;
  const totalCount = DEFIS_CONFIG.length;
  const progressPercentage = (completedCount / totalCount) * 100;

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
              styles.statsTitle,
              { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
            ]}
          >
            {i18n.t("défis")}
          </Text>
          <View style={styles.statsRow}>
            <Text
              style={[
                styles.statsCount,
                { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
              ]}
            >
              {completedCount}
            </Text>
            <Text
              style={[
                styles.statsLabel,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              / {totalCount} {i18n.t("completes")}
            </Text>
          </View>
        </View>

        {/* Progress bar globale */}
        <View style={styles.globalProgressContainer}>
          <View
            style={[
              styles.globalProgressBar,
              { backgroundColor: isDarkMode ? "#27272A" : "#E5E7EB" },
            ]}
          >
            <View
              style={[
                styles.globalProgressFill,
                {
                  backgroundColor: COLORS.primary,
                  width: `${progressPercentage}%`,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.globalProgressText,
              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {Math.round(progressPercentage)}%
          </Text>
        </View>
      </Animated.View>

      <FlatList
        data={DEFIS_CONFIG}
        renderItem={({ item, index }) => (
          <ChallengeItem
            type={item.type}
            title={item.title}
            description={item.description}
            icon={item.icon}
            color={item.color}
            index={index}
          />
        )}
        keyExtractor={(item) => item.type}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  statsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  statsContent: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  statsCount: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statsLabel: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  globalProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  globalProgressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  globalProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  globalProgressText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    minWidth: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  challengeWrapper: {
    marginBottom: 0,
  },
  challengeCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  challengeContent: {
    flex: 1,
    justifyContent: "center",
  },
  challengeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  challengeTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.3,
    flex: 1,
  },
  completedBadge: {
    borderRadius: 20,
    padding: 4,
  },
  challengeDescription: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  progressContainer: {
    marginTop: 12,
    gap: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});

export default DefisScreen;
