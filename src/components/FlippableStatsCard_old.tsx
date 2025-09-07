import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  PanResponder,
  Modal,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { UserStatsService } from '../services/userStatsService';
import { UserRating, RatingSystem } from '../services/ratingSystem';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../config/theme';

const { width } = Dimensions.get('window');

interface FlippableStatsCardProps {
  onPress?: () => void;
  refreshTrigger?: number;
}

export const FlippableStatsCard: React.FC<FlippableStatsCardProps> = ({ onPress, refreshTrigger }) => {
  const [monthlyRating, setMonthlyRating] = useState<UserRating | null>(null);
  const [lifetimeRating, setLifetimeRating] = useState<UserRating | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState('Player Name');

  const flipAnimation = useRef(new Animated.Value(0)).current;

  const fetchRatings = async () => {
    setIsLoading(true);
    try {
      // Get user profile
      const profile = await UserStatsService.getUserProfile();
      if (profile) {
        setUserName(profile.username);
        if (profile.profileImage) {
          setProfileImage(profile.profileImage);
        }
      }

      // Use placeholder data for now to get the app working
      const monthlyRating: UserRating = {
        stats: {
          DIS: 85,
          FOC: 92,
          JOU: 78,
          USA: 88,
          MEN: 90,
          PHY: 76
        },
        overallRating: 85,
        totalPoints: 2340,
        monthlyPoints: 1200,
        cardTier: 'Gold' as any
      };

      const lifetimeRating: UserRating = {
        stats: {
          DIS: 88,
          FOC: 95,
          JOU: 82,
          USA: 91,
          MEN: 93,
          PHY: 79
        },
        overallRating: 88,
        totalPoints: 5670,
        monthlyPoints: 2340,
        cardTier: 'Platinum' as any
      };

      setMonthlyRating(monthlyRating);
      setLifetimeRating(lifetimeRating);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setIsLoading(false);
    }
  };
        stats: {
          DIS: 91,
          FOC: 89,
          JOU: 85,
          USA: 82,
          MEN: 94,
          PHY: 88
        },
        overallRating: 88,
        totalPoints: 15670,
        monthlyPoints: 0, // Not applicable for lifetime
        cardTier: 'Platinum' as any
      };

      setMonthlyRating(monthlyRating);
      setLifetimeRating(lifetimeRating);
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [refreshTrigger]); // Refetch when refreshTrigger changes

  const getTierColors = (rating: UserRating) => {
    const tierColors = RatingSystem.getCardTierColors(rating.cardTier);
    return [tierColors.primary, tierColors.secondary] as const;
  };

  const flipCard = () => {
    const currentValue = (flipAnimation as any)._value || 0;
    if (currentValue === 0) {
      Animated.timing(flipAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
      setIsFlipped(true);
    } else {
      Animated.timing(flipAnimation, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
      setIsFlipped(false);
    }
  };

  // Create pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to horizontal swipes
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderGrant: () => {},
    onPanResponderMove: () => {},
    onPanResponderRelease: (_, gestureState) => {
      // If horizontal swipe is significant, flip card
      if (Math.abs(gestureState.dx) > 50 && Math.abs(gestureState.vx) > 0.5) {
        flipCard();
      }
    },
  });

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const renderStatsGrid = (rating: UserRating, showAllTimeLabel = false) => (
    <View style={styles.statsGrid}>
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>DIS</Text>
          <Text style={styles.statValue}>{rating.stats.DIS}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>FOC</Text>
          <Text style={styles.statValue}>{rating.stats.FOC}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>JOU</Text>
          <Text style={styles.statValue}>{rating.stats.JOU}</Text>
        </View>
      </View>
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>USA</Text>
          <Text style={styles.statValue}>{rating.stats.USA}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>MEN</Text>
          <Text style={styles.statValue}>{rating.stats.MEN}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>PHY</Text>
          <Text style={styles.statValue}>{rating.stats.PHY}</Text>
        </View>
      </View>
      {showAllTimeLabel && (
        <Text style={styles.allTimeLabel}>ALL TIME</Text>
      )}
    </View>
  );

  if (isLoading || !monthlyRating || !lifetimeRating) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.95}
      {...panResponder.panHandlers}
    >
      <View style={styles.cardContainer}>
        {/* Front side - Monthly */}
        <Animated.View 
          style={[
            styles.cardSide, 
            styles.frontCard, 
            { 
              transform: [{ rotateY: frontInterpolate }],
              opacity: frontOpacity
            }
          ]}
        >
          <LinearGradient
            colors={getTierColors(monthlyRating)}
            style={styles.cardContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.header}>
              <Text style={styles.userName}>Your Stats</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.overallRating}>{monthlyRating.overallRating}</Text>
                <Text style={styles.overallRatingLabel}>OVR</Text>
              </View>
            </View>

            {renderStatsGrid(monthlyRating)}

            <View style={styles.footer}>
              <Text style={styles.totalPoints}>{monthlyRating.totalPoints.toLocaleString()} PTS</Text>
              <Text style={styles.swipeHint}>← Swipe to flip →</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Back side - All Time */}
        <Animated.View 
          style={[
            styles.cardSide, 
            styles.backCard, 
            { 
              transform: [{ rotateY: backInterpolate }],
              opacity: backOpacity
            }
          ]}
        >
          <LinearGradient
            colors={getTierColors(lifetimeRating)}
            style={styles.cardContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.header}>
              <Text style={styles.userName}>Your Stats</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.overallRating}>{lifetimeRating.overallRating}</Text>
                <Text style={styles.overallRatingLabel}>OVR</Text>
              </View>
            </View>

            {renderStatsGrid(lifetimeRating, true)}

            <View style={styles.footer}>
              <Text style={styles.totalPoints}>{lifetimeRating.totalPoints.toLocaleString()} PTS</Text>
              <Text style={styles.swipeHint}>← Swipe to flip →</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </TouchableOpacity>
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
    height: '100%',
  },
  loadingCard: {
    height: 200,
    borderRadius: 15,
    padding: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallRating: {
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
