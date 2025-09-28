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
import Svg, { Circle } from 'react-native-svg';

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
    justifyContent: 'center',
    position: 'absolute',
    left: 12,
    top: 12,
    height: 48,
    width: 64,
    zIndex: 10,
  },
  closeButtonText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontWeight: '600',
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
  // Styles reused from CountdownScreen for visual parity
  progressSvg: {
    left: '50%',
    marginLeft: -170,
    marginTop: -170,
    position: 'absolute',
    top: '50%',
  },
  progressCircle: {
    alignItems: 'center',
    height: 420,
    justifyContent: 'center',
    marginTop: -30,
    position: 'relative',
    width: 420,
  },
  timeDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  primaryTimeContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  primaryTimeText: {
    color: theme.colors.text.primary,
    fontFamily: 'monospace',
    fontSize: 64,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  primaryLabelsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.xs,
  },
  primaryLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
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
  const { theme: ctxTheme } = useTheme();
  const styles = createStyles(ctxTheme);

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute (seconds are not shown)
  useEffect(() => {
    if (!visible) return;

    // Sync at start of minute then tick every 60s
    const update = () => setCurrentTime(new Date());
    update();
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000;

    const timeout = setTimeout(() => {
      update();
      const interval = setInterval(update, 60 * 1000);
      // store interval on closure cleanup
      (timeout as any)._interval = interval;
    }, msToNextMinute);

    return () => {
      clearTimeout(timeout as any);
      const interval = (timeout as any)._interval as ReturnType<typeof setInterval> | undefined;
      if (interval) clearInterval(interval);
    };
  }, [visible]);

  // Android back handling while focused
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Extract hours and minutes for display
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();

  // Break hours into two digits
  const h1 = Math.floor(hours / 10).toString();
  const h2 = (hours % 10).toString();
  const m1 = Math.floor(minutes / 10).toString();
  const m2 = (minutes % 10).toString();

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
            {/* Circular progress ring for visual parity with CountdownScreen */}
            <View style={styles.progressCircle as any}>
              <Svg width={340} height={340} style={styles.progressSvg as any}>
                <Circle cx={170} cy={170} r={155} stroke="#333333" strokeWidth={8} fill="transparent" />
                {/* Static ring for clock mode */}
                <Circle cx={170} cy={170} r={155} stroke={ctxTheme.colors.primary} strokeWidth={8} fill="transparent" strokeDasharray={`${2 * Math.PI * 155}`} strokeLinecap="round" transform="rotate(-90 170 170)" />
              </Svg>

              <View style={styles.timeDisplayContainer}>
                <View style={styles.primaryTimeContainer}>
                  <Text style={[styles.primaryTimeText, { color: ctxTheme.colors.text.primary }]}>
                    {h1}{h2}:{m1}{m2}
                  </Text>
                  <View style={styles.primaryLabelsContainer}>
                    <Text style={styles.primaryLabel}>HOURS</Text>
                    <Text style={styles.primaryLabel}>MINUTES</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.currentTime}>{/* Keep for accessibility but empty since we show big digits */}</Text>

          <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};