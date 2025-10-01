import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Navigation } from './navigation';
import { AuthProvider } from './modules/auth/AuthProvider';
import { I18nProvider } from './i18n/I18nProvider';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { clearOldFocusData } from './utils/clearOldData';
import { HabitStreakService } from './services/habitStreakService';
import { HabitBackgroundService } from './services/habitBackgroundService';

// Conditional import for web compatibility
let GestureHandler: any = View;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GestureHandlerRootView } = require('react-native-gesture-handler');
  GestureHandler = GestureHandlerRootView;
} catch {
  // Fallback for web
  console.log('Using View fallback for web');
}

const AppContent = () => {
  const { theme } = useTheme();

  useEffect(() => {
    // Clear old data to prevent duplicate key issues
    clearOldFocusData();
    
    // Initialize habit streak service for daily checks and notifications
    const initializeServices = async () => {
      try {
        await HabitStreakService.initialize();
        await HabitBackgroundService.initialize();
      } catch (error) {
        console.error('Failed to initialize habit services:', error);
      }
    };
    
    initializeServices();

    // Cleanup on unmount
    return () => {
      HabitBackgroundService.cleanup();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandler style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <I18nProvider>
            <AuthProvider>
              <NotificationsProvider>
                <Navigation />
              </NotificationsProvider>
            </AuthProvider>
          </I18nProvider>
        </View>
      </GestureHandler>
    </SafeAreaProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});