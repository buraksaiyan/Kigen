import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface KigenKanjiBackgroundProps {
  style?: any;
}

export const KigenKanjiBackground: React.FC<KigenKanjiBackgroundProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Text style={styles.kanji}>起源</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  kanji: {
    fontSize: 200,
    fontWeight: '100',
    color: 'rgba(255, 255, 255, 0.03)',
    textAlign: 'center',
  },
});
