import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme as defaultTheme } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import TimerClock from '../components/timerClocks/TimerClock';

interface ClockModeScreenProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  clockStyle: string;
}

const createStyles = (theme: typeof defaultTheme) => StyleSheet.create({
  analogClockContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 120,
    height: 240,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    width: 240,
  },
  centerDot: {
    backgroundColor: theme.colors.text.primary,
    borderRadius: 4,
    height: 8,
    position: 'absolute',
    width: 8,
  },
  clockContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  clockFace: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 100,
    height: 200,
    justifyContent: 'center',
    position: 'relative',
    width: 200,
  },
  clockWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    top: 20,
    width: 40,
    zIndex: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  currentTime: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  dateText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  digitalClockContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    minWidth: 200,
    padding: theme.spacing.xl,
  },
  digitalClockPeriod: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  digitalClockTime: {
    color: theme.colors.text.primary,
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
  },
  hourHand: {
    backgroundColor: theme.colors.text.primary,
    borderRadius: 2,
    height: 60,
    left: 98,
    position: 'absolute',
    top: 70,
    transformOrigin: 'bottom center',
    width: 4,
  },
  hourMarker: {
    backgroundColor: theme.colors.text.primary,
    borderRadius: 1.5,
    height: 15,
    position: 'absolute',
    width: 3,
  },
  minuteHand: {
    backgroundColor: theme.colors.text.primary,
    borderRadius: 1.5,
    height: 80,
    left: 98.5,
    position: 'absolute',
    top: 60,
    transformOrigin: 'bottom center',
    width: 3,
  },
  minuteMarker: {
    backgroundColor: theme.colors.text.tertiary,
    borderRadius: 0.5,
    height: 8,
    position: 'absolute',
    width: 1,
  },
  secondHand: {
    backgroundColor: theme.colors.danger,
    borderRadius: 0.5,
    height: 90,
    left: 99.5,
    position: 'absolute',
    top: 55,
    transformOrigin: 'bottom center',
    width: 1,
  },
  subtitleText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  titleText: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
});

// Map clock style to our supported timer clock types
const getClockStyle = (styleId: string): 'classic' | 'flip' | 'gradient' => {
  switch (styleId) {
    case 'classic':
    case 'circular':
    case 'analog':
      return 'classic';
    case 'flip':
      return 'flip';
    case 'gradient':
    case 'bar':
    case 'progress':
      return 'gradient';
    default:
      return 'classic';
  }
};

export const ClockModeScreen: React.FC<ClockModeScreenProps> = ({
  visible,
  onClose,
  title,
  clockStyle,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  // Android back button handling
  useFocusEffect(
    React.useCallback(() => {
      if (!visible) return;

      const backHandler = () => {
        onClose();
        return true;
      };

      if (Platform.OS === 'android') {
        const subscription = BackHandler.addEventListener('hardwareBackPress', backHandler);
        return () => subscription.remove();
      }
    }, [visible, onClose])
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const clockType = getClockStyle(clockStyle);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>

        <View style={styles.clockContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.subtitleText}>Clock Mode</Text>
          </View>

          <View style={styles.clockWrapper}>
            <TimerClock 
              clockStyle={clockType}
              duration={3600}
              elapsed={currentTime.getSeconds() + (currentTime.getMinutes() * 60)}
              size={200}
              strokeWidth={12}
              color={theme.colors.primary}
            />
          </View>

          <Text style={styles.currentTime}>
            {formatTime(currentTime)}
          </Text>

          <Text style={styles.dateText}>
            {formatDate(currentTime)}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};