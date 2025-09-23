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
import { theme } from '../../config/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../auth/AuthProvider';
import { UserStatsService } from '../../services/userStatsService';
import { digitalWellbeingService, DigitalWellbeingStats } from '../../services/digitalWellbeingService';
import { RatingSystem } from '../../services/ratingSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useDashboardSections } from '../../hooks/useDashboardSections';

const { width: screenWidth } = Dimensions.get('window');

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
}

interface ActiveHabit {
  id: string;
  title: string;
  streak: number;
  completedToday: boolean;
}

interface ActiveTodo {
  id: string;
  title: string;
  completed: boolean;
}

interface ActiveReminder {
  id: string;
  title: string;
  scheduledTime: string;
  recurring: string;
}

export const DashboardScreen: React.FC = () => {
  const { session } = useAuth();
  const { 
    getSortedSections,
    refreshSections 
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
  const [usageStats, setUsageStats] = useState<DigitalWellbeingStats | null>(null);
  const [hasUsagePermission, setHasUsagePermission] = useState(false);

  const toggleTodoCompletion = async (todoId: string) => {
    try {
      const updatedTodos = activeTodos.map(todo => 
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      );
      setActiveTodos(updatedTodos);
      
      // Update in AsyncStorage
      await AsyncStorage.setItem('@kigen_todos', JSON.stringify(updatedTodos));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const toggleHabitCompletion = async (habitId: string) => {
    try {
      const updatedHabits = activeHabits.map(habit => 
        habit.id === habitId ? { ...habit, completedToday: !habit.completedToday } : habit
      );
      setActiveHabits(updatedHabits);
      
      // Update in AsyncStorage
      await AsyncStorage.setItem('@kigen_habits', JSON.stringify(updatedHabits));
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const completeGoal = async (goalId: string) => {
    try {
      const updatedGoals = activeGoals.map(goal => 
        goal.id === goalId ? { ...goal, completed: true, completedAt: new Date().toISOString() } : goal
      );
      setActiveGoals(updatedGoals);
      
      // Update in AsyncStorage
      await AsyncStorage.setItem('@kigen_goals', JSON.stringify(updatedGoals));
    } catch (error) {
      console.error('Error completing goal:', error);
    }
  };

  const failGoal = async (goalId: string) => {
    try {
      const updatedGoals = activeGoals.map(goal => 
        goal.id === goalId ? { ...goal, failed: true, failedAt: new Date().toISOString() } : goal
      );
      setActiveGoals(updatedGoals);
      
      // Update in AsyncStorage
      await AsyncStorage.setItem('@kigen_goals', JSON.stringify(updatedGoals));
    } catch (error) {
      console.error('Error failing goal:', error);
    }
  };

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
        productivity: monthlyRating.stats.MEN,
        mental: monthlyRating.stats.MEN,
        physical: monthlyRating.stats.PHY,
        social: monthlyRating.stats.DET,
        overallRating: monthlyRating.overallRating,
      };
      setMonthlyStats(mappedMonthlyStats);
      setAllTimeStats(mappedMonthlyStats);

      const goalsData = await AsyncStorage.getItem('@kigen_goals');
      if (goalsData) {
        const goals = JSON.parse(goalsData);
        const activeGoalsData = goals
          .filter((goal: any) => !goal.completed && !goal.failed)
          .slice(0, 3)
          .map((goal: any) => ({ id: goal.id, title: goal.title, progress: 0.5, deadline: '2025-12-31' }));
        setActiveGoals(activeGoalsData);
      }

      // Load active habits
      const habitsData = await AsyncStorage.getItem('@kigen_habits');
      if (habitsData) {
        const habits = JSON.parse(habitsData);
        const activeHabitsData = habits
          .filter((habit: any) => habit.isActive)
          .slice(0, 3)
          .map((habit: any) => ({ 
            id: habit.id, 
            title: habit.title, 
            streak: habit.streak || 0,
            completedToday: habit.lastCompleted === new Date().toDateString()
          }));
        setActiveHabits(activeHabitsData);
      }

      // Load active todos
      const todosData = await AsyncStorage.getItem('@kigen_todos');
      if (todosData) {
        const todos = JSON.parse(todosData);
        const activeTodosData = todos
          .filter((todo: any) => !todo.completed)
          .slice(0, 3)
          .map((todo: any) => ({ id: todo.id, title: todo.title, completed: false }));
        setActiveTodos(activeTodosData);
      }

      // Load active reminders
      const remindersData = await AsyncStorage.getItem('@kigen_reminders');
      if (remindersData) {
        const reminders = JSON.parse(remindersData);
        const activeRemindersData = reminders
          .filter((reminder: any) => reminder.isActive)
          .slice(0, 3)
          .map((reminder: any) => ({ 
            id: reminder.id, 
            title: reminder.title, 
            scheduledTime: reminder.scheduledTime,
            recurring: reminder.recurring
          }));
        setActiveReminders(activeRemindersData);
      }

      // Load canonical user profile from UserStatsService (falls back to AsyncStorage keys)
      try {
        const userProfile = await UserStatsService.getUserProfile();
        if (userProfile) {
          if (userProfile.profileImage) setProfileImageUri(userProfile.profileImage);
          if (userProfile.username) setDisplayName(userProfile.username);
        } else {
          // Fallback to legacy keys
          const saved = await AsyncStorage.getItem('@kigen_profile_image');
          if (saved) setProfileImageUri(saved);
          const savedName = await AsyncStorage.getItem('@kigen_profile_name');
          if (savedName) setDisplayName(savedName);
        }
      } catch (e) {
        console.error('Error loading user profile', e);
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

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadDashboardData();
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
      await refreshSections();
    } catch (e) {
      console.error('Error refreshing dashboard', e);
    } finally {
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
  const secondaryTextColor = textColor === '#000000' ? '#666666' : '#CCCCCC';

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
                        await AsyncStorage.setItem('@kigen_profile_image', uri);
                      }
                      setProfileImageUri(uri);
                    }
                  } catch (e) {
                    console.error('Image pick error', e);
                  }
                }}>
                  <Image
                    source={{ uri: profileImageUri || session?.user?.user_metadata?.avatar_url || 'https://via.placeholder.com/100x100' }}
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
                        await AsyncStorage.setItem('@kigen_profile_image', uri);
                      }
                      setProfileImageUri(uri);
                    }
                  } catch (e) {
                    console.error('Image pick error', e);
                  }
                }}>
                  <Image
                    source={{ uri: profileImageUri || session?.user?.user_metadata?.avatar_url || 'https://via.placeholder.com/100x100' }}
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
    <View style={styles.carouselPanel}>
      <Text style={styles.sectionTitle}>Active Goals</Text>
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {activeGoals.length > 0 ? (
          activeGoals.map((goal) => (
            <View key={goal.id} style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalDeadline}>{goal.deadline}</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${goal.progress * 100}%` }]} />
              </View>
              <View style={styles.goalActions}>
                <TouchableOpacity 
                  style={styles.completeButton}
                  onPress={() => completeGoal(goal.id)}
                >
                  <Icon name="check" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Complete</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.failButton}
                  onPress={() => failGoal(goal.id)}
                >
                  <Icon name="close" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Fail</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No active goals yet</Text>
            <Text style={styles.emptyStateSubtext}>Set your first goal to get started!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderActiveHabits = () => (
    <View style={styles.carouselPanel}>
      <Text style={styles.sectionTitle}>Active Habits</Text>
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {activeHabits.length > 0 ? (
          activeHabits.map((habit) => (
            <View key={habit.id} style={styles.habitItem}>
              <TouchableOpacity 
                style={styles.habitCheckbox}
                onPress={() => toggleHabitCompletion(habit.id)}
              >
                <Icon
                  name={habit.completedToday ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={habit.completedToday ? theme.colors.success : theme.colors.text.secondary}
                />
              </TouchableOpacity>
              <View style={styles.habitContent}>
                <Text style={styles.habitTitle}>{habit.title}</Text>
                <View style={styles.habitStreak}>
                  <Icon name="local-fire-department" size={16} color="#FF6B35" />
                  <Text style={styles.habitStreakText}>{habit.streak} days</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No active habits yet</Text>
            <Text style={styles.emptyStateSubtext}>Build healthy routines by adding daily habits</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderActiveTodos = () => (
    <View style={styles.carouselPanel}>
      <Text style={styles.sectionTitle}>Active To-Do Lists</Text>
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {activeTodos.length > 0 ? (
          activeTodos.map((todo) => (
            <View key={todo.id} style={styles.todoItem}>
              <TouchableOpacity 
                style={styles.todoCheckbox}
                onPress={() => toggleTodoCompletion(todo.id)}
              >
                <Icon
                  name={todo.completed ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={todo.completed ? theme.colors.success : theme.colors.text.secondary}
                />
              </TouchableOpacity>
              <Text style={[
                styles.todoTitle,
                todo.completed && styles.todoTitleCompleted
              ]}>
                {todo.title}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No active tasks</Text>
            <Text style={styles.emptyStateSubtext}>Stay organized by adding tasks to your to-do list</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderActiveReminders = () => (
    <View style={styles.carouselPanel}>
      <Text style={styles.sectionTitle}>Active Reminders</Text>
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {activeReminders.length > 0 ? (
          activeReminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderItem}>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>{reminder.title}</Text>
                <View style={styles.reminderTime}>
                  <Icon name="schedule" size={16} color={theme.colors.text.secondary} />
                  <Text style={styles.reminderTimeText}>
                    {new Date(reminder.scheduledTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                  {reminder.recurring !== 'none' && (
                    <Text style={styles.reminderRecurring}>
                      • {reminder.recurring}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.reminderAction}>
                <Icon name="notifications-off" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No active reminders</Text>
            <Text style={styles.emptyStateSubtext}>Set up reminders to stay on track</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar - slim, slightly thicker than bottom bar. Notification button on top-left. */}
      <View style={styles.topBarContainer}>
        <TouchableOpacity style={styles.topBarLeftButton} onPress={() => Alert.alert('Notifications', 'No new notifications')}>
          {/* Use the same vector icon as BottomBar for visual parity. Size 24 inside 48 container matches BottomBar */}
          <Icon name="notifications" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        {/* center area left empty for app name (to be added later) */}
        <View style={styles.topBarCenter} />
      </View>

      {/* Small hint text between top bar and card - moved into scrollable content so it can scroll away */}

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
        nestedScrollEnabled={true}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} />}
      >
        <View style={styles.topTapHintContainer}>
          <Text style={styles.topTapHintText}>Tap to flip</Text>
        </View>
        
        {/* Render sections in custom order with visibility control */}
        {(() => {
          const carouselSections = getSortedSections().filter((s) => 
            ['activeGoals', 'activeHabits', 'activeTodos', 'activeReminders'].includes(s.id)
          );
          const hasCarouselSections = carouselSections.length > 0;
          let carouselRendered = false;
          
          return getSortedSections().map((section) => {
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

const styles = StyleSheet.create({
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
  },
  topBarLeftButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  topBarButtonIcon: {
    height: 28,
    resizeMode: 'contain',
    tintColor: theme.colors.text.primary,
    width: 28,
  },
  topBarCenter: {
    flex: 1,
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
    shadowColor: '#000',
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
    marginTop: 20,
    height: 350, // Fixed height to prevent vertical stretching
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
    color: '#FFFFFF',
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
    backgroundColor: '#0000FF',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  reminderTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderTimeText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  reminderRecurring: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginLeft: theme.spacing.xs,
  },
  reminderAction: {
    padding: theme.spacing.sm,
  },
});