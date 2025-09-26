import React, { useState, useEffect, useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import { View, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import screens
import { DashboardScreen as DashboardScreenNew } from '../modules/dashboard/DashboardScreenNew';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { HistoryScreen } from '../modules/history/HistoryScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { FocusSessionScreen } from '../screens/FocusSessionScreen';
import { GoalEntryPage } from '../screens/GoalEntryPage';
import { JournalEntryPage } from '../screens/JournalEntryPage';
import { RemindersCreationPage } from '../screens/RemindersCreationPage';
import { ToDoCreationPage } from '../screens/ToDoCreationPage';
import { SocialEntriesPage } from '../screens/SocialEntriesPage';
import { HabitsCreationPage } from '../screens/HabitsCreationPage';
import PointsHistoryScreen from '../screens/PointsHistoryScreen';
import DashboardCustomizationScreen from '../screens/DashboardCustomizationScreen';
// Journals/new-entry UI has been removed. Navigation will point to History for journaling access.

// Import components
import { BottomBar } from '../components/BottomBar';
import { CircularMenu } from '../components/CircularMenu';
import { RightSidebar } from '../components/RightSidebar';

// Import services and utilities
import { theme } from '../config/theme';
import { AuthProvider } from '../modules/auth/AuthProvider';
import { UserStatsService } from '../services/userStatsService';
import themeService from '../services/themeService';
import { useTheme } from '../contexts/ThemeContext';

type ScreenName = 
  'Dashboard' | 'Leaderboard' | 'History' | 'Achievements' | 'Profile' | 'Settings' | 'Goals' | 'Journals';

type RootStackParamList = {
  Main: undefined;
  GoalEntry: undefined;
  JournalEntry: undefined;
  ReminderEntry: undefined;
  TodoEntry: undefined;
  SocialEntry: undefined;
  HabitEntry: undefined;
};

export const MainNavigator: React.FC = () => {
  const { theme } = useTheme();
  const Stack = createNativeStackNavigator<RootStackParamList>();

  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        
        <Stack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="GoalEntry" component={GoalEntryPage} />
          <Stack.Screen name="JournalEntry" component={JournalEntryPage} />
          <Stack.Screen name="ReminderEntry" component={RemindersCreationPage} />
          <Stack.Screen name="TodoEntry" component={ToDoCreationPage} />
          <Stack.Screen name="SocialEntry" component={SocialEntriesPage} />
          <Stack.Screen name="HabitEntry" component={HabitsCreationPage} />
        </Stack.Navigator>
        
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

// Main Screen component that handles the custom navigation system
const MainScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeScreen, setActiveScreen] = useState<ScreenName>('Dashboard');
  // local state used to force re-render when theme changes
  const [, setThemeVersion] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [isCircularMenuOpen, setIsCircularMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFocusSessionOpen, setIsFocusSessionOpen] = useState(false);
  const [isPointsHistoryOpen, setIsPointsHistoryOpen] = useState(false);
  const [isDashboardCustomizationOpen, setIsDashboardCustomizationOpen] = useState(false);

  // Load real streak data
  useEffect(() => {
    const loadStreak = async () => {
      try {
        const streak = await UserStatsService.getDailyStreak();
        setStreakCount(streak);
      } catch (error) {
        console.error('Error loading streak:', error);
      }
    };
    
    loadStreak();
    // Apply saved theme preset if any
    themeService.applyPresetIfSaved().catch(console.error);

    // Register theme change listener so navigator (and children) re-render
    const unregister = themeService.registerThemeChangeListener(() => {
      setThemeVersion(v => v + 1);
    });

    return () => unregister();
  }, []);

  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Calculate center position for circular menu - align with bottom bar streak button
  const centerX = screenWidth / 2; // Center horizontally with streak button
  const centerY = screenHeight - 84 - 42 - 60; // Bottom bar height (84) + half streak button (42) + menu spacing (60)

  const handleNavigate = (screen: string) => {
    if (screen === 'Sidebar') {
      setIsSidebarOpen(true);
      return;
    }
    
    setActiveScreen(screen as ScreenName);
  };

  const handleToggleCircularMenu = () => {
    setIsCircularMenuOpen(!isCircularMenuOpen);
  };

  const handleCircularMenuSelect = (itemId: string) => {
    console.log(`Selected circular menu item: ${itemId}`);
    
    switch (itemId) {
      case 'focus':
        setIsFocusSessionOpen(true);
        break;
      case 'goals':
        navigation.navigate('GoalEntry');
        break;
      case 'journaling':
        navigation.navigate('JournalEntry');
        break;
      case 'reminders':
        navigation.navigate('ReminderEntry');
        break;
      case 'todo':
        navigation.navigate('TodoEntry');
        break;
      case 'social':
        navigation.navigate('SocialEntry');
        break;
      case 'habit':
        navigation.navigate('HabitEntry');
        break;
      default:
        console.log(`Unhandled menu item: ${itemId}`);
    }
    
    setIsCircularMenuOpen(false);
  };

  const handleSidebarNavigate = (screen: string) => {
    if (screen === 'pointsHistory') {
      setIsPointsHistoryOpen(true);
    } else if (screen === 'dashboardCustomization') {
      setIsDashboardCustomizationOpen(true);
    } else {
      setActiveScreen(screen as ScreenName);
    }
  };

  // Handle Android hardware back button presses to close overlays or go back to Dashboard
  const handleHardwareBack = useCallback(() => {
    console.log('[MainNavigator] hardwareBack pressed', { isSidebarOpen, isCircularMenuOpen, isFocusSessionOpen, isPointsHistoryOpen, isDashboardCustomizationOpen, activeScreen });
    // Priority: close sidebar -> close circular menu -> close focus modal -> close points/history/customization -> go to Dashboard
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
      return true;
    }

    if (isCircularMenuOpen) {
      setIsCircularMenuOpen(false);
      return true;
    }

    if (isFocusSessionOpen) {
      // Let the FocusSessionScreen handle its own back navigation (e.g., setup -> selection)
      // Return false so child listeners can handle the event first.
      console.log('[MainNavigator] deferring to FocusSessionScreen for back handling');
      return false;
    }

    if (isPointsHistoryOpen) {
      setIsPointsHistoryOpen(false);
      return true;
    }

    if (isDashboardCustomizationOpen) {
      setIsDashboardCustomizationOpen(false);
      return true;
    }

    // If we're not on the dashboard, navigate back to it
    if (activeScreen !== 'Dashboard') {
      setActiveScreen('Dashboard');
      return true;
    }

    // Let the OS handle the back button (exit app) when on dashboard
    return false;
  }, [isSidebarOpen, isCircularMenuOpen, isFocusSessionOpen, isPointsHistoryOpen, isDashboardCustomizationOpen, activeScreen]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
      return () => sub.remove();
    }

    return;
  }, [handleHardwareBack]);

  const renderCurrentScreen = () => {
    switch (activeScreen) {
      case 'Dashboard':
        return <DashboardScreenNew />;
      case 'Leaderboard':
        return <LeaderboardScreen />;
      case 'History':
        return <HistoryScreen />;
      case 'Achievements':
        return <AchievementsScreen visible={true} onClose={() => setActiveScreen('Dashboard')} />;
      case 'Profile':
        return <ProfileScreen visible={true} onClose={() => setActiveScreen('Dashboard')} />;
      case 'Settings':
        return (
          <SettingsScreen
            visible={true}
            onClose={() => setActiveScreen('Dashboard')}
            onOpenCustomization={() => setIsDashboardCustomizationOpen(true)}
          />
        );
      case 'Goals':
        // Goals screen removed; redirect to Dashboard for now
        return <DashboardScreenNew />;
      case 'Journals':
        // Redirect journaling circular menu to the History screen (journal history)
        return <HistoryScreen />;
      default:
        return <DashboardScreenNew />;
    }
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.colors.background} 
        translucent={false}
      />
      
      <View style={styles.screenContainer}>
        {renderCurrentScreen()}
      </View>

      <BottomBar
        streakCount={streakCount}
        onNavigate={handleNavigate}
        onToggleMenu={handleToggleCircularMenu}
        activeScreen={activeScreen}
      />

      <CircularMenu
        isOpen={isCircularMenuOpen}
        onClose={() => setIsCircularMenuOpen(false)}
          onSelect={handleCircularMenuSelect}
          centerX={centerX}
          centerY={centerY}
        />

        <RightSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNavigate={handleSidebarNavigate}
        />

        <FocusSessionScreen
          visible={isFocusSessionOpen}
          onClose={() => setIsFocusSessionOpen(false)}
          onOpenGoals={() => navigation.navigate('GoalEntry')}
        />
        
        {isPointsHistoryOpen && (
          <PointsHistoryScreen
            visible={isPointsHistoryOpen}
            onClose={() => setIsPointsHistoryOpen(false)}
          />
        )}
        
        {isDashboardCustomizationOpen && (
          <DashboardCustomizationScreen
            visible={isDashboardCustomizationOpen}
            onClose={() => setIsDashboardCustomizationOpen(false)}
            onSave={() => {
              setIsDashboardCustomizationOpen(false);
              // Refresh dashboard here if needed
            }}
          />
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});