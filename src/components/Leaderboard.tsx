import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RatingSystem, CardTier } from '../services/ratingSystem';
import LeaderboardService, { LeaderboardEntry } from '../services/LeaderboardService';
import { theme } from '../config/theme';

type LeaderboardType = 'lifetime' | 'monthly';

export const Leaderboard: React.FC = () => {
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
      // Load global leaderboard from LeaderboardService
      const globalData = await LeaderboardService.getGlobalLeaderboard(50);
      
      // For lifetime leaderboard, use totalPoints
      const lifetimeWithRanks = globalData.map((entry, index) => ({ 
        ...entry, 
        rank: index + 1 
      }));
      setLifetimeLeaderboard(lifetimeWithRanks);

      // For monthly leaderboard, use monthlyPoints and re-sort
      const monthlyWithRanks = [...globalData]
        .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
        .map((entry, index) => ({ 
          ...entry, 
          rank: index + 1 
        }));
      
  console.log('Monthly leaderboard data:', monthlyWithRanks.length, 'entries');
  console.log('Sample monthly data:', monthlyWithRanks.slice(0, 3));
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

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry, isLifetime: boolean) => {
    const tierColors = RatingSystem.getCardTierColors(entry.cardTier as CardTier);
    const points = isLifetime ? entry.totalPoints : entry.monthlyPoints;

    return (
      <View key={`${entry.id}-${isLifetime ? 'lifetime' : 'monthly'}`} style={styles.entryContainer}>
        <LinearGradient
          colors={[tierColors.primary, tierColors.secondary]}
          style={styles.entryBackground}
        >
          <View style={styles.rankContainer}>
            <Text style={styles.rankText}>{getRankIcon(entry.rank!)}</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.username}>{entry.username}</Text>
            <View style={styles.tierBadge}>
              <Text style={[styles.tierText, { color: tierColors.accent }]}>
                {entry.cardTier}
              </Text>
            </View>
          </View>

          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>{points?.toLocaleString() || 0}</Text>
            <Text style={styles.pointsLabel}>pts</Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const getMonthName = (monthString: string): string => {
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getPreviousMonth = (): string => {
    const date = new Date(selectedMonth + '-01');
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
  };

  const getNextMonth = (): string => {
    const date = new Date(selectedMonth + '-01');
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 7);
  };

  const isCurrentMonth = (): boolean => {
    return selectedMonth === new Date().toISOString().slice(0, 7);
  };

  const isFutureMonth = (): boolean => {
    return selectedMonth > new Date().toISOString().slice(0, 7);
  };

  return (
    <View style={styles.container}>
      {/* Tab Header */}
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
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month Navigator (only for monthly tab) */}
      {activeTab === 'monthly' && (
        <View style={styles.monthNavigator}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => setSelectedMonth(getPreviousMonth())}
          >
            <Text style={styles.monthButtonText}>‹</Text>
          </TouchableOpacity>
          
          <View style={styles.monthDisplay}>
            <Text style={styles.monthText}>{getMonthName(selectedMonth)}</Text>
            {isCurrentMonth() && <Text style={styles.currentMonthIndicator}>CURRENT</Text>}
          </View>
          
          <TouchableOpacity
            style={[styles.monthButton, isFutureMonth() && styles.disabledButton]}
            onPress={() => !isFutureMonth() && setSelectedMonth(getNextMonth())}
            disabled={isFutureMonth()}
          >
            <Text style={[styles.monthButtonText, isFutureMonth() && styles.disabledText]}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Leaderboard Content */}
      <ScrollView
        style={styles.leaderboardContainer}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activeTab === 'monthly' ? 'Monthly Rankings' : 'All-Time Champions'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'monthly' 
              ? `Rule this month's zone` 
              : 'The greatest ones in the zone'
            }
          </Text>
        </View>

        <View style={styles.entriesContainer}>
          {activeTab === 'monthly' ? (
            monthlyLeaderboard.length > 0 ? (
              monthlyLeaderboard.map(entry => renderLeaderboardEntry(entry, false))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubtext}>Pull to refresh to load leaderboard data</Text>
              </View>
            )
          ) : (
            lifetimeLeaderboard.length > 0 ? (
              lifetimeLeaderboard.map(entry => renderLeaderboardEntry(entry, true))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No champions yet</Text>
                <Text style={styles.emptySubtext}>Be the first to make history!</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  activeTab: {
    backgroundColor: theme.colors.primary, // Midnight purple
    borderColor: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.text.primary,
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  currentMonthIndicator: {
    color: theme.colors.accent,
    fontSize: 10,
    marginTop: 2,
  },
  disabledButton: {
    opacity: 0.3,
  },
  disabledText: {
    color: theme.colors.text.tertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySubtext: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.text.tertiary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  entriesContainer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  entryBackground: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 16,
  },
  entryContainer: {
    marginBottom: 12,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  leaderboardContainer: {
    flex: 1,
  },
  monthButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  monthButtonText: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  monthDisplay: {
    alignItems: 'center',
  },
  monthNavigator: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  monthText: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  pointsText: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  rankContainer: {
    alignItems: 'center',
    width: 50,
  },
  rankText: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  tab: {
    alignItems: 'center',
    borderColor: theme.colors.text.secondary,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  tabContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    flexDirection: 'row',
    margin: 20,
    marginBottom: 10,
    padding: 4,
  },
  tabText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  tierBadge: {
    alignSelf: 'flex-start',
  },
  tierText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  username: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});
