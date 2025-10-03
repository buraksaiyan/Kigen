import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme as defaultTheme } from '../config/theme';

interface FocusCompletionScreenProps {
  sessionName: string;
  modeColor: string;
  duration: number; // in minutes
  sessionType: 'focus' | 'pomodoro' | 'clock';
  onReturnToFocusModes: () => void;
  onGoToDashboard: () => void;
}

export const FocusCompletionScreen: React.FC<FocusCompletionScreenProps> = ({
  sessionName,
  modeColor,
  duration,
  sessionType,
  onReturnToFocusModes,
  onGoToDashboard,
}) => {
  // Create gradient colors based on mode color
  const gradientColors = [
    `${modeColor}20`,
    `${modeColor}40`,
    defaultTheme.colors.background,
  ] as const;

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* Success Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${modeColor}30` }]}>
          <Icon name="check-circle" size={80} color={modeColor} />
        </View>

        {/* Completion Message */}
        <Text style={styles.title}>Session Complete!</Text>
        <Text style={styles.sessionName}>{sessionName}</Text>
        
        {/* Duration Info */}
        <View style={styles.durationContainer}>
          <Icon name="timer" size={24} color={defaultTheme.colors.text.secondary} />
          <Text style={styles.durationText}>
            {formatDuration(duration)} of focused time
          </Text>
        </View>

        {/* Session Type Badge */}
        <View style={[styles.badge, { backgroundColor: `${modeColor}20`, borderColor: modeColor }]}>
          <Text style={[styles.badgeText, { color: modeColor }]}>
            {sessionType === 'pomodoro' ? 'Pomodoro Session' : 
             sessionType === 'clock' ? 'Clock Mode' : 
             'Focus Session'}
          </Text>
        </View>

        {/* Motivational Text */}
        <Text style={styles.motivationText}>
          Great work! Your focus and dedication are building your mental strength.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: modeColor }]}
            onPress={onReturnToFocusModes}
            activeOpacity={0.8}
          >
            <Icon name="replay" size={24} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Start Another Session</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: modeColor }]}
            onPress={onGoToDashboard}
            activeOpacity={0.8}
          >
            <Icon name="home" size={24} color={modeColor} />
            <Text style={[styles.secondaryButtonText, { color: modeColor }]}>
              Go to Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultTheme.colors.background,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: defaultTheme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  sessionName: {
    fontSize: 24,
    fontWeight: '600',
    color: defaultTheme.colors.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: defaultTheme.colors.surface,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 18,
    fontWeight: '500',
    color: defaultTheme.colors.text.primary,
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  motivationText: {
    fontSize: 16,
    color: defaultTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    maxWidth: 320,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'transparent',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
