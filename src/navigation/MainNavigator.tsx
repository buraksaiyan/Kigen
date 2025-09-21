import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
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

// Import components
import { BottomBar } from '../components/BottomBar';
import { CircularMenu } from '../components/CircularMenu';
import { RightSidebar } from '../components/RightSidebar';

// Import services and utilities
import { theme } from '../config/theme';
import { AuthProvider } from '../modules/auth/AuthProvider';
import { UserStatsService } from '../services/userStatsService';

const Stack = createNativeStackNavigator();

type ScreenName = 'Dashboard' | 'Leaderboard' | 'History' | 'Achievements' | 'Profile' | 'Settings';

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

  // Calculate center position for circular menu
  const centerX = 180; // Approximate center of screen width
  const centerY = 600; // Approximate position above bottom bar

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
      // TODO: Handle other menu items
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