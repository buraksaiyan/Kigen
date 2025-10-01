import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InZoneKanjiBackgroundProps {
  style?: any;
}

export const InZoneKanjiBackground: React.FC<InZoneKanjiBackgroundProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Text style={styles.kanji}>起源</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: -1,
  },
  kanji: {
    color: 'rgba(255, 255, 255, 0.08)',
    fontSize: 200,
    fontWeight: '100',
    textAlign: 'center',
  },
});
