import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../config/theme';
import BackgroundTimerService from '../services/BackgroundTimerService';
import TimerSoundService from '../services/TimerSoundService';
import { useSettings } from '../hooks/useSettings';
import useOrientation from '../hooks/useOrientation';
import { FOCUS_QUOTES, getQuotesByCategory, FocusQuote } from '../data/focusQuotes';

const { width } = Dimensions.get('window');

interface FocusMode {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  description: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
}

interface CountdownScreenProps {
  visible: boolean;
  mode: FocusMode;
  totalHours: number;
  totalMinutes: number;
  breakMinutes: number;
  selectedGoal?: Goal | null; // Add goal support
  onComplete: () => void;
  onPause: () => void;
  onEarlyFinish: () => void;
  onAbort: () => void;
  // For Pomodoro: whether breaks are skippable and a callback to update current session id
  skippableBreaks?: boolean;
  onSessionIdChange?: (id: string) => void;
  // For Pomodoro: number of loops to complete (default 1)
  loopCount?: number;
}

// Helper function to map mode ID to quote category
const getModeCategory = (modeId: string): FocusQuote['category'] => {
  const modeMap: Record<string, FocusQuote['category']> = {
    'flow': 'flow',
    'pomodoro': 'pomodoro',
    'clock': 'clock',
    'body': 'body',
    'meditation': 'meditation',
  };
  return modeMap[modeId] || 'general';
};

