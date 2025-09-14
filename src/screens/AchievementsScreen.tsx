import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';
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
    maxStreak: 0,
    bodyFocusSessions: 0,
    meditationSessions: 0,
    journalEntries: 0,
  });

  // Handle hardware back button
  useEffect(() => {
    if (!visible) return;

    const backAction = () => {
      console.log('📱 Hardware back button pressed in AchievementsScreen');
      onClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [visible, onClose]);

  useEffect(() => {
    if (visible) {
      loadAchievements();
      loadStats();
    }
  }, [visible]);

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
      
      setStats({
        totalHours: Math.floor(sessionStats.totalMinutes / 60),
        maxStreak: sessionStats.bestStreak,
        bodyFocusSessions,
        meditationSessions,
        journalEntries: 0, // TODO: Get from journal service
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
      case 'current_streak': return stats.maxStreak; // Using max streak as proxy
      case 'body_focus_special': return stats.bodyFocusSessions;
      case 'meditation_special': return stats.meditationSessions;
      case 'journal_entries': return stats.journalEntries;
      case 'completed_goals': return 0; // TODO: Implement
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
    const currentValue = getCurrentValue(achievement.category);
    const progress = Math.min(100, (currentValue / achievement.requirement) * 100);
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
              {currentValue} / {achievement.requirement}
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
        <KigenKanjiBackground />
        
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
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 60,
  },
  
  // Overall Progress
  overallProgress: {
    padding: 20,
    alignItems: 'center',
  },
  overallTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  overallStats: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  overallProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Category Tabs
  categoryTabs: {
    maxHeight: 100,
  },
  categoryTabsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryTab: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    minWidth: 80,
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
    textAlign: 'center',
    marginBottom: 2,
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
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginVertical: 16,
  },
  
  // Achievement Card
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    opacity: 0.7,
  },
  achievementCardUnlocked: {
    opacity: 1,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  achievementBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    minWidth: 60,
    textAlign: 'right',
  },
});