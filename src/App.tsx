import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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