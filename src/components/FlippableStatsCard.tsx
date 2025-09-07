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

      // Use placeholder data with realistic stats for testing
      const monthlyRating: UserRating = {
        stats: {
          DIS: 1900,
          FOC: 1000,
          JOU: 800,
          USA: 200,
          MEN: 900,
          PHY: 500
        },
        overallRating: 85,
        totalPoints: 5300, // This puts us in Gold tier (4000-6000)
        monthlyPoints: 1200,
        cardTier: 'Gold' as any
      };

      const lifetimeRating: UserRating = {
        stats: {
          DIS: 2800,
          FOC: 1500,
          JOU: 1200,
          USA: 500,
          MEN: 1300,
          PHY: 700
        },
        overallRating: 88,
        totalPoints: 8000, // This puts us in Diamond tier (8000-10000)
        monthlyPoints: 2340,
        cardTier: 'Diamond' as any
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
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10;
    },
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) > 50) {
        handleFlip();
      } else if (Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10) {
        // This is a tap
        setIsExpanded(true);
      }
    },
  });

  const pickImage = async () => {
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

    if (!result.canceled && result.assets && result.assets.length > 0) {
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
  const gradientColors: [string, string] = [tierColors.primary, tierColors.secondary];

  return (
    <>
      <View style={styles.card} {...panResponder.panHandlers}>
        <LinearGradient colors={gradientColors} style={styles.cardContent}>
          <Animated.View style={[styles.cardSide, { transform: [{ rotateY: frontRotation }] }]}>
            
            {/* Card Layout matching your sketch */}
            <View style={styles.cardLayout}>
              
              {/* Left Side - Picture */}
              <View style={styles.leftSection}>
                <View style={styles.pictureContainer}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.cardProfileImage} />
                  ) : (
                    <View style={styles.picturePlaceholder}>
                      <Text style={styles.picturePlaceholderText}>PICTURE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardPlayerName}>{userName}</Text>
              </View>
              
              {/* Right Side - Stats and OVR */}
              <View style={styles.rightSection}>
                {/* OVR positioned at top right */}
                <View style={styles.ovrSection}>
                  <Text style={styles.ovrLabel}>OVR</Text>
                  <Text style={styles.ovrValue}>{currentRating.overallRating}</Text>
                </View>
                
                {/* All 6 Stats */}
                <View style={styles.allStatsGrid}>
                  {Object.entries(currentRating.stats).map(([key, value]) => (
                    <View key={key} style={styles.statRow}>
                      <Text style={styles.statKey}>{key}</Text>
                      <Text style={styles.statValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            
            {/* Card Type and Tier at bottom */}
            <View style={styles.cardFooter}>
              <Text style={styles.cardTypeText}>{cardTitle}</Text>
              <Text style={styles.tierText}>{currentRating.cardTier.toUpperCase()}</Text>
            </View>
            
            <Text style={styles.tapHint}>TAP TO EXPAND • SWIPE TO FLIP</Text>
          </Animated.View>
        </LinearGradient>
      </View>

      {/* Expanded Modal */}
      <Modal
        visible={isExpanded}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ScrollView style={styles.expandedCard} contentContainerStyle={styles.expandedContent}>
          <LinearGradient colors={gradientColors} style={styles.expandedHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsExpanded(false)}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            
            {/* Profile Picture Section */}
            <View style={styles.profileSection}>
              <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Text style={styles.profilePlaceholderText}>+</Text>
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <Text style={styles.playerName}>{userName}</Text>
            </View>
            
            {/* OVR */}
            <View style={styles.expandedOvrContainer}>
              <Text style={styles.expandedOvrLabel}>OVERALL</Text>
              <Text style={styles.expandedOvrNumber}>{currentRating.overallRating}</Text>
            </View>
          </LinearGradient>
          
          {/* Detailed Stats */}
          <View style={styles.detailedStatsContainer}>
            <Text style={styles.detailedStatsTitle}>PLAYER STATISTICS</Text>
            
            {Object.entries(currentRating.stats).map(([key, value]) => (
              <View key={key} style={styles.detailedStatRow}>
                <Text style={styles.detailedStatName}>{getStatName(key)}</Text>
                <View style={styles.statBar}>
                  <View style={[styles.statBarFill, { width: `${value}%` }]} />
                  <Text style={styles.detailedStatValue}>{value}</Text>
                </View>
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
  
  // New FIFA card layout matching your sketch
  cardLayout: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  leftSection: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pictureContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 8,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  picturePlaceholderText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  cardPlayerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rightSection: {
    flex: 0.6,
    paddingLeft: 8,
  },
  ovrSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  ovrLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  ovrValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  allStatsGrid: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statKey: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
    minWidth: 30,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tapHint: {
    fontSize: 8,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 4,
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
