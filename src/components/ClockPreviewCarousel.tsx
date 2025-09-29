import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../config/theme';

export const CLOCK_STYLES = [
  { id: 'classic', title: 'Classic Circular', icon: 'clock-outline' },
  { id: 'digital', title: 'Digital Clock', icon: 'numeric' },
  { id: 'circular', title: 'Circular Progress', icon: 'progress-clock' },
  { id: 'arc', title: 'Arc Dashboard', icon: 'gauge' },
  { id: 'progress', title: 'Progress Bar', icon: 'chart-timeline-variant' },
  { id: 'flip', title: 'Flip Clock', icon: 'flip-vertical' },
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
          const isSelected = selected === item.id;
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onSelect && onSelect(item.id)}
              style={[styles.card, isSelected && styles.selectedCard]}
            >
              <View style={[styles.previewBox, isSelected && styles.previewBoxSelected]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={56}
                  color={isSelected ? theme.colors.white : theme.colors.primary}
                />
              </View>
              <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
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
  label: { color: theme.colors.text.primary, marginTop: 8, width: 120, textAlign: 'center' },
  previewBox: { alignItems: 'center', backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border, borderRadius: 12, borderWidth: 1, height: 120, justifyContent: 'center', width: 120 },
  previewBoxSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  selectedCard: { borderColor: theme.colors.primary, borderWidth: 2, shadowColor: theme.colors.primary, shadowOpacity: 0.35, shadowRadius: 8 },
  wrap: { paddingVertical: 8 }
});
