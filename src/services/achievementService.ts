import AsyncStorage from '@react-native-async-storage/async-storage';
import { focusSessionService } from './FocusSessionService';
import { UserStatsService } from './userStatsService';
import { showAchievementNotification } from './notificationService';

export interface Achievement {
  id: string;
  category: 'focus_hours' | 'current_streak' | 'max_streak' | 'completed_goals' | 'journal_entries' | 'body_focus_special' | 'meditation_special' | 'completed_habits' | 'completed_todos' | 'active_reminders' | 'social_time';
  title: string;
  description: string;
  emoji: string;
  requirement: number;
  unlocked: boolean;
  unlockedAt?: string;
}

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  // Focus Hours Achievements
  { id: 'focus_1h', category: 'focus_hours', title: 'First Step', description: 'Complete your first hour of focus', emoji: '🌱', requirement: 1 },
  { id: 'focus_10h', category: 'focus_hours', title: 'Getting Serious', description: 'Accumulate 10 hours of focused work', emoji: '💪', requirement: 10 },
  { id: 'focus_25h', category: 'focus_hours', title: 'Dedicated Mind', description: 'Achieve 25 hours of deep focus', emoji: '🧠', requirement: 25 },
  { id: 'focus_50h', category: 'focus_hours', title: 'Focus Warrior', description: 'Conquer 50 hours of concentrated effort', emoji: '⚔️', requirement: 50 },
  { id: 'focus_100h', category: 'focus_hours', title: 'Century Master', description: '100 hours of unwavering dedication', emoji: '💎', requirement: 100 },
  { id: 'focus_250h', category: 'focus_hours', title: 'Elite Performer', description: 'Elite level: 250 hours of mastery', emoji: '', requirement: 250 },
  { id: 'focus_500h', category: 'focus_hours', title: 'Grand Master', description: '500 hours of exceptional discipline', emoji: '👑', requirement: 500 },
  { id: 'focus_750h', category: 'focus_hours', title: 'Legendary Focus', description: 'Legendary achievement: 750 hours', emoji: '', requirement: 750 },
  { id: 'focus_1000h', category: 'focus_hours', title: 'The Thousand', description: '1000 hours - transcendent focus', emoji: '🌟', requirement: 1000 },
  { id: 'focus_1500h', category: 'focus_hours', title: 'Beyond Limits', description: '1500 hours of boundless determination', emoji: '✨', requirement: 1500 },
  { id: 'focus_3000h', category: 'focus_hours', title: 'Enlightened Mind', description: '3000 hours - enlightenment through focus', emoji: '🧘', requirement: 3000 },
  { id: 'focus_5000h', category: 'focus_hours', title: 'Immortal Focus', description: '5000 hours - achieve immortality', emoji: '⚡', requirement: 5000 },
  { id: 'focus_7500h', category: 'focus_hours', title: 'Divine Concentration', description: '7500 hours of divine focus', emoji: '🕊️', requirement: 7500 },
  { id: 'focus_10000h', category: 'focus_hours', title: 'The Infinite', description: '10,000+ hours - become infinite', emoji: '♾️', requirement: 10000 },

  // Current Day Streak Achievements  
  { id: 'streak_1', category: 'current_streak', title: 'Day One', description: 'Start your focus journey', emoji: '🌅', requirement: 1 },
  { id: 'streak_7', category: 'max_streak', title: 'Week Warrior', description: 'Maintain focus for 7 consecutive days', emoji: '', requirement: 7 },
  { id: 'streak_15', category: 'max_streak', title: 'Fortnight Focus', description: '15 days of unwavering commitment', emoji: '⚡', requirement: 15 },
  { id: 'streak_30', category: 'max_streak', title: 'Monthly Master', description: 'Complete a full month of focus', emoji: '🗓️', requirement: 30 },
  { id: 'streak_50', category: 'max_streak', title: 'Disciplined Mind', description: '50 days of pure discipline', emoji: '💎', requirement: 50 },
  { id: 'streak_75', category: 'max_streak', title: 'Iron Will', description: '75 days of unbreakable focus', emoji: '🛡️', requirement: 75 },
  { id: 'streak_100', category: 'max_streak', title: 'Centurion', description: '100 days - legendary persistence', emoji: '🏛️', requirement: 100 },
  { id: 'streak_250', category: 'max_streak', title: 'Eternal Flame', description: '250 days of burning dedication', emoji: '', requirement: 250 },
  { id: 'streak_500', category: 'max_streak', title: 'Transcendent', description: '500 days - transcend limitations', emoji: '🌟', requirement: 500 },
  { id: 'streak_750', category: 'max_streak', title: 'Phoenix Rising', description: '750 days of phoenix-like rebirth', emoji: '🦅', requirement: 750 },
  { id: 'streak_1000', category: 'max_streak', title: 'The Immortal', description: '1000 days - achieve immortality', emoji: '♾️', requirement: 1000 },

  // Body Focus Special Achievements
  { id: 'body_1', category: 'body_focus_special', title: 'Body Awakened', description: 'Complete your first body focus session', emoji: '💪', requirement: 1 },
  { id: 'body_5', category: 'body_focus_special', title: 'Physical Warrior', description: '5 body focus sessions completed', emoji: '🏋️', requirement: 5 },
  { id: 'body_10', category: 'body_focus_special', title: 'Strength Builder', description: '10 sessions of body mastery', emoji: '🦾', requirement: 10 },
  { id: 'body_20', category: 'body_focus_special', title: 'Iron Body', description: '20 body focus achievements', emoji: '⚔️', requirement: 20 },
  { id: 'body_50', category: 'body_focus_special', title: 'Physical Elite', description: '50 sessions of body excellence', emoji: '', requirement: 50 },
  { id: 'body_100', category: 'body_focus_special', title: 'Strength Champion', description: '100 sessions of physical discipline', emoji: '👑', requirement: 100 },
  { id: 'body_250', category: 'body_focus_special', title: 'Titan Body', description: '250 sessions - become a titan', emoji: '⚡', requirement: 250 },
  { id: 'body_500', category: 'body_focus_special', title: 'Legendary Physique', description: '500 sessions of legendary training', emoji: '', requirement: 500 },
  { id: 'body_750', category: 'body_focus_special', title: 'Godlike Form', description: '750 sessions - achieve divine form', emoji: '🌟', requirement: 750 },
  { id: 'body_1000', category: 'body_focus_special', title: 'Eternal Physique', description: '1000 sessions of eternal physical discipline', emoji: '🏛️', requirement: 1000 },

  // Meditation Focus Special Achievements
  { id: 'meditation_1', category: 'meditation_special', title: 'Inner Peace', description: 'Find peace in your first meditation', emoji: '🧘', requirement: 1 },
  { id: 'meditation_5', category: 'meditation_special', title: 'Mindful Soul', description: '5 meditation sessions completed', emoji: '🕯️', requirement: 5 },
  { id: 'meditation_10', category: 'meditation_special', title: 'Centered Mind', description: '10 sessions of inner exploration', emoji: '🌸', requirement: 10 },
  { id: 'meditation_20', category: 'meditation_special', title: 'Peaceful Warrior', description: '20 meditation achievements', emoji: '🕊️', requirement: 20 },
  { id: 'meditation_50', category: 'meditation_special', title: 'Mindfulness Sage', description: '50 sessions of zen mastery', emoji: '⛩️', requirement: 50 },
  { id: 'meditation_100', category: 'meditation_special', title: 'Enlightened Being', description: '100 sessions toward enlightenment', emoji: '✨', requirement: 100 },
  { id: 'meditation_250', category: 'meditation_special', title: 'Sage of Tranquility', description: '250 sessions of deep wisdom', emoji: '🌙', requirement: 250 },
  { id: 'meditation_500', category: 'meditation_special', title: 'Divine Consciousness', description: '500 sessions of divine awareness', emoji: '🔮', requirement: 500 },
  { id: 'meditation_750', category: 'meditation_special', title: 'Transcendent Spirit', description: '750 sessions - transcend reality', emoji: '🌌', requirement: 750 },
  { id: 'meditation_1000', category: 'meditation_special', title: 'Infinite Serenity', description: '1000 sessions - achieve infinite inner peace', emoji: '🙏', requirement: 1000 },

  // Journal Entries Achievements
  { id: 'journal_1', category: 'journal_entries', title: 'First Words', description: 'Write your first journal entry', emoji: '✍️', requirement: 1 },
  { id: 'journal_5', category: 'journal_entries', title: 'Thoughtful Writer', description: '5 journal entries of reflection', emoji: '📝', requirement: 5 },
  { id: 'journal_10', category: 'journal_entries', title: 'Consistent Chronicler', description: '10 entries of life documentation', emoji: '📖', requirement: 10 },
  { id: 'journal_20', category: 'journal_entries', title: 'Story Teller', description: '20 entries of your journey', emoji: '📚', requirement: 20 },
  { id: 'journal_30', category: 'journal_entries', title: 'Memory Keeper', description: '30 precious moments captured', emoji: '🗂️', requirement: 30 },
  { id: 'journal_40', category: 'journal_entries', title: 'Life Documenter', description: '40 entries of life experiences', emoji: '📰', requirement: 40 },
  { id: 'journal_50', category: 'journal_entries', title: 'Wisdom Recorder', description: '50 entries of growing wisdom', emoji: '🏛️', requirement: 50 },
  { id: 'journal_75', category: 'journal_entries', title: 'Master Journalist', description: '75 entries of masterful writing', emoji: '🖋️', requirement: 75 },
  { id: 'journal_100', category: 'journal_entries', title: 'Century Writer', description: '100 entries - a century of thoughts', emoji: '💭', requirement: 100 },
  { id: 'journal_250', category: 'journal_entries', title: 'Epic Chronicler', description: '250 entries of epic proportions', emoji: '📜', requirement: 250 },
  { id: 'journal_500', category: 'journal_entries', title: 'Legendary Scribe', description: '500 entries - legendary documentation', emoji: '🏺', requirement: 500 },
  { id: 'journal_750', category: 'journal_entries', title: 'Timeless Author', description: '750 entries for all time', emoji: '⏳', requirement: 750 },
  { id: 'journal_1000', category: 'journal_entries', title: 'Infinite Writer', description: '1000 entries of infinite stories', emoji: '♾️', requirement: 1000 },

  // Completed Goals Achievements
  { id: 'goals_1', category: 'completed_goals', title: 'First Victory', description: 'Complete your first goal', emoji: '', requirement: 1 },
  { id: 'goals_5', category: 'completed_goals', title: 'Goal Crusher', description: 'Complete 5 goals successfully', emoji: '💪', requirement: 5 },
  { id: 'goals_10', category: 'completed_goals', title: 'Achievement Hunter', description: '10 goals conquered', emoji: '', requirement: 10 },
  { id: 'goals_25', category: 'completed_goals', title: 'Master Achiever', description: '25 goals mastered', emoji: '👑', requirement: 25 },
  { id: 'goals_50', category: 'completed_goals', title: 'Goal Legend', description: '50 legendary accomplishments', emoji: '', requirement: 50 },
  { id: 'goals_100', category: 'completed_goals', title: 'Century Champion', description: '100 goals completed', emoji: '💎', requirement: 100 },
  { id: 'goals_250', category: 'completed_goals', title: 'Ultimate Victor', description: '250 goals of ultimate victory', emoji: '⚡', requirement: 250 },
  { id: 'goals_500', category: 'completed_goals', title: 'Transcendent Achiever', description: '500 goals transcending limits', emoji: '🌟', requirement: 500 },
  { id: 'goals_750', category: 'completed_goals', title: 'Divine Conqueror', description: '750 goals of divine conquest', emoji: '🕊️', requirement: 750 },
  { id: 'goals_1000', category: 'completed_goals', title: 'Infinite Champion', description: '1000 goals - infinite champion', emoji: '♾️', requirement: 1000 },

  // Completed Habits Achievements
  { id: 'habits_1', category: 'completed_habits', title: 'Habit Builder', description: 'Complete your first habit', emoji: '🌱', requirement: 1 },
  { id: 'habits_5', category: 'completed_habits', title: 'Routine Master', description: 'Complete 5 habits successfully', emoji: '🔄', requirement: 5 },
  { id: 'habits_10', category: 'completed_habits', title: 'Discipline Forge', description: '10 habits of forged discipline', emoji: '⚒️', requirement: 10 },
  { id: 'habits_25', category: 'completed_habits', title: 'Habit Champion', description: '25 habits conquered', emoji: '🏅', requirement: 25 },
  { id: 'habits_50', category: 'completed_habits', title: 'Routine Legend', description: '50 legendary habits mastered', emoji: '', requirement: 50 },
  { id: 'habits_100', category: 'completed_habits', title: 'Century Builder', description: '100 habits of century-level discipline', emoji: '💎', requirement: 100 },
  { id: 'habits_250', category: 'completed_habits', title: 'Ultimate Routine', description: '250 habits of ultimate mastery', emoji: '⚡', requirement: 250 },
  { id: 'habits_500', category: 'completed_habits', title: 'Transcendent Builder', description: '500 habits transcending limitations', emoji: '🌟', requirement: 500 },
  { id: 'habits_750', category: 'completed_habits', title: 'Divine Discipline', description: '750 habits of divine discipline', emoji: '🕊️', requirement: 750 },
  { id: 'habits_1000', category: 'completed_habits', title: 'Infinite Builder', description: '1000 habits - infinite discipline', emoji: '♾️', requirement: 1000 },

  // Completed Todos Achievements
  { id: 'todos_1', category: 'completed_todos', title: 'Task Master', description: 'Complete your first task', emoji: '', requirement: 1 },
  { id: 'todos_10', category: 'completed_todos', title: 'Productive Mind', description: 'Complete 10 tasks successfully', emoji: '', requirement: 10 },
  { id: 'todos_25', category: 'completed_todos', title: 'Efficiency Expert', description: '25 tasks of expert efficiency', emoji: '⚡', requirement: 25 },
  { id: 'todos_50', category: 'completed_todos', title: 'Task Champion', description: '50 tasks conquered', emoji: '', requirement: 50 },
  { id: 'todos_100', category: 'completed_todos', title: 'Century Completer', description: '100 tasks of century-level productivity', emoji: '💎', requirement: 100 },
  { id: 'todos_250', category: 'completed_todos', title: 'Ultimate Producer', description: '250 tasks of ultimate productivity', emoji: '', requirement: 250 },
  { id: 'todos_500', category: 'completed_todos', title: 'Transcendent Doer', description: '500 tasks transcending limits', emoji: '🌟', requirement: 500 },
  { id: 'todos_750', category: 'completed_todos', title: 'Divine Executor', description: '750 tasks of divine execution', emoji: '🕊️', requirement: 750 },
  { id: 'todos_1000', category: 'completed_todos', title: 'Infinite Producer', description: '1000 tasks - infinite productivity', emoji: '♾️', requirement: 1000 },

  // Active Reminders Achievements
  { id: 'reminders_1', category: 'active_reminders', title: 'Mindful Reminder', description: 'Set your first reminder', emoji: '⏰', requirement: 1 },
  { id: 'reminders_5', category: 'active_reminders', title: 'Time Keeper', description: 'Maintain 5 active reminders', emoji: '🕐', requirement: 5 },
  { id: 'reminders_10', category: 'active_reminders', title: 'Schedule Master', description: '10 reminders of masterful organization', emoji: '', requirement: 10 },
  { id: 'reminders_25', category: 'active_reminders', title: 'Time Lord', description: '25 reminders of time lord mastery', emoji: '⚡', requirement: 25 },
  { id: 'reminders_50', category: 'active_reminders', title: 'Chronicle Keeper', description: '50 reminders of legendary timekeeping', emoji: '🏛️', requirement: 50 },
  { id: 'reminders_100', category: 'active_reminders', title: 'Century Organizer', description: '100 reminders of century-level organization', emoji: '💎', requirement: 100 },
  { id: 'reminders_250', category: 'active_reminders', title: 'Ultimate Scheduler', description: '250 reminders of ultimate scheduling', emoji: '', requirement: 250 },
  { id: 'reminders_500', category: 'active_reminders', title: 'Transcendent Planner', description: '500 reminders transcending time', emoji: '🌟', requirement: 500 },
  { id: 'reminders_750', category: 'active_reminders', title: 'Divine Organizer', description: '750 reminders of divine organization', emoji: '🕊️', requirement: 750 },
  { id: 'reminders_1000', category: 'active_reminders', title: 'Infinite Scheduler', description: '1000 reminders - infinite organization', emoji: '♾️', requirement: 1000 },

  // Social Time Achievements (time spent outside + with friends)
  { id: 'social_1', category: 'social_time', title: 'Social Butterfly', description: 'Spend 1 hour socializing (outside or with friends)', emoji: '🦋', requirement: 1 },
  { id: 'social_5', category: 'social_time', title: 'Friendly Spirit', description: '5 hours of quality social time', emoji: '👥', requirement: 5 },
  { id: 'social_10', category: 'social_time', title: 'Community Builder', description: '10 hours connecting with others', emoji: '🤝', requirement: 10 },
  { id: 'social_25', category: 'social_time', title: 'Social Champion', description: '25 hours of meaningful social interactions', emoji: '🏆', requirement: 25 },
  { id: 'social_50', category: 'social_time', title: 'Relationship Master', description: '50 hours nurturing relationships', emoji: '💕', requirement: 50 },
  { id: 'social_100', category: 'social_time', title: 'Century Connector', description: '100 hours of social excellence', emoji: '💎', requirement: 100 },
  { id: 'social_250', category: 'social_time', title: 'Ultimate Socializer', description: '250 hours of ultimate social mastery', emoji: '🌟', requirement: 250 },
  { id: 'social_500', category: 'social_time', title: 'Transcendent Friend', description: '500 hours transcending social boundaries', emoji: '✨', requirement: 500 },
  { id: 'social_750', category: 'social_time', title: 'Divine Connector', description: '750 hours of divine social harmony', emoji: '🕊️', requirement: 750 },
  { id: 'social_1000', category: 'social_time', title: 'Infinite Socializer', description: '1000 hours - infinite social connections', emoji: '♾️', requirement: 1000 },
];

