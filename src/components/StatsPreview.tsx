import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserStatsService } from '../services/userStatsService';
import { UserRating, RatingSystem } from '../services/ratingSystem';
import { LinearGradient } from 'expo-linear-gradient';

interface StatsPreviewProps {
  onPress?: () => void;
}

export const StatsPreview: React.FC<StatsPreviewProps> = ({ onPress }) => {
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const rating = await UserStatsService.getCurrentRating();
      setUserRating(rating);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !userRating) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      </View>
    );
  }

  const tierColors = RatingSystem.getCardTierColors(userRating.cardTier);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={[`${tierColors.primary}40`, `${tierColors.secondary}40`]}
        style={styles.background}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Fighter Stats</Text>
          <View style={styles.tierBadge}>
            <Text style={[styles.tierText, { color: tierColors.accent }]}>
              {userRating.cardTier}
            </Text>
          </View>
        </View>

        <View style={styles.overallRating}>
          <Text style={styles.overallRatingNumber}>{userRating.overallRating}</Text>
          <Text style={styles.overallRatingLabel}>OVR</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userRating.stats.DIS}</Text>
            <Text style={styles.statLabel}>DIS</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userRating.stats.FOC}</Text>
            <Text style={styles.statLabel}>FOC</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userRating.stats.JOU}</Text>
            <Text style={styles.statLabel}>JOU</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userRating.stats.DET}</Text>
            <Text style={styles.statLabel}>DET</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userRating.stats.MEN}</Text>
            <Text style={styles.statLabel}>MEN</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userRating.stats.PHY}</Text>
            <Text style={styles.statLabel}>PHY</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.totalPoints}>{userRating.totalPoints.toLocaleString()} PTS</Text>
          <Text style={styles.tapHint}>Tap to view full card</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  background: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    padding: 20,
  },
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  footer: {
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    height: 150,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
  },
  overallRating: {
    alignItems: 'center',
    marginBottom: 15,
  },
  overallRatingLabel: {
    color: '#ccc',
    fontSize: 14,
    marginTop: -5,
  },
  overallRatingNumber: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#ccc',
    fontSize: 10,
    marginTop: 2,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  tapHint: {
    color: '#888',
    fontSize: 12,
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tierText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalPoints: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});
