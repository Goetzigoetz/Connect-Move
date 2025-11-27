import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Animated as RNAnimated, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../styles/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const PartnersSkeleton = ({ isDarkMode }) => {
  const shimmerValue = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(shimmerValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        RNAnimated.timing(shimmerValue, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, []);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonBox = ({ style }) => (
    <RNAnimated.View
      style={[
        styles.skeletonBox,
        {
          backgroundColor: isDarkMode ? "#27272A" : "#E5E7EB",
          opacity,
        },
        style,
      ]}
    />
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.bgDark : "#F9FAFB" },
      ]}
    >
      {/* Floating icons skeleton */}
      <SkeletonBox style={[styles.floatingIcon, { top: 80, left: 30 }]} />
      <SkeletonBox style={[styles.floatingIcon, { top: 120, right: 80 }]} />
      <SkeletonBox style={[styles.floatingIcon, { top: 200, left: 50 }]} />
      <SkeletonBox style={[styles.floatingIcon, { top: 280, right: 100 }]} />

      {/* Main card skeleton */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          {/* Image skeleton */}
          <SkeletonBox style={styles.cardImage} />

          {/* Content skeleton */}
          <View style={styles.cardContent}>
            {/* Name and age */}
            <View style={styles.nameSection}>
              <SkeletonBox style={styles.nameSkeleton} />
              <SkeletonBox style={styles.ageSkeleton} />
            </View>

            {/* Bio */}
            <SkeletonBox style={styles.bioSkeleton1} />
            <SkeletonBox style={styles.bioSkeleton2} />

            {/* Distance */}
            <View style={styles.distanceRow}>
              <SkeletonBox style={styles.iconSkeleton} />
              <SkeletonBox style={styles.distanceTextSkeleton} />
            </View>

            {/* Interests */}
            <View style={styles.interestsSection}>
              <View style={styles.interestsHeader}>
                <SkeletonBox style={styles.iconSkeleton} />
                <SkeletonBox style={styles.interestsTitleSkeleton} />
              </View>
              <View style={styles.interestsGrid}>
                <SkeletonBox style={styles.interestChip} />
                <SkeletonBox style={styles.interestChip} />
                <SkeletonBox style={styles.interestChip} />
                <SkeletonBox style={[styles.interestChip, { width: 50 }]} />
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actionsRow}>
              <SkeletonBox style={styles.actionButton} />
              <SkeletonBox style={styles.actionButton} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonBox: {
    borderRadius: 8,
  },
  floatingIcon: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    zIndex: 0,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.68,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardImage: {
    width: "100%",
    height: "45%",
    borderRadius: 0,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  nameSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  nameSkeleton: {
    flex: 1,
    height: 28,
    borderRadius: 8,
  },
  ageSkeleton: {
    width: 60,
    height: 26,
    borderRadius: 10,
  },
  bioSkeleton1: {
    width: "100%",
    height: 16,
    marginBottom: 6,
    borderRadius: 6,
  },
  bioSkeleton2: {
    width: "70%",
    height: 16,
    marginBottom: 12,
    borderRadius: 6,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  iconSkeleton: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  distanceTextSkeleton: {
    width: 80,
    height: 16,
    borderRadius: 6,
  },
  interestsSection: {
    marginBottom: 16,
  },
  interestsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  interestsTitleSkeleton: {
    width: 120,
    height: 16,
    borderRadius: 6,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  interestChip: {
    width: 80,
    height: 28,
    borderRadius: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});

export default PartnersSkeleton;
