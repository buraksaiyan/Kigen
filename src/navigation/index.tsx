import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../modules/auth/AuthProvider';
import { DashboardScreen } from '../modules/dashboard/DashboardScreen';
import { JournalListScreen } from '../modules/journal/JournalListScreen';
import { JournalEditScreen } from '../modules/journal/JournalEditScreen';
import { View, Text, Button, TextInput } from 'react-native';
import { useState } from 'react';

const Stack = createNativeStackNavigator();

const AuthScreen: React.FC = () => {
  const { signInWithOtp, loading } = useAuth();
  const [email, setEmail] = useState('');
  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Sign In</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ backgroundColor: '#111', padding: 10 }}
      />
      <Button title="Send Magic Link" disabled={loading || !email} onPress={() => signInWithOtp(email)} />
    </View>
  );
};

export const Navigation: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? (
        <Stack.Navigator>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="JournalList" component={JournalListScreen} options={{ title: 'Journal' }} />
          <Stack.Screen name="JournalEdit" component={JournalEditScreen} options={{ title: 'Edit Entry' }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};