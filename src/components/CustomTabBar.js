import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../styles/colors';
import { useThemeContext } from '../ThemeProvider';
import { BlurView } from 'expo-blur';
import { useTabBar } from '../contexts/TabBarContext';

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { isDarkMode } = useThemeContext();
  const { isTabBarVisible } = useTabBar();
  const translateY = useSharedValue(0);

  // Map des icônes Feather pour chaque route
  const iconMap = {
    'Activités': 'home',
    'Partenaires': 'users',
    'MainStepIndicator': 'plus-circle',
    'Événements': 'calendar',
    'Statistiques': 'bar-chart-2',
    'Profil': 'user',
  };

  const getTabLabel = (route) => {
    const { options } = descriptors[route.key];
    return options.title || route.name;
  };

  React.useEffect(() => {
    translateY.value = withSpring(isTabBarVisible ? 0 : 100, {
      damping: 20,
      stiffness: 90
    });
  }, [isTabBarVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.containerWrapper, animatedStyle]}>
      <BlurView
        intensity={isDarkMode ? 100 : 80}
        tint={isDarkMode ? 'dark' : 'light'}
        style={styles.container}
      >
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = iconMap[route.name] || 'circle';

          // Si c'est le bouton MainStepIndicator, afficher le bouton central
          if (route.name === 'MainStepIndicator') {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
                style={styles.fabContainer}
                activeOpacity={0.8}
              >
                <View style={styles.fabButton}>
                  <Feather
                    name="plus"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.fabLabel}>Publier</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TabBarItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              iconName={iconName}
              label={getTabLabel(route)}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              isDarkMode={isDarkMode}
            />
          );
        })}
      </View>
      </BlurView>
    </Animated.View>
  );
};

const TabBarItem = ({ route, isFocused, iconName, label, onPress, isDarkMode }) => {
  const scale = useSharedValue(isFocused ? 1 : 0);
  const opacity = useSharedValue(isFocused ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 150
    });
    opacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const animatedBadgeStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(
      scale.value,
      [0, 1],
      [0.8, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale: scaleValue }],
      opacity: opacity.value,
    };
  });

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      style={styles.tabItem}
      activeOpacity={0.6}
    >
      <View style={styles.tabContent}>
        {/* Badge de fond pour l'onglet actif */}
        {isFocused && (
          <Animated.View
            style={[
              styles.activeBadge,
              animatedBadgeStyle,
              { backgroundColor: `${COLORS.primary}20` }
            ]}
          />
        )}

        {/* Icône */}
        <Feather
          name={iconName}
          size={22}
          color={isFocused ? COLORS.primary : (isDarkMode ? '#8E8E93' : '#8E8E93')}
          style={styles.icon}
        />

        {/* Label */}
        <Text
          style={[
            styles.label,
            {
              color: isFocused ? COLORS.primary : (isDarkMode ? '#8E8E93' : '#8E8E93'),
              fontFamily: isFocused ? 'Inter_600SemiBold' : 'Inter_500Medium',
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 50,
  },
  activeBadge: {
    position: 'absolute',
    width: 64,
    height: 32,
    borderRadius: 16,
    top: 8,
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabLabel: {
    fontSize: 10,
    marginTop: 6,
    color: COLORS.primary,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.1,
  },
});

export default CustomTabBar;
