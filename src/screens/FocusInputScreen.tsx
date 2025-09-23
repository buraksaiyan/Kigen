import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  Vibration,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../config/theme';

interface FocusInputScreenProps {
  visible: boolean;
  onClose: () => void;
  onSessionComplete: (session: FocusSession) => void;
}

interface FocusSession {
  id: string;
  duration: number; // in minutes
  actualDuration: number; // actual time spent
  type: 'focus' | 'short-break' | 'long-break';
  startTime: string;
  endTime: string;
  completed: boolean;
  interruptions: number;
}

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;

export const FocusInputScreen: React.FC<FocusInputScreenProps> = ({
  visible,
  onClose,
  onSessionComplete,
}) => {
  // Timer states
  const [selectedDuration, setSelectedDuration] = useState(25); // in minutes
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionType, setSessionType] = useState<'focus' | 'short-break' | 'long-break'>('focus');
  const [completedSessions, setCompletedSessions] = useState(0);
  const [interruptions, setInterruptions] = useState(0);
  
  // Animation values
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartTime = useRef<string>('');

  const theme = {
    colors: {
      background: '#000000',
      surface: '#1C1C1E',
      surfaceSecondary: '#2C2C2E',
      primary: '#007AFF',
      success: '#34C759',
      warning: '#FF9500',
      danger: '#FF3B30',
      text: {
        primary: '#FFFFFF',
        secondary: '#8E8E93',
      },
      border: '#38383A',
    },
  };

  const focusDurations = [15, 20, 25, 30, 45, 60]; // minutes
  const breakDurations = { short: 5, long: 15 }; // minutes

  const sessionTypeConfig = {
    focus: { color: theme.colors.primary, label: 'Focus Time', icon: 'psychology' },
    'short-break': { color: theme.colors.success, label: 'Short Break', icon: 'coffee' },
    'long-break': { color: theme.colors.warning, label: 'Long Break', icon: 'nature-people' },
  };

  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          const newTime = prev - 1;
          const totalSeconds = selectedDuration * 60;
          progress.value = withTiming((totalSeconds - newTime) / totalSeconds, {
            duration: 100,
            easing: Easing.linear,
          });
          return newTime;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, timeLeft, selectedDuration]);

  const startSession = () => {
    if (timeLeft === 0) {
      setTimeLeft(selectedDuration * 60);
      sessionStartTime.current = new Date().toISOString();
    }
    setIsActive(true);
    setIsPaused(false);
    
    scale.value = withTiming(1.05, { duration: 200 }, () => {
      scale.value = withTiming(1, { duration: 200 });
    });
  };

  const pauseSession = () => {
    setIsPaused(true);
    setInterruptions(prev => prev + 1);
  };

  const resetSession = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(0);
    setInterruptions(0);
    progress.value = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleSessionComplete = () => {
    setIsActive(false);
    setIsPaused(false);
    
    // Vibration feedback
    Vibration.vibrate([500, 200, 500]);
    
    const session: FocusSession = {
      id: Date.now().toString(),
      duration: selectedDuration,
      actualDuration: Math.round((selectedDuration * 60 - timeLeft) / 60),
      type: sessionType,
      startTime: sessionStartTime.current,
      endTime: new Date().toISOString(),
      completed: true,
      interruptions,
    };

    onSessionComplete(session);
    setCompletedSessions(prev => prev + 1);
    
    // Auto-suggest break after focus session
    if (sessionType === 'focus') {
      const shouldTakeLongBreak = (completedSessions + 1) % 4 === 0;
      const nextSessionType = shouldTakeLongBreak ? 'long-break' : 'short-break';
      const nextDuration = shouldTakeLongBreak ? breakDurations.long : breakDurations.short;
      
      Alert.alert(
        'Session Complete! 🎉',
        `Great job! Time for a ${shouldTakeLongBreak ? 'long' : 'short'} break?`,
        [
          { text: 'Skip Break', onPress: resetSession },
          { text: 'Take Break', onPress: () => {
            setSessionType(nextSessionType);
            setSelectedDuration(nextDuration);
            resetSession();
          }},
        ]
      );
    } else {
      Alert.alert(
        'Break Complete! ☕',
        'Ready to get back to focus?',
        [
          { text: 'Extend Break', onPress: resetSession },
          { text: 'Start Focus', onPress: () => {
            setSessionType('focus');
            setSelectedDuration(25);
            resetSession();
          }},
        ]
      );
    }
    
    setInterruptions(0);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const currentSessionConfig = sessionTypeConfig[sessionType];
  const displayTime = timeLeft > 0 ? timeLeft : selectedDuration * 60;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Focus Session
          </Text>
          <TouchableOpacity onPress={resetSession} style={styles.resetButton}>
            <MaterialIcons name="refresh" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Session Type Selector */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Session Type
            </Text>
            <View style={styles.sessionTypeContainer}>
              {Object.entries(sessionTypeConfig).map(([type, config]) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.sessionTypeButton,
                    {
                      backgroundColor: sessionType === type ? config.color : theme.colors.surface,
                      borderColor: config.color,
                    }
                  ]}
                  onPress={() => {
                    if (!isActive) {
                      setSessionType(type as any);
                      if (type === 'focus') {
                        setSelectedDuration(25);
                      } else if (type === 'short-break') {
                        setSelectedDuration(breakDurations.short);
                      } else {
                        setSelectedDuration(breakDurations.long);
                      }
                      resetSession();
                    }
                  }}
                  disabled={isActive}
                >
                  <MaterialIcons
                    name={config.icon as any}
                    size={20}
                    color={sessionType === type ? '#FFFFFF' : config.color}
                  />
                  <Text style={[
                    styles.sessionTypeText,
                    { color: sessionType === type ? '#FFFFFF' : config.color }
                  ]}>
                    {config.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration Selector */}
          {sessionType === 'focus' && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Duration (minutes)
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.durationScrollView}
              >
                {focusDurations.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      {
                        backgroundColor: selectedDuration === duration ? currentSessionConfig.color : theme.colors.surface,
                        borderColor: currentSessionConfig.color,
                      }
                    ]}
                    onPress={() => {
                      if (!isActive) {
                        setSelectedDuration(duration);
                        resetSession();
                      }
                    }}
                    disabled={isActive}
                  >
                    <Text style={[
                      styles.durationText,
                      { color: selectedDuration === duration ? '#FFFFFF' : currentSessionConfig.color }
                    ]}>
                      {duration}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Timer Circle */}
          <View style={styles.timerContainer}>
            <Animated.View style={[styles.timerCircle, animatedCircleStyle]}>
              {/* Progress Circle Background */}
              <View style={[styles.progressCircle, { borderColor: theme.colors.surface }]} />
              
              <View style={styles.timerContent}>
                <Text style={[styles.timeText, { color: currentSessionConfig.color }]}>
                  {formatTime(displayTime)}
                </Text>
                <Text style={[styles.sessionLabel, { color: theme.colors.text.secondary }]}>
                  {currentSessionConfig.label}
                </Text>
                {interruptions > 0 && (
                  <Text style={[styles.interruptionText, { color: theme.colors.warning }]}>
                    {interruptions} interruption{interruptions > 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            </Animated.View>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlsContainer}>
            {!isActive ? (
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: currentSessionConfig.color }]}
                onPress={startSession}
              >
                <MaterialIcons name="play-arrow" size={32} color="#FFFFFF" />
                <Text style={styles.playButtonText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.activeControls}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: theme.colors.warning }]}
                  onPress={pauseSession}
                >
                  <MaterialIcons name={isPaused ? 'play-arrow' : 'pause'} size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: theme.colors.danger }]}
                  onPress={() => {
                    Alert.alert(
                      'Stop Session?',
                      'Are you sure you want to stop this session?',
                      [
                        { text: 'Continue', style: 'cancel' },
                        { text: 'Stop', style: 'destructive', onPress: resetSession },
                      ]
                    );
                  }}
                >
                  <MaterialIcons name="stop" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Session Stats */}
          <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.statItem}>
              <MaterialIcons name="check-circle" size={20} color={theme.colors.success} />
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {completedSessions}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  Completed
                </Text>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={20} color={theme.colors.primary} />
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {Math.round(completedSessions * selectedDuration)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  Total Minutes
                </Text>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <MaterialIcons name="trending-up" size={20} color={theme.colors.warning} />
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {completedSessions > 0 ? Math.round((1 - interruptions / completedSessions) * 100) : 100}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  Focus Rate
                </Text>
              </View>
            </View>
          </View>

          {/* Tips */}
          <View style={[styles.tipsContainer, { backgroundColor: theme.colors.surface }]}>
            <MaterialIcons name="lightbulb-outline" size={20} color={theme.colors.warning} />
            <View style={styles.tipsContent}>
              <Text style={[styles.tipsTitle, { color: theme.colors.text.primary }]}>
                Focus Tips
              </Text>
              <Text style={[styles.tipsText, { color: theme.colors.text.secondary }]}>
                • Find a quiet environment
                {'\n'}• Turn off notifications
                {'\n'}• Take breaks every 25 minutes
                {'\n'}• Stay hydrated and breathe deeply
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  activeControls: {
    flexDirection: 'row',
    gap: 20,
  },
  closeButton: {
    padding: 8,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  controlButton: {
    alignItems: 'center',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  controlsContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  durationButton: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
    minWidth: 60,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  durationScrollView: {
    flexDirection: 'row',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  interruptionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  playButton: {
    alignItems: 'center',
    borderRadius: 24,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  playButtonText: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  progressCircle: {
    borderRadius: (CIRCLE_SIZE - 20) / 2,
    borderWidth: 8,
    height: CIRCLE_SIZE - 20,
    position: 'absolute',
    width: CIRCLE_SIZE - 20,
  },
  resetButton: {
    padding: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sessionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  sessionTypeButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sessionTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statContent: {
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statsContainer: {
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  timeText: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: -2,
  },
  timerCircle: {
    alignItems: 'center',
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    position: 'relative',
    width: CIRCLE_SIZE,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  timerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  tipsContainer: {
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 40,
    padding: 16,
  },
  tipsContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipsText: {
    fontSize: 12,
    lineHeight: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
});