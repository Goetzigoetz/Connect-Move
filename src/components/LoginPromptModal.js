import React from "react";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";

const LoginPromptModal = ({ visible, onClose, actionType = "like" }) => {
  const navigation = useNavigation();

  const getActionConfig = () => {
    switch (actionType) {
      case "like":
        return {
          title: "Connexion requise",
          description: "Connectez-vous pour interagir avec les publications et rejoindre la communauté",
        };
      case "comment":
        return {
          title: "Connexion requise",
          description: "Connectez-vous pour commenter et échanger avec la communauté",
        };
      default:
        return {
          title: "Connexion requise",
          description: "Connectez-vous pour continuer et profiter de toutes les fonctionnalités",
        };
    }
  };

  const config = getActionConfig();

  const handleContinue = () => {
    onClose();
    setTimeout(() => {
      navigation.navigate("Login");
    }, 200);
  };

  const handleCancel = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={handleCancel} />

        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(250)}
          style={styles.modalContainer}
        >
          <LinearGradient
            colors={["#F97316", "#F97316", "#EA580C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Icônes sportives décoratives */}
            <View style={[styles.iconDecor, { top: 30, left: 20 }]}>
              <Ionicons name="basketball-outline" size={60} color="#FFFFFF" />
            </View>
            <View style={[styles.iconDecor, { top: 40, right: 25 }]}>
              <Ionicons name="football-outline" size={55} color="#FFFFFF" />
            </View>
            <View style={[styles.iconDecor, { bottom: 120, left: 30 }]}>
              <Ionicons name="bicycle-outline" size={50} color="#FFFFFF" />
            </View>
            <View style={[styles.iconDecor, { bottom: 110, right: 20 }]}>
              <Ionicons name="barbell-outline" size={52} color="#FFFFFF" />
            </View>
            <View style={[styles.iconDecor, { top: 120, left: 25, opacity: 0.06 }]}>
              <Ionicons name="tennisball-outline" size={40} color="#FFFFFF" />
            </View>
            <View style={[styles.iconDecor, { bottom: 180, right: 30, opacity: 0.06 }]}>
              <Ionicons name="trophy-outline" size={45} color="#FFFFFF" />
            </View>

            {/* Bouton close en haut à droite */}
            <View style={styles.closeButtonContainer}>
              <Pressable
                onPress={handleCancel}
                style={({ pressed }) => [
                  styles.closeButton,
                  { opacity: pressed ? 0.6 : 1 }
                ]}
              >
                <Ionicons name="close" size={26} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Contenu principal */}
            <View style={styles.content}>
              {/* Header */}
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.description}>{config.description}</Text>

              {/* Bouton Continuer - VERSION SIMPLE */}
              <Pressable
                onPress={handleContinue}
                style={styles.continueButton}
              >
                <Text style={styles.buttonText}>Continuer</Text>
                <Ionicons name="arrow-forward" size={20} color="#F97316" style={{ marginLeft: 8 }} />
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 20,
  },
  backdropPress: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    elevation: 30,
  },
  gradient: {
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 28,
  },
  iconDecor: {
    position: 'absolute',
    opacity: 0.08,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 100,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    // Pas de padding ici car déjà sur gradient
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -1.2,
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  description: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: '#F97316',
    letterSpacing: -0.4,
  },
});

export default LoginPromptModal;
