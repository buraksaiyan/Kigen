import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import screens
import { DashboardScreen as DashboardScreenNew } from '../modules/dashboard/DashboardScreenNew';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { HistoryScreen } from '../modules/history/HistoryScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { FocusSessionScreen } from '../screens/FocusSessionScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { JournalsEntryScreen } from '../screens/JournalsEntryScreen';

// Import components
import { BottomBar } from '../components/BottomBar';
import { CircularMenu } from '../components/CircularMenu';
import { RightSidebar } from '../components/RightSidebar';

// Import services and utilities
import { theme } from '../config/theme';
import { AuthProvider } from '../modules/auth/AuthProvider';
import { UserStatsService } from '../services/userStatsService';

const Stack = createNativeStackNavigator();

  type ScreenName = 'Dashboard' | 'Leaderboard' | 'History' | 'Achievements' | 'Profile' | 'Settings' | 'Goals' | 'Journals';

export const MainNavigator: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<ScreenName>('Dashboard');
  const [streakCount, setStreakCount] = useState(0); // Will be loaded from real data
  const [isCircularMenuOpen, setIsCircularMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFocusSessionOpen, setIsFocusSessionOpen] = useState(false);

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
        setActiveScreen('Goals');
        break;
      case 'journaling':
        setActiveScreen('Journals');
        break;
      default:
        console.log(`Unhandled menu item: ${itemId}`);
    }
    
    setIsCircularMenuOpen(false);
  };

  const handleSidebarNavigate = (screen: string) => {
    setActiveScreen(screen as ScreenName);
  };

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
        return <SettingsScreen visible={true} onClose={() => setActiveScreen('Dashboard')} />;
      case 'Goals':
        return <GoalsScreen />;
      case 'Journals':
        return <JournalsEntryScreen />;
      default:
        return <DashboardScreenNew />;
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
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
        />
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screenContainer: {
    flex: 1,
  },
});