import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import LeaderboardService from '../services/LeaderboardService';
import { RatingSystem, CardTier } from '../services/ratingSystem';
import { theme } from '../config/theme';

// width not needed currently

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints?: number;
  monthlyPoints?: number;
  cardTier: CardTier;
  rank: number;
}

type LeaderboardType = 'lifetime' | 'monthly';

interface LeaderboardScreenProps {
  onNavigateBack?: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onNavigateBack: _onNavigateBack }) => {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('monthly');
  const [lifetimeLeaderboard, setLifetimeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadLeaderboards();
  }, [selectedMonth]);

  const loadLeaderboards = async () => {
    try {
      // Check Supabase connectivity
      const isSupabaseAvailable = await LeaderboardService.isSupabaseAvailable();
      setIsOnline(isSupabaseAvailable);

      // Load global leaderboard from LeaderboardService
      const globalData = await LeaderboardService.getGlobalLeaderboard();
      
      // Transform to the expected format
      const lifetimeWithRanks = globalData
        .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
        .map((entry, index) => ({
          userId: entry.id,
          username: entry.username,
          totalPoints: entry.totalPoints,
          monthlyPoints: entry.monthlyPoints,
          cardTier: entry.cardTier as CardTier,
          rank: index + 1
        }));
      setLifetimeLeaderboard(lifetimeWithRanks);

      // For monthly, filter by current month (this is a simplified approach)
      // In a real implementation, you'd want monthly-specific data
      const monthlyWithRanks = globalData
        .sort((a, b) => (b.monthlyPoints || 0) - (a.monthlyPoints || 0))
        .map((entry, index) => ({
          userId: entry.id,
          username: entry.username,
          totalPoints: entry.totalPoints,
          monthlyPoints: entry.monthlyPoints,
          cardTier: entry.cardTier as CardTier,
          rank: index + 1
        }));
      setMonthlyLeaderboard(monthlyWithRanks);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadLeaderboards();
    setIsRefreshing(false);
  };

  const getTierColors = (tier: CardTier): { primary: string; secondary: string } => {
    const ratingSystemColors = RatingSystem.getCardTierColors(tier);
    return { 
      primary: ratingSystemColors.primary, 
      secondary: ratingSystemColors.secondary 
    };
  };

  const formatMonthYear = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getMinMonth = () => {
    // Allow going back to January 2024 (or whenever the app started)
    return '2024-01';
  };

  const currentLeaderboard = activeTab === 'monthly' ? monthlyLeaderboard : lifetimeLeaderboard;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <SafeAreaView style={styles.container}>
        
        {/* Top Bar with Monthly and All-Time buttons */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.topBarButton, activeTab === 'monthly' && styles.activeTopBarButton]}
            onPress={() => setActiveTab('monthly')}
          >
            <Text style={[styles.topBarButtonText, activeTab === 'monthly' && styles.activeTopBarButtonText]}>
              Monthly
            </Text>
          </TouchableOpacity>

          <View style={styles.topBarDivider} />

          <TouchableOpacity
            style={[styles.topBarButton, activeTab === 'lifetime' && styles.activeTopBarButton]}
            onPress={() => setActiveTab('lifetime')}
          >
            <Text style={[styles.topBarButtonText, activeTab === 'lifetime' && styles.activeTopBarButtonText]}>
              All-Time
            </Text>
          </TouchableOpacity>
        </View>

        {/* Connection Status Indicator */}
        {!isOnline && (
          <View style={styles.connectionStatusBar}>
            <Text style={styles.connectionStatusText}>
              🔄 Using cached data - Connection unavailable
            </Text>
          </View>
        )}

        {/* Month selector for monthly view */}
        {activeTab === 'monthly' && (
          <View style={styles.monthSelectorContainer}>
            <TouchableOpacity
              style={[styles.monthNavButton, selectedMonth === getMinMonth() && styles.monthNavButtonDisabled]}
              onPress={() => {
                const currentDate = new Date(selectedMonth + '-01');
                currentDate.setMonth(currentDate.getMonth() - 1);
                const newMonth = currentDate.toISOString().slice(0, 7);
                if (newMonth >= getMinMonth()) {
                  setSelectedMonth(newMonth);
                }
              }}
              disabled={selectedMonth === getMinMonth()}
            >
              <Text style={[styles.monthNavButtonText, selectedMonth === getMinMonth() && styles.monthNavButtonTextDisabled]}>‹</Text>
            </TouchableOpacity>

            <View style={styles.monthDisplay}>
              <Text style={styles.monthDisplayText}>{formatMonthYear(selectedMonth)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.monthNavButton, selectedMonth >= new Date().toISOString().slice(0, 7) && styles.monthNavButtonDisabled]}
              onPress={() => {
                const currentDate = new Date(selectedMonth + '-01');
                currentDate.setMonth(currentDate.getMonth() + 1);
                const newMonth = currentDate.toISOString().slice(0, 7);
                // Don't allow selecting future months
                if (newMonth <= new Date().toISOString().slice(0, 7)) {
                  setSelectedMonth(newMonth);
                }
              }}
              disabled={selectedMonth >= new Date().toISOString().slice(0, 7)}
            >
              <Text style={[styles.monthNavButtonText, selectedMonth >= new Date().toISOString().slice(0, 7) && styles.monthNavButtonTextDisabled]}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          {currentLeaderboard.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No data available</Text>
            </View>
          ) : (
            currentLeaderboard.map((entry, _index) => {
              const tierColors = getTierColors(entry.cardTier);
              const points = activeTab === 'monthly' ? entry.monthlyPoints : entry.totalPoints;
              
              return (
                <LinearGradient
                  key={entry.userId}
                  colors={[tierColors.primary, tierColors.secondary]}
                  style={styles.leaderboardCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.rankContainer}>
                    {entry.rank <= 3 ? (
                      <Text style={styles.medalEmoji}>
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                      </Text>
                    ) : (
                      <Text style={styles.rankNumber}>#{entry.rank}</Text>
                    )}
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.username}>{entry.username}</Text>
                    <View style={styles.tierBadge}>
                      <Text style={styles.tierText}>{entry.cardTier}</Text>
                    </View>
                  </View>

                  <View style={styles.pointsContainer}>
                    <Text style={styles.pointsText}>{points?.toLocaleString() || 0}</Text>
                    <Text style={styles.pointsLabel}>PTS</Text>
                  </View>
                </LinearGradient>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  activeTab: {
    backgroundColor: theme.colors.primary,
    // Keep a visible outline regardless of theme primary color (e.g., midnight purple)
    borderColor: '#888691',
    borderWidth: 1,
  },
  activeTabText: {
    color: theme.colors.text.primary,
  },
  activeTopBarButton: {
    backgroundColor: theme.colors.primary,
  },
  activeTopBarButtonText: {
    color: theme.colors.text.primary,
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  leaderboardCard: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    elevation: 3,
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  medalEmoji: {
    fontSize: 24,
  },
  monthNavButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    width: 48,
  },
  monthNavButtonDisabled: {
    backgroundColor: theme.colors.surface,
    opacity: 0.5,
  },
  monthNavButtonText: {
    color: theme.colors.text.primary,
    fontSize: 24,
    fontWeight: '600',
  },
  monthNavButtonTextDisabled: {
    color: theme.colors.text.tertiary,
  },
  monthDisplay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  monthDisplayText: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  monthSelector: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  monthSelectorContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  monthText: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsLabel: {
    ...theme.typography.small,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  pointsText: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  rankContainer: {
    alignItems: 'center',
    width: 50,
  },
  rankNumber: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  tab: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: '#888691',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: theme.spacing.sm,
  },
  tabContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    padding: 4,
  },
  tabText: {
    ...theme.typography.bodyLarge,
    color: '#888691',
    fontWeight: '600',
  },
  tierBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tierText: {
    ...theme.typography.small,
    color: theme.colors.text.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  topBar: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
  },
  topBarButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: theme.spacing.md,
  },
  topBarButtonText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  topBarDivider: {
    backgroundColor: theme.colors.border,
    width: 1,
  },
  userInfo: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
  },
  username: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  connectionStatusBar: {
    backgroundColor: theme.colors.warning,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  connectionStatusText: {
    ...theme.typography.small,
    color: theme.colors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
