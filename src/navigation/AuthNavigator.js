import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";

// Import des écrans
import Home from "../screens/Home";
import Login from "../screens/Auth/Login";
import PhoneVerificationPage from "../screens/Auth/PhoneVerificationPage";
import Profile from "../screens/Profile";
import { TouchableOpacity } from "react-native";
import ActivityDetails from "../screens/ActivityDetails";
import PasswordPage from "../screens/Auth/PasswordPage";
import { COLORS } from "../styles/colors";
import Categories from "../screens/Categories";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import ReportReasonScreen from "../screens/ReportReasonScreen";
import { getScreenOptions } from "./screenOptions";
import ForgotPassword from "../screens/Auth/ForgotPassword";
import ClufPage from "../screens/ClufPage";
import SignInScreen from "../screens/Auth/SignInScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={getScreenOptions()}>
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
          presentation: "modal",
          title: "Conditions d'utilisation",
          title: "",
        }}
      />
      <Stack.Screen
        name="Categories"
        component={Categories}
        options={{
          title: "",
          headerTitle: "",
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
        }}
      />

      <Stack.Screen
        name="ReportReasonScreen"
        component={ReportReasonScreen}
        options={{
          title: "",
          headerTitle: "",
        }}
      />

      <Stack.Screen
        name="SignInScreen"
        component={SignInScreen}
        options={{
          presentation: "modal",
          headerShown: false,
          title: "",
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Inter_500Medium",
          },
        }}
      />
      <Stack.Screen
        name="Login"
        component={Login}
        options={{
          presentation: "modal",
          headerShown: false,
          title: "",
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Inter_500Medium",
          },
        }}
      />

      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{
          presentation: "modal",
          title: "",
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Inter_500Medium",
          },
        }}
      />

      <Stack.Screen
        name="PhoneVerificationPage"
        component={PhoneVerificationPage}
        options={{
          title: "",
          headerTitle: "",
        }}
      />

      <Stack.Screen
        name="PasswordPage"
        component={PasswordPage}
        options={{
          title: "",
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: "Inter_500Medium",
          },
        }}
      />
    </Stack.Navigator>
  );
};

const AuthNavigator = () => {
  return <HomeStack />;
};

export default AuthNavigator;
