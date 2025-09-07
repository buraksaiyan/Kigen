import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { UserStatsService } from '../services/userStatsService';
import { RatingSystem, CardTier } from '../services/ratingSystem';
import { theme } from '../config/theme';
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';

const { width } = Dimensions.get('window');

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
    switch (tier) {
      case 'Bronze': return { primary: '#CD7F32', secondary: '#A0522D' };
      case 'Silver': return { primary: '#C0C0C0', secondary: '#A9A9A9' };
      case 'Gold': return { primary: '#FFD700', secondary: '#FFA500' };
      case 'Platinum': return { primary: '#E5E4E2', secondary: '#BCC6CC' };
      case 'Diamond': return { primary: '#B9F2FF', secondary: '#4A90E2' };
      case 'Carbon': return { primary: '#36454F', secondary: '#2F4F4F' };
      case 'Obsidian': return { primary: '#0F0F23', secondary: '#800080' };
      default: return { primary: '#CD7F32', secondary: '#A0522D' };
    }
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
            <Text style={styles.monthText}>{formatMonthYear(selectedMonth)}</Text>
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  monthSelector: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  monthText: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  medalEmoji: {
    fontSize: 24,
  },
  rankNumber: {
    ...theme.typography.h4,
    color: '#FFFFFF',
    fontWeight: '700',
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
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  tierText: {
    ...theme.typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    ...theme.typography.h4,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pointsLabel: {
    ...theme.typography.small,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
});