export const CountdownScreen: React.FC<CountdownScreenProps> = ({
  visible,
  mode,
  totalHours,
  totalMinutes,
  breakMinutes,
  selectedGoal,
  onComplete,
  onPause,
  onEarlyFinish,
  onAbort,
  skippableBreaks,
  onSessionIdChange,
  loopCount = 1,
}) => {
  const [timeLeft, setTimeLeft] = useState(totalHours * 3600 + totalMinutes * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime] = useState(Date.now());
  
  // Quote cycling state
  const [availableQuotes] = useState(() => getQuotesByCategory(getModeCategory(mode.id)));
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const selectedQuote = availableQuotes[currentQuoteIndex];
  
  const cycleQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % availableQuotes.length);
  };

  // Break-related state
  const [isInBreak, setIsInBreak] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(breakMinutes * 60);
  const [pausedFocusTime, setPausedFocusTime] = useState(0);

  // Pomodoro loop tracking
  const [currentLoop, setCurrentLoop] = useState(1);
  const [maxLoops] = useState(loopCount);

  // Set counter state for Body Focus mode
  const [setCount, setSetCount] = useState(0);

  // Settings for sounds
  const { settings } = useSettings();

  // Calculate progress percentage based on timeLeft
  const totalSeconds = totalHours * 3600 + totalMinutes * 60;
  const progressPercentage = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  // Orientation-aware sizing for SVG timer
  const { orientation, screen } = useOrientation();
  const isLandscape = orientation === 'landscape';
  const svgSize = Math.min(screen.width, screen.height) * (isLandscape ? 0.6 : 0.75); // responsive size
  const svgRadius = Math.floor(svgSize / 2) - 15; // padding for stroke

  useEffect(() => {
    StatusBar.setHidden(true);
    
    // Keep screen awake during focus session
    activateKeepAwakeAsync();
    
    // Initialize timer sound service
    TimerSoundService.initialize();
    
    // Register background task and request permissions
    BackgroundTimerService.requestPermissions();
    BackgroundTimerService.registerBackgroundTask();
    
    return () => {
      StatusBar.setHidden(false);
      deactivateKeepAwake();
      
      // Clean up background timer on unmount
      if (!isRunning) {
        BackgroundTimerService.stopTimer();
      }
    };
  }, [isRunning, mode.id]);

  // Show notification when timer starts
  useEffect(() => {
    if (visible && isRunning && !isPaused) {
      const showStartNotification = async () => {
        try {
          const totalTimeFormatted = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}:00`;
          
          // Only show start notification, don't show completion notification immediately
          console.log(`Starting ${mode.title} focus session for ${totalTimeFormatted}`);
          
        } catch (error) {
          console.log('Failed to show start notification:', error);
        }
      };

      showStartNotification();
      
      // Start background timer
      BackgroundTimerService.startTimer({
        id: startTime.toString(),
        startTime,
        duration: totalHours * 3600 + totalMinutes * 60,
        isPaused: false,
        isRunning: true,
        mode: {
          title: mode.title,
          color: mode.color,
        },
      });
    }
  }, [visible, isRunning, isPaused, mode.title, totalHours, totalMinutes, startTime]);

  // Background state sync
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came back to foreground, sync with background timer
        try {
          const backgroundState = await BackgroundTimerService.getTimer();
          if (backgroundState) {
            const elapsed = Math.floor((Date.now() - backgroundState.startTime) / 1000);
            const newTimeLeft = Math.max(0, backgroundState.duration - elapsed);
            setTimeLeft(newTimeLeft);
            setIsPaused(backgroundState.isPaused);
            setIsRunning(backgroundState.isRunning && newTimeLeft > 0);
          }
        } catch (error) {
          console.log('Failed to sync background timer:', error);
        }
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Animate progress circle smoothly
  // Handle set counter for Body Focus mode
  const handleSetIncrement = () => {
    setSetCount(prev => prev + 1);
  };

  const handleSetReset = () => {
    setSetCount(0);
  };

  // TODO: Re-implement background timer sync after fixing the issues
  // useEffect(() => {
  //   const handleAppStateChange = async (nextAppState: string) => {
  //     // Background sync logic will be added back after fixes
  //   };
  //   const subscription = AppState.addEventListener('change', handleAppStateChange);
  //   return () => subscription?.remove();
  // }, [onComplete]);

  useEffect(() => {
  let interval: ReturnType<typeof globalThis.setInterval>;
    
    if (isRunning && !isPaused && timeLeft > 0 && !isInBreak) {
  interval = globalThis.setInterval(async () => {
        setTimeLeft(prevTime => {
          const newTime = prevTime - 1;
          
          // Play tick sound if enabled in settings (but not for meditation)
          if (settings.timerSoundsEnabled && newTime > 0 && mode.id !== 'meditation') {
            TimerSoundService.playTick(settings.soundVolume, false).catch(err => 
              console.log('Timer tick sound error:', err)
            );
          }
          
          if (newTime <= 0) {
            setIsRunning(false);
            // If this is a pomodoro mode, handle loop logic here
            if (mode.id === 'pomodoro') {
              handlePomodoroWorkComplete().catch(err => console.error('Pomodoro work completion error', err));
            } else {
              onComplete();
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        globalThis.clearInterval(interval);
      }
    };
  }, [isRunning, isPaused, onComplete, settings.timerSoundsEnabled, settings.soundVolume, isInBreak]);

  // Break timer effect
  useEffect(() => {
    let breakInterval: ReturnType<typeof globalThis.setInterval>;
    
    if (isInBreak && breakTimeLeft > 0) {
      breakInterval = globalThis.setInterval(() => {
        setBreakTimeLeft(prevTime => {
          const newTime = prevTime - 1;
          
          if (newTime <= 0) {
            // Break is over, resume focus session
            handleBreakComplete();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (breakInterval) {
        globalThis.clearInterval(breakInterval);
      }
    };
  }, [isInBreak, breakTimeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return {
      h1: Math.floor(h / 10).toString(),
      h2: (h % 10).toString(),
      m1: Math.floor(m / 10).toString(),
      m2: (m % 10).toString(),
      s1: Math.floor(s / 10).toString(),
      s2: (s % 10).toString(),
    };
  };

  const currentTime = formatTime(timeLeft);

  const handlePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    
    // Update background timer state
    BackgroundTimerService.updateTimer({
      isPaused: newPausedState,
    });
    
    onPause();
  };

  const handleBreak = () => {
    // Pause the main focus timer
    setPausedFocusTime(timeLeft);
    setIsPaused(true);
    setIsInBreak(true);
    setBreakTimeLeft(breakMinutes * 60); // Reset break timer
  };

  const handleBreakComplete = () => {
    // Resume the main focus timer from where it left off
    setTimeLeft(pausedFocusTime);
    setIsInBreak(false);
    setIsPaused(false);
  };

  // For pomodoro flow: on finishing a work session
  const handlePomodoroWorkComplete = async () => {
    try {
      // Complete and record the current stored session (FocusSessionService reads @inzone_current_session)
      const { focusSessionService } = await import('../services/FocusSessionService');
      const current = await focusSessionService.getCurrentSession();
      if (current?.id) {
        await focusSessionService.completeSession(current.id, true, 'completed');
      }

      // Check if all loops are completed
      if (currentLoop >= maxLoops) {
        // All loops done! Show completion screen
        onComplete();
        return;
      }

      // More loops to go, take a break
      // Decide if this break should be a long break
      const run = await focusSessionService.getPomodoroRun();
      const consecutive = run?.consecutive || 0;
      const isLongBreak = consecutive > 0 && (consecutive % 4 === 0);

      // Set break duration accordingly
      const effectiveBreakMinutes = isLongBreak ? 30 : breakMinutes;
      setBreakTimeLeft(effectiveBreakMinutes * 60);
      setIsInBreak(true);
      setPausedFocusTime(0);
      setIsPaused(true);
      setIsRunning(false);
    } catch (error) {
      console.error('Error handling pomodoro completion:', error);
      onComplete();
    }
  };

  const startNextPomodoro = async () => {
    try {
      // Increment loop counter
      setCurrentLoop(prev => prev + 1);

      // Start a fresh pomodoro work session
      const { focusSessionService } = await import('../services/FocusSessionService');
      const workTotalMinutes = totalHours * 60 + totalMinutes; // compute work minutes from props
      const sessionId = await focusSessionService.startSession({ id: 'pomodoro', title: 'Pomodoro', color: mode.color }, workTotalMinutes, null);
      // Notify parent to keep currentSessionId in sync
      onSessionIdChange?.(sessionId);

      // Reset timers and resume
      setTimeLeft(totalHours * 3600 + totalMinutes * 60);
      setIsInBreak(false);
      setIsPaused(false);
      setIsRunning(true);
    } catch (error) {
      console.error('Error starting next pomodoro session:', error);
    }
  };

  const handleContinueFromBreak = () => {
    // User manually continues from break
    // If pomodoro, this resumes to next work session
    if (mode.id === 'pomodoro') {
      // If user clicked Continue during break, we resume to next work session by starting it
      startNextPomodoro().catch(err => console.error('Error resuming pomodoro after continue', err));
    } else {
      handleBreakComplete();
    }
  };

  const handleSkipBreak = async () => {
    // Skip break and begin the next pomodoro immediately
    try {
      // Start next pomodoro
      await startNextPomodoro();
    } catch (error) {
      console.error('Error skipping break:', error);
    }
  };

  const handleEarlyFinish = async () => {
    try {
      // Stop background timer and cancel any scheduled notifications
      await BackgroundTimerService.stopTimer();
      setIsRunning(false);
      
      // Call the original early finish handler
      // If pomodoro, reset run state
      if (mode.id === 'pomodoro') {
        const { focusSessionService } = await import('../services/FocusSessionService');
        await focusSessionService.savePomodoroRun({ consecutive: 0, lastEndAt: new Date().toISOString() });
      }
      onEarlyFinish();
    } catch (error) {
      console.error('Error stopping timer on early finish:', error);
      // Still call early finish even if stopping timer fails
      onEarlyFinish();
    }
  };

  const handleAbort = async () => {
    try {
      // Stop background timer and cancel any scheduled notifications
      await BackgroundTimerService.stopTimer();
      setIsRunning(false);
      
      // Reset pomodoro run state if applicable
      if (mode.id === 'pomodoro') {
        const { focusSessionService } = await import('../services/FocusSessionService');
        await focusSessionService.savePomodoroRun({ consecutive: 0, lastEndAt: new Date().toISOString() });
      }

      // Call the original abort handler
      onAbort();
    } catch (error) {
      console.error('Error stopping timer on abort:', error);
      // Still call abort even if stopping timer fails
      onAbort();
    }
  };

  if (!visible) return null;

  // Show break screen if in break mode
  if (isInBreak) {
    const breakTime = formatTime(breakTimeLeft);
    const breakProgressPercentage = breakMinutes > 0 ? ((breakMinutes * 60 - breakTimeLeft) / (breakMinutes * 60)) * 100 : 0;

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Break Header */}
          <View style={styles.header}>
            <Text style={[styles.modeTitle, { color: '#22C55E' }]}>
              Break Time
            </Text>
            <View style={[styles.progressBar, { backgroundColor: '#22C55E20' }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: '#22C55E',
                    width: `${breakProgressPercentage}%` 
                  }
                ]} 
              />
            </View>
          </View>

          {/* Break Timer Display */}
          <View style={styles.circularTimerContainer}>
            <View style={styles.breakTimerContainer}>
              <Svg width={svgSize} height={svgSize}>
                {/* Background circle - gray */}
                <Circle
                  cx={svgSize / 2}
                  cy={svgSize / 2}
                  r={svgRadius}
                  stroke="#333333"
                  strokeWidth={8}
                  fill="transparent"
                />
                {/* Progress circle - green for break */}
                <Circle
                  cx={svgSize / 2}
                  cy={svgSize / 2}
                  r={svgRadius}
                  stroke="#22C55E"
                  strokeWidth={8}
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * svgRadius}`}
                  strokeDashoffset={`${2 * Math.PI * svgRadius * (1 - breakProgressPercentage / 100)}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
                />
              </Svg>
              
              {/* Break Time Display */}
              <View style={styles.breakTimerTextContainer}>
                <View style={styles.primaryTimeContainer}>
                  <Text style={[styles.primaryTimeText, { color: theme.colors.text.primary }]}>
                    {breakTime.m1}{breakTime.m2}:{breakTime.s1}{breakTime.s2}
                  </Text>
                  <View style={styles.primaryLabelsContainer}>
                    <Text style={styles.primaryLabel}>MINUTES</Text>
                    <Text style={styles.primaryLabel}>SECONDS</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Break Controls */}
          <View style={styles.controls}>
            <View style={styles.controlButton} />
            
            <TouchableOpacity
              style={[styles.controlButton, styles.continueButton, { backgroundColor: '#22C55E', borderRadius: 25 }]}
              onPress={handleContinueFromBreak}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.primaryButtonText, { color: theme.colors.text.primary }]}>
                Continue
              </Text>
            </TouchableOpacity>

            {/* Skip Break for Pomodoro if enabled */}
            {mode.id === 'pomodoro' && skippableBreaks && (
              <TouchableOpacity
                style={[styles.controlButton, styles.continueButton, { backgroundColor: '#FF66B2', borderRadius: 25 }]}
                onPress={handleSkipBreak}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.primaryButtonText, { color: theme.colors.text.primary }]}>Skip Break</Text>
              </TouchableOpacity>
            )}

            <View style={styles.controlButton} />
          </View>

          {/* Break Quote */}
          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>
              &quot;Take a deep breath. You&apos;ve earned this break.&quot;
            </Text>
            <Text style={styles.quoteAuthor}>— Your Focus Guide</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.modeTitle, { color: mode.color }]}>
            {mode.title}
          </Text>
          {/* Pomodoro Loop Counter */}
          {mode.id === 'pomodoro' && maxLoops > 1 && (
            <Text style={[styles.loopCounter, { color: mode.color }]}>
              Loop {currentLoop} of {maxLoops}
            </Text>
          )}
          <View style={[styles.progressBar, { backgroundColor: `${mode.color}20` }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: mode.color,
                  width: `${progressPercentage}%` 
                }
              ]} 
            />
          </View>
        </View>

        {/* Circular Timer Display */}
        <View style={styles.circularTimerContainer}>
          {/* Body Focus Set Counter - only show for body mode */}
          {mode.id === 'body' && (
            <View style={styles.setCounterContainer}>
              <Text style={[styles.setCounterLabel, { color: mode.color }]}>SETS</Text>
              <View style={styles.setCounterRow}>
                <TouchableOpacity 
                  style={[styles.setCounterButton, { borderColor: mode.color }]}
                  onPress={handleSetIncrement}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.setCounterValue, { color: mode.color }]}>{setCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.setResetButton, { backgroundColor: mode.color }]}
                  onPress={handleSetReset}
                  activeOpacity={0.8}
                >
                  <Text style={styles.setResetButtonText}>RESET</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Progress Circle */}
              <View style={[styles.progressCircle, { width: svgSize, height: svgSize }]}>
            <Svg width={svgSize} height={svgSize} style={[styles.progressSvg, { marginLeft: -svgSize / 2, marginTop: -svgSize / 2 }]}>
              {/* Background circle - gray */}
              <Circle
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={svgRadius}
                stroke="#333333"
                strokeWidth={8}
                fill="transparent"
              />
              {/* Progress circle - colored based on mode */}
              <Circle
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={svgRadius}
                stroke={mode.color}
                strokeWidth={8}
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * svgRadius}`}
                strokeDashoffset={`${2 * Math.PI * svgRadius * (1 - progressPercentage / 100)}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
              />
            </Svg>
            
            {/* Time Display */}
            <View style={styles.timeDisplayContainer}>
              {/* Hours and Minutes - Large */}
              <View style={styles.primaryTimeContainer}>
                <Text style={[styles.primaryTimeText, { color: theme.colors.text.primary }]}>
                  {currentTime.h1}{currentTime.h2}:{currentTime.m1}{currentTime.m2}
                </Text>
                <View style={styles.primaryLabelsContainer}>
                  <Text style={styles.primaryLabel}>HOURS</Text>
                  <Text style={styles.primaryLabel}>MINUTES</Text>
                </View>
              </View>
              
              {/* Seconds - Small */}
              <View style={styles.secondaryTimeContainer}>
                <Text style={[styles.secondaryTimeText, { color: mode.color }]}>
                  {currentTime.s1}{currentTime.s2}
                </Text>
                <Text style={styles.secondaryLabel}>SECONDS</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Hide Break button for Pomodoro and Clock modes */}
          {mode.id !== 'pomodoro' && mode.id !== 'clock' && (
            <TouchableOpacity
              style={[styles.controlButton, styles.breakButton]}
              onPress={handleBreak}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text.tertiary }]}>Break</Text>
            </TouchableOpacity>
          )}

          {/* Hide Pause button for Pomodoro and Clock modes */}
          {mode.id !== 'pomodoro' && mode.id !== 'clock' && (
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: mode.color, borderRadius: 25 }]}
              onPress={handlePause}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.primaryButtonText, { color: theme.colors.text.primary }]}>
                {isPaused ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Early Finish Button - make it wider when pause/break are hidden */}
          <TouchableOpacity
            style={[
              styles.controlButton, 
              styles.earlyFinishButton,
              (mode.id === 'pomodoro' || mode.id === 'clock') && { minWidth: 200 }
            ]}
            onPress={handleEarlyFinish}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.text.tertiary }]} numberOfLines={1}>Finish</Text>
          </TouchableOpacity>
        </View>

        {/* Zen Quote - Tappable to cycle */}
        <TouchableOpacity 
          style={styles.quoteContainer} 
          onPress={cycleQuote}
          activeOpacity={0.7}
        >
          <Text style={styles.quoteText}>
            &quot;{selectedQuote?.text || 'Focus on the present moment.'}&quot;
          </Text>
          <Text style={styles.quoteAuthor}>— {selectedQuote?.author || 'Unknown'}</Text>
          <Text style={styles.quoteHint}>Tap for next quote</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  abortButton: {
    backgroundColor: theme.colors.overlayLight,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  breakButton: {
    backgroundColor: theme.colors.overlayLight,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  continueButton: {
    minWidth: 160,
    paddingVertical: theme.spacing.sm,
  },
  // New circular timer styles
  circularTimerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  breakTimerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  breakTimerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -40 }],
  },
  clockContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  controlButton: {
    alignItems: 'center',
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
    maxWidth: 120,
    minWidth: 100,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  digitBottom: {
    borderTopColor: theme.colors.overlayLight,
    borderTopWidth: 1,
    bottom: 0,
  },
  digitCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    height: 80,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 60,
  },
  digitContainer: {
    height: 80,
    marginHorizontal: 2,
    position: 'relative',
    width: 60,
  },
  digitHalf: {
    alignItems: 'center',
    borderRadius: 8,
    elevation: 5,
    height: '50%',
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '100%',
  },
  digitText: {
    color: theme.colors.text.primary,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  digitTop: {
    borderBottomColor: theme.colors.overlay,
    borderBottomWidth: 1,
    top: 0,
  },
  earlyFinishButton: {
    backgroundColor: theme.colors.overlayLight,
    borderColor: theme.colors.border,
    borderWidth: 1,
    maxWidth: 140,
    minWidth: 130, // Wider to fit "Early Finish" on one line
  },
  flipContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  modeTitle: {
    ...theme.typography.h2,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  loopCounter: {
    ...theme.typography.body,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  primaryButton: {
    elevation: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  primaryLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  primaryLabelsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.xs,
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
  // eslint-disable-next-line react-native/no-color-literals
  progressArc: {
    borderBottomColor: 'transparent',
    borderLeftColor: theme.colors.primary,
    borderRadius: 165,
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderWidth: 6,
    height: 330,
    position: 'absolute',
    width: 330,
  },
  progressBar: {
    borderRadius: 2,
    height: 4,
    overflow: 'hidden',
    width: width * 0.8,
  },
  progressCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // size is controlled by the Svg inline styles (svgSize)
  },
  progressFill: {
    borderRadius: 2,
    height: '100%',
  },
  progressRing: {
    borderColor: theme.colors.overlayLight,
    borderRadius: 165,
    borderWidth: 6,
    height: 330,
    position: 'absolute',
    width: 330,
  },
  quoteAuthor: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  quoteContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  quoteText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  quoteHint: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    fontSize: 11,
    marginTop: theme.spacing.xs,
    opacity: 0.6,
    textAlign: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  secondaryButton: {
    backgroundColor: theme.colors.overlay,
    borderColor: theme.colors.overlayLight,
    borderWidth: 2,
  },
  secondaryButtonText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
    fontWeight: '700',
  },
  secondaryTimeContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  secondaryTimeText: {
    color: theme.colors.text.primary,
    fontFamily: 'monospace',
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  separator: {
    fontSize: 32,
    fontWeight: 'bold',
    marginHorizontal: theme.spacing.sm,
  },
  separatorLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    marginHorizontal: theme.spacing.sm,
  },
  separatorSmall: {
    fontSize: 28,
    fontWeight: 'bold',
    marginHorizontal: theme.spacing.xs,
  },
  smallButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  smallControlButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.overlay,
    borderRadius: 22.5,
    borderWidth: 2,
    height: 45,
    justifyContent: 'center',
    width: 45,
  },
  timeDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timeLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    letterSpacing: 2,
  },
  timeLabelLarge: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
  },
  timeLabelSmall: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.lg,
    width: '100%',
  },
  secondaryLabel: {
    color: theme.colors.text.secondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  // Simple text styles for backup
  simpleDigitText: {
    color: theme.colors.text.primary,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  simpleDigitTextLarge: {
    fontSize: 48,
  },
  simpleDigitTextSmall: {
    fontSize: 28,
  },
  // Set counter styles for Body Focus mode
  setCounterContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  setCounterLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  setCounterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  setCounterButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.overlayLight,
    borderRadius: 40,
    borderWidth: 3,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  setCounterValue: {
    fontFamily: 'monospace',
    fontSize: 32,
    fontWeight: 'bold',
  },
  setResetButton: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  setResetButtonText: {
    color: theme.colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // SVG progress circle styles
  progressSvg: {
    left: '50%',
    position: 'absolute',
    top: '50%',
    // margin offsets are provided dynamically where the Svg is rendered
  },
});
