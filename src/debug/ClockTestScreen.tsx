import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

// Import all clock components
import DigitalClock from '../components/timerClocks/DigitalClock';
import CircularClock from '../components/timerClocks/CircularClock';
import ArcClock from '../components/timerClocks/ArcClock';
import ProgressBarClock from '../components/timerClocks/ProgressBarClock';
import CustomFlipClock from '../components/timerClocks/CustomFlipClock';
import ClassicClock from '../components/timerClocks/ClassicClock';

export default function ClockTestScreen() {
  const { theme: currentTheme } = useTheme();
  
  const testProps = {
    duration: 300, // 5 minutes
    elapsed: 150, // 2.5 minutes elapsed
    size: 100,
    strokeWidth: 8,
    color: currentTheme.colors.primary,
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 20,
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.colors.text.primary,
      marginBottom: 30,
      textAlign: 'center',
    },
    clockSection: {
      marginBottom: 40,
      alignItems: 'center',
    },
    clockTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: currentTheme.colors.text.primary,
      marginBottom: 15,
    },
    clockContainer: {
      padding: 20,
      backgroundColor: currentTheme.colors.surface,
      borderRadius: 16,
      alignItems: 'center',
      minHeight: 150,
      justifyContent: 'center',
    },
    errorText: {
      color: currentTheme.colors.danger,
      textAlign: 'center',
      fontSize: 14,
    },
  });

  const ClockWrapper = ({ title, ClockComponent }: { title: string; ClockComponent: any }) => (
    <View style={styles.clockSection}>
      <Text style={styles.clockTitle}>{title}</Text>
      <View style={styles.clockContainer}>
        {(() => {
          try {
            return <ClockComponent {...testProps} />;
          } catch (error) {
            return <Text style={styles.errorText}>Error: {String(error)}</Text>;
          }
        })()}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.header}>Clock Components Test</Text>
          
          <ClockWrapper title="Classic Clock" ClockComponent={ClassicClock} />
          <ClockWrapper title="Digital Clock" ClockComponent={DigitalClock} />
          <ClockWrapper title="Circular Clock" ClockComponent={CircularClock} />
          <ClockWrapper title="Arc Clock" ClockComponent={ArcClock} />
          <ClockWrapper title="Progress Bar Clock" ClockComponent={ProgressBarClock} />
          <ClockWrapper title="Custom Flip Clock" ClockComponent={CustomFlipClock} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}