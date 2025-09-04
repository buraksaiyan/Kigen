import React from 'react';
import * as Sentry from 'sentry-expo';
import { Navigation } from './navigation';
import { AuthProvider } from './modules/auth/AuthProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import './config/sentry';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}