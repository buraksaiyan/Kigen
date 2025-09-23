import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { PointsHistoryService, PointHistoryEntry, DailyPointsSummary } from '../services/PointsHistoryService';
import { theme } from '../config/theme';

type FilterType = 'all' | 'journal' | 'goal_completed' | 'focus_session' | 'todo_completed' | 'social_interaction';
type TimeFilter = 'today' | 'week' | 'month' | 'all';

interface PointsHistoryScreenProps {
  visible?: boolean;
  onClose: () => void;
  navigation?: any;
}

export default function PointsHistoryScreen({ visible = true, onClose, navigation }: PointsHistoryScreenProps) {
  const [history, setHistory] = useState<PointHistoryEntry[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailyPointsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState({ current: 0, best: 0, lastDate: '' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date range for time filter
      const now = new Date();
      let startDate = '';
      
      switch (timeFilter) {
        case 'today':
          const todayDate = now.toISOString().split('T')[0];
          if (todayDate) startDate = todayDate;
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - 7);
          const weekDate = weekStart.toISOString().split('T')[0];
          if (weekDate) startDate = weekDate;
          break;
        case 'month':
          const monthStart = new Date(now);
          monthStart.setMonth(monthStart.getMonth() - 1);
          const monthDate = monthStart.toISOString().split('T')[0];
          if (monthDate) startDate = monthDate;
          break;
        case 'all':
          startDate = '';
          break;
      }
      
      // Load history with filters
      const historyData = await PointsHistoryService.getPointsHistory(
        100, // limit
        filterType === 'all' ? undefined : filterType,
        undefined, // category
        startDate || undefined,
        undefined // endDate
      );
      
      setHistory(historyData);
      
      // Load daily summaries
      const summaries = await PointsHistoryService.getRecentDailySummaries(7);
      setDailySummaries(summaries);
      
      // Calculate total points for current filter
      if (startDate) {
        const endDate = now.toISOString().split('T')[0];
        if (endDate) {
          const total = await PointsHistoryService.getTotalPointsForRange(startDate, endDate);
          setTotalPoints(total);
        }
      } else {
        const total = historyData.reduce((sum, entry) => sum + entry.points, 0);
        setTotalPoints(total);
      }
      
      // Load streak information
      const streakData = await PointsHistoryService.getPointsStreak();
      setStreak(streakData);
      
    } catch (error) {
      console.error('Error loading points history:', error);
      Alert.alert('Error', 'Failed to load points history');
    } finally {
      setLoading(false);
    }
  }, [filterType, timeFilter]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Points History</Text>
            <View style={styles.backButton} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading points history...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'journal': return 'book-outline';
      case 'goal_completed': return 'checkmark-circle-outline';
      case 'goal_created': return 'add-circle-outline';
      case 'focus_session': return 'time-outline';
      case 'todo_completed': return 'checkbox-outline';
      case 'todo_created': return 'create-outline';
      case 'reminder_completed': return 'notifications-outline';
      case 'social_interaction': return 'people-outline';
      case 'habit_streak': return 'flame-outline';
      case 'achievement_unlocked': return 'trophy-outline';
      case 'daily_bonus': return 'gift-outline';
      default: return 'star-outline';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'journal': return '#4CAF50';
      case 'goal_completed': return '#2196F3';
      case 'goal_created': return '#03DAC6';
      case 'focus_session': return '#FF9800';
      case 'todo_completed': return '#9C27B0';
      case 'todo_created': return '#7B1FA2';
      case 'reminder_completed': return '#F44336';
      case 'social_interaction': return '#E91E63';
      case 'habit_streak': return '#FF5722';
      case 'achievement_unlocked': return '#FFD700';
      case 'daily_bonus': return '#00BCD4';
      default: return theme.colors.primary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderHistoryEntry = (entry: PointHistoryEntry) => (
    <View key={entry.id} style={styles.historyEntry}>
      <View style={styles.entryLeft}>
        <View style={[styles.iconContainer, { backgroundColor: getSourceColor(entry.source) + '20' }]}>
          <Ionicons name={getSourceIcon(entry.source) as any} size={20} color={getSourceColor(entry.source)} />
        </View>
        <View style={styles.entryDetails}>
          <Text style={styles.entryDescription}>{entry.description}</Text>
          <Text style={styles.entryTime}>{formatDate(entry.timestamp)}</Text>
          {entry.metadata?.taskTitle && (
            <Text style={styles.entryMeta}>{entry.metadata.taskTitle}</Text>
          )}
          {entry.metadata?.sessionDuration && (
            <Text style={styles.entryMeta}>{entry.metadata.sessionDuration} minutes</Text>
          )}
        </View>
      </View>
      <View style={styles.entryRight}>
        <Text style={styles.pointsText}>+{entry.points}</Text>
        <Text style={[styles.categoryBadge, { backgroundColor: getCategoryColor(entry.category) }]}>
          {entry.category}
        </Text>
      </View>
    </View>
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'DIS': return '#2196F3';
      case 'FOC': return '#FF9800';
      case 'JOU': return '#4CAF50';
      case 'DET': return '#9C27B0';
      case 'MEN': return '#00BCD4';
      case 'PHY': return '#FF5722';
      case 'SOC': return '#E91E63';
      case 'PRD': return '#795548';
      default: return theme.colors.primary;
    }
  };

  const renderFilterButtons = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
        {[
          { key: 'all', label: 'All' },
          { key: 'journal', label: 'Journals' },
          { key: 'goal_completed', label: 'Goals' },
          { key: 'focus_session', label: 'Focus' },
          { key: 'todo_completed', label: 'Todos' },
          { key: 'social_interaction', label: 'Social' },
        ].map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              filterType === filter.key && styles.filterButtonActive
            ]}
            onPress={() => setFilterType(filter.key as FilterType)}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === filter.key && styles.filterButtonTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTimeFilters = () => (
    <View style={styles.timeFiltersContainer}>
      {[
        { key: 'today', label: 'Today' },
        { key: 'week', label: 'Week' },
        { key: 'month', label: 'Month' },
        { key: 'all', label: 'All Time' },
      ].map(filter => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.timeFilterButton,
            timeFilter === filter.key && styles.timeFilterButtonActive
          ]}
          onPress={() => setTimeFilter(filter.key as TimeFilter)}
        >
          <Text style={[
            styles.timeFilterButtonText,
            timeFilter === filter.key && styles.timeFilterButtonTextActive
          ]}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStatsHeader = () => (
    <View style={styles.statsHeader}>
      <View style={styles.statCard}>
        <MaterialIcons name="stars" size={24} color={theme.colors.primary} />
        <Text style={styles.statValue}>{totalPoints}</Text>
        <Text style={styles.statLabel}>Total Points</Text>
      </View>
      
      <View style={styles.statCard}>
        <MaterialIcons name="local-fire-department" size={24} color="#FF5722" />
        <Text style={styles.statValue}>{streak.current}</Text>
        <Text style={styles.statLabel}>Current Streak</Text>
      </View>
      
      <View style={styles.statCard}>
        <MaterialIcons name="timeline" size={24} color="#4CAF50" />
        <Text style={styles.statValue}>{streak.best}</Text>
        <Text style={styles.statLabel}>Best Streak</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Points History</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading points history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Points History</Text>
          <TouchableOpacity 
            onPress={loadData}
            style={styles.refreshButton}
          >
            <Ionicons name="refresh" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {renderStatsHeader()}
          {renderTimeFilters()}
          {renderFilterButtons()}

          <View style={styles.historyContainer}>
            <Text style={styles.sectionTitle}>
              Recent Activity ({history.length} {history.length === 1 ? 'entry' : 'entries'})
            </Text>
            
            {history.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="history" size={48} color={theme.colors.text.secondary} />
                <Text style={styles.emptyStateText}>No points history found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start completing activities to earn points!
                </Text>
              </View>
            ) : (
              history.map(renderHistoryEntry)
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  timeFiltersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  timeFilterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  timeFilterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  timeFilterButtonText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  timeFilterButtonTextActive: {
    color: '#FFFFFF',
  },
  filtersContainer: {
    paddingBottom: 16,
  },
  filtersScroll: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  historyEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entryDetails: {
    flex: 1,
  },
  entryDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  entryTime: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  entryMeta: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    overflow: 'hidden',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});