import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { UserStatsService } from '../src/services/userStatsService';
import { validatePointsAndDisplay } from './StatsValidator';

export const CacheTest: React.FC = () => {
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setOutput(prev => prev + message + '\n');
  };

  const testCacheInvalidation = async () => {
    setIsRunning(true);
    setOutput('');
    
    try {
      addLog('🔍 Testing Cache Invalidation...');
      
      // Get initial rating
      const initialRating = await UserStatsService.getCurrentRating();
  addLog(`Initial Rating - PRD: ${initialRating.stats.PRD}, OVR: ${initialRating.overallRating}`);
      
      // Clear cache manually to ensure fresh calculation
      await UserStatsService.invalidateRatingCache();
      addLog('🗑️ Cache manually cleared');
      
      // Get fresh rating
      const freshRating = await UserStatsService.getCurrentRating();
  addLog(`Fresh Rating - PRD: ${freshRating.stats.PRD}, OVR: ${freshRating.overallRating}`);
      
      // Compare
      if (freshRating.stats.PRD !== initialRating.stats.PRD) {
  addLog('CACHE INVALIDATION WORKING: Values changed after cache clear');
      } else {
  addLog('CACHE INVALIDATION ISSUE: Values remained same');
      }
      
  addLog('\nTesting Journal Entry...');
      
      // Record journal entry
      await UserStatsService.recordJournalEntry();
      addLog('📝 Journal entry recorded');
      
      // Get updated rating
      const updatedRating = await UserStatsService.getCurrentRating();
  addLog(`After Journal - PRD: ${updatedRating.stats.PRD}, OVR: ${updatedRating.overallRating}`);
      
      // Check if it updated
      const prdIncrease = updatedRating.stats.PRD - freshRating.stats.PRD;
      if (prdIncrease > 0) {
  addLog(`JOURNAL POINTS WORKING: PRD increased by ${prdIncrease}`);
      } else {
  addLog('JOURNAL POINTS NOT WORKING: No PRD increase detected');
      }
      
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testTodoCompletion = async () => {
    setIsRunning(true);
    setOutput('');
    
    try {
      addLog('📋 Testing Todo Completion...');
      
      // Get initial rating
      const initialRating = await UserStatsService.getCurrentRating();
      addLog(`📊 Initial - DET: ${initialRating.stats.DET}, PRD: ${initialRating.stats.PRD}, OVR: ${initialRating.overallRating}`);
      
      // Record todo completion
      await UserStatsService.recordTodoCompletion('Debug Test Todo');
      addLog('📋 Todo completion recorded');
      
      // Get updated rating
      const updatedRating = await UserStatsService.getCurrentRating();
      addLog(`📊 After Todo - DET: ${updatedRating.stats.DET}, PRD: ${updatedRating.stats.PRD}, OVR: ${updatedRating.overallRating}`);
      
      // Check if it updated
      const detIncrease = updatedRating.stats.DET - initialRating.stats.DET;
      const prdIncrease = updatedRating.stats.PRD - initialRating.stats.PRD;
      
      if (detIncrease === 5 && prdIncrease === 5) {
        addLog('✅ TODO POINTS WORKING: +5 DET, +5 PRD');
      } else {
        addLog(`❌ TODO POINTS NOT WORKING: DET +${detIncrease}, PRD +${prdIncrease} (expected +5, +5)`);
      }
      
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runValidation = async () => {
    setIsRunning(true);
    setOutput('');
    
    try {
      // Capture console.log output
      const originalLog = console.log;
      console.log = (message) => {
        originalLog(message);
        setOutput(prev => prev + message + '\n');
      };
      
      await validatePointsAndDisplay();
      
      // Restore console.log
      console.log = originalLog;
    } catch (error) {
      addLog(`❌ Validation Error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Points System Debug</Text>
      
      <View style={styles.buttons}>
        <TouchableOpacity 
          style={[styles.button, isRunning && styles.buttonDisabled]} 
          onPress={testCacheInvalidation}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Cache & Journal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, isRunning && styles.buttonDisabled]} 
          onPress={testTodoCompletion}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Test Todo Points</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, isRunning && styles.buttonDisabled]} 
          onPress={runValidation}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Full Validation</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.output}>
        <Text style={styles.outputText}>{output || 'No output yet...'}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    margin: 4,
  },
  buttonDisabled: {
    backgroundColor: '#4c1d95',
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  output: {
    flex: 1,
    backgroundColor: '#0f0f23',
    borderRadius: 8,
    padding: 12,
  },
  outputText: {
    color: '#00ff00',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});