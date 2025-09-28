import React from 'react';
import { View, Text } from 'react-native';
import ProgressBarClock from '../components/timerClocks/ProgressBarClock';

export default function ProgressBarTest() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Text style={{ color: 'white', marginBottom: 20 }}>Progress Bar Clock Test</Text>
      <ProgressBarClock
        duration={300}
        elapsed={150}
        size={200}
        strokeWidth={16}
        color="#FF6B6B"
      />
    </View>
  );
}