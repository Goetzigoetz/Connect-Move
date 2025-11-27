import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

const AnimatedSplashScreen = ({ onFinish }) => {
  // Animation values
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const appNameOpacity = useSharedValue(0);
  const appNameTranslateY = useSharedValue(30);
  const circleScale = useSharedValue(0);
  const circleOpacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const iconsLayerScale = useSharedValue(0.85); // Pour effet de parallaxe/profondeur
  const iconsLayerOpacity = useSharedValue(0);
  
  // Sport icons animations (12 icônes)
  const sport1Opacity = useSharedValue(0);
  const sport1Scale = useSharedValue(0);
  const sport1Rotate = useSharedValue(0);
  const sport2Opacity = useSharedValue(0);
  const sport2Scale = useSharedValue(0);
  const sport2Rotate = useSharedValue(0);
  const sport3Opacity = useSharedValue(0);
  const sport3Scale = useSharedValue(0);
  const sport3Rotate = useSharedValue(0);
  const sport4Opacity = useSharedValue(0);
  const sport4Scale = useSharedValue(0);
  const sport4Rotate = useSharedValue(0);
  const sport5Opacity = useSharedValue(0);
  const sport5Scale = useSharedValue(0);
  const sport5Rotate = useSharedValue(0);
  const sport6Opacity = useSharedValue(0);
  const sport6Scale = useSharedValue(0);
  const sport6Rotate = useSharedValue(0);
  const sport7Opacity = useSharedValue(0);
  const sport7Scale = useSharedValue(0);
  const sport7Rotate = useSharedValue(0);
  const sport8Opacity = useSharedValue(0);
  const sport8Scale = useSharedValue(0);
  const sport8Rotate = useSharedValue(0);
  const sport9Opacity = useSharedValue(0);
  const sport9Scale = useSharedValue(0);
  const sport9Rotate = useSharedValue(0);
  const sport10Opacity = useSharedValue(0);
  const sport10Scale = useSharedValue(0);
  const sport10Rotate = useSharedValue(0);
  const sport11Opacity = useSharedValue(0);
  const sport11Scale = useSharedValue(0);
  const sport11Rotate = useSharedValue(0);
  const sport12Opacity = useSharedValue(0);
  const sport12Scale = useSharedValue(0);
  const sport12Rotate = useSharedValue(0);

  useEffect(() => {
    // Sequence d'animations
    // 1. Fade in + scale du logo avec un effet de spring
    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    });

    // 2. Effet de rotation subtile
    logoRotate.value = withSequence(
      withTiming(5, { duration: 400, easing: Easing.inOut(Easing.ease) }),
      withTiming(-5, { duration: 400, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
    );

    // 3. Animation du nom de l'app "Connect & Move"
    appNameOpacity.value = withDelay(
      400,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      })
    );

    appNameTranslateY.value = withDelay(
      400,
      withSpring(0, {
        damping: 15,
        stiffness: 100,
      })
    );

    // 4. Cercle d'expansion en arrière-plan
    circleOpacity.value = withDelay(
      200,
      withTiming(0.15, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );

    circleScale.value = withDelay(
      200,
      withTiming(2.5, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Animation de la couche d'icônes (effet de profondeur)
    iconsLayerOpacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );

    iconsLayerScale.value = withDelay(
      300,
      withSpring(1, {
        damping: 15,
        stiffness: 80,
      })
    );

    // 5. Animation des icônes de sport qui apparaissent autour du logo (12 icônes)
    // Basketball (top-left)
    sport1Opacity.value = withDelay(
      600,
      withTiming(1, { duration: 400 })
    );
    sport1Scale.value = withDelay(
      600,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    sport1Rotate.value = withDelay(
      600,
      withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Football (top-right)
    sport2Opacity.value = withDelay(
      700,
      withTiming(1, { duration: 400 })
    );
    sport2Scale.value = withDelay(
      700,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    sport2Rotate.value = withDelay(
      700,
      withRepeat(
        withTiming(-360, { duration: 3500, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Bicycle (bottom-left)
    sport3Opacity.value = withDelay(
      650,
      withTiming(1, { duration: 400 })
    );
    sport3Scale.value = withDelay(
      650,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    sport3Rotate.value = withDelay(
      650,
      withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Barbell (bottom-right)
    sport4Opacity.value = withDelay(
      750,
      withTiming(1, { duration: 400 })
    );
    sport4Scale.value = withDelay(
      750,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    sport4Rotate.value = withDelay(
      750,
      withRepeat(
        withTiming(-360, { duration: 3200, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Tennis
    sport5Opacity.value = withDelay(
      800,
      withTiming(1, { duration: 400 })
    );
    sport5Scale.value = withDelay(
      800,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    sport5Rotate.value = withDelay(
      800,
      withRepeat(
        withTiming(360, { duration: 3800, easing: Easing.linear }),
        -1,
        false
      )
    );

    // American Football
    sport6Opacity.value = withDelay(
      850,
      withTiming(1, { duration: 400 })
    );
    sport6Scale.value = withDelay(
      850,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    sport6Rotate.value = withDelay(
      850,
      withRepeat(
        withTiming(-360, { duration: 4200, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Baseball
    sport7Opacity.value = withDelay(
      900,
      withTiming(1, { duration: 400 })
    );
    sport7Scale.value = withDelay(
      900,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    sport7Rotate.value = withDelay(
      900,
      withRepeat(
        withTiming(360, { duration: 3600, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Golf
    sport8Opacity.value = withDelay(
      950,
      withTiming(1, { duration: 400 })
    );
    sport8Scale.value = withDelay(
      950,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    sport8Rotate.value = withDelay(
      950,
      withRepeat(
        withTiming(-360, { duration: 4500, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Fitness (walking)
    sport9Opacity.value = withDelay(
      620,
      withTiming(1, { duration: 400 })
    );
    sport9Scale.value = withDelay(
      620,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    sport9Rotate.value = withDelay(
      620,
      withRepeat(
        withTiming(360, { duration: 3300, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Swimming
    sport10Opacity.value = withDelay(
      820,
      withTiming(1, { duration: 400 })
    );
    sport10Scale.value = withDelay(
      820,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    sport10Rotate.value = withDelay(
      820,
      withRepeat(
        withTiming(-360, { duration: 3900, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Trophy
    sport11Opacity.value = withDelay(
      680,
      withTiming(1, { duration: 400 })
    );
    sport11Scale.value = withDelay(
      680,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    sport11Rotate.value = withDelay(
      680,
      withRepeat(
        withTiming(360, { duration: 4100, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Medal
    sport12Opacity.value = withDelay(
      780,
      withTiming(1, { duration: 400 })
    );
    sport12Scale.value = withDelay(
      780,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    sport12Rotate.value = withDelay(
      780,
      withRepeat(
        withTiming(-360, { duration: 3700, easing: Easing.linear }),
        -1,
        false
      )
    );

    // 6. Effet de pulsation continue
    const startPulse = () => {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    };

    const pulseTimeout = setTimeout(startPulse, 800);

    // 7. Fade out complet après 3 secondes
    const fadeOutTimeout = setTimeout(() => {
      logoOpacity.value = withTiming(
        0,
        {
          duration: 400,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (finished && onFinish) {
            runOnJS(onFinish)();
          }
        }
      );

      appNameOpacity.value = withTiming(0, {
        duration: 400,
        easing: Easing.in(Easing.cubic),
      });

      iconsLayerOpacity.value = withTiming(0, { duration: 400 });

      sport1Opacity.value = withTiming(0, { duration: 400 });
      sport2Opacity.value = withTiming(0, { duration: 400 });
      sport3Opacity.value = withTiming(0, { duration: 400 });
      sport4Opacity.value = withTiming(0, { duration: 400 });
      sport5Opacity.value = withTiming(0, { duration: 400 });
      sport6Opacity.value = withTiming(0, { duration: 400 });
      sport7Opacity.value = withTiming(0, { duration: 400 });
      sport8Opacity.value = withTiming(0, { duration: 400 });
      sport9Opacity.value = withTiming(0, { duration: 400 });
      sport10Opacity.value = withTiming(0, { duration: 400 });
      sport11Opacity.value = withTiming(0, { duration: 400 });
      sport12Opacity.value = withTiming(0, { duration: 400 });

      backgroundOpacity.value = withTiming(0, {
        duration: 400,
        easing: Easing.in(Easing.cubic),
      });
    }, 3000);

    return () => {
      clearTimeout(pulseTimeout);
      clearTimeout(fadeOutTimeout);
    };
  }, []);

  // Styles animés
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value * pulseScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const appNameAnimatedStyle = useAnimatedStyle(() => ({
    opacity: appNameOpacity.value,
    transform: [{ translateY: appNameTranslateY.value }],
  }));

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: circleOpacity.value,
    transform: [{ scale: circleScale.value }],
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const iconsLayerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconsLayerOpacity.value,
    transform: [{ scale: iconsLayerScale.value }],
  }));

  // Sport icons animated styles
  const sport1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: sport1Opacity.value,
    transform: [
      { scale: sport1Scale.value },
      { rotate: `${sport1Rotate.value}deg` },
    ],
  }));

  const sport2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: sport2Opacity.value,
    transform: [
      { scale: sport2Scale.value },
      { rotate: `${sport2Rotate.value}deg` },
    ],
  }));

  const sport3AnimatedStyle = useAnimatedStyle(() => ({
    opacity: sport3Opacity.value,
    transform: [
      { scale: sport3Scale.value },
      { rotate: `${sport3Rotate.value}deg` },
    ],
  }));

  const sport4AnimatedStyle = useAnimatedStyle(() => ({
    opacity: sport4Opacity.value,
    transform: [
      { scale: sport4Scale.value },
      { rotate: `${sport4Rotate.value}deg` },
    ],
  }));

  const sport5AnimatedStyle = useAnimatedStyle(() => ({
    opacity: sport5Opacity.value,
    transform: [
      { scale: sport5Scale.value },
      { rotate: `${sport5Rotate.value}deg` },
    ],
  }));

  const sport6AnimatedStyle = useAnimatedStyle(() => ({
    opacity: sport6Opacity.value,
    transform: [
      { scale: sport6Scale.value },
      { rotate: `${sport6Rotate.value}deg` },
    ],
  }));

  const sport7AnimatedStyle = useAnimatedStyle(() => ({
    opacity: sport7Opacity.value,
    transform: [
      { scale: sport7Scale.value },
      { rotate: `${sport7Rotate.value}deg` },
    ],
  }));

  const sport8AnimatedStyle = useAnimatedStyle(() => ({
    opacity: sport8Opacity.value,
    transform: [
      { scale: sport8Scale.value },
      { rotate: `${sport8Rotate.value}deg` },
    ],
  }));

  const sport9AnimatedStyle = useAnimatedStyle(() => ({
    opacity: sport9Opacity.value,
    transform: [
      { scale: sport9Scale.value },
      { rotate: `${sport9Rotate.value}deg` },
    ],
  }));

  const sport10AnimatedStyle = useAnimatedStyle(() => ({
    opacity: sport10Opacity.value,
    transform: [
      { scale: sport10Scale.value },
      { rotate: `${sport10Rotate.value}deg` },
    ],
  }));

  const sport11AnimatedStyle = useAnimatedStyle(() => ({
    opacity: sport11Opacity.value,
    transform: [
      { scale: sport11Scale.value },
      { rotate: `${sport11Rotate.value}deg` },
    ],
  }));

  const sport12AnimatedStyle = useAnimatedStyle(() => ({
    opacity: sport12Opacity.value,
    transform: [
      { scale: sport12Scale.value },
      { rotate: `${sport12Rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.container, backgroundAnimatedStyle]}>
      <LinearGradient
        colors={["#F97316", "#F97316", "#EA580C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Cercles d'arrière-plan animés */}
      <Animated.View style={[styles.circle, circleAnimatedStyle]} />
      <Animated.View
        style={[styles.circle, styles.circle2, circleAnimatedStyle]}
      />
      <Animated.View
        style={[styles.circle, styles.circle3, circleAnimatedStyle]}
      />

      {/* Couche d'icônes de sport en arrière-plan avec effet de profondeur */}
      <Animated.View style={[styles.iconsLayer, iconsLayerAnimatedStyle]}>
        {/* Icônes de sport animées (12 icônes) - en arrière-plan */}
        <Animated.View style={[styles.sportIcon, styles.sportIcon1, sport1AnimatedStyle]}>
          <Ionicons name="basketball-outline" size={45} color="rgba(255, 255, 255, 0.5)" />
        </Animated.View>

        <Animated.View style={[styles.sportIcon, styles.sportIcon2, sport2AnimatedStyle]}>
          <Ionicons name="football-outline" size={50} color="rgba(255, 255, 255, 0.5)" />
        </Animated.View>

        <Animated.View style={[styles.sportIcon, styles.sportIcon3, sport3AnimatedStyle]}>
          <Ionicons name="bicycle-outline" size={42} color="rgba(255, 255, 255, 0.5)" />
        </Animated.View>

        <Animated.View style={[styles.sportIcon, styles.sportIcon4, sport4AnimatedStyle]}>
          <Ionicons name="barbell-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
        </Animated.View>

        <Animated.View style={[styles.sportIcon, styles.sportIcon5, sport5AnimatedStyle]}>
          <Ionicons name="tennisball-outline" size={40} color="rgba(255, 255, 255, 0.5)" />
        </Animated.View>

        <Animated.View style={[styles.sportIcon, styles.sportIcon6, sport6AnimatedStyle]}>
          <Ionicons name="american-football-outline" size={43} color="rgba(255, 255, 255, 0.5)" />
        </Animated.View>

        <Animated.View style={[styles.sportIcon, styles.sportIcon7, sport7AnimatedStyle]}>
          <Ionicons name="baseball-outline" size={38} color="rgba(255, 255, 255, 0.5)" />
        </Animated.View>

        <Animated.View style={[styles.sportIcon, styles.sportIcon8, sport8AnimatedStyle]}>
          <Ionicons name="golf-outline" size={36} color="rgba(255, 255, 255, 0.5)" />
        </Animated.View>

        <Animated.View style={[styles.sportIcon, styles.sportIcon9, sport9AnimatedStyle]}>
          <Ionicons name="walk-outline" size={44} color="rgba(255, 255, 255, 0.5)" />
        </Animated.View>

        <Animated.View style={[styles.sportIcon, styles.sportIcon10, sport10AnimatedStyle]}>
          <Ionicons name="water-outline" size={40} color="rgba(255, 255, 255, 0.5)" />
        </Animated.View>

        <Animated.View style={[styles.sportIcon, styles.sportIcon11, sport11AnimatedStyle]}>
          <Ionicons name="trophy-outline" size={46} color="rgba(255, 255, 255, 0.5)" />
        </Animated.View>

        <Animated.View style={[styles.sportIcon, styles.sportIcon12, sport12AnimatedStyle]}>
          <Ionicons name="medal-outline" size={41} color="rgba(255, 255, 255, 0.5)" />
        </Animated.View>
      </Animated.View>

      {/* Logo principal avec fond blanc rond - au premier plan */}
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <View style={styles.logoWrapper}>
          <Image
            source={require("../../assets/512.png")}
            style={styles.logo}
            contentFit="cover"
            transition={300}
          />
        </View>
      </Animated.View>

      {/* Nom de l'application */}
      <Animated.View style={[styles.appNameContainer, appNameAnimatedStyle]}>
        <Text style={styles.appName}>Connect & Move</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F97316",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100, // Premier plan
  },
  logoWrapper: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: (width * 0.35) / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: (width * 0.35) / 2,
  },
  appNameContainer: {
    marginTop: 24,
    zIndex: 100, // Premier plan
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: -1,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  circle: {
    position: "absolute",
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    zIndex: 1,
  },
  circle2: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
  },
  circle3: {
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
  },
  iconsLayer: {
    position: "absolute",
    width: width,
    height: height,
    zIndex: 2, // Arrière-plan, derrière le logo
  },
  sportIcon: {
    position: "absolute",
  },
  sportIcon1: {
    top: height * 0.12,
    left: width * 0.08,
  },
  sportIcon2: {
    top: height * 0.15,
    right: width * 0.12,
  },
  sportIcon3: {
    top: height * 0.28,
    left: width * 0.05,
  },
  sportIcon4: {
    top: height * 0.28,
    right: width * 0.08,
  },
  sportIcon5: {
    bottom: height * 0.35,
    left: width * 0.12,
  },
  sportIcon6: {
    bottom: height * 0.32,
    right: width * 0.1,
  },
  sportIcon7: {
    bottom: height * 0.15,
    left: width * 0.08,
  },
  sportIcon8: {
    bottom: height * 0.18,
    right: width * 0.15,
  },
  sportIcon9: {
    top: height * 0.22,
    right: width * 0.25,
  },
  sportIcon10: {
    bottom: height * 0.25,
    left: width * 0.22,
  },
  sportIcon11: {
    top: height * 0.18,
    left: width * 0.28,
  },
  sportIcon12: {
    bottom: height * 0.22,
    right: width * 0.28,
  },
});

export default AnimatedSplashScreen;