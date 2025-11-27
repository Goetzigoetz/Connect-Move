import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../styles/colors';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

/**
 * Tutoriel interactif montrant le geste de swipe entre les tabs
 * Avec overlay sombre et animation stylée
 */
const SwipeHandTutorial = ({ onComplete }) => {
  const { t } = useTranslation();
  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.8);
  const contentOpacity = useSharedValue(0);
  const arrowTranslateX = useSharedValue(0);
  const arrowOpacity = useSharedValue(1);

  useEffect(() => {
    // Fade in de l'overlay
    overlayOpacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });

    // Apparition du contenu avec scale
    contentScale.value = withDelay(
      200,
      withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.back(1.2)),
      })
    );

    contentOpacity.value = withDelay(
      200,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      })
    );

    // Animation des flèches en boucle
    arrowTranslateX.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(60, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1, // Répéter à l'infini
        false
      )
    );
  }, []);

  const handleDismiss = () => {
    // Animation de sortie
    contentOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.ease),
    });

    overlayOpacity.value = withTiming(
      0,
      {
        duration: 300,
        easing: Easing.in(Easing.ease),
      },
      (finished) => {
        'worklet';
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      }
    );
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentContainerStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowTranslateX.value }],
    opacity: arrowOpacity.value,
  }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="box-none">
      <Pressable style={styles.dismissArea} onPress={handleDismiss}>
        <Animated.View style={[styles.contentContainer, contentContainerStyle]}>
          <View style={styles.card}>
            {/* Animation des flèches */}
            <View style={styles.arrowsContainer}>
              <Animated.View style={arrowStyle}>
                <View style={styles.arrowRow}>
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={32}
                    color={COLORS.primary}
                  />
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={32}
                    color={COLORS.primary}
                    style={{ marginLeft: -12 }}
                  />
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={32}
                    color={COLORS.primary}
                    style={{ marginLeft: -12, opacity: 0.5 }}
                  />
                </View>
              </Animated.View>

              <View style={styles.spacer} />

              <Animated.View style={arrowStyle}>
                <View style={styles.arrowRow}>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={32}
                    color={COLORS.primary}
                    style={{ opacity: 0.5 }}
                  />
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={32}
                    color={COLORS.primary}
                    style={{ marginLeft: -12 }}
                  />
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={32}
                    color={COLORS.primary}
                    style={{ marginLeft: -12 }}
                  />
                </View>
              </Animated.View>
            </View>

            {/* Texte explicatif */}
            <Text style={styles.title}>{t('swipe_tutorial_title', { defaultValue: 'Astuce !' })}</Text>
            <Text style={styles.description}>
              {t('swipe_tutorial_description', {
                defaultValue: 'Swipez horizontalement pour naviguer entre les onglets',
              })}
            </Text>

            {/* Bouton de fermeture */}
            <Pressable style={styles.button} onPress={handleDismiss}>
              <Text style={styles.buttonText}>
                {t('swipe_tutorial_got_it', { defaultValue: "J'ai compris" })}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: width * 0.85,
    maxWidth: 400,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  arrowsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    marginBottom: 32,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    width: 40,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default SwipeHandTutorial;
