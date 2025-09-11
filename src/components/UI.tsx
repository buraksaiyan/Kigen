import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { theme } from '../config/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    };

    // Size variations
    const sizeStyles = {
      small: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
      medium: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
      large: { paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: disabled ? theme.colors.text.disabled : theme.colors.primary,
        borderWidth: 1,
        borderColor: disabled ? theme.colors.text.disabled : theme.colors.primary,
      },
      secondary: {
        backgroundColor: disabled ? theme.colors.text.disabled : theme.colors.secondary,
        borderWidth: 1,
        borderColor: disabled ? theme.colors.text.disabled : theme.colors.primary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? theme.colors.text.disabled : theme.colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
    };

    const sizeStyles = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    const color = variant === 'outline' 
      ? (disabled ? theme.colors.text.disabled : theme.colors.primary)
      : theme.colors.text.primary;

    return {
      ...baseStyle,
      ...sizeStyles[size],
      color,
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
};

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ children, style }) => (
  <View
    style={[
      {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      style,
    ]}
  >
    {children}
  </View>
);
