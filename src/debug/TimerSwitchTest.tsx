import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import TimerClock from '../components/timerClocks/TimerClock';
import { CLOCK_STYLES } from '../components/ClockPreviewCarousel';

const { width } = Dimensions.get('window');
const timerSize = Math.min(width * 0.8, 320);

export const TimerSwitchTest: React.FC = () => {
  const [currentClockIndex, setCurrentClockIndex] = useState(0);
  const [testProgress, setTestProgress] = useState(0);

  // Test with 10 minutes total, varying elapsed time for visual feedback
  const testDuration = 600; // 10 minutes total
  const testElapsed = Math.floor(testDuration * (testProgress / 100));

  const currentClockStyle = CLOCK_STYLES[currentClockIndex];

  // Safety check
  if (!currentClockStyle) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Error: No clock styles available</Text>
      </View>
    );
  }

  const nextClock = () => {
    setCurrentClockIndex((prev) => (prev + 1) % CLOCK_STYLES.length);
  };

  const updateProgress = (increment: number) => {
    setTestProgress((prev) => Math.max(0, Math.min(100, prev + increment)));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Timer Clock Switch Test</Text>
      <Text style={styles.subtitle}>Testing TimerClock component with all clock types</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Current: {currentClockStyle.title}</Text>
        <Text style={styles.infoText}>Progress: {testProgress}%</Text>
        <Text style={styles.infoText}>Elapsed: {Math.floor(testElapsed / 60)}:{(testElapsed % 60).toString().padStart(2, '0')}</Text>
      </View>

      <View style={styles.timerContainer}>
        <TimerClock
          clockStyle={currentClockStyle.id as 'classic' | 'digital' | 'circular' | 'arc' | 'progress' | 'flip'}
          duration={testDuration}
          elapsed={testElapsed}
          size={timerSize}
          onComplete={() => console.log('Timer completed!')}
        />
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.button} onPress={nextClock}>
          <Text style={styles.buttonText}>Next Clock Type</Text>
        </TouchableOpacity>
        
        <View style={styles.progressControls}>
          <TouchableOpacity style={styles.smallButton} onPress={() => updateProgress(-10)}>
            <Text style={styles.buttonText}>-10%</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={() => updateProgress(10)}>
            <Text style={styles.buttonText}>+10%</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.clockList}>
        <Text style={styles.listTitle}>Available Clock Types:</Text>
        {CLOCK_STYLES.map((style, index) => (
          <TouchableOpacity
            key={style.id}
            style={[
              styles.clockItem,
              index === currentClockIndex && styles.activeClockItem
            ]}
            onPress={() => setCurrentClockIndex(index)}
          >
            <Text style={[
              styles.clockItemText,
              index === currentClockIndex && styles.activeClockItemText
            ]}>
              {style.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 5,
  },
  timerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: timerSize + 60,
    width: '100%',
  },
  controlsContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressControls: {
    flexDirection: 'row',
    gap: 10,
  },
  smallButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clockList: {
    width: '100%',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  clockItem: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  activeClockItem: {
    backgroundColor: '#333333',
    borderColor: '#4CAF50',
  },
  clockItemText: {
    color: '#cccccc',
    fontSize: 16,
    textAlign: 'center',
  },
  activeClockItemText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default TimerSwitchTest;