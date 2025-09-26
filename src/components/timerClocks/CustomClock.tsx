import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { theme } from '../../config/theme';

interface Props { title?: string; timeString?: string; backgroundImage?: any; fontFamily?: string; color?: string }

export default function CustomClock({ title = 'Custom', timeString = '25:00', backgroundImage, fontFamily, color }: Props) {
  const Container: any = backgroundImage ? ImageBackground : View;
  return (
    <Container style={[styles.container, backgroundImage ? {} : { backgroundColor: theme.colors.surface }]} source={backgroundImage}>
      <Text style={[styles.title, { color: color || theme.colors.text.primary, fontFamily }]}>{title}</Text>
      <Text style={[styles.time, { color: color || theme.colors.text.primary, fontFamily }]}>{timeString}</Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, overflow: 'hidden' },
  title: { fontSize: 12, opacity: 0.9 },
  time: { fontSize: 26, fontWeight: '700', marginTop: 6 }
});
