import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { theme as defaultTheme } from '../../config/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../auth/AuthProvider';
import { UserStatsService } from '../../services/userStatsService';
import { achievementService } from '../../services/achievementService';
import { digitalWellbeingService, DigitalWellbeingStats } from '../../services/digitalWellbeingService';
import { RatingSystem } from '../../services/ratingSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { useDashboardSections } from '../../hooks/useDashboardSections';
import { onPointsRecorded } from '../../utils/pointEvents';

const { width: screenWidth } = Dimensions.get('window');

// Navigation hook (used for top-bar actions)
// We'll infer the stack params where needed; this file uses navigation.navigate('Notifications')
// which is registered in MainNavigator.

interface UserStats {
  discipline: number;
  focus: number;
  journaling: number;
  determination: number;
  productivity: number;
  mental: number;
  physical: number;
  social: number;
  overallRating: number;
}

interface ActiveGoal {
  id: string;
  title: string;
  progress: number;
  deadline: string;
  context?: string;
  entryDate: string;
}

interface ActiveHabit {
  id: string;
  title: string;
  streak: number;
  completedToday: boolean;
  lastCompleted?: string;
  targetDays?: number;
  failedAt?: string;
  failureReason?: 'missed_day' | 'gave_up';
  startDate: string;
  projectedEndDate?: string;
  context?: string;
}

interface ActiveTodo {
  id: string;
  title: string;
  completed: boolean;
  context?: string;
  entryDate: string;
}

interface ActiveReminder {
  id: string;
  title: string;
  scheduledTime: string;
  recurring: string;
  context?: string;
  entryDate: string;
}

interface CompletedGoal {
  id: string;
  title: string;
  completedAt: string;
  originalDeadline: string;
}

interface CompletedTodo {
  id: string;
  title: string;
  completedAt: string;
}

interface CompletedHabit {
  id: string;
  title: string;
  finalStreak: number;
  completedAt: string;
  targetDays?: number;
}

interface JournalEntry {
  id: string;
  content: string;
  date: string;
}

