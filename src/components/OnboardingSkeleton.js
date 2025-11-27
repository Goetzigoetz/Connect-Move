import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
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

const { width } = Dimensions.get("window");

const SkeletonBox = ({ width: boxWidth, height, style }) => {
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

  return (
    <View
      style={[
        styles.skeletonBox,
        { width: boxWidth, height },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0)",
            "rgba(255, 255, 255, 0.2)",
            "rgba(255, 255, 255, 0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmer}
        />
      </Animated.View>
    </View>
  );
};

const OnboardingSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.header}>
        <SkeletonBox width={120} height={32} style={styles.titleSkeleton} />
        <SkeletonBox width={width - 80} height={20} style={styles.subtitleSkeleton} />
      </View>

      {/* Content skeleton */}
      <View style={styles.content}>
        {/* Input fields */}
        <SkeletonBox width={width - 48} height={56} style={styles.inputSkeleton} />
        <SkeletonBox width={width - 48} height={56} style={styles.inputSkeleton} />
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomButtons}>
        <SkeletonBox width={(width - 60) / 3} height={56} style={styles.buttonSkeleton} />
        <SkeletonBox width={(width - 60) * 2 / 3} height={56} style={styles.buttonSkeleton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F97316",
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  header: {
    paddingTop: 80,
    alignItems: "center",
  },
  titleSkeleton: {
    marginBottom: 12,
    borderRadius: 8,
  },
  subtitleSkeleton: {
    marginBottom: 40,
    borderRadius: 6,
  },
  content: {
    flex: 1,
    paddingTop: 20,
    gap: 16,
  },
  inputSkeleton: {
    borderRadius: 12,
  },
  bottomButtons: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 40,
  },
  buttonSkeleton: {
    borderRadius: 9999,
  },
  skeletonBox: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
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
});

export default OnboardingSkeleton;
