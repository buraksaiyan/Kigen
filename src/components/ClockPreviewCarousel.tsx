import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import ClassicCircular from './timerClocks/ClassicCircular';
import MinimalDigital from './timerClocks/MinimalDigital';
import FlipClock from './timerClocks/FlipClock';
import PomodoroRing from './timerClocks/PomodoroRing';
import GradientBar from './timerClocks/GradientBar';
import ArcClock from './timerClocks/ArcClock';
import CustomClock from './timerClocks/CustomClock';
import { theme } from '../config/theme';

export const CLOCK_STYLES = [
  { id: 'classic', title: 'ClassicCircular', component: ClassicCircular },
  { id: 'minimal', title: 'MinimalDigital', component: MinimalDigital },
  { id: 'flip', title: 'FlipClock', component: FlipClock },
  { id: 'pomodoro', title: 'PomodoroRing', component: PomodoroRing },
  { id: 'gradient', title: 'GradientBar', component: GradientBar },
  { id: 'arc', title: 'ArcClock', component: ArcClock },
  { id: 'custom', title: 'CustomMode', component: CustomClock },
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
        renderItem={({ item }) => {
          const Comp: any = item.component;
          const isSelected = selected === item.id;
          return (
            <TouchableOpacity activeOpacity={0.9} onPress={() => onSelect && onSelect(item.id)} style={[styles.card, isSelected && styles.selectedCard]}>
              <View style={styles.previewBox}>
                <Comp />
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
  wrap: { paddingVertical: 8 },
  card: { width: 140, marginHorizontal: 8, alignItems: 'center' },
  previewBox: { width: 120, height: 120, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface },
  label: { marginTop: 8, color: theme.colors.text.primary },
  selectedCard: { shadowColor: theme.colors.primary, shadowOpacity: 0.35, shadowRadius: 8, borderWidth: 2, borderColor: theme.colors.primary }
});
