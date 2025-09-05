import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../modules/auth/AuthProvider';
import { DashboardScreen } from '../modules/dashboard/DashboardScreen';
import { JournalListScreen } from '../modules/journal/JournalListScreen';
import { JournalEditScreen } from '../modules/journal/JournalEditScreen';
import { View, Text, Button, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';

const Stack = createNativeStackNavigator();

const AuthScreen: React.FC = () => {
  const { signInWithOtp, loading } = useAuth();
  const [email, setEmail] = useState('');
  
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#000000',
      padding: 24,
      justifyContent: 'center',
      gap: 24,
    }}>
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ 
          fontSize: 32, 
          fontWeight: '700', 
          color: '#FFFFFF',
          marginBottom: 8 
        }}>
          Welcome to Kigen
        </Text>
        <Text style={{ 
          fontSize: 16, 
          color: '#8E8E93',
          textAlign: 'center'
        }}>
          Your journey to focused living starts here
        </Text>
      </View>

      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
          Sign in with your email
        </Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Enter your email"
          placeholderTextColor="#636366"
          value={email}
          onChangeText={setEmail}
          style={{
            backgroundColor: '#1C1C1E',
            padding: 16,
            borderRadius: 12,
            fontSize: 16,
            color: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#38383A',
          }}
        />
        <TouchableOpacity
          disabled={loading || !email}
          onPress={() => signInWithOtp(email)}
          style={{
            backgroundColor: loading || !email ? '#636366' : '#007AFF',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '600',
          }}>
            {loading ? 'Sending...' : 'Send Magic Link'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={{
        fontSize: 14,
        color: '#636366',
        textAlign: 'center',
        marginTop: 20,
      }}>
        We'll send you a secure link to sign in
      </Text>
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