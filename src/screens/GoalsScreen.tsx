// This file has been deleted as per user request.
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// GoalsScreen removed — if opened, redirect to Dashboard
export const GoalsScreen: React.FC = () => {
  const navigation = useNavigation();
  useEffect(() => {
    try {
      // @ts-ignore
      navigation.navigate('Dashboard');
    } catch (e) {}
  }, [navigation]);
  return <View />;
};
