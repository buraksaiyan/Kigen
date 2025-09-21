import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../config/theme';
import { useAuth } from '../auth/AuthProvider';
import { UserStatsService } from '../../services/userStatsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const currentStats = isMonthly ? monthlyStats : allTimeStats;
  const username = session?.user?.email?.split('@')[0] || 'User';

  // Load real data
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load monthly stats
        const monthlyRating = await UserStatsService.getCurrentRating();
        const mappedMonthlyStats: UserStats = {
          discipline: monthlyRating.stats.DIS,
          focus: monthlyRating.stats.FOC,
          journaling: monthlyRating.stats.JOU,
          determination: monthlyRating.stats.USA, // Using USA for determination
          productivity: monthlyRating.stats.MEN, // Using MEN for productivity
          mental: monthlyRating.stats.MEN,
          physical: monthlyRating.stats.PHY,
          social: monthlyRating.stats.USA, // Using USA for social
          overallRating: monthlyRating.overallRating,
        };
        setMonthlyStats(mappedMonthlyStats);
        
        // Load all-time stats (simplified - using monthly for now)
        setAllTimeStats(mappedMonthlyStats);
        
        // Load active goals
        const goalsData = await AsyncStorage.getItem('@kigen_goals');
        if (goalsData) {
          const goals = JSON.parse(goalsData);
          const activeGoalsData = goals
            .filter((goal: any) => !goal.completed && !goal.failed)
            .slice(0, 3) // Limit to 3
            .map((goal: any) => ({
              id: goal.id,
              title: goal.title,
              progress: 0.5, // Mock progress for now
              deadline: '2025-12-31', // Mock deadline
            }));
          setActiveGoals(activeGoalsData);
        }
        
        // For now, keep habits and todos empty
        setActiveHabits([]);
        setActiveTodos([]);
        
        // Set user rank based on rating
        setUserRank(monthlyRating.cardTier);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const flipRotation = useSharedValue(0);
  const carouselTranslateX = useSharedValue(0);

  const handleCardFlip = useCallback(() => {
    if (isCardFlipping) return;
    
    setIsCardFlipping(true);
    flipRotation.value = withSpring(
      flipRotation.value + 180,
      { damping: 15, stiffness: 100 },
      () => {
        setIsMonthly(!isMonthly);
        setIsCardFlipping(false);
      }
    );
  }, [isMonthly, isCardFlipping]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipRotation.value,
      [0, 90, 180],
      [0, 90, 180],
      Extrapolate.CLAMP
    );
    
    const scaleX = interpolate(
      flipRotation.value % 180,
      [0, 90, 180],
      [1, 0, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scaleX },
      ],
    };
  });

  const updateCarouselIndex = (index: number) => {
    setCurrentCarouselIndex(index);
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      carouselTranslateX.value = currentCarouselIndex * -screenWidth + event.translationX;
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const threshold = screenWidth * 0.3;
      
      if (Math.abs(event.translationX) > threshold || Math.abs(velocity) > 500) {
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

  const renderUserCard = () => (
    <TouchableOpacity onPress={handleCardFlip} activeOpacity={0.9}>
      <Animated.View style={[styles.userCard, cardAnimatedStyle]}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{userRank}</Text>
        </View>
        
        <View style={styles.profileSection}>
          <Image
            source={{ uri: 'https://via.placeholder.com/80x80' }}
            style={styles.profileImage}
          />
          <Text style={styles.username}>{username}</Text>
        </View>

        {loading || !currentStats ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading stats...</Text>
          </View>
        ) : (
          <>
            <View style={styles.ratingSection}>
              <Text style={styles.overallRating}>{currentStats.overallRating}</Text>
              <Text style={styles.ratingLabel}>Overall Rating</Text>
            </View>

            <View style={styles.statsSection}>
              <View style={styles.statsColumn}>
                <StatItem label="Discipline" value={currentStats.discipline} />
                <StatItem label="Focus" value={currentStats.focus} />
                <StatItem label="Journaling" value={currentStats.journaling} />
                <StatItem label="Determination" value={currentStats.determination} />
              </View>
              <View style={styles.statsColumn}>
                <StatItem label="Productivity" value={currentStats.productivity} />
                <StatItem label="Mental" value={currentStats.mental} />
                <StatItem label="Physical" value={currentStats.physical} />
                <StatItem label="Social" value={currentStats.social} />
              </View>
            </View>

            <View style={styles.periodToggle}>
              <Text style={styles.periodText}>
                {isMonthly ? 'Monthly Stats' : 'All-Time Stats'}
              </Text>
            </View>
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );

  const renderActiveGoals = () => (
    <View style={styles.carouselPanel}>
      <Text style={styles.sectionTitle}>Active Goals</Text>
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {activeGoals.map((goal) => (
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
        ))}
      </ScrollView>
    </View>
  );

  const renderActiveHabits = () => (
    <View style={styles.carouselPanel}>
      <Text style={styles.sectionTitle}>Active Habits</Text>
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {activeHabits.map((habit) => (
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
        ))}
      </ScrollView>
    </View>
  );

  const renderActiveTodos = () => (
    <View style={styles.carouselPanel}>
      <Text style={styles.sectionTitle}>Active To-Do Lists</Text>
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {activeTodos.map((todo) => (
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
        ))}
      </ScrollView>
    </View>
  );

  const renderPhoneUsage = () => (
    <View style={styles.usageSection}>
      <Text style={styles.usageSectionTitle}>Phone Usage Today</Text>
      <View style={styles.usageStats}>
        <View style={styles.usageStat}>
          <Text style={styles.usageValue}>4h 32m</Text>
          <Text style={styles.usageLabel}>Total Screen Time</Text>
        </View>
        <View style={styles.usageStat}>
          <Text style={styles.usageValue}>127</Text>
          <Text style={styles.usageLabel}>App Opens</Text>
        </View>
      </View>
      <View style={styles.topApps}>
        <Text style={styles.topAppsTitle}>Top Apps</Text>
        <View style={styles.appUsageItem}>
          <View style={styles.appUsageBar} />
          <Text style={styles.appUsageText}>Social Media: 1h 45m</Text>
        </View>
        <View style={styles.appUsageItem}>
          <View style={[styles.appUsageBar, { width: '60%' }]} />
          <Text style={styles.appUsageText}>Entertainment: 1h 12m</Text>
        </View>
        <View style={styles.appUsageItem}>
          <View style={[styles.appUsageBar, { width: '40%' }]} />
          <Text style={styles.appUsageText}>Productivity: 52m</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.improveButton}>
        <Text style={styles.improveButtonText}>Improve Focus</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {renderUserCard()}

        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.carousel, carouselAnimatedStyle]}>
            {renderActiveGoals()}
            {renderActiveHabits()}
            {renderActiveTodos()}
          </Animated.View>
        </GestureDetector>

        <View style={styles.carouselIndicator}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.indicatorDot,
                currentCarouselIndex === index && styles.indicatorDotActive,
              ]}
            />
          ))}
        </View>

        {renderPhoneUsage()}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const StatItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
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
  userCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 400,
  },
  rankBadge: {
    position: 'absolute',
    top: 16,
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
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  username: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  overallRating: {
    color: theme.colors.text.primary,
    fontSize: 48,
    fontWeight: '700',
  },
  ratingLabel: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsColumn: {
    flex: 1,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
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
    backgroundColor: theme.colors.primary,
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
    backgroundColor: theme.colors.primary,
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
  bottomSpacer: {
    height: 120, // Space for bottom navigation
  },
});