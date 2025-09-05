import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../config/theme';

interface KigenLogoProps {
  size?: 'small' | 'medium' | 'large';
  showJapanese?: boolean;
}

export const KigenLogo: React.FC<KigenLogoProps> = ({ 
  size = 'medium', 
  showJapanese = true 
}) => {
  const styles = getStyles(size);
  
  return (
    <View style={styles.container}>
      {showJapanese && (
        <Text style={styles.japanese}>起源</Text>
      )}
      <View style={styles.logoContainer}>
        <Text style={styles.capitalK}>K</Text>
        <Text style={styles.lowercase}>igen</Text>
      </View>
    </View>
  );
};

const getStyles = (size: 'small' | 'medium' | 'large') => {
  const sizeConfig = {
    small: { 
      japanese: 16, 
      main: 24, 
      capitalK: 24,
      spacing: 4 
    },
    medium: { 
      japanese: 20, 
      main: 32, 
      capitalK: 32,
      spacing: 6 
    },
    large: { 
      japanese: 24, 
      main: 42, 
      capitalK: 42,
      spacing: 8 
    },
  };
  
  const config = sizeConfig[size];
  
  return StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    japanese: {
      fontSize: config.japanese,
      color: theme.colors.text.secondary,
      fontWeight: '300',
      marginBottom: config.spacing,
      letterSpacing: 2,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    capitalK: {
      fontSize: config.capitalK,
      color: theme.colors.primary,
      fontWeight: '700',
      // Make capital K the same height as lowercase letters
      lineHeight: config.main * 0.75, // Reduced line height to match lowercase
    },
    lowercase: {
      fontSize: config.main,
      color: theme.colors.text.primary,
      fontWeight: '300',
      letterSpacing: 1,
    },
  });
};
