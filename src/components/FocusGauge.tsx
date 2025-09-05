import React from 'react';
import { View, Text } from 'react-native';
import { theme } from '../config/theme';

interface FocusGaugeProps {
  rating: number; // 0-100
  size?: 'small' | 'large';
}

export const FocusGauge: React.FC<FocusGaugeProps> = ({ rating, size = 'large' }) => {
  const dimensions = size === 'large' ? 140 : 90;
  const strokeWidth = size === 'large' ? 12 : 8;

  const getRatingColor = (rating: number): string => {
    if (rating >= 80) return theme.colors.success;
    if (rating >= 60) return theme.colors.primary;
    if (rating >= 40) return theme.colors.warning;
    return theme.colors.danger;
  };

  const getRatingText = (rating: number): string => {
    if (rating >= 80) return 'Excellent Focus';
    if (rating >= 60) return 'Good Focus';
    if (rating >= 40) return 'Needs Work';
    return 'Critical';
  };

  // Simple Android-focused circular progress
  const progressPercentage = Math.max(0, Math.min(100, rating));
  
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ 
        position: 'relative', 
        width: dimensions, 
        height: dimensions,
        marginBottom: theme.spacing.md,
      }}>
        {/* Background Circle */}
        <View
          style={{
            position: 'absolute',
            width: dimensions,
            height: dimensions,
            borderRadius: dimensions / 2,
            borderWidth: strokeWidth,
            borderColor: theme.colors.border,
          }}
        />
        
        {/* Progress Circle - Simple version */}
        <View
          style={{
            position: 'absolute',
            width: dimensions,
            height: dimensions,
            borderRadius: dimensions / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: progressPercentage > 0 ? getRatingColor(rating) : 'transparent',
            borderRightColor: progressPercentage > 25 ? getRatingColor(rating) : 'transparent',
            borderBottomColor: progressPercentage > 50 ? getRatingColor(rating) : 'transparent',
            borderLeftColor: progressPercentage > 75 ? getRatingColor(rating) : 'transparent',
            transform: [{ rotate: '-90deg' }],
          }}
        />

        {/* Center Content */}
        <View
          style={{
            position: 'absolute',
            width: dimensions,
            height: dimensions,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={[
              size === 'large' ? theme.typography.h1 : theme.typography.h3,
              { 
                color: getRatingColor(rating), 
                textAlign: 'center',
                fontWeight: '800',
              },
            ]}
          >
            {Math.round(rating)}
          </Text>
          {size === 'large' && (
            <Text
              style={[
                theme.typography.small,
                { 
                  color: theme.colors.text.tertiary, 
                  textAlign: 'center',
                  marginTop: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                },
              ]}
            >
              {getRatingText(rating)}
            </Text>
          )}
        </View>
      </View>

      {size === 'large' && (
        <Text
          style={[
            theme.typography.h4,
            {
              color: theme.colors.text.primary,
              textAlign: 'center',
              fontWeight: '700',
            },
          ]}
        >
          Discipline Score
        </Text>
      )}
    </View>
  );
};
