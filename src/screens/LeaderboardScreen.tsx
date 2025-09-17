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
import { UserStatsService } from '../services/userStatsService';
import { RatingSystem, CardTier } from '../services/ratingSystem';
import { theme } from '../config/theme';
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';

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

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onNavigateBack }) => {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('monthly');
  const [lifetimeLeaderboard, setLifetimeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadLeaderboards();
  }, [selectedMonth]);

  const loadLeaderboards = async () => {
    try {
      // Load lifetime leaderboard
      const lifetimeData = await UserStatsService.getLifetimeLeaderboard();
      const lifetimeWithRanks = lifetimeData
        .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
      setLifetimeLeaderboard(lifetimeWithRanks);

      // Load monthly leaderboard
      const monthlyData = await UserStatsService.getMonthlyLeaderboard(selectedMonth);
      const monthlyWithRanks = monthlyData
        .sort((a, b) => (b.monthlyPoints || 0) - (a.monthlyPoints || 0))
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
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

  const currentLeaderboard = activeTab === 'monthly' ? monthlyLeaderboard : lifetimeLeaderboard;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <SafeAreaView style={styles.container}>
        <KigenKanjiBackground />
        
        {/* Tab Selection - Monthly vs All-Time */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'monthly' && styles.activeTab]}
            onPress={() => setActiveTab('monthly')}
          >
            <Text style={[styles.tabText, activeTab === 'monthly' && styles.activeTabText]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'lifetime' && styles.activeTab]}
            onPress={() => setActiveTab('lifetime')}
          >
            <Text style={[styles.tabText, activeTab === 'lifetime' && styles.activeTabText]}>
              All-Time
            </Text>
          </TouchableOpacity>
        </View>

        {/* Month selector for monthly view */}
        {activeTab === 'monthly' && (
          <View style={styles.monthSelector}>
            <TouchableOpacity 
              style={styles.monthNavButtonInline}
              onPress={() => {
                const currentDate = new Date(selectedMonth + '-01');
                currentDate.setMonth(currentDate.getMonth() - 1);
                const newMonth = currentDate.toISOString().slice(0, 7);
                setSelectedMonth(newMonth);
              }}
            >
              <Text style={styles.monthNavText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthText}>{formatMonthYear(selectedMonth)}</Text>
            <TouchableOpacity 
              style={[styles.monthNavButtonInline, selectedMonth >= new Date().toISOString().slice(0, 7) && styles.monthNavButtonDisabled]}
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
              <Text style={[styles.monthNavText, selectedMonth >= new Date().toISOString().slice(0, 7) && styles.monthNavTextDisabled]}>›</Text>
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
            currentLeaderboard.map((entry, index) => {
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
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    marginHorizontal: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    width: 40,
  },
  monthNavButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.5,
  },
  monthNavButtonInline: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    marginHorizontal: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    width: 32,
  },
  monthNavText: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  monthNavTextDisabled: {
    color: theme.colors.text.tertiary,
  },
  monthSelector: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
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
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rankContainer: {
    alignItems: 'center',
    width: 50,
  },
  rankNumber: {
    ...theme.typography.h4,
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  userInfo: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
  },
  username: {
    ...theme.typography.bodyLarge,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
});