export const DashboardScreen: React.FC = () => {
  const { session } = useAuth();
  const { theme } = useTheme();
  const { 
    getSortedSections,
    refreshSections,
    enabledSections
  } = useDashboardSections();
  
  const [isMonthly, setIsMonthly] = useState(true);
  const [isCardFlipping, setIsCardFlipping] = useState(false);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState<UserStats | null>(null);
  const [allTimeStats, setAllTimeStats] = useState<UserStats | null>(null);
  const [activeGoals, setActiveGoals] = useState<ActiveGoal[]>([]);
  const [activeHabits, setActiveHabits] = useState<ActiveHabit[]>([]);
  const [activeTodos, setActiveTodos] = useState<ActiveTodo[]>([]);
  const [activeReminders, setActiveReminders] = useState<ActiveReminder[]>([]);
  const [userRank, setUserRank] = useState('Bronze');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [usageStats, setUsageStats] = useState<DigitalWellbeingStats | null>(null);
  const [hasUsagePermission, setHasUsagePermission] = useState(false);
  const [completedGoals, setCompletedGoals] = useState<CompletedGoal[]>([]);
  const [completedTodos, setCompletedTodos] = useState<CompletedTodo[]>([]);
  const [completedHabits, setCompletedHabits] = useState<CompletedHabit[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const styles = createStyles(theme);
  const navigation = useNavigation();

  const StatItem: React.FC<{ 
    label: string; 
    value: number; 
    textColor: string; 
    secondaryTextColor: string; 
  }> = ({ label, value, textColor, secondaryTextColor }) => (
    <View style={styles.statItem}>
      <Text style={[styles.statLabel, { color: secondaryTextColor }]}>{label}</Text>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
    </View>
  );

  // Function to update rank in real-time based on current monthly stats
  const updateRankInRealTime = async () => {
    try {
      const monthlyRating = await UserStatsService.getCurrentRating();
      setUserRank(monthlyRating.cardTier);
      console.log('🎖️ Rank updated to:', monthlyRating.cardTier, 'with', monthlyRating.totalPoints, 'points');
      
      // Sync leaderboard data whenever rank changes
      await UserStatsService.syncUserToLeaderboard();
    } catch (error) {
      console.error('Error updating rank:', error);
    }
  };

  // Subscribe to points recorded events to force UI refresh
  React.useEffect(() => {
    const unsub = onPointsRecorded(() => {
      setRefreshTrigger(prev => prev + 1);
    });
    return () => unsub();
  }, []);

  const toggleTodoCompletion = useCallback(async (todoId: string) => {
    try {
      const todoToToggle = activeTodos.find(todo => todo.id === todoId);
      if (!todoToToggle) return;

      if (!todoToToggle.completed) {
        // Completing the todo - move to history
        const completedAt = new Date().toISOString();
        
        const newCompletedTodo: CompletedTodo = {
          id: todoToToggle.id,
          title: todoToToggle.title,
          completedAt
        };
        
        const updatedCompletedTodos = [...completedTodos, newCompletedTodo];
        setCompletedTodos(updatedCompletedTodos);
        
        // Save completed todos to storage
        await AsyncStorage.setItem('@inzone_completed_todos', JSON.stringify(updatedCompletedTodos));
        
        // Remove from active todos
        const updatedActiveTodos = activeTodos.filter(todo => todo.id !== todoId);
        setActiveTodos(updatedActiveTodos);
        
        // Update active todos storage
        await AsyncStorage.setItem('@inzone_todos', JSON.stringify(updatedActiveTodos));
        
        // Record the todo completion in stats
        await UserStatsService.recordTodoCompletion(todoToToggle.title);

        // Force update rank in real-time after todo completion
        await updateRankInRealTime();
      } else {
        // Uncompleting - this shouldn't happen in current UI, but handle it just in case
        const updatedTodos = activeTodos.map(todo => 
          todo.id === todoId ? { ...todo, completed: false } : todo
        );
        setActiveTodos(updatedTodos);
        await AsyncStorage.setItem('@inzone_todos', JSON.stringify(updatedTodos));
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      Alert.alert('Error', 'Failed to update todo');
    }

    // Update rank in real-time after todo changes
    await updateRankInRealTime();
    
    // Check for new achievements
    await achievementService.checkAchievements();
  }, [activeTodos, completedTodos, setCompletedTodos, updateRankInRealTime]);

  const handleDisableReminder = async (reminderId: string) => {
    try {
      // Get current reminders
      const remindersData = await AsyncStorage.getItem('@inzone_reminders');
      if (!remindersData) return;

      const reminders = JSON.parse(remindersData);
      
      // Find and update the reminder
      const updatedReminders = reminders.map((reminder: any) => {
        if (reminder.id === reminderId) {
          // Cancel the notification if it exists
          if (reminder.notificationId) {
            Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
          }
          return { ...reminder, isActive: false };
        }
        return reminder;
      });

      // Save updated reminders
      await AsyncStorage.setItem('@inzone_reminders', JSON.stringify(updatedReminders));

      // Refresh the active reminders list
      await loadDashboardData();

      // Show success message
      Alert.alert('Success', 'Reminder disabled successfully');
    } catch (error) {
      console.error('Error disabling reminder:', error);
      Alert.alert('Error', 'Failed to disable reminder');
    }
  };

  const toggleHabitCompletion = useCallback(async (habitId: string) => {
    try {
      // Load the full habits list from storage
      const habitsData = await AsyncStorage.getItem('@inzone_habits');
      if (!habitsData) return;

      const allHabits = JSON.parse(habitsData);
      const today = new Date().toDateString();

      let habitCompleted = false;
      let completedHabitData: CompletedHabit | null = null;

      // Update the specific habit
      const updatedAllHabits = allHabits.map((habit: any) => {
        if (habit.id === habitId) {
          const wasCompletedToday = habit.lastCompleted === today;

          if (!wasCompletedToday) {
            // First completion today - increase streak
            const newStreak = habit.streak + 1;
            const targetDays = habit.targetDays || 30;

            // Check if habit is completed (reached target)
            if (newStreak >= targetDays) {
              habitCompleted = true;
              completedHabitData = {
                id: habit.id,
                title: habit.title,
                finalStreak: newStreak,
                completedAt: new Date().toISOString(),
                targetDays: targetDays
              };
              // Mark as inactive instead of updating
              return { ...habit, isActive: false };
            }

            return {
              ...habit,
              streak: newStreak,
              lastCompleted: today
            };
          } else {
            // Already completed today - do nothing
            return habit;
          }
        }
        return habit;
      });

      // Save the full updated habits list
      await AsyncStorage.setItem('@inzone_habits', JSON.stringify(updatedAllHabits));

      // If habit was completed, add to completed habits
      if (habitCompleted && completedHabitData) {
        const updatedCompletedHabits = [...completedHabits, completedHabitData];
        setCompletedHabits(updatedCompletedHabits);
        await AsyncStorage.setItem('@inzone_completed_habits', JSON.stringify(updatedCompletedHabits));

        // Alert.alert('Habit Completed!', `Congratulations! You've completed your ${(completedHabitData as CompletedHabit).targetDays}-day habit with a streak of ${(completedHabitData as CompletedHabit).finalStreak} days!`); // Removed annoying success dialog
      }

      // Update the dashboard display (first 3 active habits)
      const activeHabitsData = updatedAllHabits
        .filter((habit: any) => habit.isActive)
        .slice(0, 3)
        .map((habit: any) => ({
          id: habit.id,
          title: habit.title,
          streak: habit.streak || 0,
          completedToday: habit.lastCompleted === today,
          lastCompleted: habit.lastCompleted,
          targetDays: habit.targetDays || 30
        }));
      setActiveHabits(activeHabitsData);

      // Update rank in real-time after habit changes
      await updateRankInRealTime();

      // Check for new achievements
      await achievementService.checkAchievements();
    } catch (error) {
      console.error('Error updating habit:', error);
      Alert.alert('Error', 'Failed to update habit');
    }
  }, [activeHabits, completedHabits, setCompletedHabits, updateRankInRealTime]);

  const handleHabitAction = async (habitId: string, action: 'reset_streak' | 'give_up') => {
    try {
      // Load all habits from storage
      const habitsData = await AsyncStorage.getItem('@inzone_habits');
      if (!habitsData) return;

      const allHabits = JSON.parse(habitsData);

      if (action === 'reset_streak') {
        // Update the specific habit
        const updatedHabits = allHabits.map((habit: any) => {
          if (habit.id === habitId) {
            return {
              ...habit,
              streak: 0,
              lastCompleted: undefined,
              completedToday: false
            };
          }
          return habit;
        });

        // Save back to storage
        await AsyncStorage.setItem('@inzone_habits', JSON.stringify(updatedHabits));

        // Update active habits list with reset values
        setActiveHabits(prev => prev.map(habit =>
          habit.id === habitId
            ? { ...habit, streak: 0, lastCompleted: undefined, completedToday: false }
            : habit
        ));
      } else {
        // give_up - completely remove the habit from storage
        const filteredHabits = allHabits.filter((habit: any) => habit.id !== habitId);

        // Save back to storage (habit is completely removed)
        await AsyncStorage.setItem('@inzone_habits', JSON.stringify(filteredHabits));

        // Remove from active habits list
        setActiveHabits(prev => prev.filter(habit => habit.id !== habitId));
      }

      Alert.alert(
        action === 'reset_streak' ? 'Habit Reset' : 'Habit Deleted',
        action === 'reset_streak'
          ? 'Your habit streak has been reset. Keep going!'
          : 'Habit has been completely removed.'
      );
    } catch (error) {
      console.error('Error handling habit action:', error);
      Alert.alert('Error', 'Failed to update habit');
    }
  };

  const completeGoal = useCallback(async (goalId: string) => {
    try {
      // Find the goal to complete
      const goalToComplete = activeGoals.find(goal => goal.id === goalId);
      if (!goalToComplete) return;

      const completedAt = new Date().toISOString();
      
      // Add to completed goals
      const newCompletedGoal: CompletedGoal = {
        id: goalToComplete.id,
        title: goalToComplete.title,
        completedAt,
        originalDeadline: goalToComplete.deadline
      };
      
      const updatedCompletedGoals = [...completedGoals, newCompletedGoal];
      setCompletedGoals(updatedCompletedGoals);
      
      // Save completed goals to storage
      await AsyncStorage.setItem('@inzone_completed_goals', JSON.stringify(updatedCompletedGoals));
      
      // Remove from active goals
      const updatedActiveGoals = activeGoals.filter(goal => goal.id !== goalId);
      setActiveGoals(updatedActiveGoals);
      
      // Update active goals storage
      await AsyncStorage.setItem('@inzone_goals', JSON.stringify(updatedActiveGoals));
      
      // Alert.alert('Goal Completed!', 'Congratulations on completing your goal!'); // Removed annoying success dialog
      
      // Record the goal completion in stats
      await UserStatsService.recordGoalCompletion();

      // Update rank in real-time after goal completion
      await updateRankInRealTime();
      
      // Check for new achievements
      await achievementService.checkAchievements();
    } catch (error) {
      console.error('Error completing goal:', error);
      Alert.alert('Error', 'Failed to complete goal');
    }
  }, [activeGoals, completedGoals, setCompletedGoals]);

  const failGoal = useCallback(async (goalId: string) => {
    try {
      const updatedGoals = activeGoals.map(goal => 
        goal.id === goalId ? { ...goal, failed: true, failedAt: new Date().toISOString() } : goal
      );
      setActiveGoals(updatedGoals);
      
      // Update in AsyncStorage
      await AsyncStorage.setItem('@inzone_goals', JSON.stringify(updatedGoals));
    } catch (error) {
      console.error('Error failing goal:', error);
    }
  }, [activeGoals]);

  const currentStats = isMonthly ? monthlyStats : allTimeStats;
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  // Prefer an explicitly stored displayName, then Supabase metadata, then email prefix
  const username = displayName
    || session?.user?.user_metadata?.full_name
    || session?.user?.user_metadata?.name
    || session?.user?.email?.split('@')[0]
    || 'User';

  // Load real data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load monthly stats
      const monthlyRating = await UserStatsService.getCurrentRating();
      const mappedMonthlyStats: UserStats = {
        discipline: monthlyRating.stats.DIS,
        focus: monthlyRating.stats.FOC,
        journaling: monthlyRating.stats.JOU,
        determination: monthlyRating.stats.DET,
        productivity: monthlyRating.stats.PRD || 0,
        mental: monthlyRating.stats.MEN,
        physical: monthlyRating.stats.PHY,
        social: monthlyRating.stats.SOC || 0,
        overallRating: monthlyRating.overallRating,
      };
      setMonthlyStats(mappedMonthlyStats);
      setAllTimeStats(mappedMonthlyStats);

      const goalsData = await AsyncStorage.getItem('@inzone_goals');
      if (goalsData) {
        const goals = JSON.parse(goalsData);
        const activeGoalsData = goals
          .filter((goal: any) => !goal.completed && !goal.failed)
          .slice(0, 3)
          .map((goal: any) => ({ id: goal.id, title: goal.title, progress: 0.5, deadline: '2025-12-31' }));
        setActiveGoals(activeGoalsData);
      }

      // Load active habits
      const habitsData = await AsyncStorage.getItem('@inzone_habits');
      if (habitsData) {
        const habits = JSON.parse(habitsData);
        const activeHabitsData = habits
          .filter((habit: any) => habit.isActive)
          .slice(0, 3)
          .map((habit: any) => ({ 
            id: habit.id, 
            title: habit.title, 
            streak: habit.streak || 0,
            completedToday: habit.lastCompleted === new Date().toDateString(),
            lastCompleted: habit.lastCompleted,
            targetDays: habit.targetDays || 30 // Default to 30 days if not set
          }));
        setActiveHabits(activeHabitsData);
      }

      // Load active todos
      const todosData = await AsyncStorage.getItem('@inzone_todos');
      if (todosData) {
        const todos = JSON.parse(todosData);
        const activeTodosData = todos
          .filter((todo: any) => !todo.completed)
          .slice(0, 3)
          .map((todo: any) => ({ id: todo.id, title: todo.title, completed: false }));
        setActiveTodos(activeTodosData);
      }

      // Load active reminders
      const remindersData = await AsyncStorage.getItem('@inzone_reminders');
      if (remindersData) {
        const reminders = JSON.parse(remindersData);
        const now = new Date();
        const activeRemindersData = reminders
          .filter((reminder: any) => {
            if (!reminder.isActive) return false;
            
            // For recurring reminders, always show if active
            if (reminder.recurring !== 'none') return true;
            
            // For one-time reminders, only show if in the future
            const reminderTime = new Date(reminder.scheduledTime);
            return reminderTime > now;
          })
          .slice(0, 3)
          .map((reminder: any) => ({ 
            id: reminder.id, 
            title: reminder.title, 
            scheduledTime: reminder.scheduledTime,
            recurring: reminder.recurring
          }));
        setActiveReminders(activeRemindersData);
      }

      // Load canonical user profile from UserStatsService (creates default if none exists)
      try {
        const userProfile = await UserStatsService.ensureUserProfile();
        if (userProfile) {
          if (userProfile.profileImage) setProfileImageUri(userProfile.profileImage);
          if (userProfile.username) setDisplayName(userProfile.username);
        }
      } catch (e) {
        console.error('Error loading user profile', e);
        // Fallback to legacy keys if profile creation fails
        try {
          const saved = await AsyncStorage.getItem('@inzone_profile_image');
          if (saved) setProfileImageUri(saved);
          const savedName = await AsyncStorage.getItem('@inzone_profile_name');
          if (savedName) setDisplayName(savedName);
        } catch (fallbackError) {
          console.error('Error loading fallback profile data', fallbackError);
        }
      }

      setUserRank(monthlyRating.cardTier);

      try {
        const permission = await digitalWellbeingService.canAccessUsageStats();
        setHasUsagePermission(permission);
        if (permission) {
          const stats = await digitalWellbeingService.getTodaysStats();
          setUsageStats(stats);
        }
      } catch (error) {
        console.error('Error loading usage stats:', error);
      }

      // Load completed items
      const completedGoalsData = await AsyncStorage.getItem('@inzone_completed_goals');
      if (completedGoalsData) {
        setCompletedGoals(JSON.parse(completedGoalsData));
      }

      const completedTodosData = await AsyncStorage.getItem('@inzone_completed_todos');
      if (completedTodosData) {
        setCompletedTodos(JSON.parse(completedTodosData));
      }

      const completedHabitsData = await AsyncStorage.getItem('@inzone_completed_habits');
      if (completedHabitsData) {
        setCompletedHabits(JSON.parse(completedHabitsData));
      }

      // Load journal entries
      const journalData = await AsyncStorage.getItem('@inzone_journal_entries');
      if (journalData) {
        setJournalEntries(JSON.parse(journalData));
      }

      // Check for achievements on app load
      await achievementService.checkAchievements();

      // Sync leaderboard data with current user stats
      await UserStatsService.syncUserToLeaderboard();

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize sections on first load
  React.useEffect(() => {
    loadDashboardData();
  }, []);

  const refreshData = async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes
    
    setRefreshing(true);
    try {
      // Set timeout to prevent hanging refreshes
      const timeout = new Promise((resolve) => {
        setTimeout(() => resolve('timeout'), 8000); // 8 second timeout
      });
      
      const refreshPromise = Promise.all([
        loadDashboardData(),
        refreshSections()
      ]);
      
      // Race between refresh operations and timeout
      const result = await Promise.race([refreshPromise, timeout]);
      
      if (result === 'timeout') {
  console.warn('Dashboard refresh timed out');
      }
      
    } catch (e) {
      console.error('Error refreshing dashboard', e);
    } finally {
      // Always set refreshing to false, even on timeout/error
      setRefreshing(false);
    }
  };

  const flipRotation = useSharedValue(0);

  // Toggle isMonthly after animation completes (runOnJS safe)
  const finishFlip = useCallback(() => {
    setIsMonthly(prev => !prev);
    setIsCardFlipping(false);
  }, []);

  const handleCardFlip = useCallback(() => {
    if (isCardFlipping) return;
    setIsCardFlipping(true);
    // Use a short timed animation to avoid spring bounce/shake
    const target = (flipRotation.value + 180) % 360;
    flipRotation.value = withTiming(target, { duration: 350 }, () => {
      runOnJS(finishFlip)();
    });
  }, [isCardFlipping, finishFlip]);

  // Front and back animated styles to avoid mirroring. Use backfaceVisibility: 'hidden'.
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value % 360, [0, 180], [0, 180]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      backfaceVisibility: 'hidden',
    } as any;
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value % 360, [0, 180], [-180, 0]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      backfaceVisibility: 'hidden',
    } as any;
  });

  const renderUserCard = () => {
    // Get background image based on current rank
    const backgroundImage = RatingSystem.getCardBackgroundImage(userRank as any);
    
  // Get text colors based on rank background using RatingSystem luminance helper
  const textColor = RatingSystem.getCardTextColorFromTier(userRank as any);
  const secondaryTextColor = textColor === theme.colors.black ? '#666666' : '#CCCCCC';

    // Gesture: use Tap for taps and a horizontal Pan for swipes.
    const tapGesture = Gesture.Tap().onEnd(() => {
      runOnJS(handleCardFlip)();
    });

    // Use stronger activeOffsetX and minDistance to avoid capturing vertical drags; require a clear horizontal swipe
    const horizontalPan = Gesture.Pan()
      .activeOffsetX([-40, 40])
      .minDistance(20)
      .onEnd((ev) => {
        const absX = Math.abs(ev.translationX);
        // require a more deliberate swipe to flip
        if (absX > 120 && Math.abs(ev.translationX) > Math.abs(ev.translationY) * 1.2) {
          runOnJS(handleCardFlip)();
        }
      });

  const cardGesture = Gesture.Race(tapGesture, horizontalPan);

    // Render front (monthly) and back (all-time) faces stacked; tap/fling flips card
    return (
      <GestureDetector gesture={cardGesture}>
        <View style={styles.userCard}>
          {/* Front face */}
          <Animated.View style={[styles.faceContainer, frontAnimatedStyle]}>
            <ImageBackground
              source={backgroundImage}
              style={styles.userCardBackground}
              imageStyle={{ borderRadius: 20 }}
              resizeMode="cover"
            >
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{userRank}</Text>
              </View>

              <View style={styles.periodTopLeft}>
                <Text style={[styles.periodTextSmall, { color: secondaryTextColor }]}>{isMonthly ? 'Monthly' : 'All-Time'}</Text>
              </View>

              <View style={styles.profileSection}>
                <TouchableOpacity onPress={async () => {
                  try {
                    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!perm.granted) return;
                    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
                    if ((result as any).canceled === false && (result as any).assets && (result as any).assets.length > 0) {
                      const uri = (result as any).assets[0].uri;
                      // Save to canonical profile so Profile screen and other parts of app see the change
                      try {
                        await UserStatsService.updateUserProfile({ profileImage: uri });
                      } catch {
                        // Fallback to AsyncStorage key if update fails
                        await AsyncStorage.setItem('@inzone_profile_image', uri);
                      }
                      setProfileImageUri(uri);
                    }
                  } catch (e) {
                    console.error('Image pick error', e);
                  }
                }}>
                  <Image
                    source={profileImageUri || session?.user?.user_metadata?.avatar_url 
                      ? { uri: profileImageUri || session?.user?.user_metadata?.avatar_url }
                      : require('../../../assets/images/profile-icon.png')}
                    style={styles.profileImage}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.usernameSection}>
                <Text style={[styles.username, { color: textColor }]}> 
                  {username}
                </Text>
              </View>

              {loading || !currentStats ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading stats...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.ratingSection}>
                    <Text style={[styles.overallRating, { color: textColor }]}> 
                      {currentStats.overallRating}
                    </Text>
                    <View style={styles.ratingSubtextRow}>
                      <Text style={[styles.ratingLabel, { color: secondaryTextColor }]}>Overall Rating</Text>
                    </View>
                  </View>

                  <View style={styles.statsSection}>
                    <StatItem label="Discipline" value={currentStats.discipline} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                    <StatItem label="Focus" value={currentStats.focus} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                    <StatItem label="Journaling" value={currentStats.journaling} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                    <StatItem label="Determination" value={currentStats.determination} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                    <StatItem label="Productivity" value={currentStats.productivity} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                    <StatItem label="Mental" value={currentStats.mental} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                    <StatItem label="Physical" value={currentStats.physical} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                    <StatItem label="Social" value={currentStats.social} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                  </View>

                  {/* period label moved into ratingSection */}
                </>
              )}
              {/* bottom hint removed - moved to top */}
            </ImageBackground>
          </Animated.View>

          {/* Back face - show all-time stats explicitly */}
          <Animated.View style={[styles.faceContainer, styles.backFace, backAnimatedStyle]}>
            <ImageBackground
              source={RatingSystem.getCardBackgroundImage(userRank as any)}
              style={styles.userCardBackground}
              imageStyle={{ borderRadius: 20 }}
              resizeMode="cover"
            >
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{userRank}</Text>
              </View>

              <View style={styles.periodTopLeft}>
                <Text style={[styles.periodTextSmall, { color: secondaryTextColor }]}>All-Time</Text>
              </View>

              <View style={styles.profileSection}>
                <TouchableOpacity onPress={async () => {
                  try {
                    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!perm.granted) return;
                    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
                    if ((result as any).canceled === false && (result as any).assets && (result as any).assets.length > 0) {
                      const uri = (result as any).assets[0].uri;
                      try {
                        await UserStatsService.updateUserProfile({ profileImage: uri });
                      } catch {
                        await AsyncStorage.setItem('@inzone_profile_image', uri);
                      }
                      setProfileImageUri(uri);
                    }
                  } catch (e) {
                    console.error('Image pick error', e);
                  }
                }}>
                  <Image
                    source={profileImageUri || session?.user?.user_metadata?.avatar_url 
                      ? { uri: profileImageUri || session?.user?.user_metadata?.avatar_url }
                      : require('../../../assets/images/profile-icon.png')}
                    style={styles.profileImage}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.usernameSection}>
                <Text style={[styles.username, { color: textColor }]}> 
                  {username}
                </Text>
              </View>

              {loading || !allTimeStats ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading stats...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.ratingSection}>
                    <Text style={[styles.overallRating, { color: textColor }]}> 
                      {allTimeStats.overallRating}
                    </Text>
                    <View style={styles.ratingSubtextRow}>
                      <Text style={[styles.ratingLabel, { color: secondaryTextColor }]}>Overall Rating</Text>
                    </View>
                  </View>

                  <View style={styles.statsSection}>
                    <StatItem label="Discipline" value={allTimeStats.discipline} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                    <StatItem label="Focus" value={allTimeStats.focus} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                    <StatItem label="Journaling" value={allTimeStats.journaling} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                    <StatItem label="Determination" value={allTimeStats.determination} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                    <StatItem label="Productivity" value={allTimeStats.productivity} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                    <StatItem label="Mental" value={allTimeStats.mental} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                    <StatItem label="Physical" value={allTimeStats.physical} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                    <StatItem label="Social" value={allTimeStats.social} textColor={textColor} secondaryTextColor={secondaryTextColor} />
                  </View>

                  {/* period label moved into ratingSection */}
                </>
              )}
              {/* bottom hint removed - moved to top */}
            </ImageBackground>
          </Animated.View>
        </View>
      </GestureDetector>
    );
  };

  const renderActiveGoals = () => (
    <View style={styles.swipeableSection}>
      <Text style={styles.sectionTitle}>Active Goals</Text>
      {activeGoals.length > 0 ? (
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.swipeableContainer}
        >
          {activeGoals.map((goal) => (
            <View key={goal.id} style={styles.fullSwipePage}>
              <View style={styles.swipeCard}>
                <Text style={styles.swipeCardTitle}>{goal.title}</Text>
                
                {goal.context && (
                  <View style={styles.swipeContextSection}>
                    <Text style={styles.swipeContextLabel}>Context:</Text>
                    <Text style={styles.swipeContextText}>{goal.context}</Text>
                  </View>
                )}
                
                <View style={styles.swipeInfoRow}>
                  <View style={styles.swipeInfoItem}>
                    <Icon name="event" size={20} color={theme.colors.text.secondary} />
                    <View style={styles.swipeInfoTextContainer}>
                      <Text style={styles.swipeInfoLabel}>Entry Date</Text>
                      <Text style={styles.swipeInfoValue}>
                        {new Date(goal.entryDate || Date.now()).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.swipeInfoItem}>
                    <Icon name="flag" size={20} color={theme.colors.text.secondary} />
                    <View style={styles.swipeInfoTextContainer}>
                      <Text style={styles.swipeInfoLabel}>Deadline</Text>
                      <Text style={styles.swipeInfoValue}>{goal.deadline}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.swipeActions}>
                  <TouchableOpacity 
                    style={styles.swipeCompleteButton}
                    onPress={() => completeGoal(goal.id)}
                  >
                    <Icon name="check-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.swipeActionButtonText}>Complete Goal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.swipeDismissButton}
                    onPress={() => failGoal(goal.id)}
                  >
                    <Icon name="cancel" size={24} color="#FFFFFF" />
                    <Text style={styles.swipeActionButtonText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.swipeableEmptyState}>
          <Icon name="track-changes" size={48} color={theme.colors.text.secondary} style={styles.emptyIcon} />
          <Text style={styles.emptyStateText}>No active goals</Text>
          <Text style={styles.emptyStateSubtext}>Set your first goal to get started!</Text>
        </View>
      )}
    </View>
  );

  const renderActiveHabits = () => (
    <View style={styles.swipeableSection}>
      <Text style={styles.sectionTitle}>Active Habits</Text>
      {activeHabits.length > 0 ? (
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.swipeableContainer}
        >
          {activeHabits.map((habit) => {
            const progressPercent = Math.min((habit.streak / (habit.targetDays || 30)) * 100, 100);
            const projectedEnd = habit.projectedEndDate || new Date(
              new Date(habit.startDate).getTime() + ((habit.targetDays || 30) - habit.streak) * 24 * 60 * 60 * 1000
            ).toLocaleDateString();
            
            return (
              <View key={habit.id} style={styles.fullSwipePage}>
                <View style={styles.swipeCard}>
                  {/* Header with title and dismiss button */}
                  <View style={styles.habitSwipeHeader}>
                    <Text style={styles.swipeCardTitle}>{habit.title}</Text>
                    <TouchableOpacity 
                      style={styles.habitDismissButton}
                      onPress={() => {
                        Alert.alert(
                          'Dismiss Habit',
                          'This will remove the habit from your active list.',
                          [
                            { text: 'Dismiss', onPress: () => handleHabitAction(habit.id, 'give_up') },
                            { text: 'Cancel', style: 'cancel' }
                          ]
                        );
                      }}
                    >
                      <Icon name="close" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Context if available */}
                  {habit.context && (
                    <View style={styles.swipeContextSection}>
                      <Text style={styles.swipeContextLabel}>Context:</Text>
                      <Text style={styles.swipeContextText}>{habit.context}</Text>
                    </View>
                  )}
                  
                  {/* Streak information */}
                  <View style={styles.habitStreakInfo}>
                    <View style={styles.habitStreakRow}>
                      <Icon name="local-fire-department" size={32} color="#FF6B35" />
                      <Text style={styles.habitStreakNumber}>{habit.streak}</Text>
                      <Text style={styles.swipeInfoLabel}> / {habit.targetDays || 30} days</Text>
                    </View>
                    <View style={styles.habitProgressBar}>
                      <View 
                        style={[
                          styles.habitProgressFill, 
                          { width: `${progressPercent}%` }
                        ]} 
                      />
                    </View>
                  </View>
                  
                  {/* Dates row */}
                  <View style={styles.habitDatesRow}>
                    <View style={styles.habitDateItem}>
                      <Text style={styles.habitDateLabel}>Start Date</Text>
                      <Text style={styles.habitDateValue}>
                        {new Date(habit.startDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.habitDateItem}>
                      <Text style={styles.habitDateLabel}>Projected End</Text>
                      <Text style={styles.habitDateValue}>{projectedEnd}</Text>
                    </View>
                  </View>
                  
                  {/* Daily completion button */}
                  <TouchableOpacity 
                    style={[
                      styles.habitDailyButton,
                      habit.completedToday && styles.habitDailyButtonCompleted
                    ]}
                    onPress={() => toggleHabitCompletion(habit.id)}
                    disabled={habit.completedToday}
                  >
                    <Icon 
                      name={habit.completedToday ? 'check-circle' : 'check-circle-outline'} 
                      size={24} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.habitDailyButtonText}>
                      {habit.completedToday ? 'Completed Today ✓' : 'Mark as Complete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.swipeableEmptyState}>
          <Icon name="self-improvement" size={48} color={theme.colors.text.secondary} style={styles.emptyIcon} />
          <Text style={styles.emptyStateText}>No active habits</Text>
          <Text style={styles.emptyStateSubtext}>Build healthy routines by adding daily habits</Text>
        </View>
      )}
    </View>
  );

  const renderActiveTodos = () => {
    // Group todos into pages of max 3
    const todosPerPage = 3;
    const todoPages: ActiveTodo[][] = [];
    for (let i = 0; i < activeTodos.length; i += todosPerPage) {
      todoPages.push(activeTodos.slice(i, i + todosPerPage));
    }
    
    const handleDismissTodo = async (todoId: string) => {
      try {
        const updatedTodos = activeTodos.filter(todo => todo.id !== todoId);
        setActiveTodos(updatedTodos);
        await AsyncStorage.setItem('@inzone_todos', JSON.stringify(updatedTodos));
      } catch (error) {
        console.error('Error dismissing todo:', error);
        Alert.alert('Error', 'Failed to dismiss todo');
      }
    };
    
    return (
      <View style={styles.swipeableSection}>
        <Text style={styles.sectionTitle}>Active To-Dos</Text>
        {activeTodos.length > 0 ? (
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={styles.swipeableContainer}
          >
            {todoPages.map((page, pageIndex) => (
              <View key={`todo-page-${pageIndex}`} style={styles.bulletSwipePage}>
                <View style={styles.bulletContainer}>
                  {page.map((todo, index) => (
                    <View 
                      key={todo.id} 
                      style={[
                        styles.bulletItem,
                        index === page.length - 1 && styles.bulletItemLast
                      ]}
                    >
                      <TouchableOpacity 
                        style={styles.bulletCheckbox}
                        onPress={() => toggleTodoCompletion(todo.id)}
                      >
                        <Icon
                          name={todo.completed ? 'check-box' : 'check-box-outline-blank'}
                          size={24}
                          color={todo.completed ? theme.colors.success : theme.colors.text.secondary}
                        />
                      </TouchableOpacity>
                      
                      <View style={styles.bulletContent}>
                        <Text style={styles.bulletTitle}>{todo.title}</Text>
                        {todo.context && (
                          <Text style={styles.bulletContext}>{todo.context}</Text>
                        )}
                        <Text style={styles.bulletDate}>
                          Added: {new Date(todo.entryDate || Date.now()).toLocaleDateString()}
                        </Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.bulletDismissButton}
                        onPress={() => {
                          Alert.alert(
                            'Dismiss To-Do',
                            'Remove this task without completing it?',
                            [
                              { text: 'Dismiss', onPress: () => handleDismissTodo(todo.id), style: 'destructive' },
                              { text: 'Cancel', style: 'cancel' }
                            ]
                          );
                        }}
                      >
                        <Icon name="close" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.swipeableEmptyState}>
            <Icon name="checklist" size={48} color={theme.colors.text.secondary} style={styles.emptyIcon} />
            <Text style={styles.emptyStateText}>No active tasks</Text>
            <Text style={styles.emptyStateSubtext}>Stay organized by adding tasks to your to-do list</Text>
          </View>
        )}
      </View>
    );
  };

  const renderActiveReminders = () => {
    // Group reminders into pages of max 3
    const remindersPerPage = 3;
    const reminderPages: ActiveReminder[][] = [];
    for (let i = 0; i < activeReminders.length; i += remindersPerPage) {
      reminderPages.push(activeReminders.slice(i, i + remindersPerPage));
    }
    
    return (
      <View style={styles.swipeableSection}>
        <Text style={styles.sectionTitle}>Active Reminders</Text>
        {activeReminders.length > 0 ? (
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={styles.swipeableContainer}
          >
            {reminderPages.map((page, pageIndex) => (
              <View key={`reminder-page-${pageIndex}`} style={styles.bulletSwipePage}>
                <View style={styles.bulletContainer}>
                  {page.map((reminder, index) => {
                    const reminderDate = new Date(reminder.scheduledTime);
                    const isToday = reminderDate.toDateString() === new Date().toDateString();
                    const dateStr = isToday ? 'Today' : reminderDate.toLocaleDateString();
                    const timeStr = reminderDate.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true
                    });
                    
                    return (
                      <View 
                        key={reminder.id} 
                        style={[
                          styles.bulletItem,
                          index === page.length - 1 && styles.bulletItemLast
                        ]}
                      >
                        <View style={styles.bulletContent}>
                          <Text style={styles.bulletTitle}>{reminder.title}</Text>
                          {reminder.context && (
                            <Text style={styles.bulletContext}>{reminder.context}</Text>
                          )}
                          <Text style={styles.bulletDate}>
                            Added: {new Date(reminder.entryDate || Date.now()).toLocaleDateString()}
                          </Text>
                          
                          {/* Reminder date/time display */}
                          <View style={styles.bulletReminderTime}>
                            <Icon name="alarm" size={16} color={theme.colors.primary} />
                            <Text style={styles.bulletReminderTimeText}>
                              {dateStr} at {timeStr}
                            </Text>
                          </View>
                          
                          {reminder.recurring !== 'none' && (
                            <View style={[styles.bulletReminderTime, { backgroundColor: theme.colors.secondary + '20' }]}>
                              <Icon name="repeat" size={16} color={theme.colors.secondary} />
                              <Text style={[styles.bulletReminderTimeText, { color: theme.colors.secondary }]}>
                                {reminder.recurring}
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        <TouchableOpacity 
                          style={styles.bulletDismissButton}
                          onPress={() => {
                            Alert.alert(
                              'Cancel Reminder',
                              'This will permanently cancel this reminder.',
                              [
                                { 
                                  text: 'Cancel Reminder', 
                                  onPress: () => handleDisableReminder(reminder.id),
                                  style: 'destructive'
                                },
                                { text: 'Keep', style: 'cancel' }
                              ]
                            );
                          }}
                        >
                          <Icon name="close" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.swipeableEmptyState}>
            <Icon name="notifications-active" size={48} color={theme.colors.text.secondary} style={styles.emptyIcon} />
            <Text style={styles.emptyStateText}>No active reminders</Text>
            <Text style={styles.emptyStateSubtext}>Set up reminders to stay on track</Text>
          </View>
        )}
      </View>
    );
  };

  const renderPhoneUsage = () => {
    if (!hasUsagePermission) {
      return (
        <View style={styles.usageSection}>
          <Text style={styles.usageSectionTitle}>Phone Usage Today</Text>
          <View style={styles.permissionPrompt}>
            <Text style={styles.permissionTitle}>Enable Usage Tracking</Text>
            <Text style={styles.permissionText}>
              Get insights into your daily screen time and app usage patterns to build healthier digital habits.
            </Text>
            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={async () => {
                try {
                  await digitalWellbeingService.requestUsageAccess();
                  // Small delay to ensure permission is processed
                  setTimeout(async () => {
                    const permission = await digitalWellbeingService.canAccessUsageStats();
                    setHasUsagePermission(permission);
                    if (permission) {
                      const stats = await digitalWellbeingService.getTodaysStats();
                      setUsageStats(stats);
                      console.log('Real usage stats loaded:', stats);
                    }
                  }, 1000);
                } catch (error) {
                  console.error('Error requesting permission:', error);
                }
              }}
            >
              <Text style={styles.permissionButtonText}>Enable Access</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (!usageStats) {
      return (
        <View style={styles.usageSection}>
          <Text style={styles.usageSectionTitle}>Phone Usage Today</Text>
          <View style={styles.usageStats}>
            <Text style={styles.loadingText}>Loading usage data...</Text>
          </View>
        </View>
      );
    }

    // Format time from milliseconds to hours and minutes
    const formatTime = (milliseconds: number) => {
      const totalMinutes = Math.floor(milliseconds / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    };

    // Get top 3 apps by usage time
    const topApps = usageStats.apps
      .sort((a, b) => b.timeInForeground - a.timeInForeground)
      .slice(0, 3);

    return (
      <View style={styles.usageSection}>
        <Text style={styles.usageSectionTitle}>Phone Usage Today</Text>
        <View style={styles.usageStats}>
          <View style={styles.usageStat}>
            <Text style={styles.usageValue}>{formatTime(usageStats.totalScreenTime)}</Text>
            <Text style={styles.usageLabel}>Total Screen Time</Text>
          </View>
          <View style={styles.usageStat}>
            <Text style={styles.usageValue}>{usageStats.pickups}</Text>
            <Text style={styles.usageLabel}>Phone Pickups</Text>
          </View>
        </View>
        <View style={styles.topApps}>
          <Text style={styles.topAppsTitle}>Top Apps</Text>
          {topApps.map((app, _index) => {
            const maxTime = topApps[0]?.timeInForeground || 1;
            const widthPercent = Math.max(20, (app.timeInForeground / maxTime) * 100);
            
            return (
              <View key={app.packageName} style={styles.appUsageItem}>
                <View style={[styles.appUsageBar, { width: `${widthPercent}%` }]} />
                <Text style={styles.appUsageText}>
                  {app.appName}: {formatTime(app.timeInForeground)}
                </Text>
              </View>
            );
          })}
        </View>
        <TouchableOpacity style={styles.improveButton}>
          <Text style={styles.improveButtonText}>Improve Focus</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHistoryContent = () => (
    <View>
      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <View style={styles.carouselPanel}>
          <Text style={styles.sectionTitle}>Completed Goals</Text>
          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            {completedGoals
              .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
              .map((goal) => (
                <View key={goal.id} style={styles.historyItem}>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyTitle}>{goal.title}</Text>
                    <Text style={styles.historyDate}>
                      Completed: {new Date(goal.completedAt).toLocaleDateString()} at {new Date(goal.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </Text>
                  </View>
                  <Icon name="check-circle" size={24} color="#34C759" />
                </View>
              ))}
          </ScrollView>
        </View>
      )}

      {/* Completed Habits */}
      {completedHabits.length > 0 && (
        <View style={styles.carouselPanel}>
          <Text style={styles.sectionTitle}>Completed Habits</Text>
          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            {completedHabits
              .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
              .map((habit) => (
                <View key={habit.id} style={styles.historyItem}>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyTitle}>{habit.title}</Text>
                    <Text style={styles.historySubtitle}>
                      Final streak: {habit.finalStreak} days (Target: {habit.targetDays})
                    </Text>
                    <Text style={styles.historyDate}>
                      Completed: {new Date(habit.completedAt).toLocaleDateString()} at {new Date(habit.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </Text>
                  </View>
                  <Icon name="local-fire-department" size={24} color="#FF6B35" />
                </View>
              ))}
          </ScrollView>
        </View>
      )}

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <View style={styles.carouselPanel}>
          <Text style={styles.sectionTitle}>Completed Tasks</Text>
          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            {completedTodos
              .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
              .map((todo) => (
                <View key={todo.id} style={styles.historyItem}>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyTitle}>{todo.title}</Text>
                    <Text style={styles.historyDate}>
                      Completed: {new Date(todo.completedAt).toLocaleDateString()} at {new Date(todo.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </Text>
                  </View>
                  <Icon name="check-box" size={24} color="#34C759" />
                </View>
              ))}
          </ScrollView>
        </View>
      )}

      {/* Journal Entries */}
      {journalEntries.length > 0 && (
        <View style={styles.carouselPanel}>
          <Text style={styles.sectionTitle}>Journal Entries</Text>
          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            {journalEntries
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry) => {
                const isExpanded = expandedItems.has(entry.id);
                return (
                  <TouchableOpacity 
                    key={entry.id} 
                    style={styles.expandableHistoryItem}
                    onPress={() => {
                      const newExpanded = new Set(expandedItems);
                      if (isExpanded) {
                        newExpanded.delete(entry.id);
                      } else {
                        newExpanded.add(entry.id);
                      }
                      setExpandedItems(newExpanded);
                    }}
                  >
                    <View style={styles.historyContent}>
                      <Text style={styles.historyTitle}>Journal Entry</Text>
                      <Text style={styles.historyDate}>
                        {new Date(entry.date).toLocaleDateString()} at {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text 
                        style={styles.historyPreview} 
                        numberOfLines={isExpanded ? 1000 : 2}
                      >
                        {entry.content}
                      </Text>
                    </View>
                    <Text style={styles.expandIcon}>
                      {isExpanded ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View>
      )}

      {/* Empty state */}
      {completedGoals.length === 0 && completedHabits.length === 0 && completedTodos.length === 0 && journalEntries.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No completed items yet</Text>
          <Text style={styles.emptyStateSubtext}>Complete goals, habits, and tasks to see them here</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar - slim, slightly thicker than bottom bar. Notification button on top-left. */}
      <View style={styles.topBarContainer}>
        <TouchableOpacity style={styles.topBarLeftButton} onPress={() => navigation.navigate('Notifications' as never)}>
          {/* Use the same vector icon as BottomBar for visual parity. Size 24 inside 48 container matches BottomBar */}
          <Icon name="notifications" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        {__DEV__ && (
          <>
            <TouchableOpacity style={styles.topBarDebugButton} onPress={() => navigation.navigate('HabitStreakTest' as never)}>
              <Icon name="bug-report" size={20} color={theme.colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topBarResponsiveButton} onPress={() => navigation.navigate('ResponsiveTest' as never)}>
              <Icon name="aspect-ratio" size={18} color={theme.colors.secondary} />
            </TouchableOpacity>
          </>
        )}
        {/* center area with app logo - centered in the top bar */}
        <Image source={require('../../../assets/images/inzone-logo.png')} style={styles.topBarLogo} />
      </View>

      {/* Small hint text between top bar and card - moved into scrollable content so it can scroll away */}

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
        nestedScrollEnabled={true}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={refreshData}
            enabled={!isCardFlipping}
          />
        }
      >
        <View style={styles.topTapHintContainer}>
          <Text style={styles.topTapHintText}>Tap to flip</Text>
        </View>
        
        {/* Render sections in custom order with visibility control */}
        {(() => {
          const carouselSections = enabledSections.filter((s) => 
            ['activeGoals', 'activeHabits', 'activeTodos', 'activeReminders'].includes(s.id)
          );
          const hasCarouselSections = carouselSections.length > 0;
          let carouselRendered = false;
          
          return enabledSections.map((section) => {
            const sectionType = section.id;
            
            switch (sectionType) {
              case 'userCard':
                return <View key={sectionType}>{renderUserCard()}</View>;
              case 'phoneUsage':
                return <View key={sectionType}>{renderPhoneUsage()}</View>;
              case 'activeGoals':
              case 'activeHabits':
              case 'activeTodos':
              case 'activeReminders':
                // Render carousel only once when we encounter the first carousel section
                if (hasCarouselSections && !carouselRendered && carouselSections[0]?.id === sectionType) {
                  carouselRendered = true;
                  return (
                    <View key="carousel-group">
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        nestedScrollEnabled={true}
                        onScroll={(event) => {
                          const offsetX = event.nativeEvent.contentOffset.x;
                          const newIndex = Math.round(offsetX / screenWidth);
                          if (newIndex !== currentCarouselIndex) {
                            setCurrentCarouselIndex(newIndex);
                          }
                        }}
                        scrollEventThrottle={16}
                        style={styles.carousel}
                      >
                        {carouselSections.some(s => s.id === 'activeGoals') && renderActiveGoals()}
                        {carouselSections.some(s => s.id === 'activeHabits') && renderActiveHabits()}
                        {carouselSections.some(s => s.id === 'activeTodos') && renderActiveTodos()}
                        {carouselSections.some(s => s.id === 'activeReminders') && renderActiveReminders()}
                      </ScrollView>

                      {carouselSections.length > 1 && (
                        <View style={styles.carouselIndicator}>
                          {carouselSections.map((_, index: number) => (
                            <View
                              key={index}
                              style={[
                                styles.indicatorDot,
                                currentCarouselIndex === index && styles.indicatorDotActive,
                              ]}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  );
                }
                // Skip other carousel sections since they're rendered in the carousel above
                return null;
              default:
                return null;
            }
          }).filter(Boolean); // Remove null entries
        })()}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: typeof defaultTheme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  // Top bar (slightly thicker than bottom bar)
  topBarContainer: {
    height: 48, // slightly thicker than typical bottom bar (~40)
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    justifyContent: 'center',
  },
  topBarLeftButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    left: 12,
    position: 'absolute',
    width: 48,
    zIndex: 1,
  },
  topBarDebugButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    left: 68,
    position: 'absolute',
    width: 40,
    zIndex: 1,
  },
  topBarResponsiveButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    left: 112,
    position: 'absolute',
    width: 36,
    zIndex: 1,
  },
  topBarButtonIcon: {
    height: 28,
    resizeMode: 'contain',
    tintColor: theme.colors.text.primary,
    width: 28,
  },
  topBarLogo: {
    height: 128,
    resizeMode: 'contain',
    width: 200,
  },

  // Small tap hint between top bar and card
  // Tight tap hint spacing: small gaps to keep it close to top bar and card
  tapHintContainer: {
    alignSelf: 'center',
    marginBottom: 6,
    marginHorizontal: 16,
    marginTop: 6,
  },
  tapHintText: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    opacity: 0.9,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: 'transparent', // Remove background since we use ImageBackground
    marginHorizontal: 16,
  // Small top gap so the tap hint sits close to the card
  marginTop: 4,
    borderRadius: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 580, // Increased to fit all stats
  },
  userCardBackground: {
    borderRadius: 20,
    padding: 24,
    minHeight: 500, // Made bigger
    justifyContent: 'flex-start',
  },
  rankBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
    right: 16,
    top: 12,
  },
  rankText: {
    color: theme.colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 12, // Reduced spacing
  },
  profileImage: {
    width: 100, // Made bigger
    height: 100, // Made bigger
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.text.primary,
  },
  usernameSection: {
    alignItems: 'center',
    marginBottom: 4,
  },
  periodTopLeft: {
    backgroundColor: 'transparent',
    left: 16,
    position: 'absolute',
    top: 12,
  },
  username: {
    fontSize: 16, // Made smaller
    fontWeight: '600',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  overallRating: {
    color: theme.colors.text.primary,
    fontSize: 44,
    fontWeight: '700',
  },
  ratingLabel: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
  },
  statsSection: {
    flexDirection: 'column', // Changed to column for vertical layout
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginVertical: 2,
    backgroundColor: 'transparent', // Removed black background
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  statValue: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  periodToggle: {
    alignItems: 'center',
    marginTop: 16,
  },
  periodText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  ratingSubtextRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  periodTextSmall: {
    fontSize: 12,
    fontWeight: '500',
  },
  tapToFlipContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  tapToFlipText: {
    color: theme.colors.text.tertiary,
    fontSize: 12,
  },
  topTapHintContainer: {
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 6,
  },
  topTapHintText: {
    color: theme.colors.text.tertiary,
    fontSize: 10,
  },
  carousel: {
    flexDirection: 'row',
    height: 350,
    marginTop: 20, // Fixed height to prevent vertical stretching
  },
  carouselPanel: {
    minHeight: 300,
    paddingHorizontal: 16,
    width: screenWidth,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  itemsList: {
    maxHeight: 250,
  },
  goalItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  goalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalTitle: {
    color: theme.colors.text.primary,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  goalDeadline: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  progressBar: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 3,
    height: 6,
    marginBottom: 12,
    marginRight: 16,
  },
  progressFill: {
    backgroundColor: theme.colors.success,
    borderRadius: 3,
    height: '100%',
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  failButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.danger,
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  habitItem: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 16,
  },
  habitCheckbox: {
    marginRight: 12,
  },
  habitContent: {
    flex: 1,
  },
  habitTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  habitStreak: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  habitStreakText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  habitFailButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.danger,
    borderRadius: 6,
    justifyContent: 'center',
    padding: 8,
  },
  todoItem: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 16,
  },
  todoCheckbox: {
    marginRight: 12,
  },
  todoTitle: {
    color: theme.colors.text.primary,
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  todoTitleCompleted: {
    color: theme.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  carouselIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  indicatorDot: {
    backgroundColor: theme.colors.text.tertiary,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  indicatorDotActive: {
    backgroundColor: theme.colors.secondary,
    width: 24,
  },
  usageSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
  },
  usageSectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  usageStat: {
    alignItems: 'center',
  },
  faceContainer: {
    borderRadius: 20,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  backFace: {
    // Place back face above front so rotation works; zIndex may not matter for animated 3D
    zIndex: 0,
  },
  usageValue: {
    color: theme.colors.text.primary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  usageLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  topApps: {
    marginBottom: 16,
  },
  topAppsTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  appUsageItem: {
    marginBottom: 8,
  },
  appUsageBar: {
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    height: 4,
    marginBottom: 4,
    width: '80%',
  },
  appUsageText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  improveButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  improveButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
  },
  permissionPrompt: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  permissionTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyStateText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 120, // Space for bottom navigation
  },
  reminderItem: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  reminderTime: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  reminderTimeText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    marginLeft: theme.spacing.xs,
  },
  reminderRecurring: {
    color: theme.colors.secondary,
    fontSize: 14,
    marginLeft: theme.spacing.xs,
  },
  reminderAction: {
    padding: theme.spacing.sm,
  },
  tabContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 4,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.white,
  },
  historyItem: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 16,
  },
  expandableHistoryItem: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 16,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  historySubtitle: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    marginBottom: 4,
  },
  historyDate: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  historyPreview: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    marginTop: 8,
  },
  expandIcon: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // New swipeable tracking section styles
  swipeableSection: {
    marginBottom: 20,
    marginHorizontal: 16,
    marginTop: 12,
  },
  swipeableContainer: {
    marginTop: 12,
  },
  fullSwipePage: {
    alignItems: 'center',
    justifyContent: 'center',
    width: screenWidth - 32,
  },
  swipeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    elevation: 4,
    padding: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: '100%',
  },
  swipeCardTitle: {
    color: theme.colors.text.primary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  swipeContextSection: {
    backgroundColor: theme.colors.background,
    borderLeftColor: theme.colors.primary,
    borderLeftWidth: 3,
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  swipeContextLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  swipeContextText: {
    color: theme.colors.text.primary,
    fontSize: 15,
    lineHeight: 22,
  },
  swipeInfoRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  swipeInfoItem: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  swipeInfoTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  swipeInfoLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  swipeInfoValue: {
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  swipeActions: {
    flexDirection: 'column',
    gap: 12,
  },
  swipeCompleteButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  swipeDismissButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.danger,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  swipeActionButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  swipeableEmptyState: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 200,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  // Habit-specific swipe styles
  habitSwipeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  habitDismissButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.danger,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  habitStreakInfo: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  habitStreakRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  habitStreakNumber: {
    color: theme.colors.primary,
    fontSize: 36,
    fontWeight: '700',
    marginLeft: 12,
  },
  habitProgressBar: {
    backgroundColor: theme.colors.border,
    borderRadius: 8,
    height: 12,
    marginTop: 8,
    overflow: 'hidden',
    width: '100%',
  },
  habitProgressFill: {
    backgroundColor: theme.colors.primary,
    height: '100%',
  },
  habitDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  habitDateItem: {
    flex: 1,
    paddingHorizontal: 4,
  },
  habitDateLabel: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    marginBottom: 4,
  },
  habitDateValue: {
    color: theme.colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  habitDailyButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    paddingVertical: 14,
  },
  habitDailyButtonCompleted: {
    backgroundColor: theme.colors.success,
  },
  habitDailyButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Todo/Reminder bullet styles
  bulletSwipePage: {
    width: screenWidth - 32,
  },
  bulletContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    elevation: 4,
    padding: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bulletItem: {
    backgroundColor: theme.colors.background,
    borderLeftColor: theme.colors.primary,
    borderLeftWidth: 4,
    borderRadius: 10,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 14,
  },
  bulletItemLast: {
    marginBottom: 0,
  },
  bulletCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  bulletContent: {
    flex: 1,
  },
  bulletTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  bulletContext: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  bulletDate: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  bulletDismissButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.danger,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginLeft: 12,
    width: 24,
  },
  bulletReminderTime: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 6,
    flexDirection: 'row',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bulletReminderTimeText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
});