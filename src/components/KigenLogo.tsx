import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../config/theme';

interface KigenLogoProps {
  size?: 'small' | 'medium' | 'large';
  showJapanese?: boolean;
  showText?: boolean; // New prop to show/hide the "Kigen" text
  variant?: 'text' | 'image'; // New prop to switch between text and image versions
}

export const KigenLogo: React.FC<KigenLogoProps> = ({ 
  size = 'medium', 
  showJapanese = true,
  showText = true, // Default to showing text for backward compatibility
  variant = 'text' // Default to text for backward compatibility
}) => {
  const styles = getStyles(size, showText);
  
  // If using image variant, show the logo image
  if (variant === 'image') {
    return (
      <View style={styles.container}>
        <Image 
          // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
          source={require('../../assets/images/kigen-newlogo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
    );
  }
  
  // Original text version
  return (
    <View style={styles.container}>
      {showJapanese && (
        <Text style={styles.japanese}>起源</Text>
      )}
      {showText && (
        <View style={styles.logoContainer}>
          <Text style={styles.capitalK}>K</Text>
          <Text style={styles.lowercase}>igen</Text>
        </View>
      )}
    </View>
  );
};

const getStyles = (size: 'small' | 'medium' | 'large', showText: boolean = true) => {
  const baseConfig = {
    small: { 
      japanese: showText ? 20 : 32, 
      main: 24, 
      capitalK: 24,
      spacing: 4,
      imageSize: 60
    },
    medium: { 
      japanese: showText ? 26 : 52, 
      main: 32, 
      capitalK: 32,
      spacing: 6,
      imageSize: 70
    },
    large: { 
      japanese: showText ? 30 : 48, 
      main: 42, 
      capitalK: 42,
      spacing: 8,
      imageSize: 80
    },
  };
  
  const config = baseConfig[size];
  
  return StyleSheet.create({
    capitalK: {
      fontSize: config.capitalK,
      color: theme.colors.primary,
      fontWeight: '700',
      // Make capital K the same height as lowercase letters
      lineHeight: config.main * 0.75, // Reduced line height to match lowercase
    },
    container: {
      alignItems: 'center',
    },
    japanese: {
      color: theme.colors.text.secondary,
      fontSize: config.japanese,
      fontWeight: '300',
      letterSpacing: 2,
      marginBottom: config.spacing,
    },
    logoContainer: {
      alignItems: 'baseline',
      flexDirection: 'row',
    },
    logoImage: {
      height: config.imageSize,
      width: config.imageSize,
    },
    lowercase: {
      color: theme.colors.text.primary,
      fontSize: config.main,
      fontWeight: '300',
      letterSpacing: 1,
    },
  });
};