const STORAGE_KEY = '@inzone_achievements';

class AchievementService {
  // Initialize achievements with default state
  private async initializeAchievements(): Promise<Achievement[]> {
    const achievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(def => ({
      ...def,
      unlocked: false
    }));
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
    return achievements;
  }

  // Get all achievements
  async getAchievements(): Promise<Achievement[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      let achievements: Achievement[];
      
      if (!data) {
        achievements = await this.initializeAchievements();
      } else {
        // Parse stored achievements
        const parsed: Achievement[] = JSON.parse(data);

        // Dedupe by id in case storage was corrupted or duplicates were introduced
        const mapById = new Map<string, Achievement>();
        for (const a of parsed) {
          if (!mapById.has(a.id)) {
            mapById.set(a.id, a);
          }
        }

        const uniqueAchievements = Array.from(mapById.values());
        if (uniqueAchievements.length !== parsed.length) {
          const removed = parsed.length - uniqueAchievements.length;
          console.warn(`achievementService: removed ${removed} duplicate achievement(s) from storage`);
          // Persist cleaned list back to storage to avoid repeated duplicate rendering
          try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueAchievements));
            console.log('achievementService: persisted deduplicated achievements to storage');
          } catch (err) {
            console.error('achievementService: failed to persist deduped achievements', err);
          }
        }

        achievements = uniqueAchievements;

        // Check if we need to add new achievements (migration)
        const existingIds = new Set(achievements.map(a => a.id));
        const missingAchievements = ACHIEVEMENT_DEFINITIONS
          .filter(def => !existingIds.has(def.id))
          .map(def => ({ ...def, unlocked: false }));

        if (missingAchievements.length > 0) {
          achievements.push(...missingAchievements);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
          console.log(`Added ${missingAchievements.length} new achievements`);
        }
      }
      
      return achievements;
    } catch (error) {
      console.error('Error getting achievements:', error);
      return await this.initializeAchievements();
    }
  }

  // Unlock an achievement
  private async unlockAchievement(achievementId: string): Promise<void> {
    try {
      const achievements = await this.getAchievements();
      const achievement = achievements.find(a => a.id === achievementId);
      
      if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
        
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
        
  console.log(`Achievement Unlocked: ${achievement.title} - ${achievement.description}`);
        
        // Show achievement notification to user
        showAchievementNotification(achievement.title, achievement.description);
      }
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  }

  // Check and update focus hours achievements
  private async checkFocusHoursAchievements(totalHours: number): Promise<void> {
    const focusAchievements = ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'focus_hours');
    
    for (const achievement of focusAchievements) {
      if (totalHours >= achievement.requirement) {
        await this.unlockAchievement(achievement.id);
      }
    }
  }

  // Check and update streak achievements
  private async checkStreakAchievements(maxStreak: number, currentStreak: number): Promise<void> {
    // Check max streak achievements
    const maxStreakAchievements = ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'max_streak');
    for (const achievement of maxStreakAchievements) {
      if (maxStreak >= achievement.requirement) {
        await this.unlockAchievement(achievement.id);
      }
    }

    // Check current streak achievement (only the "Day One" achievement)
    if (currentStreak >= 1) {
      await this.unlockAchievement('streak_1');
    }
  }

  // Check special focus mode achievements
  private async checkSpecialModeAchievements(): Promise<void> {
    try {
      const sessions = await focusSessionService.getFocusSessions();
      
      // Body focus sessions
      const bodyFocusSessions = sessions.filter(s => s.mode.id === 'body' && s.completed);
      const bodyAchievements = ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'body_focus_special');
      for (const achievement of bodyAchievements) {
        if (bodyFocusSessions.length >= achievement.requirement) {
          await this.unlockAchievement(achievement.id);
        }
      }

      // Meditation sessions
      const meditationSessions = sessions.filter(s => s.mode.id === 'meditation' && s.completed);
      const meditationAchievements = ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'meditation_special');
      for (const achievement of meditationAchievements) {
        if (meditationSessions.length >= achievement.requirement) {
          await this.unlockAchievement(achievement.id);
        }
      }
    } catch (error) {
      console.error('Error checking special mode achievements:', error);
    }
  }

  // Check journal achievements
  private async checkJournalAchievements(): Promise<void> {
    try {
      // Import journalStorage dynamically to avoid circular dependency
      const { journalStorage } = await import('../services/journalStorage');
      const entries = await journalStorage.getAllEntries();
      const journalCount = entries.length;
      
      const journalAchievements = ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'journal_entries');
      for (const achievement of journalAchievements) {
        if (journalCount >= achievement.requirement) {
          await this.unlockAchievement(achievement.id);
        }
      }
    } catch (error) {
      console.error('Error checking journal achievements:', error);
    }
  }

  // Check goal achievements
  private async checkGoalAchievements(): Promise<void> {
    try {
      // Import UserStatsService dynamically to avoid circular dependency
      const { UserStatsService } = await import('./userStatsService');
      const totalGoals = await UserStatsService.getTotalCompletedGoals();
      
      const goalAchievements = ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'completed_goals');
      for (const achievement of goalAchievements) {
        if (totalGoals >= achievement.requirement) {
          await this.unlockAchievement(achievement.id);
        }
      }
    } catch (error) {
      console.error('Error checking goal achievements:', error);
    }
  }

  // Check habit achievements
  private async checkHabitAchievements(): Promise<void> {
    try {
      const completedHabitsData = await AsyncStorage.getItem('@inzone_completed_habits');
      const completedHabits = completedHabitsData ? JSON.parse(completedHabitsData) : [];
      const totalCompletedHabits = completedHabits.length;
      
      const habitAchievements = ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'completed_habits');
      for (const achievement of habitAchievements) {
        if (totalCompletedHabits >= achievement.requirement) {
          await this.unlockAchievement(achievement.id);
        }
      }
    } catch (error) {
      console.error('Error checking habit achievements:', error);
    }
  }

  // Check todo achievements
  private async checkTodoAchievements(): Promise<void> {
    try {
      const completedTodosData = await AsyncStorage.getItem('@inzone_completed_todos');
      const completedTodos = completedTodosData ? JSON.parse(completedTodosData) : [];
      const totalCompletedTodos = completedTodos.length;
      
      const todoAchievements = ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'completed_todos');
      for (const achievement of todoAchievements) {
        if (totalCompletedTodos >= achievement.requirement) {
          await this.unlockAchievement(achievement.id);
        }
      }
    } catch (error) {
      console.error('Error checking todo achievements:', error);
    }
  }

  // Check reminder achievements
  private async checkReminderAchievements(): Promise<void> {
    try {
      const remindersData = await AsyncStorage.getItem('@inzone_reminders');
      const reminders = remindersData ? JSON.parse(remindersData) : [];
      const activeReminders = reminders.filter((r: any) => r.isActive);
      const totalActiveReminders = activeReminders.length;
      
      const reminderAchievements = ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'active_reminders');
      for (const achievement of reminderAchievements) {
        if (totalActiveReminders >= achievement.requirement) {
          await this.unlockAchievement(achievement.id);
        }
      }
    } catch (error) {
      console.error('Error checking reminder achievements:', error);
    }
  }

  // Check social media reduction achievements
  private async checkSocialAchievements(): Promise<void> {
    try {
      // For social achievements, we'll track total hours of social media usage reduction
      // This could be based on time spent in focus sessions vs social media time
      // For now, let's use a simple approach - total social media hours tracked
      const { UserStatsService } = await import('./userStatsService');
      const monthlyStats = await UserStatsService.calculateCurrentMonthStats();
      const totalSocialHours = Math.floor(monthlyStats.SOC / 60); // Convert minutes to hours
      
      const socialAchievements = ACHIEVEMENT_DEFINITIONS.filter(a => a.category === 'social_reduction');
      for (const achievement of socialAchievements) {
        if (totalSocialHours >= achievement.requirement) {
          await this.unlockAchievement(achievement.id);
        }
      }
    } catch (error) {
      console.error('Error checking social achievements:', error);
    }
  }

  // Main method to check all achievements
  async checkAchievements(): Promise<void> {
    try {
      const sessionStats = await focusSessionService.getSessionStats();

      // Use completed sessions' actual durations to calculate focus hours
      // This avoids counting planned durations or aborted sessions toward hour-based achievements
      const allSessions = await focusSessionService.getFocusSessions();
      const totalCompletedMinutes = allSessions
        .filter(s => s.completed)
        .reduce((sum, s) => sum + (s.actualDuration || s.duration || 0), 0);

      const totalHours = Math.floor(totalCompletedMinutes / 60);

      await Promise.all([
        this.checkFocusHoursAchievements(totalHours),
        this.checkStreakAchievements(sessionStats.bestStreak, sessionStats.currentStreak),
        this.checkSpecialModeAchievements(),
        this.checkJournalAchievements(),
        this.checkGoalAchievements(),
        this.checkHabitAchievements(),
        this.checkTodoAchievements(),
        this.checkReminderAchievements(),
        this.checkSocialAchievements(),
      ]);

      // Reconcile stored achievements with actual computed values in case
      // earlier logic or migrations left incorrect unlocked flags.
      await this.reconcileAchievements();
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  // Recompute which achievements should be unlocked based on current data
  // and persist fixes to AsyncStorage. This will correct cases where an
  // achievement was incorrectly marked as unlocked (e.g. 'First Step').
  async reconcileAchievements(): Promise<void> {
    try {
      const achievements = await this.getAchievements();

      // Compute focus totals from completed sessions
      const allSessions = await focusSessionService.getFocusSessions();
      const completedSessions = allSessions.filter(s => s.completed);
      const totalCompletedMinutes = completedSessions.reduce((sum, s) => sum + (s.actualDuration || s.duration || 0), 0);
      const totalHours = Math.floor(totalCompletedMinutes / 60);

      // Compute streaks
      const sessionStats = await focusSessionService.getSessionStats();

      // Compute special mode counts
      const bodyCount = completedSessions.filter(s => s.mode.id === 'body').length;
      const meditationCount = completedSessions.filter(s => s.mode.id === 'meditation').length;

      // Compute journal and goals
      const { journalStorage } = await import('../services/journalStorage');
      const journalCount = (await journalStorage.getAllEntries()).length;
      const totalGoals = await UserStatsService.getTotalCompletedGoals();

      const updates: string[] = [];

      for (const def of ACHIEVEMENT_DEFINITIONS) {
        const stored = achievements.find(a => a.id === def.id);
        if (!stored) continue;

        let shouldBeUnlocked = false;
        switch (def.category) {
          case 'focus_hours':
            shouldBeUnlocked = totalHours >= def.requirement;
            break;
          case 'max_streak':
            shouldBeUnlocked = sessionStats.bestStreak >= def.requirement;
            break;
          case 'current_streak':
            shouldBeUnlocked = sessionStats.currentStreak >= def.requirement;
            break;
          case 'body_focus_special':
            shouldBeUnlocked = bodyCount >= def.requirement;
            break;
          case 'meditation_special':
            shouldBeUnlocked = meditationCount >= def.requirement;
            break;
          case 'journal_entries':
            shouldBeUnlocked = journalCount >= def.requirement;
            break;
          case 'completed_goals':
            shouldBeUnlocked = totalGoals >= def.requirement;
            break;
          default:
            shouldBeUnlocked = stored.unlocked;
        }

        if (shouldBeUnlocked !== stored.unlocked) {
          stored.unlocked = shouldBeUnlocked;
          stored.unlockedAt = shouldBeUnlocked ? new Date().toISOString() : undefined;
          updates.push(`${stored.id}: ${shouldBeUnlocked ? 'locked->unlocked' : 'unlocked->locked'}`);
        }
      }

      if (updates.length > 0) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
        console.log('Achievement reconciliation applied:', updates);
      } else {
        console.log('Achievement reconciliation: no changes needed');
      }
    } catch (error) {
      console.error('Error reconciling achievements:', error);
    }
  }

  // Get achievements by category
  async getAchievementsByCategory(category: Achievement['category']): Promise<Achievement[]> {
    const achievements = await this.getAchievements();
    return achievements.filter(a => a.category === category);
  }

  // Get unlocked achievements count
  async getUnlockedCount(): Promise<number> {
    const achievements = await this.getAchievements();
    return achievements.filter(a => a.unlocked).length;
  }

  // Get progress for next achievement in category
  async getNextAchievementProgress(category: Achievement['category'], currentValue: number): Promise<{
    next?: Achievement;
    progress: number;
  }> {
    const achievements = await this.getAchievementsByCategory(category);
    const unlockedAchievements = achievements.filter(a => !a.unlocked);
    
    if (unlockedAchievements.length === 0) {
      return { progress: 100 };
    }

    const nextAchievement = unlockedAchievements.sort((a, b) => a.requirement - b.requirement)[0];
    if (!nextAchievement) {
      return { progress: 100 };
    }
    
    const progress = Math.min(100, (currentValue / nextAchievement.requirement) * 100);

    return {
      next: nextAchievement,
      progress
    };
  }
}

export const achievementService = new AchievementService();