import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Modal, View, Text, StyleSheet, BackHandler, Platform } from 'react-native';
import { useAuth } from '../modules/auth/AuthProvider';
import { DashboardScreen } from '../modules/dashboard/DashboardScreen';
import { JournalListScreen } from '../modules/journal/JournalListScreen';
import { JournalEditScreen } from '../modules/journal/JournalEditScreen';
import { LoginScreen } from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();

// Theme configuration - matches your existing app theme
const theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6', 
    success: '#34C759',
    danger: '#FF3B30',
    warning: '#FF9500',
    background: '#000000',
    surface: '#1C1C1E',
    surfaceSecondary: '#2C2C2E',
    border: '#38383A',
    text: {
      primary: '#FFFFFF',
      secondary: '#8E8E93',
      tertiary: '#636366',
      disabled: '#48484A',
    },
  },
};

export const Navigation: React.FC = () => {
  const { session, loading, isLoginScreenVisible, hideLoginScreen } = useAuth();

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          // Allow default back behavior for navigation
          return false;
        }
      );

      return () => backHandler.remove();
    }
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.text.primary,
            contentStyle: {
              backgroundColor: theme.colors.background,
            },
          }}
        >
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="JournalList" 
            component={JournalListScreen}
            options={{ 
              title: 'Journal',
              headerTitleStyle: { color: theme.colors.text.primary }
            }} 
          />
          <Stack.Screen 
            name="JournalEdit" 
            component={JournalEditScreen}
            options={{ 
              title: 'Write Entry',
              headerTitleStyle: { color: theme.colors.text.primary }
            }} 
          />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Login Modal */}
      <Modal
        visible={isLoginScreenVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={hideLoginScreen}
      >
        <LoginScreen onClose={hideLoginScreen} theme={theme} />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
});