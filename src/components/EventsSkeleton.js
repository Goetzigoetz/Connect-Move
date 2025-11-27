import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Animated as RNAnimated } from "react-native";
import { COLORS } from "../styles/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const EventsSkeleton = ({ isDarkMode }) => {
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
        { backgroundColor: isDarkMode ? COLORS.bgDark : "#FFFFFF" },
      ]}
    >
      {/* Calendar skeleton */}
      <View style={styles.calendarContainer}>
        {/* Month header */}
        <View style={styles.calendarHeader}>
          <SkeletonBox style={styles.monthSkeleton} />
        </View>

        {/* Days header */}
        <View style={styles.daysHeader}>
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBox key={i} style={styles.dayHeaderSkeleton} />
          ))}
        </View>

        {/* Calendar grid */}
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.calendarRow}>
            {Array.from({ length: 7 }).map((_, colIndex) => (
              <SkeletonBox key={colIndex} style={styles.daySkeleton} />
            ))}
          </View>
        ))}
      </View>

      {/* Section header skeleton */}
      <View style={styles.sectionHeader}>
        <SkeletonBox style={styles.sectionTitleSkeleton} />
      </View>

      {/* Event cards skeleton */}
      <View style={styles.eventsContainer}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.eventCard}>
            {/* Image skeleton */}
            <SkeletonBox style={styles.eventImageSkeleton} />

            {/* Content skeleton */}
            <View style={styles.eventContent}>
              {/* Title */}
              <SkeletonBox style={styles.eventTitleSkeleton} />

              {/* Info row 1 */}
              <View style={styles.infoRow}>
                <SkeletonBox style={styles.iconSkeleton} />
                <SkeletonBox style={styles.infoTextSkeleton} />
                <SkeletonBox style={styles.iconSkeleton} />
                <SkeletonBox style={styles.infoTextSkeleton} />
              </View>

              {/* Info row 2 */}
              <View style={styles.infoRow}>
                <SkeletonBox style={styles.iconSkeleton} />
                <SkeletonBox style={styles.locationTextSkeleton} />
              </View>
            </View>
          </View>
        ))}
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
  calendarContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  calendarHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  monthSkeleton: {
    width: 150,
    height: 24,
    borderRadius: 12,
  },
  daysHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  dayHeaderSkeleton: {
    width: 32,
    height: 20,
    borderRadius: 6,
  },
  calendarRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  daySkeleton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  sectionTitleSkeleton: {
    width: 120,
    height: 20,
    borderRadius: 10,
  },
  eventsContainer: {
    paddingHorizontal: 16,
  },
  eventCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  eventImageSkeleton: {
    width: "100%",
    height: 160,
    borderRadius: 0,
  },
  eventContent: {
    padding: 16,
  },
  eventTitleSkeleton: {
    width: "80%",
    height: 24,
    marginBottom: 12,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  iconSkeleton: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  infoTextSkeleton: {
    width: 80,
    height: 16,
    borderRadius: 6,
  },
  locationTextSkeleton: {
    width: 120,
    height: 16,
    borderRadius: 6,
  },
});

export default EventsSkeleton;
