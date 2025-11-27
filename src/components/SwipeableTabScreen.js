import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

/**
 * Wrapper pour rendre un écran de tab swipeable
 * @param {React.Component} children - Le contenu de l'écran
 * @param {function} onSwipeLeft - Callback pour swipe vers la gauche
 * @param {function} onSwipeRight - Callback pour swipe vers la droite
 */
const SwipeableTabScreen = ({ children, onSwipeLeft, onSwipeRight }) => {
  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Très sensible : commence après seulement 10px
    .failOffsetY([-50, 50]) // Tolérant sur le mouvement vertical (permet scroll)
    .onEnd((event) => {
      'worklet';
      const velocityX = event.velocityX;
      const translationX = event.translationX;

      // Seuils très bas pour une détection ultra-sensible
      const SWIPE_THRESHOLD = 30; // Réduit de 100 à 30px
      const VELOCITY_THRESHOLD = 300; // Réduit de 800 à 300

      if (translationX < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) {
        // Swipe vers la gauche (aller à droite)
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        if (onSwipeLeft) runOnJS(onSwipeLeft)();
      } else if (translationX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) {
        // Swipe vers la droite (aller à gauche)
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        if (onSwipeRight) runOnJS(onSwipeRight)();
      }
    });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        {children}
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SwipeableTabScreen;
