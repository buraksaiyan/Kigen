import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions
} from 'react-native';
import { PanGestureHandler, State, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { UserStatsService } from '../services/userStatsService';
import { UserRating, RatingSystem } from '../services/ratingSystem';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface FlippableStatsCardProps {
  onPress?: () => void;
  refreshTrigger?: number; // Add a prop to trigger refresh
}

export const FlippableStatsCard: React.FC<FlippableStatsCardProps> = ({ onPress, refreshTrigger }) => {
  const [monthlyRating, setMonthlyRating] = useState<UserRating | null>(null);
  const [lifetimeRating, setLifetimeRating] = useState<UserRating | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const flipAnimation = useRef(new Animated.Value(0)).current;
  const panGestureRef = useRef(null);

  React.useEffect(() => {
    loadStats();
  }, []);

  // Reload stats when refreshTrigger changes
  React.useEffect(() => {
    if (refreshTrigger) {
      loadStats();
    }
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      const currentRating = await UserStatsService.getCurrentRating();
      setMonthlyRating(currentRating);
      
      // Create lifetime rating (for now, use same stats with total points)
      const lifetimeStats = { ...currentRating };
      setLifetimeRating(lifetimeStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlip = () => {
    const toValue = isFlipped ? 0 : 180;
    
    Animated.timing(flipAnimation, {
      toValue,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(!isFlipped);
    });
  };

  const handlePanGesture = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === State.END) {
      if (Math.abs(translationX) > 50) { // Swipe threshold
        handleFlip();
      }
    }
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [
      { rotateY: frontInterpolate }
    ]
  };

  const backAnimatedStyle = {
    transform: [
      { rotateY: backInterpolate }
    ]
  };

  if (isLoading || !monthlyRating || !lifetimeRating) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Kigen stats...</Text>
        </View>
      </View>
    );
  }

  const monthlyTierColors = RatingSystem.getCardTierColors(monthlyRating.cardTier);
  const lifetimeTierColors = RatingSystem.getCardTierColors(lifetimeRating.cardTier);

  const renderStatsGrid = (rating: UserRating, isLifetime: boolean) => (
    <View style={styles.statsGrid}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{rating.stats.DIS}</Text>
        <Text style={styles.statLabel}>DIS</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{rating.stats.FOC}</Text>
        <Text style={styles.statLabel}>FOC</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{rating.stats.JOU}</Text>
        <Text style={styles.statLabel}>JOU</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{rating.stats.USA}</Text>
        <Text style={styles.statLabel}>USA</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{rating.stats.MEN}</Text>
        <Text style={styles.statLabel}>MEN</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{rating.stats.PHY}</Text>
        <Text style={styles.statLabel}>PHY</Text>
      </View>
    </View>
  );

  return (
    <PanGestureHandler
      ref={panGestureRef}
      onGestureEvent={handlePanGesture}
      onHandlerStateChange={handlePanGesture}
    >
      <View style={styles.container}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <View style={styles.cardContainer}>
            {/* Front Side - Monthly Stats */}
            <Animated.View style={[styles.cardSide, styles.frontSide, frontAnimatedStyle]}>
              <LinearGradient
                colors={[`${monthlyTierColors.primary}40`, `${monthlyTierColors.secondary}40`]}
                style={styles.background}
              >
                <View style={styles.header}>
                  <Text style={styles.title}>Kigen Stats</Text>
                  <View style={styles.tierBadge}>
                    <Text style={[styles.tierText, { color: monthlyTierColors.accent }]}>
                      {monthlyRating.cardTier}
                    </Text>
                  </View>
                </View>

                <View style={styles.modeIndicator}>
                  <Text style={styles.modeText}>MONTHLY</Text>
                </View>

                <View style={styles.overallRating}>
                  <Text style={styles.overallRatingNumber}>{monthlyRating.overallRating}</Text>
                  <Text style={styles.overallRatingLabel}>OVR</Text>
                </View>

                {renderStatsGrid(monthlyRating, false)}

                <View style={styles.footer}>
                  <Text style={styles.totalPoints}>{monthlyRating.monthlyPoints.toLocaleString()} PTS</Text>
                  <Text style={styles.swipeHint}>← Swipe to flip →</Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Back Side - All-Time Stats */}
            <Animated.View style={[styles.cardSide, styles.backSide, backAnimatedStyle]}>
              <LinearGradient
                colors={[`${lifetimeTierColors.primary}40`, `${lifetimeTierColors.secondary}40`]}
                style={styles.background}
              >
                <View style={styles.header}>
                  <Text style={styles.title}>Kigen Stats</Text>
                  <View style={styles.tierBadge}>
                    <Text style={[styles.tierText, { color: lifetimeTierColors.accent }]}>
                      {lifetimeRating.cardTier}
                    </Text>
                  </View>
                </View>

                <View style={styles.modeIndicator}>
                  <Text style={styles.modeText}>ALL-TIME</Text>
                </View>

                <View style={styles.overallRating}>
                  <Text style={styles.overallRatingNumber}>{lifetimeRating.overallRating}</Text>
                  <Text style={styles.overallRatingLabel}>OVR</Text>
                </View>

                {renderStatsGrid(lifetimeRating, true)}

                <View style={styles.footer}>
                  <Text style={styles.totalPoints}>{lifetimeRating.totalPoints.toLocaleString()} PTS</Text>
                  <Text style={styles.swipeHint}>← Swipe to flip →</Text>
                </View>
              </LinearGradient>
            </Animated.View>

            <TouchableOpacity style={styles.tapHintOverlay} onPress={onPress}>
              <Text style={styles.tapHint}>Tap to view full card</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  cardContainer: {
    position: 'relative',
  },
  cardSide: {
    position: 'absolute',
    width: '100%',
    backfaceVisibility: 'hidden',
  },
  frontSide: {
    zIndex: 2,
  },
  backSide: {
    zIndex: 1,
  },
  background: {
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 200,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modeIndicator: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 15,
  },
  modeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  overallRating: {
    alignItems: 'center',
    marginBottom: 15,
  },
  overallRatingNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  overallRatingLabel: {
    fontSize: 14,
    color: '#ccc',
    marginTop: -5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    width: '16%',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 9,
    color: '#ccc',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
  },
  totalPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  swipeHint: {
    fontSize: 10,
    color: '#888',
  },
  tapHintOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  tapHint: {
    fontSize: 10,
    color: '#ccc',
  },
});
