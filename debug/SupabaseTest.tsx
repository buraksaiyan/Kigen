import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { supabase } from '../src/services/supabase';
import { env } from '../src/config/env';
import { theme } from '../src/config/theme';

export const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  const testConnection = async () => {
    try {
      console.log('Testing Supabase connection...');
      console.log('URL:', env.supabaseUrl);
      console.log('Key:', env.supabaseAnonKey?.substring(0, 20) + '...');
      
      // Test basic connection
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(5);

      if (error) {
        setConnectionStatus(`❌ Error: ${error.message}`);
        console.error('Supabase error:', error);
      } else {
        setConnectionStatus(`✅ Connected! Found ${data.length} entries`);
        setLeaderboardData(data);
        console.log('Supabase data:', data);
      }
    } catch (err) {
      setConnectionStatus(`❌ Network Error: ${err}`);
      console.error('Network error:', err);
    }
  };

  const testInsert = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .insert({
          user_id: 'test_user_' + Date.now(),
          username: 'Test User',
          total_points: 100,
          monthly_points: 50,
          weekly_points: 25,
          overall_rating: 75,
          card_tier: 'Bronze'
        });

      if (error) {
        console.error('Insert error:', error);
        alert(`Insert failed: ${error.message}`);
      } else {
        console.log('Insert success:', data);
        alert('Test user inserted successfully!');
        testConnection(); // Refresh data
      }
    } catch (err) {
      console.error('Insert network error:', err);
      alert(`Network error: ${err}`);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Supabase Debug Panel
      </Text>
      
      <Text style={styles.statusText}>
        Status: {connectionStatus}
      </Text>
      
      <Text style={styles.urlText}>
        URL: {env.supabaseUrl}
      </Text>
      
  <Button title="Test Connection" onPress={testConnection} />
  <Button title="Insert Test Data" onPress={testInsert} />
      
      <Text style={styles.dataTitle}>
        Current Data ({leaderboardData.length} entries):
      </Text>
      
      {leaderboardData.map((entry, index) => (
        <Text key={index} style={styles.dataEntry}>
          {entry.username}: {entry.total_points} pts ({entry.card_tier})
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
    padding: 20,
  },
  dataEntry: {
    fontSize: 12,
    marginTop: 5,
  },
  dataTitle: {
    fontWeight: 'bold',
    marginTop: 20,
  },
  statusText: {
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  urlText: {
    marginBottom: 10,
  },
});
