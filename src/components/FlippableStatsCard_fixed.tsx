import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { PanGestureHandler, TapGestureHandler } from 'react-native-gesture-handler';
import { Rating, UserStats } from '../services/ratingService';
import { getTierTheme } from '../config/theme';

interface FlippableStatsCardProps {
  userStats: UserStats;
  monthlyRating: Rating;
  lifetimeRating: Rating;
  onPress: () => void;
}

export const FlippableStatsCard: React.FC<FlippableStatsCardProps> = ({
  userStats,
  monthlyRating,
  lifetimeRating,
  onPress,
}) => {
  const tapRef = useRef(null);
  const panRef = useRef(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const flipProgress = useSharedValue(0);

  const handleTap = () => {
    runOnJS(onPress)();
  };

  const handlePan = useAnimatedGestureHandler({
    onEnd: (event) => {
      const shouldFlip = Math.abs(event.translationX) > 50 && Math.abs(event.velocityX) > 500;
      if (shouldFlip) {
        const newFlipped = !isFlipped;
        runOnJS(setIsFlipped)(newFlipped);
        flipProgress.value = withTiming(newFlipped ? 1 : 0, { duration: 600 });
      }
    },
  });

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipProgress.value,
      [0, 1],
      [0, 180],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity: interpolate(
        flipProgress.value,
        [0, 0.5, 1],
        [1, 0, 0],
        Extrapolate.CLAMP
      ),
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipProgress.value,
      [0, 1],
      [180, 0],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity: interpolate(
        flipProgress.value,
        [0, 0.5, 1],
        [0, 0, 1],
        Extrapolate.CLAMP
      ),
    };
  });

  const getTierColors = (rating: Rating) => {
    const theme = getTierTheme(rating.tier);
    return theme.colors;
  };

  const renderStatsGrid = (rating: Rating, showAllTimeLabel = false) => (
    <View style={styles.statsGrid}>
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>DIS</Text>
          <Text style={styles.statValue}>{rating.discipline}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>FOC</Text>
          <Text style={styles.statValue}>{rating.focus}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>JOU</Text>
          <Text style={styles.statValue}>{rating.journal}</Text>
        </View>
      </View>
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>USA</Text>
          <Text style={styles.statValue}>{rating.usage}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>MEN</Text>
          <Text style={styles.statValue}>{rating.mental}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>PHY</Text>
          <Text style={styles.statValue}>{rating.physical}</Text>
        </View>
      </View>
      {showAllTimeLabel && (
        <Text style={styles.allTimeLabel}>ALL TIME</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <TapGestureHandler ref={tapRef} onGestureEvent={handleTap} simultaneousHandlers={[panRef]}>
        <PanGestureHandler ref={panRef} onGestureEvent={handlePan} simultaneousHandlers={[tapRef]}>
          <View style={styles.cardContainer}>
            {/* Front side - Monthly */}
            <Animated.View style={[styles.cardSide, styles.frontCard, frontAnimatedStyle]}>
              <LinearGradient
                colors={getTierColors(monthlyRating)}
                style={styles.cardContent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.header}>
                  <Text style={styles.userName}>{userStats.displayName}</Text>
                  <Text style={styles.overallRating}>{monthlyRating.overall}</Text>
                  <Text style={styles.overallRatingLabel}>OVR</Text>
                </View>

                {renderStatsGrid(monthlyRating)}

                <View style={styles.footer}>
                  <Text style={styles.totalPoints}>{monthlyRating.totalPoints.toLocaleString()} PTS</Text>
                  <Text style={styles.swipeHint}>← Swipe to flip →</Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Back side - All Time */}
            <Animated.View style={[styles.cardSide, styles.backCard, backAnimatedStyle]}>
              <LinearGradient
                colors={getTierColors(lifetimeRating)}
                style={styles.cardContent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.header}>
                  <Text style={styles.userName}>{userStats.displayName}</Text>
                  <Text style={styles.overallRating}>{lifetimeRating.overall}</Text>
                  <Text style={styles.overallRatingLabel}>OVR</Text>
                </View>

                {renderStatsGrid(lifetimeRating, true)}

                <View style={styles.footer}>
                  <Text style={styles.totalPoints}>{lifetimeRating.totalPoints.toLocaleString()} PTS</Text>
                  <Text style={styles.swipeHint}>← Swipe to flip →</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
        </PanGestureHandler>
      </TapGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  cardContainer: {
    position: 'relative',
    minHeight: 200, // Ensure container takes up proper space
  },
  cardSide: {
    position: 'absolute',
    width: '100%',
    height: 200,
    backfaceVisibility: 'hidden',
  },
  frontCard: {
    zIndex: 2,
  },
  backCard: {
    zIndex: 1,
  },
  cardContent: {
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    height: 200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  userName: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  overallRatingLabel: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
  },
  statsGrid: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  allTimeLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    marginTop: 10,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 15,
  },
  totalPoints: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 5,
  },
  swipeHint: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.6,
  },
});
