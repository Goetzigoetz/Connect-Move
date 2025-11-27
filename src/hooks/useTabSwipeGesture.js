import { useEffect } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

/**
 * Hook personnalisé pour ajouter la navigation par swipe entre les tabs
 * @param {object} navigation - L'objet navigation de React Navigation
 * @param {array} tabRoutes - Liste des routes de tabs dans l'ordre
 * @param {string} currentRouteName - Nom de la route actuelle
 */
export const useTabSwipeGesture = (navigation, tabRoutes, currentRouteName) => {
  const currentIndex = tabRoutes.findIndex(route => route === currentRouteName);

  const handleSwipeLeft = () => {
    // Swipe vers la gauche = aller à la tab suivante (droite)
    if (currentIndex < tabRoutes.length - 1) {
      const nextRoute = tabRoutes[currentIndex + 1];
      navigation.navigate(nextRoute);
    }
  };

  const handleSwipeRight = () => {
    // Swipe vers la droite = aller à la tab précédente (gauche)
    if (currentIndex > 0) {
      const prevRoute = tabRoutes[currentIndex - 1];
      navigation.navigate(prevRoute);
    }
  };

  const gesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Commencer le geste après 20px de mouvement horizontal
    .failOffsetY([-10, 10]) // Annuler si mouvement vertical > 10px
    .onEnd((event) => {
      'worklet';
      const velocityX = event.velocityX;
      const translationX = event.translationX;

      // Seuil de swipe: 50px ou vitesse > 500
      const SWIPE_THRESHOLD = 50;
      const VELOCITY_THRESHOLD = 500;

      if (translationX < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) {
        // Swipe vers la gauche
        runOnJS(handleSwipeLeft)();
      } else if (translationX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) {
        // Swipe vers la droite
        runOnJS(handleSwipeRight)();
      }
    });

  return gesture;
};
