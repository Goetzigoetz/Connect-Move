import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useThemeContext } from "../ThemeProvider";
import { COLORS } from "../styles/colors";

const InfoCard = ({
  isVisible,
  iconName = "gift",
  iconBgClass,
  iconTintClass,
  iconSizeClass = "w-12 h-12",
  cardBgClass,
  title,
  titleClass,
  description,
  descriptionClass,
  buttonText,
  buttonBgClass,
  buttonTextColorClass = "text-white",
  onButtonPress,
  onClosePress,
  borderClass = "",
  currentIndex = 0,
  totalCards = 1,
  onDotPress,
}) => {
  if (!isVisible) {
    return null;
  }

  const { isDarkMode } = useThemeContext();

  // Déterminer les couleurs du gradient basées sur le type de carte
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
    <Animated.View
      entering={FadeInDown.duration(350)}
      style={styles.container}
    >
      <View style={[
        styles.card,
        {
          backgroundColor: isDarkMode ? COLORS.bgDark : '#FFFFFF',
        }
      ]}>
        {/* Barre de couleur subtile en haut */}
        <View style={[styles.colorBar, { backgroundColor: gradientColors[0] }]} />

        <View style={styles.cardContent}>
          {/* Header - icône et close */}
          <View style={styles.header}>
            <View style={[
              styles.iconWrapper,
              { backgroundColor: `${gradientColors[0]}10` }
            ]}>
              <Ionicons
                name={iconName}
                size={18}
                color={gradientColors[0]}
              />
            </View>

            {onClosePress && (
              <Pressable
                onPress={onClosePress}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.4 : 0.6,
                })}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={isDarkMode ? '#52525B' : '#A1A1AA'}
                />
              </Pressable>
            )}
          </View>

          {/* Contenu */}
          <View style={styles.textContent}>
            {title && (
              <Text
                style={[
                  styles.title,
                  { color: isDarkMode ? '#FAFAFA' : '#18181B' }
                ]}
                numberOfLines={1}
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
                numberOfLines={2}
              >
                {description}
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {onButtonPress && (
              <Pressable
                onPress={onButtonPress}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    opacity: pressed ? 0.8 : 1,
                    backgroundColor: gradientColors[0],
                  }
                ]}
              >
                <Text style={styles.actionButtonText}>{buttonText}</Text>
              </Pressable>
            )}

            {/* Pagination */}
            {totalCards > 1 && (
              <View style={styles.paginationDots}>
                {Array.from({ length: totalCards }).map((_, index) => (
                  <Pressable
                    key={index}
                    onPress={() => onDotPress?.(index)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: index === currentIndex
                            ? gradientColors[0]
                            : isDarkMode ? '#3F3F46' : '#E4E4E7',
                          width: index === currentIndex ? 16 : 5,
                        }
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  colorBar: {
    height: 3,
    width: '100%',
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    marginBottom: 14,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: -0.3,
    marginBottom: 6,
    lineHeight: 18,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
});

export default InfoCard;
