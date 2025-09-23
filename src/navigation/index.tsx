import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { MainNavigator } from './MainNavigator';

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
    backgroundColor: '#000000',
    flex: 1,
  },
});