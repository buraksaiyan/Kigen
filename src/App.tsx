import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Navigation } from './navigation';
import { AuthProvider } from './modules/auth/AuthProvider';
import { I18nProvider } from './i18n/I18nProvider';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { clearOldFocusData } from './utils/clearOldData';

// Conditional import for web compatibility
let GestureHandler: any = View;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
  const { GestureHandlerRootView } = require('react-native-gesture-handler');
  GestureHandler = GestureHandlerRootView;
} catch (e) {
  // Fallback for web
  console.log('Using View fallback for web');
}

export default function App() {
  useEffect(() => {
    // Clear old data to prevent duplicate key issues
    clearOldFocusData();
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandler style={{ flex: 1 }}>
        <View style={styles.container}>
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
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000', // TODO: Replace with theme color
    flex: 1,
  },
});