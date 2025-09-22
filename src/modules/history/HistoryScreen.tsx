import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../config/theme';
import { focusSessionService } from '../../services/FocusSessionService';
import { UserStatsService } from '../../services/userStatsService';
import { journalStorage } from '../../services/journalStorage';

type HistoryTab = 'journaling' | 'goals' | 'todo' | 'habits' | 'focus' | 'points';

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

  useEffect(() => {
    loadHistoryData();
  }, []);

  // Reload when screen comes into focus (e.g., after creating a journal entry)
  useFocusEffect(
    React.useCallback(() => {
      loadHistoryData();
    }, [])
  );

  const loadHistoryData = async () => {
    try {
      setLoading(true);

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

      // Load goal completion data
      const goalLogs = await focusSessionService.getGoalCompletionLogs(50);
      const goalItems: HistoryItem[] = goalLogs.map(log => {
        const date = new Date(log.timestamp);
        const dateStr = date.getFullYear() + '-' + 
          String(date.getMonth() + 1).padStart(2, '0') + '-' + 
          String(date.getDate()).padStart(2, '0');
        return {
          id: log.id.toString(),
          date: dateStr,
          time: new Date(log.timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          title: log.goalTitle,
          description: 'Goal completed',
          value: log.pointsEarned,
          type: 'goal_completed',
        };
      });

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

      // Load combined stats logs for points and other activities
      const statsLogs = await focusSessionService.getCombinedKigenStatsLogs(50);
      const pointsItems: HistoryItem[] = statsLogs.map(log => ({
        id: log.id,
        date: log.date,
        time: '12:00', // Default time since logs don't have specific time
        title: log.action,
        description: log.action,
        value: parseInt(log.points.replace('+', '')) || 0,
        type: 'points_earned',
      }));

      // For now, keep habits and todo as empty (they would need separate storage systems)
      const habitItems: HistoryItem[] = [];
      const todoItems: HistoryItem[] = [];

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
      setLoading(false);
    }
  };
  const [selectedDateRange, setSelectedDateRange] = useState('week');

  const currentData = historyData[activeTab] || [];

  const renderTabButton = (tab: typeof historyTabs[0]) => (
    <TouchableOpacity
      key={tab.id}
      style={[styles.tabButton, activeTab === tab.id && styles.activeTabButton]}
      onPress={() => setActiveTab(tab.id)}
    >
      <Icon
        name={tab.icon}
        size={20}
        color={activeTab === tab.id ? '#FFFFFF' : theme.colors.text.secondary}
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
      case 'journal_entry': return '#4ECDC4';
      case 'goal_completed': return theme.colors.success;
      case 'goal_created': return theme.colors.primary;
      case 'todo_completed': return theme.colors.success;
      case 'todo_created': return theme.colors.warning;
      case 'habit_completed': return '#96CEB4';
      case 'focus_session': return '#45B7D1';
      case 'points_earned': return '#FFD93D';
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
            // Delete selected entries (for now handle journal entries via journalStorage)
            try {
              const journals = historyData.journaling;
              const toDelete = selectedIds.filter(id => journals.some(j => j.id === id));
              for (const id of toDelete) {
                await journalStorage.deleteEntry(id);
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
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="date-range" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.filterButtonText}>This Week</Text>
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  filterButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  tabsContainer: {
    maxHeight: 80,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 100,
  },
  activeTabButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 120, // Space for bottom navigation
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyItemSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  historyItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  historyItemTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  historyItemDate: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginBottom: 6,
  },
  historyItemDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  historyItemValue: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
  },
});