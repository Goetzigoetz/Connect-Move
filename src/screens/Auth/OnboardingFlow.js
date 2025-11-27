import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Progress from "react-native-progress";
import { COLORS } from "../../styles/colors";
import { NavigatorRefreshContext } from "../../navigation/Navigator";
import OnboardingStep1 from "./OnboardingSteps/Step1";
import OnboardingStep2 from "./OnboardingSteps/Step2";
import OnboardingStep3BirthDate from "./OnboardingSteps/Step3BirthDate";
import OnboardingStep3 from "./OnboardingSteps/Step3";
import OnboardingStep4 from "./OnboardingSteps/Step4";
import OnboardingStep5 from "./OnboardingSteps/Step5";
import OnboardingStep6 from "./OnboardingSteps/Step6";
import { useThemeContext } from "../../ThemeProvider";

const { width, height } = Dimensions.get("window");

const ONBOARDING_STORAGE_KEY = "@onboarding_progress";

const OnboardingFlow = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();
  const refreshNavigator = useContext(NavigatorRefreshContext);
  const {
    userId,
    email,
    phoneNumber = null,
    firstName = "",
    lastName = "",
    photoURL = "",
    loginMethod = "email", // "email", "google", "apple", or "phone"
  } = route.params;

  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState({
    firstName,
    lastName,
    photoURL,
    loginMethod,
    phoneNumber,
    gender: "",
    birthDate: null,
    expertiseLevel: "",
    interests: [],
    location: {
      address: "",
      city: "",
      country: "",
      latitude: null,
      longitude: null,
    },
    howDidYouKnow: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const totalSteps = 7;
  const progress = currentStep / totalSteps;

  // Charger la progression sauvegardée au démarrage
  useEffect(() => {
    loadOnboardingProgress();
  }, []);

  // Sauvegarder la progression à chaque changement
  useEffect(() => {
    if (!isLoading) {
      saveOnboardingProgress();
    }
  }, [currentStep, userData]);

  const loadOnboardingProgress = async () => {
    try {
      const savedProgress = await AsyncStorage.getItem(`${ONBOARDING_STORAGE_KEY}_${userId}`);
      if (savedProgress) {
        const { step, data } = JSON.parse(savedProgress);
        console.log(`📋 Progression d'onboarding restaurée: Step ${step}`);
        console.log(`📋 Données restaurées:`, data);
        setCurrentStep(step);
        // Merge saved data with initial data, saved data takes priority
        setUserData({
          firstName: data.firstName || firstName,
          lastName: data.lastName || lastName,
          photoURL: data.photoURL || photoURL,
          loginMethod: data.loginMethod || loginMethod,
          gender: data.gender || "",
          birthDate: data.birthDate || null,
          expertiseLevel: data.expertiseLevel || "",
          interests: data.interests || [],
          location: data.location || {
            address: "",
            city: "",
            country: "",
            latitude: null,
            longitude: null,
          },
          howDidYouKnow: data.howDidYouKnow || "",
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la progression:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveOnboardingProgress = async () => {
    try {
      const progress = {
        step: currentStep,
        data: userData,
        userId,
        email,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(
        `${ONBOARDING_STORAGE_KEY}_${userId}`,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la progression:", error);
    }
  };

  const clearOnboardingProgress = async () => {
    try {
      await AsyncStorage.removeItem(`${ONBOARDING_STORAGE_KEY}_${userId}`);
      console.log("✅ Progression d'onboarding effacée");
    } catch (error) {
      console.error("Erreur lors de l'effacement de la progression:", error);
    }
  };

  const handleNext = (data) => {
    setUserData({ ...userData, ...data });
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    const stepProps = {
      userData,
      onNext: handleNext,
      onBack: handleBack,
      userId,
      email,
      navigation,
      clearOnboardingProgress, // Pass this to Step6 to clear on completion
      refreshNavigator, // Pass this to Step6 to refresh Navigator after completion
    };

    switch (currentStep) {
      case 1:
        return <OnboardingStep1 {...stepProps} />;
      case 2:
        return <OnboardingStep2 {...stepProps} />;
      case 3:
        return <OnboardingStep3BirthDate {...stepProps} />;
      case 4:
        return <OnboardingStep3 {...stepProps} />;
      case 5:
        return <OnboardingStep4 {...stepProps} />;
      case 6:
        return <OnboardingStep5 {...stepProps} />;
      case 7:
        return <OnboardingStep6 {...stepProps} />;
      default:
        return <OnboardingStep1 {...stepProps} />;
    }
  };

  // Show nothing while loading saved progress
  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background gradient */}
      <LinearGradient
        colors={isDarkMode ? [COLORS.bgDarkSecondary, COLORS.bgDarkTertiary, COLORS.bgDark] : ["#F97316", "#F97316", "#EA580C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Progress.Bar
            progress={progress}
            width={width - 48}
            height={8}
            color="#FFFFFF"
            unfilledColor="rgba(255, 255, 255, 0.3)"
            borderWidth={0}
            borderRadius={4}
          />
          <Text style={styles.progressText}>
            {t("onboarding_progress_step")} {currentStep} {t("onboarding_progress_of")} {totalSteps}
          </Text>
        </View>

        {/* Step Content */}
        <View style={styles.content}>{renderStep()}</View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  progressText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginTop: 12,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
});

export default OnboardingFlow;
