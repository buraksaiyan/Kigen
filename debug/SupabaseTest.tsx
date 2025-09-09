import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { supabase } from '../src/services/supabase';
import { env } from '../src/config/env';

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
    <View style={{ padding: 20, backgroundColor: 'white', flex: 1 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        🔍 Supabase Debug Panel
      </Text>
      
      <Text style={{ marginBottom: 10 }}>
        Status: {connectionStatus}
      </Text>
      
      <Text style={{ marginBottom: 10 }}>
        URL: {env.supabaseUrl}
      </Text>
      
      <Button title="🔄 Test Connection" onPress={testConnection} />
      <Button title="➕ Insert Test Data" onPress={testInsert} />
      
      <Text style={{ marginTop: 20, fontWeight: 'bold' }}>
        Current Data ({leaderboardData.length} entries):
      </Text>
      
      {leaderboardData.map((entry, index) => (
        <Text key={index} style={{ fontSize: 12, marginTop: 5 }}>
          {entry.username}: {entry.total_points} pts ({entry.card_tier})
        </Text>
      ))}
    </View>
  );
};
