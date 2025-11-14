import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Linking,
  SafeAreaView,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../styles/colors";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

const slides = [
  require("../../../assets/slides/1.jpg"),
  require("../../../assets/slides/2.jpg"),
  require("../../../assets/slides/3.jpg"),
  require("../../../assets/slides/4.jpg"),
  require("../../../assets/slides/5.jpg"),
  require("../../../assets/slides/6.jpg"),
  require("../../../assets/slides/7.jpg"),
  require("../../../assets/slides/8.jpg"),
];

export default function SignInScreen() {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const flatListRef = useRef(null);

  // Auto scroll effect
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % slides.length;
      flatListRef.current?.scrollToOffset({
        offset: currentIndex * width,
        animated: true,
      });
    }, 3000); // toutes les 3 secondes

    return () => clearInterval(interval);
  }, []);

  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    return () => {
      StatusBar.setBarStyle("dark-content");
    };
  }, []);

  const handlePhoneAuth = () => {
    navigation.navigate("Login");
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Pagination animated dots
  const Dot = ({ index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    const dotSize = scrollX.interpolate({
      inputRange,
      outputRange: [8, 16, 8],
      extrapolate: "clamp",
    });
    const dotOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: "clamp",
    });
    return (
      <Animated.View
        style={{
          width: dotSize,
          height: 8,
          borderRadius: 4,
          backgroundColor: "white",
          marginHorizontal: 4,
          opacity: dotOpacity,
        }}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <ExpoStatusBar style="light" />

      {/* Slider images en fond */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <Animated.Image
            source={item}
            style={{ width, height: "100%", resizeMode: "cover" }}
          />
        )}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        className="absolute inset-0"
      />

      {/* Voile sombre */}
      <View className="absolute inset-0 bg-black opacity-40" />

      {/* Croix retour */}
      <View className="absolute top-20 right-5 z-20">
        <Pressable onPress={handleGoBack}>
          <Ionicons name="close-outline" size={35} color="white" />
        </Pressable>
      </View>

      {/* Ton contenu original */}
      <View
        className="flex-1 px-6 pt-10"
        style={{ backgroundColor: "transparent" }}
      >
        <View className="mb-12 items-center">
          <Image
            source={require("../../../assets/logo.png")}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              marginBottom: 16,
            }}
            resizeMode="contain"
          />
          <Text
            style={{ fontFamily: "Inter_500Medium" }}
            className="text-3xl text-white mb-2 font-['Inter_500Medium']"
          >
            Bienvenue
          </Text>
          <Text
            style={{ fontFamily: "Inter_400Regular" }}
            className="text-white text-lg font-['Inter_400Regular'] text-center"
          >
            Connectez-vous pour rejoindre la communauté
          </Text>
        </View>

        <View className="flex-grow" />

        <View className="mb-6">
          <Pressable
            style={{ backgroundColor: COLORS.primary }}
            onPress={handlePhoneAuth}
            className="flex-row items-center justify-center rounded-3xl py-4 px-6 active:opacity-80"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="text-white font-semibold text-lg font-['Inter_600SemiBold']"
                >
                  Continuer
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color="white"
                  className="ml-4"
                />
              </>
            )}
          </Pressable>
        </View>

        <View className="mb-8 px-4 items-center">
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              textAlign: "center",
              color: "#D1D5DB",
            }}
          >
            En continuant, vous acceptez nos
          </Text>
          <Pressable
            onPress={() =>
              Linking.openURL("https://connectetmove.com/termes.html")
            }
          >
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                textAlign: "center",
                color: COLORS.primary,
              }}
            >
              conditions d'utilisation
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Pagination dots en bas */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          position: "absolute",
          bottom: 20,
          width: "100%",
          zIndex: 20,
        }}
      >
        {slides.map((_, index) => (
          <Dot key={index.toString()} index={index} />
        ))}
      </View>
    </SafeAreaView>
  );
}
