import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../config/theme';
import { focusSessionService } from '../../services/FocusSessionService';
import { journalStorage } from '../../services/journalStorage';
import { PointsHistoryService } from '../../services/PointsHistoryService';

type HistoryTab = 'journaling' | 'goals' | 'todo' | 'habits' | 'focus' | 'points';
type DateFilter = 'all' | 'today' | 'thisWeek' | 'thisMonth';

interface HistoryItem {
  id: string;
  date: string;
  time: string;
  title: string;
  description?: string;
  value?: number;
  type: string;
}

const historyTabs = [
  { id: 'journaling' as HistoryTab, title: 'Journaling', icon: 'book' },
  { id: 'goals' as HistoryTab, title: 'Goals', icon: 'flag' },
  { id: 'todo' as HistoryTab, title: 'To-Do', icon: 'check-circle' },
  { id: 'habits' as HistoryTab, title: 'Habits', icon: 'repeat' },
  { id: 'focus' as HistoryTab, title: 'Focus', icon: 'psychology' },
  { id: 'points' as HistoryTab, title: 'Points', icon: 'star' },
];

export const HistoryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HistoryTab>('journaling');
  const [historyData, setHistoryData] = useState<Record<HistoryTab, HistoryItem[]>>({
    journaling: [],
    goals: [],
    todo: [],
    habits: [],
    focus: [],
    points: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  useEffect(() => {
    loadHistoryData();
  }, []);

  // Reload when screen comes into focus (e.g., after creating a journal entry)
  useFocusEffect(
    React.useCallback(() => {
      loadHistoryData();
    }, [])
  );

  const loadHistoryData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);

      // Load real journal entries with full content
      const journalEntries = await journalStorage.getAllEntries();
      const journalingItems: HistoryItem[] = journalEntries.map(entry => {
        const date = new Date(entry.date);
        const dateStr = date.getFullYear() + '-' + 
          String(date.getMonth() + 1).padStart(2, '0') + '-' + 
          String(date.getDate()).padStart(2, '0');
        return {
          id: entry.id,
          date: dateStr,
          time: date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          title: 'Journal Entry',
          description: entry.content, // Show actual journal content
          type: 'journal_entry',
        };
      });

      // Load completed goals data from AsyncStorage
      const completedGoalsData = await AsyncStorage.getItem('@inzone_completed_goals');
      const goalItems: HistoryItem[] = [];
      if (completedGoalsData) {
        const completedGoals = JSON.parse(completedGoalsData);
        completedGoals.forEach((goal: any) => {
          const completedDate = new Date(goal.completedAt);
          const completedDateStr = completedDate.getFullYear() + '-' + 
            String(completedDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(completedDate.getDate()).padStart(2, '0');
          goalItems.push({
            id: goal.id,
            date: completedDateStr,
            time: completedDate.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }),
            title: goal.title,
            description: 'Goal completed',
            type: 'goal_completed',
          });
        });
      }

      // Load completed habits data from AsyncStorage
      const completedHabitsData = await AsyncStorage.getItem('@inzone_completed_habits');
      const habitItems: HistoryItem[] = [];
      if (completedHabitsData) {
        const completedHabits = JSON.parse(completedHabitsData);
        completedHabits.forEach((habit: any) => {
          const completedDate = new Date(habit.completedAt);
          const completedDateStr = completedDate.getFullYear() + '-' + 
            String(completedDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(completedDate.getDate()).padStart(2, '0');
          
          habitItems.push({
            id: habit.id,
            date: completedDateStr,
            time: completedDate.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }),
            title: habit.title,
            description: `Final streak: ${habit.finalStreak} days (Target: ${habit.targetDays})`,
            type: 'habit_completed',
          });
        });
      }

      // Load completed todos data from AsyncStorage
      const completedTodosData = await AsyncStorage.getItem('@inzone_completed_todos');
      const todoItems: HistoryItem[] = [];
      if (completedTodosData) {
        const completedTodos = JSON.parse(completedTodosData);
        completedTodos.forEach((todo: any) => {
          const completedDate = new Date(todo.completedAt);
          const completedDateStr = completedDate.getFullYear() + '-' + 
            String(completedDate.getMonth() + 1).padStart(2, '0') + '-' + 
            String(completedDate.getDate()).padStart(2, '0');
          
          todoItems.push({
            id: todo.id,
            date: completedDateStr,
            time: completedDate.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }),
            title: todo.title,
            description: 'Todo completed',
            type: 'todo_completed',
          });
        });
      }

      // Load focus session data
      const focusSessions = await focusSessionService.getFocusSessions(50);
      const focusItems: HistoryItem[] = focusSessions.map(session => {
        const date = new Date(session.startTime);
        const dateStr = date.getFullYear() + '-' + 
          String(date.getMonth() + 1).padStart(2, '0') + '-' + 
          String(date.getDate()).padStart(2, '0');
        return {
          id: session.id,
          date: dateStr,
          time: new Date(session.startTime).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          title: `${session.mode.title} Session`,
          description: session.completed ? 
            `Completed ${Math.round(session.duration / 60)} minutes` : 
            `Session interrupted after ${Math.round(session.duration / 60)} minutes`,
          value: session.pointsEarned,
          type: session.completed ? 'focus_completed' : 'focus_interrupted',
        };
      });

      // Load points history using PointsHistoryService
      const pointsHistory = await PointsHistoryService.getPointsHistory(50);
      const pointsItems: HistoryItem[] = pointsHistory.map(entry => {
        const date = new Date(entry.timestamp);
        const dateStr = date.getFullYear() + '-' + 
          String(date.getMonth() + 1).padStart(2, '0') + '-' + 
          String(date.getDate()).padStart(2, '0');
        return {
          id: entry.id,
          date: dateStr,
          time: date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          title: entry.description,
          description: `${entry.points > 0 ? '+' : ''}${entry.points} points (${entry.category})`,
          value: entry.points,
          type: 'points_earned',
        };
      });

      setHistoryData({
        journaling: journalingItems,
        goals: goalItems,
        todo: todoItems,
        habits: habitItems,
        focus: focusItems,
        points: pointsItems,
      });

    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      if (!isRefresh) setLoading(false);
      else setRefreshing(false);
    }
  };

  const getFilteredData = (data: HistoryItem[]) => {
    if (dateFilter === 'all') return data;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return data.filter(item => {
      const itemDate = new Date(item.date);

      switch (dateFilter) {
        case 'today':
          return itemDate >= today;
        case 'thisWeek':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
          return itemDate >= weekStart;
        case 'thisMonth':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          return itemDate >= monthStart;
        default:
          return true;
      }
    });
  };

  const currentData = getFilteredData(historyData[activeTab] || []);

  const renderTabButton = (tab: typeof historyTabs[0]) => (
    <TouchableOpacity
      key={tab.id}
      style={[styles.tabButton, activeTab === tab.id && styles.activeTabButton]}
      onPress={() => setActiveTab(tab.id)}
    >
      <Icon
        name={tab.icon}
        size={20}
        color={activeTab === tab.id ? theme.colors.white : theme.colors.text.secondary}
        style={styles.tabIcon}
      />
      <Text style={[
        styles.tabText,
        activeTab === tab.id && styles.activeTabText
      ]}>
        {tab.title}
      </Text>
    </TouchableOpacity>
  );

  const getHistoryItemIcon = (type: string) => {
    switch (type) {
      case 'journal_entry': return 'book';
      case 'goal_completed': return 'flag';
      case 'goal_created': return 'add-circle';
      case 'todo_completed': return 'check-circle';
      case 'todo_created': return 'add-task';
      case 'habit_completed': return 'repeat';
      case 'focus_session': return 'psychology';
      case 'points_earned': return 'star';
      default: return 'circle';
    }
  };

  const getHistoryItemColor = (type: string) => {
    switch (type) {
      case 'journal_entry': return theme.colors.menu.journaling;
      case 'goal_completed': return theme.colors.success;
      case 'goal_created': return theme.colors.primary;
      case 'todo_completed': return theme.colors.success;
      case 'todo_created': return theme.colors.warning;
      case 'habit_completed': return theme.colors.menu.habit;
      case 'focus_session': return theme.colors.menu.focus;
      case 'points_earned': return theme.colors.warning;
      default: return theme.colors.text.secondary;
    }
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      onLongPress={() => {
        // Toggle selection on long press
        setSelectedIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
      }}
      onPress={() => {
        // If we have active selection, tap toggles selection
        if (selectedIds.length > 0) {
          setSelectedIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
        }
      }}
      style={[styles.historyItem, selectedIds.includes(item.id) && styles.historyItemSelected]}
    >
      <View style={[styles.historyItemIcon, { backgroundColor: getHistoryItemColor(item.type) }]}>
        <Icon
          name={getHistoryItemIcon(item.type)}
          size={20}
          color="#FFFFFF"
        />
      </View>
      <View style={styles.historyItemContent}>
        <View style={styles.historyItemHeader}>
          <Text style={styles.historyItemTitle}>{item.title}</Text>
          <Text style={styles.historyItemTime}>{item.time}</Text>
        </View>
        <Text style={styles.historyItemDate}>{item.date}</Text>
        {item.description && (
          <Text style={styles.historyItemDescription}>{item.description}</Text>
        )}
        {item.value && (
          <Text style={styles.historyItemValue}>
            {activeTab === 'focus' ? `${item.value} minutes` : `+${item.value} points`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        {selectedIds.length > 0 ? (
          <TouchableOpacity style={styles.filterButton} onPress={async () => {
            // Delete selected entries
            try {
              const journals = historyData.journaling;
              const habits = historyData.habits;
              const goals = historyData.goals;
              const todos = historyData.todo;
              
              // Delete journal entries
              const journalIds = selectedIds.filter(id => journals.some(j => j.id === id));
              for (const id of journalIds) {
                await journalStorage.deleteEntry(id);
              }
              
              // Delete habits (from completed habits storage)
              const habitIds = selectedIds.filter(id => habits.some(h => h.id === id));
              if (habitIds.length > 0) {
                const completedHabitsData = await AsyncStorage.getItem('@inzone_completed_habits');
                if (completedHabitsData) {
                  let completedHabits = JSON.parse(completedHabitsData);
                  completedHabits = completedHabits.filter((habit: any) => !habitIds.includes(habit.id));
                  await AsyncStorage.setItem('@inzone_completed_habits', JSON.stringify(completedHabits));
                }
              }
              
              // Delete goals (from completed goals storage)
              const goalIds = selectedIds.filter(id => goals.some(g => g.id === id));
              if (goalIds.length > 0) {
                const completedGoalsData = await AsyncStorage.getItem('@inzone_completed_goals');
                if (completedGoalsData) {
                  let completedGoals = JSON.parse(completedGoalsData);
                  completedGoals = completedGoals.filter((goal: any) => !goalIds.includes(goal.id));
                  await AsyncStorage.setItem('@inzone_completed_goals', JSON.stringify(completedGoals));
                }
              }
              
              // Delete todos (from completed todos storage)
              const todoIds = selectedIds.filter(id => todos.some(t => t.id === id));
              if (todoIds.length > 0) {
                const completedTodosData = await AsyncStorage.getItem('@inzone_completed_todos');
                if (completedTodosData) {
                  let completedTodos = JSON.parse(completedTodosData);
                  completedTodos = completedTodos.filter((todo: any) => !todoIds.includes(todo.id));
                  await AsyncStorage.setItem('@inzone_completed_todos', JSON.stringify(completedTodos));
                }
              }
              
              // Refresh local data
              await loadHistoryData();
              setSelectedIds([]);
            } catch (e) {
              console.error('Error deleting entries', e);
            }
          }}>
            <Icon name="delete" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.filterButtonText}>Delete ({selectedIds.length})</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.filterButton, dateFilter !== 'all' && styles.activeFilterButton]}
            onPress={() => {
              const filters: DateFilter[] = ['all', 'today', 'thisWeek', 'thisMonth'];
              const currentIndex = filters.indexOf(dateFilter);
              const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % filters.length : 0;
              setDateFilter(filters[nextIndex]!);
            }}
          >
            <Icon name="date-range" size={20} color={dateFilter !== 'all' ? theme.colors.primary : theme.colors.text.secondary} />
            <Text style={[styles.filterButtonText, dateFilter !== 'all' && styles.activeFilterText]}>
              {dateFilter === 'all' ? 'All Time' : 
               dateFilter === 'today' ? 'Today' : 
               dateFilter === 'thisWeek' ? 'This Week' : 'This Month'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {historyTabs.map(renderTabButton)}
      </ScrollView>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : currentData.length > 0 ? (
          <FlatList
            data={currentData}
            keyExtractor={(item) => item.id}
            renderItem={renderHistoryItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadHistoryData(true)}
              />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Icon name="history" size={64} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyStateTitle}>No entries yet</Text>
            <Text style={styles.emptyStateDescription}>
              Your {historyTabs.find(t => t.id === activeTab)?.title.toLowerCase()} activities will appear here
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  activeFilterButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  activeFilterText: {
    color: theme.colors.text.primary,
  },
  activeTabButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  activeTabText: {
    color: theme.colors.text.primary,
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateDescription: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyStateTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'center',
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  historyItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemDate: {
    color: theme.colors.text.tertiary,
    fontSize: 12,
    marginBottom: 6,
  },
  historyItemDescription: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  historyItemHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyItemIcon: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  historyItemSelected: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  historyItemTime: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  historyItemTitle: {
    color: theme.colors.text.primary,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  historyItemValue: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 120,
    paddingVertical: 16, // Space for bottom navigation
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
  },
  tabButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    minWidth: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  tabsContainer: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    maxHeight: 80,
  },
  tabsContent: {
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});