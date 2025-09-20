import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { achievementService, Achievement } from '../services/achievementService';
import { focusSessionService } from '../services/FocusSessionService';

interface AchievementsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ visible, onClose }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Achievement['category']>('focus_hours');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHours: 0,
    totalMinutes: 0,
    maxStreak: 0,
    currentStreak: 0,
    bodyFocusSessions: 0,
    meditationSessions: 0,
    journalEntries: 0,
    totalCompletedGoals: 0,
  });

  useEffect(() => {
    if (visible) {
      loadAchievements();
      loadStats();
    }
  }, [visible, selectedCategory]); // Reload when category changes too

  const loadAchievements = async () => {
    try {
      setLoading(true);
      await achievementService.checkAchievements(); // Update achievements first
      const allAchievements = await achievementService.getAchievements();
      setAchievements(allAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const sessionStats = await focusSessionService.getSessionStats();
      const allSessions = await focusSessionService.getFocusSessions();
      
      const bodyFocusSessions = allSessions.filter(s => s.mode.id === 'body' && s.completed).length;
      const meditationSessions = allSessions.filter(s => s.mode.id === 'meditation' && s.completed).length;
      
      // Import services dynamically to avoid circular dependency
      const { UserStatsService } = await import('../services/userStatsService');
      const { journalStorage } = await import('../services/journalStorage');
      
      const totalCompletedGoals = await UserStatsService.getTotalCompletedGoals();
      const journalEntries = (await journalStorage.getAllEntries()).length;
      
      setStats({
        totalHours: Math.floor(sessionStats.totalMinutes / 60),
        totalMinutes: sessionStats.totalMinutes,
        maxStreak: sessionStats.bestStreak,
        currentStreak: sessionStats.currentStreak,
        bodyFocusSessions,
        meditationSessions,
        journalEntries,
        totalCompletedGoals,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getCategoryAchievements = (category: Achievement['category']) => {
    return achievements.filter(a => a.category === category);
  };

  const getCategoryProgress = (category: Achievement['category']) => {
    const categoryAchievements = getCategoryAchievements(category);
    const unlockedCount = categoryAchievements.filter(a => a.unlocked).length;
    return `${unlockedCount}/${categoryAchievements.length}`;
  };

  const getCurrentValue = (category: Achievement['category']) => {
    switch (category) {
      case 'focus_hours': return stats.totalHours;
      case 'max_streak': return stats.maxStreak;
      case 'current_streak': return stats.currentStreak || 0; // Use current streak if available
      case 'body_focus_special': return stats.bodyFocusSessions;
      case 'meditation_special': return stats.meditationSessions;
      case 'journal_entries': return stats.journalEntries;
      case 'completed_goals': return stats.totalCompletedGoals;
      default: return 0;
    }
  };

  const categories: Array<{category: Achievement['category'], title: string, icon: string}> = [
    { category: 'focus_hours', title: 'Focus Hours', icon: '⏰' },
    { category: 'max_streak', title: 'Max Streak', icon: '🔥' },
    { category: 'body_focus_special', title: 'Body Focus', icon: '💪' },
    { category: 'meditation_special', title: 'Meditation', icon: '🧘' },
    { category: 'journal_entries', title: 'Journal', icon: '📝' },
    { category: 'completed_goals', title: 'Goals', icon: '🎯' },
  ];

  const renderAchievement = (achievement: Achievement) => {
    let currentValue = getCurrentValue(achievement.category);
    let requirement = achievement.requirement;
    
    // Convert focus hours to minutes for accurate progress calculation
    if (achievement.category === 'focus_hours') {
      currentValue = stats.totalMinutes;
      requirement = requirement * 60; // Convert hours to minutes
    }
    
    const progress = Math.min(100, (currentValue / requirement) * 100);
    const isUnlocked = achievement.unlocked;

    return (
      <View key={achievement.id} style={[
        styles.achievementCard,
        isUnlocked && styles.achievementCardUnlocked
      ]}>
        <View style={[
          styles.achievementBadge,
          { backgroundColor: isUnlocked ? theme.colors.success : theme.colors.surface }
        ]}>
          <Text style={[
            styles.achievementEmoji,
            !isUnlocked && styles.achievementEmojiLocked
          ]}>
            {achievement.emoji}
          </Text>
        </View>
        
        <View style={styles.achievementInfo}>
          <View style={styles.achievementHeader}>
            <Text style={[
              styles.achievementTitle,
              { color: isUnlocked ? theme.colors.text.primary : theme.colors.text.secondary }
            ]}>
              {achievement.title}
            </Text>
            {isUnlocked && (
              <View style={styles.unlockedBadge}>
                <Text style={styles.unlockedText}>✓</Text>
              </View>
            )}
          </View>
          
          <Text style={[
            styles.achievementDescription,
            { color: isUnlocked ? theme.colors.text.secondary : theme.colors.text.tertiary }
          ]}>
            {achievement.description}
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { 
                  width: `${progress}%`,
                  backgroundColor: isUnlocked ? theme.colors.success : theme.colors.primary
                }
              ]} />
            </View>
            <Text style={[
              styles.progressText,
              { color: theme.colors.text.tertiary }
            ]}>
              {achievement.category === 'focus_hours' 
                ? `${Math.floor(currentValue)} / ${requirement} min`
                : `${currentValue} / ${achievement.requirement}`
              }
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const selectedAchievements = getCategoryAchievements(selectedCategory);
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Achievements</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Overall Progress */}
          <View style={styles.overallProgress}>
            <Text style={styles.overallTitle}>Overall Progress</Text>
            <Text style={styles.overallStats}>
              {unlockedCount} / {totalCount} Achievements Unlocked
            </Text>
            <View style={styles.overallProgressBar}>
              <View style={[
                styles.overallProgressFill,
                { 
                  width: `${(unlockedCount / totalCount) * 100}%`,
                  backgroundColor: theme.colors.success
                }
              ]} />
            </View>
          </View>

          {/* Category Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabs}
            contentContainerStyle={styles.categoryTabsContent}
          >
            {categories.map(({ category, title, icon }) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  selectedCategory === category && styles.categoryTabActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={styles.categoryIcon}>{icon}</Text>
                <Text style={[
                  styles.categoryTitle,
                  { color: selectedCategory === category ? theme.colors.text.primary : theme.colors.text.secondary }
                ]}>
                  {title}
                </Text>
                <Text style={[
                  styles.categoryProgress,
                  { color: theme.colors.text.tertiary }
                ]}>
                  {getCategoryProgress(category)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Achievements List */}
          <ScrollView style={styles.achievementsList} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>
              {categories.find(c => c.category === selectedCategory)?.title} Achievements
            </Text>
            {selectedAchievements
              .sort((a, b) => {
                if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1; // Unlocked first
                return a.requirement - b.requirement; // Then by requirement
              })
              .map(renderAchievement)
            }
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  
  // Overall Progress
  overallProgress: {
    alignItems: 'center',
    padding: 20,
  },
  overallTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  overallStats: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    marginBottom: 12,
  },
  overallProgressBar: {
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  overallProgressFill: {
    borderRadius: 4,
    height: '100%',
  },

  // Category Tabs
  categoryTabs: {
    maxHeight: 100,
  },
  categoryTabsContent: {
    gap: 12,
    paddingHorizontal: 20,
  },
  categoryTab: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    minWidth: 80,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryTabActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  categoryProgress: {
    fontSize: 10,
    textAlign: 'center',
  },

  // Achievements List
  achievementsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 16,
  },
  
  // Achievement Card
  achievementCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 12,
    opacity: 0.7,
    padding: 16,
  },
  achievementCardUnlocked: {
    borderColor: theme.colors.success,
    borderWidth: 1,
    opacity: 1,
  },
  achievementBadge: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: 16,
    width: 48,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementEmojiLocked: {
    opacity: 0.3,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  unlockedBadge: {
    backgroundColor: theme.colors.success,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unlockedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  progressContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  progressBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    flex: 1,
    height: 4,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 2,
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    minWidth: 60,
    textAlign: 'right',
  },
});