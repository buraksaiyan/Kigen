import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserStatsService } from '../services/userStatsService';
import { RatingSystem, CardTier } from '../services/ratingSystem';
import LeaderboardService, { LeaderboardEntry } from '../services/LeaderboardService';

const { width } = Dimensions.get('window');

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
      
      console.log('📊 Monthly leaderboard data:', monthlyWithRanks.length, 'entries');
      console.log('📊 Sample monthly data:', monthlyWithRanks.slice(0, 3));
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
          colors={['#8b5cf6', '#7c3aed']}
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
              ? `Compete for this month's crown` 
              : 'The greatest Kigen warriors of all time'
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    margin: 20,
    marginBottom: 10,
    borderRadius: 15,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#888691',
  },
  activeTab: {
    backgroundColor: '#2E1A47', // Midnight purple
    borderColor: '#888691',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  activeTabText: {
    color: '#fff',
  },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.3,
  },
  monthButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#666',
  },
  monthDisplay: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  currentMonthIndicator: {
    fontSize: 10,
    color: '#8b5cf6',
    marginTop: 2,
  },
  leaderboardContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  entriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  entryContainer: {
    marginBottom: 12,
  },
  entryBackground: {
    borderRadius: 15,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  tierBadge: {
    alignSelf: 'flex-start',
  },
  tierText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#888',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
