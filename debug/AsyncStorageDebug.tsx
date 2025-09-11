import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserStatsService } from '../src/services/userStatsService';

export const AsyncStorageDebug: React.FC = () => {
  const [debugData, setDebugData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const loadAsyncStorageData = async () => {
    setLoading(true);
    try {
      const keys = [
        '@kigen_monthly_records',
        '@kigen_daily_activity',
        '@kigen_user_profile'
      ];
      
      const data: any = {};
      
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          data[key] = value ? JSON.parse(value) : null;
        } catch (error) {
          data[key] = `Error: ${error}`;
        }
      }

      // Get specific date activities
      const today = new Date().toISOString().slice(0, 10);
      const todayKey = `@kigen_daily_activity_${today}`;
      try {
        const todayValue = await AsyncStorage.getItem(todayKey);
        data[`TODAY (${today})`] = todayValue ? JSON.parse(todayValue) : null;
      } catch (error) {
        data[`TODAY (${today})`] = `Error: ${error}`;
      }

      // Get current stats calculation
      try {
        const currentStats = await UserStatsService.calculateCurrentStats();
        const currentRating = await UserStatsService.getCurrentRating();
        const monthlyRecords = await UserStatsService.getMonthlyRecords();
        
        data['CALCULATED_CURRENT_STATS'] = currentStats;
        data['CALCULATED_CURRENT_RATING'] = currentRating;
        data['MONTHLY_RECORDS_SERVICE'] = monthlyRecords;
      } catch (error) {
        data['CALCULATED_DATA'] = `Error: ${error}`;
      }

      setDebugData(data);
    } catch (error) {
      setDebugData({ error: `Failed to load: ${error}` });
    }
    setLoading(false);
  };

  const clearAllData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const kigenKeys = keys.filter(key => key.startsWith('@kigen'));
      await AsyncStorage.multiRemove(kigenKeys);
      alert(`Cleared ${kigenKeys.length} Kigen keys`);
      loadAsyncStorageData();
    } catch (error) {
      alert(`Error clearing data: ${error}`);
    }
  };

  useEffect(() => {
    loadAsyncStorageData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AsyncStorage Debug</Text>
        <Button title="Refresh" onPress={loadAsyncStorageData} disabled={loading} />
        <Button title="Clear All Data" onPress={clearAllData} color="red" />
      </View>
      
      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <View style={styles.content}>
          {Object.entries(debugData).map(([key, value]) => (
            <View key={key} style={styles.section}>
              <Text style={styles.sectionTitle}>{key}</Text>
              <Text style={styles.sectionContent}>
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    marginBottom: 20,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  loading: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  content: {
    gap: 20,
  },
  section: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'monospace',
  },
});
