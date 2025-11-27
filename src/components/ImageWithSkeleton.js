import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeContext } from "../ThemeProvider";

const ImageWithSkeleton = ({
  source,
  style,
  contentFit = "cover",
  transition = 300,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const { isDarkMode } = useThemeContext();

  // Animation shimmer style Apple
  const shimmerAnim = useSharedValue(0);

  useEffect(() => {
    shimmerAnim.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1200,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
        withTiming(0, {
          duration: 1200,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        })
      ),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerAnim.value, [0, 1], [-200, 200]);

    return {
      transform: [{ translateX }],
    };
  });

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Skeleton loader */}
      {isLoading && (
        <View
          style={[
            styles.skeleton,
            {
              backgroundColor: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.05)",
            },
          ]}
        >
          <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
            <LinearGradient
              colors={
                isDarkMode
                  ? [
                      "rgba(255, 255, 255, 0)",
                      "rgba(255, 255, 255, 0.08)",
                      "rgba(255, 255, 255, 0)",
                    ]
                  : [
                      "rgba(0, 0, 0, 0)",
                      "rgba(0, 0, 0, 0.04)",
                      "rgba(0, 0, 0, 0)",
                    ]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmer}
            />
          </Animated.View>
        </View>
      )}

      {/* Image réelle */}
      <Image
        source={source}
        style={[styles.image, style]}
        contentFit={contentFit}
        transition={transition}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  skeleton: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    overflow: "hidden",
  },
  shimmerContainer: {
    width: "100%",
    height: "100%",
  },
  shimmer: {
    width: 200,
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default ImageWithSkeleton;
