import React from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../ThemeProvider";
import { COLORS } from "../styles/colors";

const InfoCardModal = ({
  visible,
  iconName = "gift",
  title,
  description,
  buttonText,
  buttonBgClass,
  onButtonPress,
  onClose,
}) => {
  const { isDarkMode } = useThemeContext();

  // Déterminer les couleurs basées sur le type de carte
  const getGradientColors = () => {
    if (buttonBgClass?.includes('emerald')) {
      return ['#10B981', '#059669'];
    } else if (buttonBgClass?.includes('yellow')) {
      return ['#F59E0B', '#D97706'];
    } else if (buttonBgClass?.includes('orange')) {
      return ['#F97316', '#EA580C'];
    } else if (buttonBgClass?.includes('blue')) {
      return ['#3B82F6', '#2563EB'];
    }
    return ['#F97316', '#EA580C']; // Default
  };

  const gradientColors = getGradientColors();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <Animated.View
            entering={SlideInDown.duration(300)}
            style={styles.modalContent}
          >
            <Pressable
              onPress={() => {
                onButtonPress();
                onClose();
              }}
              style={({ pressed }) => ({
                opacity: pressed ? 0.95 : 1,
              })}
            >
              <View style={[
                styles.card,
                { backgroundColor: isDarkMode ? COLORS.bgDark : '#FFFFFF' }
              ]}>
                {/* Close button */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.closeButton,
                    { opacity: pressed ? 0.5 : 1 }
                  ]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={isDarkMode ? '#71717A' : '#A1A1AA'}
                  />
                </Pressable>

                {/* Icône */}
                <View style={styles.iconSection}>
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: `${gradientColors[0]}15` }
                  ]}>
                    <Ionicons
                      name={iconName}
                      size={40}
                      color={gradientColors[0]}
                    />
                  </View>
                </View>

                {/* Contenu */}
                <View style={styles.content}>
                  {title && (
                    <Text
                      style={[
                        styles.title,
                        { color: isDarkMode ? '#FAFAFA' : '#18181B' }
                      ]}
                    >
                      {title}
                    </Text>
                  )}

                  {description && (
                    <Text
                      style={[
                        styles.description,
                        { color: isDarkMode ? '#A1A1AA' : '#71717A' }
                      ]}
                    >
                      {description}
                    </Text>
                  )}
                </View>

                {/* CTA text */}
                <View style={styles.ctaSection}>
                  <Text style={[
                    styles.ctaText,
                    { color: gradientColors[0] }
                  ]}>
                    {buttonText}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={gradientColors[0]}
                    style={{ marginLeft: 6 }}
                  />
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    margin: 16,
    marginBottom: 32,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  iconSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.4,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 26,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.2,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  ctaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    letterSpacing: -0.2,
  },
});

export default InfoCardModal;
