import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserRating, CardTier, RatingSystem } from '../services/ratingSystem';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

interface UserCardProps {
  userRating: UserRating;
  username: string;
  profileImage?: string;
  isMonthlyCard?: boolean;
  onImageUpdate?: (imageUri: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  userRating,
  username,
  profileImage,
  isMonthlyCard = false,
  onImageUpdate
}) => {
  const [selectedImage, setSelectedImage] = useState(profileImage);
  const tierColors = RatingSystem.getCardTierColors(userRating.cardTier);

  const handleImagePress = async () => {
    if (!onImageUpdate) return;

    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => pickImage('camera') },
        { text: 'Gallery', onPress: () => pickImage('library') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      const result = source === 'camera' 
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        onImageUpdate?.(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const getCardBackgroundImage = () => {
    // Different background patterns based on tier
    switch (userRating.cardTier) {
      case CardTier.Obsidian:
      case CardTier.Carbon:
        return null; // Use gradient only for highest tiers
      default:
        return null; // For now, use gradients for all
    }
  };

  const renderStatBar = (label: string, value: number, maxValue: number = 100) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    
    return (
      <View style={styles.statContainer}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.statBarContainer}>
          <View style={styles.statBarBackground}>
            <LinearGradient
              colors={[tierColors.accent, tierColors.primary]}
              style={[styles.statBarFill, { width: `${percentage}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.statValue}>{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={[tierColors.primary, tierColors.secondary]}
        style={styles.cardBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.tierContainer}>
            <Text style={styles.tierText}>{userRating.cardTier}</Text>
            {isMonthlyCard && <Text style={styles.monthlyIndicator}>MONTHLY</Text>}
          </View>
          <View style={styles.overallRatingContainer}>
            <Text style={styles.overallRatingNumber}>{userRating.overallRating}</Text>
            <Text style={styles.overallRatingLabel}>OVR</Text>
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handleImagePress} disabled={!onImageUpdate}>
            <View style={[styles.profileImageContainer, { borderColor: tierColors.accent }]}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: tierColors.accent }]}>
                  <Text style={styles.profileImagePlaceholderText}>
                    {username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.usernameContainer}>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.totalPoints}>
              {isMonthlyCard ? userRating.monthlyPoints : userRating.totalPoints} PTS
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statColumn}>
              {renderStatBar('DIS', userRating.stats.DIS, 200)}
              {renderStatBar('FOC', userRating.stats.FOC, 200)}
              {renderStatBar('JOU', userRating.stats.JOU, 100)}
            </View>
            <View style={styles.statColumn}>
              {renderStatBar('USA', userRating.stats.USA, 200)}
              {renderStatBar('MEN', userRating.stats.MEN, 300)}
              {renderStatBar('PHY', userRating.stats.PHY, 200)}
            </View>
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>KIGEN</Text>
          <View style={styles.cardTypeIndicator}>
            <Text style={styles.cardTypeText}>
              {isMonthlyCard ? 'MONTHLY CARD' : 'LIFETIME CARD'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tier glow effect */}
      <View style={[styles.glowEffect, { shadowColor: tierColors.accent }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: width * 0.85,
    height: width * 1.4,
    alignSelf: 'center',
    marginVertical: 20,
  },
  cardBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  glowEffect: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 25,
    elevation: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    zIndex: -1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tierContainer: {
    alignItems: 'flex-start',
  },
  tierText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  monthlyIndicator: {
    fontSize: 10,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 2,
  },
  overallRatingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 10,
    minWidth: 60,
  },
  overallRatingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  overallRatingLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  usernameContainer: {
    alignItems: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  totalPoints: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },
  statsSection: {
    flex: 1,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statColumn: {
    flex: 1,
    paddingHorizontal: 5,
  },
  statContainer: {
    marginBottom: 15,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
    textAlign: 'center',
  },
  statBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    minWidth: 25,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    opacity: 0.7,
  },
  cardTypeIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardTypeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
