import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import des écrans
import Home from "../screens/Home";
import Login from "../screens/Auth/Login";
import PhoneVerificationPage from "../screens/Auth/PhoneVerificationPage";
import Profile from "../screens/Profile";
import { TouchableOpacity, ActivityIndicator, View } from "react-native";
import ActivityDetails from "../screens/ActivityDetails";
import PasswordPage from "../screens/Auth/PasswordPage";
import OnboardingFlow from "../screens/Auth/OnboardingFlow";
import { COLORS } from "../styles/colors";
import FilterScreen from "../screens/FilterScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import ReportReasonScreen from "../screens/ReportReasonScreen";
import { getScreenOptions } from "./screenOptions";
import ForgotPassword from "../screens/ForgotPassword";
import ResetPassword from "../screens/ResetPassword";
import ClufPage from "../screens/ClufPage";
import LandingScreen from "../screens/LandingScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = ({ isFirstTime }) => {
  return (
    <Stack.Navigator
      initialRouteName={"LandingScreen"}
      // initialRouteName={isFirstTime ? "LandingScreen" : "Home"}
      screenOptions={{
        ...getScreenOptions(),
        animation: "slide_from_right", // Transition style Twitter/Apple
        gestureEnabled: true,
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: true,
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="LandingScreen"
        component={LandingScreen}
        options={{
          headerShown: false,
          title: "",
          animation: "fade",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="Home"
        component={Home}
        options={{
          title: "",
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Inter_500Medium",
          },
        }}
      />
      <Stack.Screen
        name="ClufPage"
        component={ClufPage}
        options={{
          animation: "fade_from_bottom",
          title: "",
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
              cardStyle: { backgroundColor: "transparent" },
              cardStyleInterpolator: ({ current: { progress } }) => ({
                cardStyle: {
                  opacity: progress,
                },
              }),
            }}
            sharedElements={(route) => {
              return [
                {
                  id: "filterButton",
                  animation: "move",
                  resize: "auto",
                  align: "auto",
                },
              ];
            }}
          />

      <Stack.Screen
        name="ActivityDetails"
        component={ActivityDetails}
        options={{
          title: "",
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Inter_500Medium",
          },
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="ReportReasonScreen"
        component={ReportReasonScreen}
        options={{
          title: "",
          headerTitle: "",
          animation: "slide_from_bottom",
        }}
      />

      <Stack.Screen
        name="Login"
        component={Login}
        options={{
          headerShown: false,
          title: "",
          animation: "slide_from_right",
          gestureEnabled: true,
        }}
      />

      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{
          headerShown: false,
          title: "",
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Inter_500Medium",
          },
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="ResetPassword"
        component={ResetPassword}
        options={{
          headerShown: false,
          title: "",
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Inter_500Medium",
          },
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="PhoneVerificationPage"
        component={PhoneVerificationPage}
        options={{
          headerShown: false,
          title: "",
          headerTitle: "",
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="PasswordPage"
        component={PasswordPage}
        options={{
          headerShown: false,
          title: "",
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Inter_500Medium",
          },
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="OnboardingFlow"
        component={OnboardingFlow}
        options={{
          headerShown: false,
          title: "",
          animation: "slide_from_right",
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

const AuthNavigator = () => {
  const [isFirstTime, setIsFirstTime] = useState(null);

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const hasOpenedBefore = await AsyncStorage.getItem("hasOpenedApp");
      if (hasOpenedBefore === null) {
        // First time opening the app
        setIsFirstTime(true);
        await AsyncStorage.setItem("hasOpenedApp", "true");
      } else {
        // Not first time
        setIsFirstTime(false);
      }
    } catch (error) {
      console.error("Error checking first time:", error);
      setIsFirstTime(false);
    }
  };

  // Show loading while checking
  if (isFirstTime === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F97316",
        }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return <HomeStack isFirstTime={isFirstTime} />;
};

export default AuthNavigator;
