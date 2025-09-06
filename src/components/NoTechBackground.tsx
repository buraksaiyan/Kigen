import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface NoTechBackgroundProps {
  style?: any;
}

export const NoTechBackground: React.FC<NoTechBackgroundProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#92400E', '#B45309', '#D97706']} // Darker yellow/amber tones for better readability
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Flowing waves like other focus types */}
        <View style={[styles.wave, styles.wave1]} />
        <View style={[styles.wave, styles.wave2]} />
        <View style={[styles.wave, styles.wave3]} />
        <View style={[styles.wave, styles.wave4]} />
        <View style={[styles.wave, styles.wave5]} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.2,
    backgroundColor: '#FCD34D',
  },
  wave1: {
    top: '10%',
    left: '5%',
    width: 120,
    height: 120,
    transform: [{ rotate: '45deg' }],
  },
  wave2: {
    top: '30%',
    right: '10%',
    width: 80,
    height: 80,
    transform: [{ rotate: '15deg' }],
  },
  wave3: {
    bottom: '20%',
    left: '15%',
    width: 100,
    height: 60,
    transform: [{ rotate: '30deg' }],
  },
  wave4: {
    top: '60%',
    left: '40%',
    width: 90,
    height: 90,
    transform: [{ rotate: '60deg' }],
  },
  wave5: {
    bottom: '40%',
    right: '20%',
    width: 70,
    height: 110,
    transform: [{ rotate: '75deg' }],
  },
});
