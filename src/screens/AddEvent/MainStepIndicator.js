import React, { useLayoutEffect, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Alert, SafeAreaView, StatusBar } from "react-native";
import StepIndicator from "react-native-step-indicator";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
// Importez les composants pour chaque étape
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";
import Step5 from "./Step5";
import { COLORS } from "../../styles/colors";
import * as Progress from "react-native-progress";
import i18n from "../../../i18n";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useFormPersistence, getFormDraft, clearFormDraft, hasDraft } from "../../hooks/useFormPersistence";
import { useThemeContext } from "../../ThemeProvider";

// Simple Step Progress Component
const SimpleStepProgress = ({ currentStep, totalSteps, isDarkMode }) => {
  return (
    <View
      style={[
        styles.stepProgressContainer,
        {
          backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF",
        },
      ]}
    >
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: isActive || isCompleted
                    ? COLORS.primary
                    : isDarkMode
                    ? "#2F3336"
                    : "#E5E7EB",
                  width: isActive ? 36 : 12,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const customStyles = {
  stepIndicatorSize: 0,
  currentStepIndicatorSize: 0,
  separatorStrokeWidth: 0,
  currentStepStrokeWidth: 0,
  stepStrokeWidth: 0,
  stepIndicatorFinishedColor: "transparent",
  stepIndicatorUnFinishedColor: "transparent",
  stepIndicatorCurrentColor: "transparent",
  stepIndicatorLabelFontSize: 0,
  currentStepIndicatorLabelFontSize: 0,
  separatorFinishedColor: "transparent",
  separatorUnFinishedColor: "transparent",
  labelColor: "transparent",
  labelSize: 0,
  currentStepLabelColor: "transparent",
};

const MainStepIndicator = ({ navigation, route }) => {
  const { userSUB } = route.params || {};
  const { isDarkMode } = useThemeContext();

  const [currentPosition, setCurrentPosition] = useState(0);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const totalSteps = 5;
  const progress = currentPosition / (totalSteps - 1);

  const [formData, setFormData] = useState({
    price: 0,
    title: "",
    description: "",
    maxParticipants: 2,
    participants: [],
    date: "",
    time: "",
    endPointName: "",
    categoryId: "",
    location: "",
    coordinates: { latitude: null, longitude: null },
    images: [],
  });

  // Sauvegarde automatique
  useFormPersistence(formData, draftLoaded);

  // Animation values
  const scale = useSharedValue(0.85);
  const contentOpacity = useSharedValue(0);
  const progressTranslateY = useSharedValue(-20);

  // Charger le brouillon au démarrage
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const hasSavedDraft = await hasDraft();
        if (hasSavedDraft) {
          Alert.alert(
            "Brouillon trouvé",
            "Voulez-vous reprendre là où vous vous êtes arrêté ?",
            [
              {
                text: "Non, recommencer",
                style: "cancel",
                onPress: async () => {
                  await clearFormDraft();
                  setDraftLoaded(true);
                },
              },
              {
                text: "Oui, continuer",
                onPress: async () => {
                  const draft = await getFormDraft();
                  if (draft) {
                    setFormData(draft);
                    // Déterminer la dernière étape complétée
                    let lastStep = 0;
                    if (draft.title && draft.description) lastStep = 1;
                    if (draft.date && draft.time) lastStep = 2;
                    if (draft.categoryId) lastStep = 3;
                    if (draft.location) lastStep = 4;
                    setCurrentPosition(lastStep);
                  }
                  setDraftLoaded(true);
                },
              },
            ]
          );
        } else {
          setDraftLoaded(true);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du brouillon:", error);
        setDraftLoaded(true);
      }
    };

    loadDraft();
  }, []);

  // Initialize entrance animation
  useEffect(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    contentOpacity.value = withTiming(1, { duration: 400 });
    progressTranslateY.value = withSpring(0, { damping: 20, stiffness: 150 });
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: i18n.t("nouvel_evenement") || "Nouvel évènement",
      headerStyle: {
        backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF",
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0.5,
        borderBottomColor: isDarkMode ? COLORS.borderDark : "#E5E7EB",
      },
      headerTintColor: isDarkMode ? "#FFFFFF" : "#000000",
      headerTitleStyle: {
        fontSize: 15,
        fontFamily: "Inter_600SemiBold",
        letterSpacing: -0.3,
        color: isDarkMode ? "#FFFFFF" : "#000000",
      },
      headerLeft: () =>
        currentPosition > 0 && (
          <Pressable
            activeOpacity={0.8}
            onPress={() => setCurrentPosition(currentPosition - 1)}
            style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4 }}
          >
            <Ionicons name="chevron-back" size={20} color="#EF4444" />
            <Text
              style={{ color: "#EF4444", fontSize: 16, fontFamily: "Inter_400Regular" }}
            >
              {i18n.t("retour")}
            </Text>
          </Pressable>
        ),
    });
  }, [currentPosition, isDarkMode]);

  // Fonction pour passer à l'étape suivante et sauvegarder les données
  const onNext = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentPosition((prev) => prev + 1);
  };

  // Fonction pour revenir à l'étape précédente (si nécessaire)
  const onPrevious = () => {
    setCurrentPosition((prev) => (prev > 1 ? prev - 1 : prev));
  };

  // Fonction pour terminer et afficher les données
  const onComplete = async () => {
    // Supprimer le brouillon après publication réussie
    await clearFormDraft();
    setCurrentPosition(0);
    setFormData({
      price: 0,
      title: "",
      description: "",
      maxParticipants: 2,
      participants: [],
      date: "",
      time: "",
      endPointName: "",
      categoryId: "",
      location: "",
      coordinates: { latitude: null, longitude: null },
      images: [],
    });
    navigation.jumpTo("Activités");
  };

  // Gérer le contenu des étapes
  const renderStepContent = () => {
    if (!draftLoaded) {
      return null; // Ou un loading indicator
    }

    switch (currentPosition) {
      case 0:
        return <Step1 userSUB={userSUB} onNext={onNext} initialData={formData} />;
      case 1:
        return <Step2 onNext={onNext} onPrevious={onPrevious} initialData={formData} />;
      case 2:
        return <Step3 onNext={onNext} onPrevious={onPrevious} initialData={formData} />;
      case 3:
        return <Step4 onNext={onNext} onPrevious={onPrevious} initialData={formData} />;
      case 4:
        return (
          <Step5
            userSUB={userSUB}
            previousData={formData}
            onComplete={onComplete}
            onPrevious={onPrevious}
            initialData={formData}
          />
        );

      default:
        return <Step1 userSUB={userSUB} onNext={onNext} initialData={formData} />;
    }
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: contentOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: progressTranslateY.value }],
    opacity: contentOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? COLORS.bgDark : "#FFFFFF"}
      />
      <Animated.View
        style={[{ flex: 1, backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" }, containerStyle]}
      >
        {/* Barre de progression animée */}
        <Animated.View style={[progressStyle, { paddingTop: 8, paddingBottom: 8 }]}>
          <Progress.Bar
            progress={progress}
            width={null}
            height={4}
            color={COLORS.primary}
            unfilledColor={isDarkMode ? "#2F3336" : "#E5E7EB"}
            borderWidth={0}
            borderRadius={2}
          />
        </Animated.View>

      {/* StepIndicator caché pour la logique */}
      <StepIndicator
        customStyles={customStyles}
        currentPosition={currentPosition}
        stepCount={totalSteps}
        onPress={(position) => setCurrentPosition(position)}
      />

        {/* Contenu de l'étape */}
        <Animated.View style={[{ flex: 1 }, contentStyle]}>
          {renderStepContent()}
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  stepProgressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 16,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  dot: {
    height: 12,
    borderRadius: 6,
    transition: "all 0.3s ease",
  },
});

export default MainStepIndicator;
