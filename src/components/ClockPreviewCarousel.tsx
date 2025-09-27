import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import ClassicClock from './timerClocks/ClassicClock';
import FlipClock from './timerClocks/FlipClock';
import GradientBarClock from './timerClocks/GradientBarClock';
import { theme } from '../config/theme';

export const CLOCK_STYLES = [
  { id: 'classic', title: 'Classic Circular', component: ClassicClock },
  { id: 'flip', title: 'Flip Clock', component: FlipClock },
  { id: 'gradient', title: 'Gradient Bar', component: GradientBarClock },
];

interface Props {
  selected?: string;
  onSelect?: (id: string) => void;
}

export default function ClockPreviewCarousel({ selected, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <FlatList
        data={CLOCK_STYLES}
        horizontal
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        pagingEnabled
        renderItem={({ item }) => {
          const Comp: any = item.component;
          const isSelected = selected === item.id;
          return (
            <TouchableOpacity activeOpacity={0.9} onPress={() => onSelect && onSelect(item.id)} style={[styles.card, isSelected && styles.selectedCard]}>
              <View style={styles.previewBox}>
                <Comp 
                  duration={300} 
                  elapsed={150} 
                  size={80} 
                  strokeWidth={8}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.label}>{item.title}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', marginHorizontal: 8, width: 140 },
  contentContainer: { paddingHorizontal: 8 },
  label: { color: theme.colors.text.primary, marginTop: 8 },
  previewBox: { alignItems: 'center', backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border, borderRadius: 12, borderWidth: 1, height: 120, justifyContent: 'center', width: 120 },
  selectedCard: { borderColor: theme.colors.primary, borderWidth: 2, shadowColor: theme.colors.primary, shadowOpacity: 0.35, shadowRadius: 8 },
  wrap: { paddingVertical: 8 }
});
