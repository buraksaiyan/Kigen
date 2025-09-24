import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../src/config/theme';

export default function SimpleTest() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 inzone Works!</Text>
      <Text style={styles.description}>
        Your React Native app is running successfully in the browser!{'\n'}
        This means the foundation is solid and ready for development.
      </Text>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          ✅ React Native Web: Working{'\n'}
          ✅ Development Server: Running{'\n'}
          ✅ Components: Loading
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  description: {
    color: theme.colors.text.secondary,
    fontSize: 20,
    lineHeight: 28,
    maxWidth: 600,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 32,
    padding: 16,
  },
  statusText: {
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
});
