import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Animated, 
  Dimensions,
  PanResponder,
  Modal,
  ScrollView,
  Image,
  Alert,
  ImageBackground,
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
  
  // Add refs for gesture tracking
  const gestureStartTime = useRef(0);
  const isSwipeGesture = useRef(false);

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

      // Use REAL data from the actual rating system
      const monthlyRating = await UserStatsService.getCurrentRating();
      
      // For lifetime, we'll aggregate all monthly records or use current as fallback
      const monthlyRecords = await UserStatsService.getMonthlyRecords();
      let lifetimeStats = { DIS: 0, FOC: 0, JOU: 0, USA: 0, MEN: 0, PHY: 0 };
      let lifetimeTotalPoints = 0;
      
      if (monthlyRecords.length > 0) {
        // Sum up all historical stats
        monthlyRecords.forEach(record => {
          lifetimeStats.DIS += record.stats.DIS;
          lifetimeStats.FOC += record.stats.FOC;
          lifetimeStats.JOU += record.stats.JOU;
          lifetimeStats.USA += record.stats.USA;
          lifetimeStats.MEN += record.stats.MEN;
          lifetimeStats.PHY += record.stats.PHY;
        });
        lifetimeTotalPoints = RatingSystem.calculateTotalPoints(lifetimeStats);
      } else {
        // Use current stats as fallback
        lifetimeStats = monthlyRating.stats;
        lifetimeTotalPoints = monthlyRating.totalPoints;
      }
      
      const lifetimeOverallRating = RatingSystem.calculateOverallRating(lifetimeStats);
      const lifetimeCardTier = RatingSystem.getCardTier(lifetimeTotalPoints);

      const lifetimeRating: UserRating = {
        stats: lifetimeStats,
        overallRating: lifetimeOverallRating,
        totalPoints: lifetimeTotalPoints,
        monthlyPoints: 0, // Not applicable for lifetime
        cardTier: lifetimeCardTier
      };

      setMonthlyRating(monthlyRating);
      setLifetimeRating(lifetimeRating);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [refreshTrigger]);

  const handleFlip = () => {
    const toValue = isFlipped ? 0 : 1;
    setIsFlipped(!isFlipped);

    Animated.timing(flipAnimation, {
      toValue,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Respond to any movement
      return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
    },
    onPanResponderGrant: () => {
      gestureStartTime.current = Date.now();
      isSwipeGesture.current = false;
    },
    onPanResponderMove: (_, gestureState) => {
      // Mark as swipe if there's horizontal movement
      if (Math.abs(gestureState.dx) > 20) {
        isSwipeGesture.current = true;
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      const gestureDuration = Date.now() - gestureStartTime.current;
      const isHorizontalSwipe = Math.abs(gestureState.dx) > 30;
      const isQuickTap = gestureDuration < 300 && Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10;

      if (isHorizontalSwipe) {
        // Flip the card
        console.log('Flipping card');
        setIsFlipped(!isFlipped);
        Animated.timing(flipAnimation, {
          toValue: isFlipped ? 0 : 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      } else if (isQuickTap) {
        // Expand the card or handle photo selection
        console.log('Tapped card');
        setIsExpanded(!isExpanded);
      }

      // Reset gesture tracking
      isSwipeGesture.current = false;
    },
    onStartShouldSetPanResponder: () => true, // Always capture touch events
  });

  // Handle tap separately
  const handleTap = () => {
    console.log('Handle tap called');
    if (!isSwipeGesture.current) {
      setIsExpanded(!isExpanded);
    }
  };  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to add a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
      // Here you would typically save this to UserStatsService
    }
  };

  const getStatName = (statKey: string): string => {
    const statNames = {
      DIS: 'DISCIPLINE',
      FOC: 'FOCUS', 
      JOU: 'JOURNALING',
      USA: 'USAGE',
      MEN: 'MENTALITY',
      PHY: 'PHYSICAL'
    };
    return statNames[statKey as keyof typeof statNames] || statKey;
  };

  const frontRotation = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotation = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const currentRating = isFlipped ? lifetimeRating : monthlyRating;
  const cardTitle = isFlipped ? 'LIFETIME STATS' : 'MONTHLY STATS';

  if (isLoading || !currentRating) {
    return (
      <View style={styles.card}>
        <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.cardContent}>
          <Text style={styles.loadingText}>Loading FIFA Card...</Text>
        </LinearGradient>
      </View>
    );
  }

  const tierColors = RatingSystem.getCardTierColors(currentRating.cardTier);
  const backgroundImage = RatingSystem.getCardBackgroundImage(currentRating.cardTier);
  const textColor = RatingSystem.getCardTextColor(currentRating.cardTier);

  return (
    <>
      <View style={styles.card} {...panResponder.panHandlers}>
          <ImageBackground 
            source={backgroundImage}
            style={styles.cardContent}
            imageStyle={{ borderRadius: 20 }}
            resizeMode="cover"
          >
            {/* Front Side */}
            <Animated.View style={[
              styles.cardSide, 
              { transform: [{ rotateY: frontRotation }] },
              { opacity: isFlipped ? 0 : 1 }
            ]}>
            {/* Card Layout matching your sketch exactly */}
            <View style={styles.cardLayout}>
              
              {/* Top Section - Time Period (moved higher) */}
              <View style={styles.topSection}>
                <Text style={[styles.timePeriod, { color: textColor }]}>MONTHLY</Text>
              </View>
              
              {/* Main Content Section */}
              <View style={styles.mainContent}>
                
                {/* Left Column - Picture and Username */}
                <View style={styles.leftColumn}>
                  <TouchableOpacity onPress={pickImage} style={styles.pictureContainer}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.cardProfileImage} />
                    ) : (
                      <View style={styles.picturePlaceholder}>
                        <Text style={[styles.picturePlaceholderText, { color: textColor }]}>picture</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <Text style={[styles.cardPlayerName, { color: textColor }]}>{userName || 'username'}</Text>
                </View>
                
                {/* Middle Column - OVR (moved up, X removed) */}
                <View style={styles.middleColumn}>
                  <Text style={[styles.ovrValue, { color: textColor }]}>{currentRating.overallRating}</Text>
                  <Text style={[styles.ovrLabel, { color: textColor }]}>OVR</Text>
                </View>
                
                {/* Right Column - Stats with values */}
                <View style={styles.rightColumn}>
                  <View style={styles.statsContainer}>
                    {Object.entries(currentRating.stats).map(([key, value]) => (
                      <View key={key} style={styles.statRow}>
                        <Text style={[styles.statKey, { color: textColor }]}>{key} - {value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              
              {/* Bottom Section - Rank (moved down) */}
              <View style={styles.bottomSection}>
                <Text style={[styles.rankText, { color: textColor }]}>{currentRating.cardTier.toUpperCase()}</Text>
              </View>
              
            </View>
            </Animated.View>

            {/* Back Side */}
            <Animated.View style={[
              styles.cardSide, 
              { transform: [{ rotateY: backRotation }] },
              { opacity: isFlipped ? 1 : 0 },
              { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 16 }
            ]}>
              {/* Card Layout matching your sketch exactly - BACK SIDE */}
              <View style={styles.cardLayout}>
                
                {/* Top Section - Time Period (moved higher) */}
                <View style={styles.topSection}>
                  <Text style={[styles.timePeriod, { color: textColor }]}>ALL TIME</Text>
                </View>
                
                {/* Main Content Section */}
                <View style={styles.mainContent}>
                  
                  {/* Left Column - Picture and Username */}
                  <View style={styles.leftColumn}>
                    <TouchableOpacity onPress={pickImage} style={styles.pictureContainer}>
                      {profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.cardProfileImage} />
                      ) : (
                        <View style={styles.picturePlaceholder}>
                          <Text style={[styles.picturePlaceholderText, { color: textColor }]}>picture</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <Text style={[styles.cardPlayerName, { color: textColor }]}>{userName || 'username'}</Text>
                  </View>
                  
                  {/* Middle Column - OVR (moved up, X removed) */}
                  <View style={styles.middleColumn}>
                    <Text style={[styles.ovrValue, { color: textColor }]}>{currentRating.overallRating}</Text>
                    <Text style={[styles.ovrLabel, { color: textColor }]}>OVR</Text>
                  </View>
                  
                  {/* Right Column - Stats with values */}
                  <View style={styles.rightColumn}>
                    <View style={styles.statsContainer}>
                      {Object.entries(currentRating.stats).map(([key, value]) => (
                        <View key={key} style={styles.statRow}>
                          <Text style={[styles.statKey, { color: textColor }]}>{key} - {value}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
                
                {/* Bottom Section - Rank (moved down) */}
                <View style={styles.bottomSection}>
                  <Text style={[styles.rankText, { color: textColor }]}>{currentRating.cardTier.toUpperCase()}</Text>
                </View>
                
              </View>
            </Animated.View>
          </ImageBackground>
        </View>

      {/* Expanded Modal */}
      <Modal
        visible={isExpanded}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ScrollView style={styles.expandedCard} contentContainerStyle={styles.expandedContent}>
          <ImageBackground 
            source={backgroundImage}
            style={styles.expandedHeader}
            imageStyle={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
            resizeMode="cover"
          >
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsExpanded(false)}>
              <Text style={[styles.closeButtonText, { color: textColor }]}>×</Text>
            </TouchableOpacity>
            
            {/* Profile Picture Section */}
            <View style={styles.profileSection}>
              <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Text style={[styles.profilePlaceholderText, { color: textColor }]}>+</Text>
                    <Text style={[styles.addPhotoText, { color: textColor }]}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <Text style={[styles.playerName, { color: textColor }]}>{userName}</Text>
            </View>
            
            {/* OVR */}
            <View style={styles.expandedOvrContainer}>
              <Text style={[styles.expandedOvrLabel, { color: textColor }]}>OVERALL</Text>
              <Text style={[styles.expandedOvrNumber, { color: textColor }]}>{currentRating.overallRating}</Text>
            </View>
          </ImageBackground>
          
          {/* Detailed Stats */}
          <View style={styles.detailedStatsContainer}>
            <Text style={styles.detailedStatsTitle}>PLAYER STATISTICS</Text>
            
            {Object.entries(currentRating.stats).map(([key, value]) => (
              <View key={key} style={styles.cleanStatRow}>
                <Text style={styles.cleanStatName}>{getStatName(key)}</Text>
                <Text style={styles.cleanStatValue}>{value}</Text>
              </View>
            ))}
            
            <View style={styles.additionalInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Points:</Text>
                <Text style={styles.infoValue}>{currentRating.totalPoints}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Card Tier:</Text>
                <Text style={styles.infoValue}>{currentRating.cardTier}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Period:</Text>
                <Text style={styles.infoValue}>{isFlipped ? 'Lifetime' : 'This Month'}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width - 32,
    height: 200,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardSide: {
    flex: 1,
    backfaceVisibility: 'hidden',
  },
  
  // Card layout matching the exact sketch
  cardLayout: {
    flex: 1,
    padding: 12,
  },
  
  // Top section for time period (moved higher)
  topSection: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: -4, // Move higher
  },
  timePeriod: {
    fontSize: 12,
    fontWeight: '600',
    color: 'black',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  
  // Main content area with 3 columns
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  
  // Left column - Picture and username
  leftColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 8,
  },
  
  // Middle column - OVR (moved up without X)
  middleColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', // Move OVR to top
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  
  // Right column - Stats list
  rightColumn: {
    flex: 1,
    paddingLeft: 8,
    justifyContent: 'center',
    borderLeftWidth: 2,
    borderLeftColor: 'black',
  },
  
  // Stats container
  statsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  
  // Bottom section for rank (moved down)
  bottomSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: -4, // Move down
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'black',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pictureContainer: {
    width: 70,
    height: 90,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'black',
  },
  cardProfileImage: {
    width: '100%',
    height: '100%',
  },
  picturePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  picturePlaceholderText: {
    fontSize: 10,
    color: 'black',
    fontWeight: '500',
  },
  cardPlayerName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'black',
    textAlign: 'center',
  },
  rightSection: {
    flex: 0.6,
    paddingLeft: 8,
  },
  ovrSection: {
    alignItems: 'flex-end', // Move OVR to right edge
    marginBottom: 12,
  },
  ovrLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'black',
    textAlign: 'center',
  },
  ovrValue: {
    fontSize: 36,
    fontWeight: '900',
    color: 'black',
    textAlign: 'center',
  },
  allStatsGrid: {
    flex: 1,
  },
  statRow: {
    marginBottom: 2,
  },
  statKey: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
    minWidth: 40, // Ensure it's at the edge
    marginLeft: 'auto', // Push to right edge
  },
  
  tierText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  
  // Loading state
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 80,
  },
  
  // Expanded Modal Styles (keeping existing)
  expandedCard: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  expandedContent: {
    paddingBottom: 40,
  },
  expandedHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholderText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  addPhotoText: {
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 4,
  },
  playerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  expandedOvrContainer: {
    alignItems: 'center',
  },
  expandedOvrLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  expandedOvrNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  detailedStatsContainer: {
    padding: 20,
  },
  detailedStatsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  cleanStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cleanStatName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  cleanStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  // Keep old styles for backwards compatibility but unused now
  detailedStatRow: {
    marginBottom: 16,
  },
  detailedStatName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  statBar: {
    height: 32,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  statBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
  },
  detailedStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginLeft: 'auto',
  },
  additionalInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});
