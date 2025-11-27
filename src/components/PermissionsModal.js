import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../styles/colors';
import * as Notifications from 'expo-notifications';
import * as TrackingTransparency from 'expo-tracking-transparency';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '../ThemeProvider';

const { width, height } = Dimensions.get('window');

const PERMISSION_STEPS = {
  TRACKING: 'tracking',
  NOTIFICATIONS: 'notifications',
  LOCATION: 'location',
  COMPLETED: 'completed',
};

const PermissionsModal = ({ visible, onComplete }) => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeContext();

  const [currentStep, setCurrentStep] = useState(PERMISSION_STEPS.TRACKING);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (visible) {
      // Déterminer la première étape selon la plateforme
      if (Platform.OS === 'ios' && Platform.Version >= 14) {
        setCurrentStep(PERMISSION_STEPS.TRACKING);
      } else {
        setCurrentStep(PERMISSION_STEPS.NOTIFICATIONS);
      }
    }
  }, [visible]);

  const requestTrackingPermission = async () => {
    if (Platform.OS !== 'ios' || Platform.Version < 14) {
      // Passer directement aux notifications sur Android ou iOS < 14
      setCurrentStep(PERMISSION_STEPS.NOTIFICATIONS);
      return;
    }

    setIsRequesting(true);
    try {
      const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
      console.log('Tracking permission status:', status);

      // Enregistrer le choix
      await AsyncStorage.setItem('hasAskedTracking', 'true');

      // Passer aux notifications
      setTimeout(() => {
        setCurrentStep(PERMISSION_STEPS.NOTIFICATIONS);
        setIsRequesting(false);
      }, 500);
    } catch (error) {
      console.error('Erreur tracking permission:', error);
      setCurrentStep(PERMISSION_STEPS.NOTIFICATIONS);
      setIsRequesting(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (!Device.isDevice) {
      // Simulateur - passer à la localisation
      setCurrentStep(PERMISSION_STEPS.LOCATION);
      return;
    }

    setIsRequesting(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Notification permission status:', status);

      // Enregistrer le choix
      await AsyncStorage.setItem('hasAskedNotifications', 'true');

      // Passer à la localisation
      setTimeout(() => {
        setCurrentStep(PERMISSION_STEPS.LOCATION);
        setIsRequesting(false);
      }, 500);
    } catch (error) {
      console.error('Erreur notification permission:', error);
      setCurrentStep(PERMISSION_STEPS.LOCATION);
      setIsRequesting(false);
    }
  };

  const requestLocationPermission = async () => {
    setIsRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission status:', status);

      // Enregistrer le choix
      await AsyncStorage.setItem('hasAskedLocation', 'true');

      // Terminer le flow
      setTimeout(() => {
        setCurrentStep(PERMISSION_STEPS.COMPLETED);
        setIsRequesting(false);
        // Enregistrer que le flow est terminé
        AsyncStorage.setItem('hasCompletedPermissionsFlow', 'true');
        onComplete?.();
      }, 500);
    } catch (error) {
      console.error('Erreur location permission:', error);
      setCurrentStep(PERMISSION_STEPS.COMPLETED);
      setIsRequesting(false);
      AsyncStorage.setItem('hasCompletedPermissionsFlow', 'true');
      onComplete?.();
    }
  };

  const skipCurrentStep = async () => {
    // Enregistrer que l'utilisateur a skip
    if (currentStep === PERMISSION_STEPS.TRACKING) {
      await AsyncStorage.setItem('hasAskedTracking', 'true');
      setCurrentStep(PERMISSION_STEPS.NOTIFICATIONS);
    } else if (currentStep === PERMISSION_STEPS.NOTIFICATIONS) {
      await AsyncStorage.setItem('hasAskedNotifications', 'true');
      setCurrentStep(PERMISSION_STEPS.LOCATION);
    } else if (currentStep === PERMISSION_STEPS.LOCATION) {
      await AsyncStorage.setItem('hasAskedLocation', 'true');
      await AsyncStorage.setItem('hasCompletedPermissionsFlow', 'true');
      setCurrentStep(PERMISSION_STEPS.COMPLETED);
      onComplete?.();
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case PERMISSION_STEPS.TRACKING:
        return {
          icon: 'shield-checkmark',
          title: t('confidentialite_securite') || 'Confidentialité et sécurité',
          description: t('tracking_permission_desc') || 'Nous respectons votre vie privée. Cette autorisation nous aide à améliorer votre expérience et à vous proposer du contenu pertinent.',
          buttonText: t('continuer') || 'Continuer',
          onPress: requestTrackingPermission,
          gradient: ['#3B82F6', '#2563EB'],
        };
      case PERMISSION_STEPS.NOTIFICATIONS:
        return {
          icon: 'notifications',
          title: t('restez_informe') || 'Restez informé',
          description: t('notifications_permission_desc') || 'Recevez des notifications pour ne manquer aucun match, message ou événement important.',
          buttonText: t('activer_les_notifications') || 'Activer les notifications',
          onPress: requestNotificationPermission,
          gradient: [COLORS.primary, COLORS.secondary],
        };
      case PERMISSION_STEPS.LOCATION:
        return {
          icon: 'location',
          title: t('trouvez_activites_pres_de_vous') || 'Trouvez des activités près de chez vous',
          description: t('location_permission_desc') || 'Autorisez l\'accès à votre position pour découvrir des événements et partenaires dans votre région.',
          buttonText: t('activer_la_localisation') || 'Activer la localisation',
          onPress: requestLocationPermission,
          gradient: ['#10B981', '#059669'],
        };
      default:
        return null;
    }
  };

  if (!visible || currentStep === PERMISSION_STEPS.COMPLETED) {
    return null;
  }

  const content = getStepContent();
  if (!content) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.7)' }]}>
        <Animated.View
          entering={SlideInDown.duration(400)}
          exiting={SlideOutDown.duration(300)}
          style={[
            styles.modalContainer,
            { backgroundColor: isDarkMode ? COLORS.bgDarkTertiary : '#FFFFFF' }
          ]}
        >
          {/* Indicateur de progression */}
          <View style={styles.progressContainer}>
            <View style={[
              styles.progressDot,
              { backgroundColor: isDarkMode ? '#3A3A3A' : '#E5E7EB' },
              currentStep === PERMISSION_STEPS.TRACKING && styles.progressDotActive
            ]} />
            <View style={[
              styles.progressDot,
              { backgroundColor: isDarkMode ? '#3A3A3A' : '#E5E7EB' },
              currentStep === PERMISSION_STEPS.NOTIFICATIONS && styles.progressDotActive
            ]} />
            <View style={[
              styles.progressDot,
              { backgroundColor: isDarkMode ? '#3A3A3A' : '#E5E7EB' },
              currentStep === PERMISSION_STEPS.LOCATION && styles.progressDotActive
            ]} />
          </View>

          {/* Icône avec gradient */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={content.gradient}
              style={styles.iconGradient}
            >
              <Ionicons name={content.icon} size={40} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Contenu */}
          <Text style={[styles.title, { color: isDarkMode ? '#FAFAFA' : '#1F2937' }]}>
            {content.title}
          </Text>
          <Text style={[styles.description, { color: isDarkMode ? '#A1A1AA' : '#6B7280' }]}>
            {content.description}
          </Text>

          {/* Boutons */}
          <TouchableOpacity
            onPress={content.onPress}
            disabled={isRequesting}
            activeOpacity={0.8}
            style={styles.buttonContainer}
          >
            <LinearGradient
              colors={content.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                {isRequesting ? t('un_instant') || 'Un instant...' : content.buttonText}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={skipCurrentStep}
            disabled={isRequesting}
            style={styles.skipButton}
          >
            <Text style={[styles.skipButtonText, { color: isDarkMode ? '#71717A' : '#9CA3AF' }]}>
              {t('plus_tard') || 'Plus tard'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 12,
  },
  button: {
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
});

export default PermissionsModal;
