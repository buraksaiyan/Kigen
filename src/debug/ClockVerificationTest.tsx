import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { CLOCK_STYLES } from '../components/ClockPreviewCarousel';
import ClassicClock from '../components/timerClocks/ClassicClock';
import DigitalClock from '../components/timerClocks/DigitalClock';
import CircularClock from '../components/timerClocks/CircularClock';
import ArcClock from '../components/timerClocks/ArcClock';
import ProgressBarClock from '../components/timerClocks/ProgressBarClock';
import CustomFlipClock from '../components/timerClocks/CustomFlipClock';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const timerSize = Math.min(width * 0.7, 300);

interface ClockVerificationTestProps {}

export const ClockVerificationTest: React.FC<ClockVerificationTestProps> = () => {
  // Test with 10 minutes total, 5 minutes elapsed (5 minutes remaining)
  const testDuration = 600; // 10 minutes total
  const testElapsed = 300; // 5 minutes elapsed

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Clock Verification Test</Text>
      <Text style={styles.subtitle}>Testing all 6 timer clock components</Text>
      {CLOCK_STYLES.map((clockStyle) => {
        // Map known ids to actual clock components
        const COMPONENT_MAP: Record<string, any> = {
          classic: ClassicClock,
          digital: DigitalClock,
          circular: CircularClock,
          arc: ArcClock,
          progress: ProgressBarClock,
          flip: CustomFlipClock,
        };

        const ClockComponent = COMPONENT_MAP[clockStyle.id];

        return (
          <View key={clockStyle.id} style={styles.clockContainer}>
            <Text style={styles.clockTitle}>{clockStyle.title}</Text>
            <View style={styles.clockWrapper}>
              {ClockComponent ? (
                <ClockComponent
                  duration={testDuration}
                  elapsed={testElapsed}
                  size={timerSize}
                  onComplete={() => console.log(`${clockStyle.title} completed`)}
                />
              ) : (
                // Fallback to icon preview if no component mapping is available
                <MaterialCommunityIcons name={(clockStyle as any).icon || 'clock-outline'} size={timerSize * 0.4} color="#fff" />
              )}
            </View>
          </View>
        );
      })}
      
      <Text style={styles.footer}>
        If you can see all clocks above without errors, verification is successful!
      </Text>
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
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 30,
    textAlign: 'center',
  },
  clockContainer: {
    marginBottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  clockTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
  },
  clockWrapper: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: timerSize + 40,
    width: '100%',
  },
  footer: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default ClockVerificationTest;