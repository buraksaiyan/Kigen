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
        contentContainerStyle={styles.contentContainer}
        pagingEnabled
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
  card: { alignItems: 'center', marginHorizontal: 8, width: 140 },
  contentContainer: { paddingHorizontal: 8 },
  label: { color: theme.colors.text.primary, marginTop: 8 },
  previewBox: { alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 12, height: 120, justifyContent: 'center', width: 120 },
  selectedCard: { borderColor: theme.colors.primary, borderWidth: 2, shadowColor: theme.colors.primary, shadowOpacity: 0.35, shadowRadius: 8 },
  wrap: { paddingVertical: 8 }
});
