import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Dimensions,
  Platform,
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
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
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
import type { DashboardSectionType } from '../../services/DashboardCustomizationService';

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

export const DashboardScreen: React.FC = () => {
  const { session } = useAuth();
  const { 
    enabledSections, 
    loading: sectionsLoading, 
    isSectionEnabled, 
    getSectionOrder,
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
  const [userRank, setUserRank] = useState('Bronze');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usageStats, setUsageStats] = useState<DigitalWellbeingStats | null>(null);
  const [hasUsagePermission, setHasUsagePermission] = useState(false);

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

      setActiveHabits([]);
      setActiveTodos([]);
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
  const carouselTranslateX = useSharedValue(0);

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

  const updateCarouselIndex = (index: number) => {
    setCurrentCarouselIndex(index);
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      // Only track horizontal movement when it's clearly dominant to avoid interfering with vertical scroll
      if (Math.abs(event.translationX) > Math.abs(event.translationY) * 1.2) {
        carouselTranslateX.value = currentCarouselIndex * -screenWidth + event.translationX;
      }
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      // Require a larger swipe to change panel so vertical scrolls don't trigger it accidentally
      const threshold = screenWidth * 0.45;
      const absX = Math.abs(event.translationX);

      if ((absX > threshold && Math.abs(event.translationX) > Math.abs(event.translationY) * 1.2) || Math.abs(velocity) > 800) {
        if (event.translationX > 0) {
          // Swipe right - go to previous
          if (currentCarouselIndex > 0) {
            const newIndex = currentCarouselIndex - 1;
            carouselTranslateX.value = withSpring(newIndex * -screenWidth);
            runOnJS(updateCarouselIndex)(newIndex);
          } else {
            carouselTranslateX.value = withSpring(0);
          }
        } else {
          // Swipe left - go to next
          if (currentCarouselIndex < 2) {
            const newIndex = currentCarouselIndex + 1;
            carouselTranslateX.value = withSpring(newIndex * -screenWidth);
            runOnJS(updateCarouselIndex)(newIndex);
          } else {
            carouselTranslateX.value = withSpring(currentCarouselIndex * -screenWidth);
          }
        }
      } else {
        carouselTranslateX.value = withSpring(currentCarouselIndex * -screenWidth);
      }
    });

  const carouselAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: carouselTranslateX.value }],
  }));

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
                      } catch (err) {
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
                      } catch (err) {
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
                <TouchableOpacity style={styles.completeButton}>
                  <Icon name="check" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Complete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.failButton}>
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
              <TouchableOpacity style={styles.habitCheckbox}>
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
              <TouchableOpacity style={styles.todoCheckbox}>
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
          {topApps.map((app, index) => {
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} />}
      >
        <View style={styles.topTapHintContainer}>
          <Text style={styles.topTapHintText}>Tap to flip</Text>
        </View>
        
        {/* Render sections in custom order with visibility control */}
        {getSortedSections().map((section) => {
          const sectionType = section.id;
          
          switch (sectionType) {
            case 'userCard':
              return <View key={sectionType}>{renderUserCard()}</View>;
            case 'phoneUsage':
              return <View key={sectionType}>{renderPhoneUsage()}</View>;
            case 'activeGoals':
            case 'activeHabits':
            case 'activeTodos':
              // For carousel sections, render as a group
              if (sectionType === 'activeGoals') {
                const carouselSections = getSortedSections().filter((s) => 
                  ['activeGoals', 'activeHabits', 'activeTodos'].includes(s.id)
                );
                
                if (carouselSections.length === 0) return null;
                
                return (
                  <View key="carousel-group">
                    <GestureDetector gesture={pan}>
                      <Animated.View style={[styles.carousel, carouselAnimatedStyle]}>
                        {carouselSections.some(s => s.id === 'activeGoals') && renderActiveGoals()}
                        {carouselSections.some(s => s.id === 'activeHabits') && renderActiveHabits()}
                        {carouselSections.some(s => s.id === 'activeTodos') && renderActiveTodos()}
                      </Animated.View>
                    </GestureDetector>

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
              return null; // Already handled in the carousel group
            default:
              return null;
          }
        })}

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
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
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
    height: 48,
    width: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  topBarButtonIcon: {
    width: 28,
    height: 28,
    tintColor: theme.colors.text.primary,
    resizeMode: 'contain',
  },
  topBarCenter: {
    flex: 1,
  },

  // Small tap hint between top bar and card
  // Tight tap hint spacing: small gaps to keep it close to top bar and card
  tapHintContainer: {
    alignSelf: 'center',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
  },
  tapHintText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    opacity: 0.9,
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
    position: 'absolute',
    top: 12,
    right: 16,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rankText: {
    color: '#FFFFFF',
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
    borderColor: '#FFFFFF',
  },
  usernameSection: {
    alignItems: 'center',
    marginBottom: 4,
  },
  periodTopLeft: {
    position: 'absolute',
    top: 12,
    left: 16,
    backgroundColor: 'transparent',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  topTapHintContainer: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  topTapHintText: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
  carousel: {
    flexDirection: 'row',
    marginTop: 20,
  },
  carouselPanel: {
    width: screenWidth,
    paddingHorizontal: 16,
    minHeight: 300,
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
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  goalDeadline: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 3,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 3,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  failButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  habitStreakText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  todoCheckbox: {
    marginRight: 12,
  },
  todoTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.secondary,
  },
  carouselIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.text.tertiary,
  },
  indicatorDotActive: {
    backgroundColor: '#0000FF',
    width: 24,
  },
  usageSection: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
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
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    marginBottom: 4,
    width: '80%',
  },
  appUsageText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  improveButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  improveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 120, // Space for bottom navigation
  },
});