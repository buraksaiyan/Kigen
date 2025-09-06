import React, { useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler, Platform } from 'react-native';
import { Navigation } from './navigation';
import { AuthProvider } from './modules/auth/AuthProvider';

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
        <AuthProvider>
          <Navigation />
        </AuthProvider>
      </View>
    </GestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});