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
  const backgroundImage = RatingSystem.getCardBackgroundImage(userRating.cardTier);
  const textColor = RatingSystem.getCardTextColor(userRating.cardTier);

  const handleImagePress = async () => {
    if (!onImageUpdate) return;

    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        { text: 'Gallery', onPress: () => pickImage() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
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
    // Return the appropriate background image for the tier
    return RatingSystem.getCardBackgroundImage(userRating.cardTier);
  };

  const renderStatBar = (label: string, value: number, maxValue: number = 100) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    
    return (
      <View style={styles.statContainer}>
        <Text style={[styles.statLabel, { color: textColor }]}>{label}</Text>
        <View style={styles.statBarContainer}>
          <View style={styles.statBarBackground}>
            <LinearGradient
              colors={[tierColors.accent, tierColors.primary]}
              style={[styles.statBarFill, { width: `${percentage}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.cardContainer}>
      <ImageBackground
        source={backgroundImage}
        style={styles.cardBackground}
        imageStyle={{ borderRadius: 20 }}
        resizeMode="cover"
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.tierContainer}>
            <Text style={[styles.tierText, { color: textColor }]}>{userRating.cardTier}</Text>
            {isMonthlyCard && <Text style={[styles.monthlyIndicator, { color: textColor }]}>MONTHLY</Text>}
          </View>
          <View style={styles.overallRatingContainer}>
            <Text style={[styles.overallRatingNumber, { color: textColor }]}>{userRating.overallRating}</Text>
            <Text style={[styles.overallRatingLabel, { color: textColor }]}>OVR</Text>
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
            <Text style={[styles.username, { color: textColor }]}>{username}</Text>
            <Text style={[styles.totalPoints, { color: textColor }]}>
              {isMonthlyCard ? userRating.monthlyPoints : userRating.totalPoints} PTS
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statColumn}>
              {renderStatBar('Discipline', userRating.stats.DIS, 200)}
              {renderStatBar('Focus', userRating.stats.FOC, 200)}
              {renderStatBar('Journaling', userRating.stats.JOU, 100)}
            </View>
            <View style={styles.statColumn}>
              {renderStatBar('Determination', userRating.stats.DET, 200)}
              {renderStatBar('Mentality', userRating.stats.MEN, 300)}
              {renderStatBar('Physical', userRating.stats.PHY, 200)}
            </View>
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <Text style={[styles.footerText, { color: textColor }]}>KIGEN</Text>
          <View style={styles.cardTypeIndicator}>
            <Text style={[styles.cardTypeText, { color: textColor }]}>
              {isMonthlyCard ? 'MONTHLY CARD' : 'LIFETIME CARD'}
            </Text>
          </View>
        </View>
      </ImageBackground>

      {/* Tier glow effect */}
      <View style={[styles.glowEffect, { shadowColor: tierColors.accent }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  cardBackground: {
    borderRadius: 20,
    elevation: 10,
    height: '100%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    width: '100%',
  },
  cardContainer: {
    alignSelf: 'center',
    height: width * 1.4,
    marginVertical: 20,
    width: width * 0.85,
  },
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardTypeIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardTypeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  glowEffect: {
    borderRadius: 25,
    bottom: -5,
    elevation: 5,
    left: -5,
    position: 'absolute',
    right: -5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    top: -5,
    zIndex: -1,
  },
  monthlyIndicator: {
    color: '#ffffff',
    fontSize: 10,
    marginTop: 2,
    opacity: 0.8,
  },
  overallRatingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    minWidth: 60,
    padding: 10,
  },
  overallRatingLabel: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.8,
  },
  overallRatingNumber: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileImage: {
    height: '100%',
    width: '100%',
  },
  profileImageContainer: {
    borderRadius: 40,
    borderWidth: 3,
    height: 80,
    marginBottom: 10,
    overflow: 'hidden',
    width: 80,
  },
  profileImagePlaceholder: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  profileImagePlaceholderText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statBarBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    flex: 1,
    height: 8,
    marginRight: 8,
    overflow: 'hidden',
  },
  statBarContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statBarFill: {
    borderRadius: 4,
    height: '100%',
  },
  statColumn: {
    flex: 1,
    paddingHorizontal: 5,
  },
  statContainer: {
    marginBottom: 15,
  },
  statLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 25,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsSection: {
    flex: 1,
    marginBottom: 20,
  },
  tierContainer: {
    alignItems: 'flex-start',
  },
  tierText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalPoints: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 2,
    opacity: 0.9,
  },
  username: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  usernameContainer: {
    alignItems: 'center',
  },
});
