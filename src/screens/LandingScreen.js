import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Modal, SafeAreaView, FlatList, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import Carousel from "react-native-reanimated-carousel";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useThemeContext } from "../ThemeProvider";
import { COLORS } from "../styles/colors";

const { width, height } = Dimensions.get("window");

const SLIDER_DATA = [
  {
    image: require("../../assets/img/slider/1.jpg"),
    textKey: "landing_slide_1",
  },
  {
    image: require("../../assets/img/slider/2.jpg"),
    textKey: "landing_slide_2",
  },
  {
    image: require("../../assets/img/slider/3.jpg"),
    textKey: "landing_slide_3",
  },
  {
    image: require("../../assets/img/slider/4.jpg"),
    textKey: "landing_slide_4",
  },
  {
    image: require("../../assets/img/slider/5.png"),
    textKey: "landing_slide_5",
  },
];

const LANGUAGES = [
  {
    code: "fr",
    label: "Français",
    flag: require("../../assets/img/fr.png"),
  },
  {
    code: "en",
    label: "English",
    flag: require("../../assets/img/en.png"),
  },
  {
    code: "de",
    label: "Deutsch",
    flag: require("../../assets/img/de.webp"),
  },
  {
    code: "es",
    label: "Español",
    flag: require("../../assets/img/es.webp"),
  },
  {
    code: "it",
    label: "Italiano",
    flag: require("../../assets/img/it.png"),
  },
  {
    code: "cn",
    label: "中文",
    flag: require("../../assets/img/cn.png"),
  },
  {
    code: "jp",
    label: "日本語",
    flag: require("../../assets/img/jp.png"),
  },
];

const LandingScreen = ({ navigation, onComplete }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || "fr");
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = React.useRef(null);

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setSelectedLanguage(languageCode);
    setShowLanguageModal(false);
  };

  const getCurrentLanguage = () => {
    return LANGUAGES.find((lang) => lang.code === selectedLanguage) || LANGUAGES[0];
  };

  const handleDotPress = (index) => {
    carouselRef.current?.scrollTo({ index, animated: true });
    setActiveSlide(index);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Image Slider */}
      <View style={styles.sliderContainer}>
        <Carousel
          ref={carouselRef}
          width={width}
          height={height}
          data={SLIDER_DATA}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeIn.duration(600)}
              style={styles.slideItem}
            >
              <Image
                source={item.image}
                style={styles.slideImage}
                resizeMode="cover"
              />
              {/* Gradient overlay */}
              <LinearGradient
                colors={[
                  'rgba(0, 0, 0, 0.1)',
                  'rgba(0, 0, 0, 0.4)',
                  'rgba(0, 0, 0, 0.75)'
                ]}
                locations={[0, 0.5, 1]}
                style={styles.gradientOverlay}
              />

              {/* Logo rond en haut */}
              <View style={styles.topLogoContainer}>
                <Image
                  source={require("../../assets/logo.png")}
                  style={styles.logoTop}
                  resizeMode="cover"
                />
              </View>

            </Animated.View>
          )}
          loop
          autoPlay={true}
          autoPlayInterval={5000}
          onSnapToItem={(index) => setActiveSlide(index)}
          panGestureHandlerProps={{
            activeOffsetX: [-10, 10],
          }}
        />
      </View>

      {/* Language Selector */}
      <SafeAreaView style={styles.languageSelectorContainer}>
        <TouchableOpacity
          style={[
            styles.languageButton,
            { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.25)' }
          ]}
          onPress={() => setShowLanguageModal(true)}
          activeOpacity={0.8}
        >
          <Image source={getCurrentLanguage().flag} style={styles.flagImage} />
          <Text style={styles.languageText}>
            {getCurrentLanguage().label}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Content */}
      <View style={styles.content}>
        {/* Section de texte avec animation par slide */}
        <Animated.View
          key={activeSlide}
          entering={FadeInDown.duration(500)}
          style={styles.textSection}
        >
          <Text style={styles.mainTitle}>
            {t(SLIDER_DATA[activeSlide].textKey)}
          </Text>
        </Animated.View>

        {/* Sous-titre fixe */}
        <Text style={styles.subtitle}>
          {t("landing_subtitle")}
        </Text>

        {/* Pagination */}
        <View style={styles.paginationWrapper}>
          {SLIDER_DATA.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View
                style={[
                  styles.pageDot,
                  index === activeSlide && styles.pageDotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bouton CTA */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (onComplete) {
              onComplete();
            } else {
              // Navigate to Login which is in the same navigator
              navigation.navigate("Login");
            }
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#F97316', '#EA580C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>{t("commencer")}</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? COLORS.bgDarkSecondary : "#FFFFFF" }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[
                styles.modalTitle,
                { color: isDarkMode ? "#FFFFFF" : "#18181B" }
              ]}>
                {t("selectionner_une_langue")}
              </Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isDarkMode ? "#A1A1AA" : "#71717A"}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageOption,
                    selectedLanguage === item.code && {
                      backgroundColor: isDarkMode ? "#27272A" : "#F4F4F5",
                    },
                  ]}
                  onPress={() => handleLanguageChange(item.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageOptionContent}>
                    <Image source={item.flag} style={styles.flagImageLarge} />
                    <Text style={[
                      styles.languageOptionText,
                      { color: isDarkMode ? "#FFFFFF" : "#18181B" }
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  {selectedLanguage === item.code && (
                    <Ionicons name="checkmark" size={24} color="#F97316" />
                  )}
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  sliderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height,
  },
  slideItem: {
    width: width,
    height: height,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topLogoContainer: {
    position: 'absolute',
    top: height * 0.12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  logoTop: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  languageSelectorContainer: {
    position: 'absolute',
    top: 10,
    right: 20,
    paddingTop: 10,
    paddingRight: 20,
    zIndex: 10,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  flagImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  languageText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: '#FFFFFF',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 44,
    backgroundColor: 'transparent',
  },
  textSection: {
    marginBottom: 8,
    minHeight: 120,
    justifyContent: 'center',
  },
  mainTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    textAlign: "center",
    color: '#FFFFFF',
    letterSpacing: -1.5,
    lineHeight: 46,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  paginationWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  pageDotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  button: {
    width: "100%",
    borderRadius: 9999,
    overflow: 'hidden',
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    letterSpacing: -0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  languageOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flagImageLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  languageOptionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
});

export default LandingScreen;
