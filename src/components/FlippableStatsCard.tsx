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
  Alert,
  ImageBackground,
  Image,
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
  onNotificationPress?: () => void;
}

export const FlippableStatsCard: React.FC<FlippableStatsCardProps> = ({ onPress: _onPress, refreshTrigger, onNotificationPress }) => {
  const [monthlyRating, setMonthlyRating] = useState<UserRating | null>(null);
  const [lifetimeRating, setLifetimeRating] = useState<UserRating | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [displayFlipped, setDisplayFlipped] = useState(false); // Separate state for display timing
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState('User Name');

  const flipAnimation = useRef(new Animated.Value(0)).current;
  
  // Add refs for gesture tracking
  const gestureStartTime = useRef(0);
  const isSwipeGesture = useRef(false);
  const hasFlippedThisGesture = useRef(false); // Prevent multiple flips per gesture

  const fetchRatings = async () => {
    setIsLoading(true);
    try {
      console.log('📊 FlippableStatsCard: Starting to fetch ratings');
      
      // Get user profile, create if doesn't exist
      const profile = await UserStatsService.ensureUserProfile();
      console.log('📊 FlippableStatsCard: Profile obtained:', profile?.username);
      
      if (!profile) {
        console.error('📊 FlippableStatsCard: No profile available');
        return;
      }
      
      setUserName(profile.username);
      if (profile.profileImage) {
        setProfileImage(profile.profileImage);
      }

      console.log('📊 FlippableStatsCard: Getting ratings');
      
      // Get monthly data using the same logic as leaderboard
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyLeaderboardData = await UserStatsService.getMonthlyLeaderboard(currentMonth);
      
      let monthlyRating: UserRating;
      if (monthlyLeaderboardData.length > 0) {
        const monthlyEntry = monthlyLeaderboardData[0];
        if (monthlyEntry) {
          // Create UserRating from leaderboard data
          const monthlyStats = await UserStatsService.calculateCurrentMonthStats();
          const monthlyPoints = monthlyEntry.monthlyPoints;
          const cardTier = monthlyEntry.cardTier;
          const overallRating = RatingSystem.calculateOverallRating(monthlyStats);
          
          monthlyRating = {
            stats: monthlyStats,
            overallRating,
            totalPoints: monthlyPoints,
            monthlyPoints,
            cardTier
          };
          console.log('📊 Using leaderboard monthly data:', monthlyEntry);
        } else {
          monthlyRating = await UserStatsService.getCurrentRating();
        }
      } else {
        // Fallback to direct calculation
        monthlyRating = await UserStatsService.getCurrentRating();
        console.log('📊 No monthly leaderboard data, using direct calculation');
      }
      
      // Get centralized all-time stats (aggregated monthly records + live current month)
      const lifetimeStats = await UserStatsService.calculateAllTimeStats();
      const lifetimeTotalPoints = RatingSystem.calculateTotalPoints(lifetimeStats);
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
      console.log('📊 FlippableStatsCard: Ratings updated successfully');
    } catch (error) {
      console.error('📊 FlippableStatsCard: Error fetching ratings:', error);
    } finally {
      setIsLoading(false);
      console.log('📊 FlippableStatsCard: Loading completed');
    }
  };

  const handleAddPhoto = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera roll is required!");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        
        // Save to user profile
        await UserStatsService.updateUserProfile({ profileImage: imageUri });
        
        Alert.alert("Success", "Profile photo updated successfully!");
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      Alert.alert("Error", "Failed to update profile photo. Please try again.");
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [refreshTrigger]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to clear horizontal swipes with minimal vertical movement
      const { dx, dy } = gestureState;
      return Math.abs(dx) > 8 || Math.abs(dy) > 8;
    },
    onPanResponderGrant: () => {
      gestureStartTime.current = Date.now();
      isSwipeGesture.current = false;
      hasFlippedThisGesture.current = false; // Reset flip flag for new gesture
    },
    onPanResponderMove: (_, gestureState) => {
      const { dx, dy } = gestureState;
      // Mark as swipe only for predominantly horizontal movement
      if (Math.abs(dx) > 25 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        isSwipeGesture.current = true;
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      const gestureDuration = Date.now() - gestureStartTime.current;
      const { dx, dy } = gestureState;
      const isHorizontalSwipe = Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5;
      const isQuickTap = gestureDuration < 250 && Math.abs(dx) < 15 && Math.abs(dy) < 15;

      if (isHorizontalSwipe && isSwipeGesture.current && !hasFlippedThisGesture.current) {
        // Simply toggle between monthly and all-time without animation
        hasFlippedThisGesture.current = true; // Prevent multiple flips per gesture
        const newFlippedState = !isFlipped;
        setIsFlipped(newFlippedState);
        setDisplayFlipped(newFlippedState);
      } else if (isQuickTap && !isSwipeGesture.current) {
        // Tap to expand - only if not swiping
        console.log('Tapped card to expand');
        setIsExpanded(!isExpanded);
      }

      // Reset gesture tracking
      isSwipeGesture.current = false;
    },
    onStartShouldSetPanResponder: () => true, // Always capture touch events
    onPanResponderTerminationRequest: () => false, // Don't let parent views intercept
  });

  const getStatName = (statKey: string): string => {
    const statNames = {
      DIS: 'Discipline',
      FOC: 'Focus', 
      JOU: 'Journaling',
      DET: 'Determination',
      MEN: 'Mentality',
      PHY: 'Physical'
    };
    return statNames[statKey as keyof typeof statNames] || statKey;
  };

  const frontRotation = flipAnimation.interpolate({
    inputRange: [-180, 0, 180],
    outputRange: ['-180deg', '0deg', '180deg'],
  });

  const backRotation = flipAnimation.interpolate({
    inputRange: [-180, 0, 180],
    outputRange: ['0deg', '180deg', '360deg'],
  });

  const currentRating = displayFlipped ? lifetimeRating : monthlyRating;

  if (isLoading || !currentRating) {
    return (
      <View style={styles.card}>
        <LinearGradient colors={['#2d1b69', '#1a103d']} style={styles.cardContent}>
          <Text style={styles.loadingText}>Loading User Stats...</Text>
        </LinearGradient>
      </View>
    );
  }

  const backgroundImage = RatingSystem.getCardBackgroundImage(currentRating.cardTier);
  const textColor = RatingSystem.getCardTextColor(currentRating.cardTier);

  return (
    <>
      {/* Top bar - slim, slightly thicker than bottom bar. Notification button on top-left. */}
      <View style={styles.topBarContainer}>
        <TouchableOpacity style={styles.topBarLeftButton} onPress={onNotificationPress}>
          <Text style={styles.topBarButtonText}>🔔</Text>
        </TouchableOpacity>
        {/* center area left empty for app name (to be added later) */}
        <View style={styles.topBarCenter} />
      </View>

      {/* Small hint text between top bar and card */}
      <View style={styles.tapHintContainer} pointerEvents="none">
        <Text style={styles.tapHintText}>Tap to flip</Text>
      </View>

      <View style={styles.card} {...panResponder.panHandlers}>
        {/* Front Side */}
        <Animated.View 
          style={[
            styles.cardSide,
            { transform: [{ rotateY: frontRotation }] },
            styles.cardSideAbsolute
          ]}
        >
          <ImageBackground 
            source={backgroundImage}
            style={styles.cardContent}
            imageStyle={styles.cardImageBorderRadius}
            resizeMode="cover"
          >
            {/* Card Layout matching your sketch exactly */}
            <View style={styles.cardLayout}>
              
              {/* Top Section - Time Period (moved higher) */}
              <View style={styles.topSection}>
                <Text style={[styles.timePeriod, { color: textColor }]}>{displayFlipped ? 'ALL-TIME' : 'MONTHLY'}</Text>
              </View>
              
              {/* Main Content Section */}
              <View style={styles.mainContent}>
                
                {/* Left Column - Picture and Username */}
                <View style={styles.leftColumn}>
                  <View style={styles.pictureContainer}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.cardProfileImage} />
                    ) : (
                      <View style={styles.picturePlaceholder}>
                        <Text style={[styles.picturePlaceholderText, { color: textColor }]}>picture</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.cardUserName, { color: textColor }]}>{userName || 'username'}</Text>
                </View>
                
                {/* Middle Column - OVR (moved up, X removed) */}
                <View style={styles.middleColumn}>
                  <Text style={[styles.ovrValue, { color: textColor }]}>{currentRating.overallRating}</Text>
                  <Text style={[styles.ovrLabel, { color: textColor }]}>OVR</Text>
                </View>
                
                {/* Right Column - Stats with values */}
                <View style={styles.rightColumn}>
                  <View style={styles.statsContainer}>
                    {currentRating && Object.entries(currentRating.stats).map(([key, value]) => (
                      <View key={`front-${key}`} style={styles.statRow}>
                        <Text style={[styles.statKey, { color: textColor }]}>{getStatName(key)}</Text>
                        <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
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
          </ImageBackground>
        </Animated.View>

        {/* Back Side */}
        <Animated.View 
          style={[
            styles.cardSide,
            { transform: [{ rotateY: backRotation }] },
            styles.cardSideAbsolute
          ]}
        >
          <ImageBackground 
            source={backgroundImage}
            style={styles.cardContent}
            imageStyle={styles.cardImageBorderRadius}
            resizeMode="cover"
          >
            {/* Card Layout matching your sketch exactly - BACK SIDE */}
            <View style={styles.cardLayout}>
              
              {/* Top Section - Time Period (moved higher) */}
              <View style={styles.topSection}>
                <Text style={[styles.timePeriod, { color: textColor }]}>{displayFlipped ? 'ALL-TIME' : 'MONTHLY'}</Text>
              </View>
              
              {/* Main Content Section */}
              <View style={styles.mainContent}>
                
                {/* Left Column - Picture and Username */}
                <View style={styles.leftColumn}>
                  <View style={styles.pictureContainer}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.cardProfileImage} />
                    ) : (
                      <View style={styles.picturePlaceholder}>
                        <Text style={[styles.picturePlaceholderText, { color: textColor }]}>picture</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.cardUserName, { color: textColor }]}>{userName || 'username'}</Text>
                </View>
                
                {/* Middle Column - OVR (moved up, X removed) */}
                <View style={styles.middleColumn}>
                  <Text style={[styles.ovrValue, { color: textColor }]}>{currentRating.overallRating}</Text>
                  <Text style={[styles.ovrLabel, { color: textColor }]}>Overall</Text>
                </View>
                
                {/* Right Column - Stats with values */}
                <View style={styles.rightColumn}>
                  <View style={styles.statsContainer}>
                    {currentRating && Object.entries(currentRating.stats).map(([key, value]) => (
                      <View key={`back-${key}`} style={styles.statRow}>
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
          </ImageBackground>
        </Animated.View>
      </View>

      {/* Expanded Modal */}
      <Modal
        visible={isExpanded}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsExpanded(false)}
      >
        <ScrollView style={styles.expandedCard} contentContainerStyle={styles.expandedContent}>
          <ImageBackground 
            source={backgroundImage}
            style={styles.expandedHeader}
            imageStyle={styles.cardImageTopBorderRadius}
            resizeMode="cover"
          >
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsExpanded(false)}>
              <Text style={[styles.closeButtonText, { color: textColor }]}>×</Text>
            </TouchableOpacity>
            
            {/* Profile Picture Section */}
            <View style={styles.profileSection}>
              <TouchableOpacity style={styles.profileImageContainer} onPress={handleAddPhoto}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Text style={[styles.profilePlaceholderText, { color: textColor }]}>+</Text>
                    <Text style={[styles.addPhotoText, { color: textColor }]}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <Text style={[styles.userName, { color: textColor }]}>{userName}</Text>
            </View>
            
            {/* OVR */}
            <View style={styles.expandedOvrContainer}>
              <Text style={[styles.expandedOvrLabel, { color: textColor }]}>OVERALL</Text>
              <Text style={[styles.expandedOvrNumber, { color: textColor }]}>{currentRating.overallRating}</Text>
            </View>
          </ImageBackground>
          
          {/* Detailed Stats */}
          <View style={styles.detailedStatsContainer}>
            <Text style={styles.detailedStatsTitle}>USER STATISTICS</Text>
            
            {Object.entries(currentRating.stats).map(([key, value]) => (
              <View key={`expanded-${key}`} style={styles.cleanStatRow}>
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
  addPhotoText: {
    color: theme.colors.text.primary,
    fontSize: 10,
    marginTop: 4,
  },
  additionalInfo: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 12,
    marginTop: 24,
    padding: 16,
  },
  
  // Bottom section for rank (moved down)
  bottomSection: {
    alignItems: 'center',
    marginBottom: -4,
    marginTop: 12, // Move down
  },
  
  card: {
    alignSelf: 'center',
    borderRadius: 16,
    elevation: 8,
    height: 200,
    margin: 16, // Reverted to original spacing
    overflow: 'hidden',
    padding: 8, // Reverted to original spacing
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: width - 32,
  },
  
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardImageBorderRadius: {
    borderRadius: 20,
  },
  cardImageTopBorderRadius: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  
  // Card layout matching the exact sketch
  cardLayout: {
    flex: 1,
    padding: 12,
  },
  
  cardProfileImage: {
    height: '100%',
    width: '100%',
  },
  
  cardSide: {
    backfaceVisibility: 'hidden',
    flex: 1,
  },
  
  cardSideAbsolute: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  
  cardUserName: {
    color: theme.colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  cleanStatName: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  cleanStatRow: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  cleanStatValue: {
    color: theme.colors.text.secondary,
    fontSize: 18,
    fontWeight: '700',
  },
  
  // eslint-disable-next-line react-native/no-color-literals
  closeButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginBottom: 20,
    width: 32,
  },
  closeButtonText: {
    color: theme.colors.text.primary,
    fontSize: 24,
    fontWeight: '600',
  },
  
  detailedStatsContainer: {
    padding: 20,
  },
  detailedStatsTitle: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // Expanded Modal Styles (keeping existing)
  expandedCard: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  expandedContent: {
    paddingBottom: 40,
  },
  expandedHeader: {
    paddingBottom: 30,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  expandedOvrContainer: {
    alignItems: 'center',
  },
  expandedOvrLabel: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  expandedOvrNumber: {
    color: theme.colors.text.primary,
    fontSize: 64,
    fontWeight: '900',
  },
  
  infoLabel: {
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoValue: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Left column - Picture and username
  leftColumn: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  
  // Loading state
  loadingText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 80,
    textAlign: 'center',
  },
  
  // Main content area with 3 columns
  mainContent: {
    alignItems: 'stretch',
    flex: 1,
    flexDirection: 'row',
  },
  
  // Middle column - OVR (moved up without X)
  middleColumn: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start', // Move OVR to top
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  
  ovrLabel: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  
  ovrValue: {
    color: theme.colors.text.primary,
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
  },
  
  pictureContainer: {
    backgroundColor: theme.colors.overlayLight,
    borderColor: theme.colors.border,
    borderRadius: 4,
    borderWidth: 2,
    height: 90,
    marginBottom: 8,
    overflow: 'hidden',
    width: 70,
  },
  
  // eslint-disable-next-line react-native/no-color-literals
  picturePlaceholder: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  
  picturePlaceholderText: {
    color: theme.colors.text.primary,
    fontSize: 10,
    fontWeight: '500',
  },
  
  profileImage: {
    height: '100%',
    width: '100%',
  },
  profileImageContainer: {
    borderRadius: 50,
    height: 100,
    marginBottom: 12,
    overflow: 'hidden',
    width: 100,
  },
  // eslint-disable-next-line react-native/no-color-literals
  profilePlaceholder: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  profilePlaceholderText: {
    color: theme.colors.text.primary,
    fontSize: 32,
    fontWeight: '300',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  
  rankText: {
    backgroundColor: theme.colors.overlayLight,
    borderRadius: 6,
    color: theme.colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  
  // Right column - Stats list
  rightColumn: {
    borderLeftColor: theme.colors.border,
    borderLeftWidth: 2,
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  
  statKey: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  
  statRow: {
    marginBottom: 2,
  },
  
  statValue: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 'auto', // Push to right edge
    minWidth: 40, // Ensure it's at the edge
    textAlign: 'right',
  },
  
  // Stats container
  statsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  
  // Small tap hint between top bar and card
  tapHintContainer: {
    alignSelf: 'center',
    marginBottom: 4,
    marginHorizontal: 16,
    marginTop: 8,
  },
  
  tapHintText: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    opacity: 0.9,
    textAlign: 'center',
  },
  
  // Top section for time period (moved higher)
  timePeriod: {
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  
  topBarButtonText: {
    fontSize: 16,
  },
  
  topBarCenter: {
    flex: 1,
  },
  
  // Top bar (slightly thicker than bottom bar)
  topBarContainer: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 48, // slightly thicker than typical bottom bar (~40)
    paddingHorizontal: 12,
  },
  
  topBarLeftButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  
  topSection: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: -4, // Move higher
  },
  
  userName: {
    color: theme.colors.text.primary,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  
});
