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

const DigitalClockDisplay: React.FC<{ theme: typeof defaultTheme }> = ({ theme }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <View style={{
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl,
      minWidth: 200,
    }}>
      <Text style={{
        fontSize: 36,
        fontWeight: '700',
        color: theme.colors.text.primary,
        lineHeight: 42,
      }}>
        {formatNumber(hours)}:{formatNumber(minutes)}:{formatNumber(seconds)}
      </Text>
      <Text style={{
        ...theme.typography.bodyLarge,
        color: theme.colors.text.secondary,
        fontWeight: '600',
        marginTop: theme.spacing.sm,
      }}>
        {hours >= 12 ? 'PM' : 'AM'}
      </Text>
    </View>
  );
};

const AnalogClockDisplay: React.FC<{ theme: typeof defaultTheme }> = ({ theme }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = currentTime.getHours() % 12;
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

  const hourAngle = (hours * 30) + (minutes * 0.5);
  const minuteAngle = minutes * 6;
  const secondAngle = seconds * 6;

  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 120,
      width: 240,
      height: 240,
      padding: theme.spacing.lg,
    }}>
      {/* Clock face */}
      <View style={{
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: theme.colors.background,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Hour markers */}
        {Array.from({ length: 12 }, (_, i) => (
          <View
            key={i}
            style={[
              {
                position: 'absolute',
                width: 3,
                height: 15,
                backgroundColor: theme.colors.text.primary,
                borderRadius: 1.5,
              },
              {
                transform: [
                  { rotate: `${i * 30}deg` },
                  { translateY: -85 }
                ]
              }
            ]}
          />
        ))}

        {/* Minute markers */}
        {Array.from({ length: 60 }, (_, i) => (
          <View
            key={i}
            style={[
              {
                position: 'absolute',
                width: 1,
                height: 8,
                backgroundColor: theme.colors.text.tertiary,
                borderRadius: 0.5,
              },
              {
                transform: [
                  { rotate: `${i * 6}deg` },
                  { translateY: -88 }
                ]
              }
            ]}
          />
        ))}

        {/* Hour hand */}
        <View
          style={[
            {
              position: 'absolute',
              width: 4,
              height: 60,
              backgroundColor: theme.colors.text.primary,
              borderRadius: 2,
              top: 70,
              left: 98,
              transformOrigin: 'bottom center',
            },
            { transform: [{ rotate: `${hourAngle}deg` }] }
          ]}
        />

        {/* Minute hand */}
        <View
          style={[
            {
              position: 'absolute',
              width: 3,
              height: 80,
              backgroundColor: theme.colors.text.primary,
              borderRadius: 1.5,
              top: 60,
              left: 98.5,
              transformOrigin: 'bottom center',
            },
            { transform: [{ rotate: `${minuteAngle}deg` }] }
          ]}
        />

        {/* Second hand */}
        <View
          style={[
            {
              position: 'absolute',
              width: 1,
              height: 90,
              backgroundColor: theme.colors.danger,
              borderRadius: 0.5,
              top: 55,
              left: 99.5,
              transformOrigin: 'bottom center',
            },
            { transform: [{ rotate: `${secondAngle}deg` }] }
          ]}
        />

        {/* Center dot */}
        <View style={{
          position: 'absolute',
          width: 8,
          height: 8,
          backgroundColor: theme.colors.text.primary,
          borderRadius: 4,
        }} />
      </View>
    </View>
  );
};

const getClockComponent = (styleId: string) => {
  switch (styleId) {
    case 'classic':
      return AnalogClockDisplay;
    case 'minimal':
      return DigitalClockDisplay;
    case 'flip':
      return DigitalClockDisplay;
    case 'pomodoro':
      return AnalogClockDisplay;
    case 'gradient':
      return DigitalClockDisplay;
    case 'arc':
      return AnalogClockDisplay;
    case 'custom':
      return DigitalClockDisplay;
    default:
      return AnalogClockDisplay;
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

  const ClockComponent = getClockComponent(clockStyle);

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
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.clockContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.subtitleText}>Clock Mode</Text>
          </View>

          <View style={styles.clockWrapper}>
            <ClockComponent theme={theme} />
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