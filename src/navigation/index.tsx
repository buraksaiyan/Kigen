import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { MainNavigator } from './MainNavigator';
import { theme } from '../config/theme';

export const Navigation = () => {
  return (
    <NavigationContainer>
      <View style={styles.container}>
        <MainNavigator />
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
});