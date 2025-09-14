import React, { useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler, Platform } from 'react-native';
import { Navigation } from './navigation';
import { AuthProvider } from './modules/auth/AuthProvider';
import { I18nProvider } from './i18n/I18nProvider';
import { clearOldFocusData } from './utils/clearOldData';

// Conditional import for web compatibility
let GestureHandler: any = View;
try {
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
    
    if (Platform.OS === 'android') {
      const backAction = () => {
        // Let the app handle back button naturally
        // This prevents the app from being minimized immediately
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => {
        backHandler.remove();
      };
    }
  }, []);

  return (
    <GestureHandler style={{ flex: 1 }}>
      <View style={styles.container}>
        <I18nProvider>
          <AuthProvider>
            <Navigation />
          </AuthProvider>
        </I18nProvider>
      </View>
    </GestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    flex: 1,
  },
});