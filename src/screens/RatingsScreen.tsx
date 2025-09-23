import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { UserCard } from '../components/UserCard';
import { Leaderboard } from '../components/Leaderboard';
import { UserStatsService } from '../services/userStatsService';
import { UserRating } from '../services/ratingSystem';
import { theme } from '../config/theme';

type ViewMode = 'card' | 'leaderboard';
type CardMode = 'monthly' | 'lifetime';

export const RatingsScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [cardMode, setCardMode] = useState<CardMode>('monthly');
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Check if user profile exists, if not create one
      let profile = await UserStatsService.getUserProfile();
      if (!profile) {
        profile = await createUserProfile();
      }
      
      const rating = await UserStatsService.getCurrentRating();
      
      setUserProfile(profile);
      setUserRating(rating);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const createUserProfile = async () => {
    return new Promise<any>((resolve) => {
      Alert.prompt(
        'Welcome to Kigen!',
        'Enter your username to create your fighter card:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null)
          },
          {
            text: 'Create',
            onPress: async (username?: string) => {
              if (username && username.trim()) {
                try {
                  const profile = await UserStatsService.createUserProfile(username.trim());
                  resolve(profile);
                } catch {
                  Alert.alert('Error', 'Failed to create profile');
                  resolve(null);
                }
              } else {
                Alert.alert('Invalid Username', 'Please enter a valid username');
                resolve(null);
              }
            }
          }
        ],
        'plain-text',
        '',
        'default'
      );
    });
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadUserData();
    setIsRefreshing(false);
  };

  const handleImageUpdate = async (imageUri: string) => {
    try {
      await UserStatsService.updateUserProfile({ profileImage: imageUri });
      setUserProfile({ ...userProfile, profileImage: imageUri });
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', 'Failed to update profile image');
    }
  };

  const getLifetimeRating = (): UserRating | null => {
    if (!userRating) return null;
    
    // For lifetime card, we use the same stats but with total points
    return {
      ...userRating,
      monthlyPoints: userRating.totalPoints // Use total points for lifetime card
    };
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading stats...</Text>
      </View>
    );
  }

  if (!userProfile || !userRating) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fighter Status</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, viewMode === 'card' && styles.activeHeaderButton]}
            onPress={() => setViewMode('card')}
          >
            <Text style={[styles.headerButtonText, viewMode === 'card' && styles.activeHeaderButtonText]}>
              Card
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, viewMode === 'leaderboard' && styles.activeHeaderButton]}
            onPress={() => setViewMode('leaderboard')}
          >
            <Text style={[styles.headerButtonText, viewMode === 'leaderboard' && styles.activeHeaderButtonText]}>
              Rankings
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'card' ? (
          <View>
            {/* Card Mode Toggle */}
            <View style={styles.cardModeToggle}>
              <TouchableOpacity
                style={[styles.cardModeButton, cardMode === 'monthly' && styles.activeCardMode]}
                onPress={() => setCardMode('monthly')}
              >
                <Text style={[styles.cardModeText, cardMode === 'monthly' && styles.activeCardModeText]}>
                  Monthly Card
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardModeButton, cardMode === 'lifetime' && styles.activeCardMode]}
                onPress={() => setCardMode('lifetime')}
              >
                <Text style={[styles.cardModeText, cardMode === 'lifetime' && styles.activeCardModeText]}>
                  Lifetime Card
                </Text>
              </TouchableOpacity>
            </View>

            {/* User Card */}
            <UserCard
              userRating={cardMode === 'monthly' ? userRating : (getLifetimeRating() || userRating)}
              username={userProfile.username}
              profileImage={userProfile.profileImage}
              isMonthlyCard={cardMode === 'monthly'}
              onImageUpdate={handleImageUpdate}
            />

            {/* Stats Explanation */}
            <View style={styles.statsExplanation}>
              <Text style={styles.explanationTitle}>How Points Work</Text>
              <View style={styles.explanationSection}>
                <Text style={styles.explanationHeader}>DISCIPLINE (DIS)</Text>
                <Text style={styles.explanationText}>
                  • +5 pts per completed focus session{'\n'}
                  • +10 pts per goal completed{'\n'}
                  • +5 pts per journal entry (daily cap){'\n'}
                  • +10 pts per execution/body focus hour{'\n'}
                  • -5 pts per aborted session{'\n'}
                  • -1 pt per 10min social media usage
                </Text>
              </View>
              
              <View style={styles.explanationSection}>
                <Text style={styles.explanationHeader}>FOCUS (FOC)</Text>
                <Text style={styles.explanationText}>
                  • +10 pts per focused hour{'\n'}
                  • +10 pts additional per flow focus hour
                </Text>
              </View>

              <View style={styles.explanationSection}>
                <Text style={styles.explanationHeader}>JOURNALING (JOU)</Text>
                <Text style={styles.explanationText}>
                  • +20 pts per entry (once per day cap)
                </Text>
              </View>

              <View style={styles.explanationSection}>
                <Text style={styles.explanationHeader}>DETERMINATION (DET)</Text>
                <Text style={styles.explanationText}>
                    • +20 pts per 10 goals completed{'\n'}
                    • +15 pts per 10 journal entries{'\n'}
                    • +50 pts per 10 focus session completions{'\n'}
                    • +5 pts per achievement unlocked{'\n'}
                    • +50 pts per completed 7-day habit streak{'\n'}
                    • +5 pts per completed To-Do bullet
                </Text>
              </View>

              <View style={styles.explanationSection}>
                <Text style={styles.explanationHeader}>MENTALITY (MEN)</Text>
                <Text style={styles.explanationText}>
                  • +2 pts per minute meditated
                </Text>
              </View>

              <View style={styles.explanationSection}>
                <Text style={styles.explanationHeader}>PHYSICAL (PHY)</Text>
                <Text style={styles.explanationText}>
                  • +20 pts per 30 minutes of body focus
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Leaderboard />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  activeCardMode: {
    backgroundColor: '#8b5cf6',
  },
  activeCardModeText: {
    color: theme.colors.text.primary,
  },
  activeHeaderButton: {
    backgroundColor: '#8b5cf6',
  },
  activeHeaderButtonText: {
    color: theme.colors.text.primary,
  },
  cardModeButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12,
  },
  cardModeText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  cardModeToggle: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    flexDirection: 'row',
    marginBottom: 10,
    marginHorizontal: 20,
    padding: 4,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#000',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 20,
  },
  explanationHeader: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  explanationSection: {
    marginBottom: 15,
  },
  explanationText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 16,
  },
  explanationTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  headerButtons: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 2,
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  statsExplanation: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    marginBottom: 40,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
  },
});
