import React, { useState, useEffect, useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { FocusModeSetupScreen } from './FocusModeSetupScreen';
import { CountdownScreen } from './CountdownScreen';
import { GoalSelectionScreen } from './GoalSelectionScreen';
import { ClockModeSetupScreen } from './ClockModeSetupScreen';
import { ClockModeScreen } from './ClockModeScreen';
import { focusSessionService } from '../services/FocusSessionService';
import { useSettings } from '../hooks/useSettings';

const CUSTOM_MODE_COLOR = theme.colors.focus.custom;
const TRANSPARENT = 'rgba(0, 0, 0, 0)';

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

interface FocusSessionScreenProps {
  visible: boolean;
  onClose: () => void;
  onOpenGoals?: () => void;
  onSessionComplete?: () => void; // Callback for when a session completes
}

const focusModes: FocusMode[] = [
  {
    id: 'flow',
    title: 'Flow Focus',
    subtitle: 'Deep Work Sessions',
    color: theme.colors.focus.study,
    description: 'Enter a state of deep focus for creative and analytical work.',
  },
  {
    id: 'executioner',
    title: 'Executioner Focus',
    subtitle: 'High-Intensity Tasks',
    color: theme.colors.focus.work,
    description: 'Tackle challenging tasks with maximum intensity and discipline.',
  },
  {
    id: 'meditation',
    title: 'Meditation Focus',
    subtitle: 'Mindfulness & Awareness',
    color: theme.colors.focus.meditation,
    description: 'Cultivate mindfulness and inner awareness through meditation.',
  },
  {
    id: 'body',
    title: 'Body Focus',
    subtitle: 'Physical Training',
    color: theme.colors.focus.exercise,
    description: 'Focus on physical training and body awareness exercises.',
  },
  {
    id: 'clock',
    title: 'Clock',
    subtitle: 'Time Management',
    color: theme.colors.focus.reading,
    description: 'Focus on time management and productivity tracking.',
  },
];

export const FocusSessionScreen: React.FC<FocusSessionScreenProps> = ({ 
  visible, 
  onClose, 
  onOpenGoals,
  onSessionComplete 
}) => {
  const [selectedMode, setSelectedMode] = useState<FocusMode | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showGoalSelection, setShowGoalSelection] = useState(false);
  const [showClockSetup, setShowClockSetup] = useState(false);
  const [showClockMode, setShowClockMode] = useState(false);
  const [clockTitle, setClockTitle] = useState('');
  const [clockStyle, setClockStyle] = useState('classic');
  const [sessionHours, setSessionHours] = useState(0);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const { settings } = useSettings();

  // Destructure focus modes for type safety
  const [flowMode, executionerMode, meditateMode, bodyMode, clockMode] = focusModes as [FocusMode, FocusMode, FocusMode, FocusMode, FocusMode];

  const handleModeSelect = (mode: FocusMode) => {
    setSelectedMode(mode);
    
    if (mode.id === 'executioner') {
      // Executioner mode uses goal selection first
      setShowGoalSelection(true);
    } else if (mode.id === 'clock') {
      // Clock mode uses its own setup screen
      setShowClockSetup(true);
    } else {
      setShowSetup(true);
    }
  };

  const handleStartSession = async (mode: FocusMode, hours: number, minutes: number, breakMin: number) => {
    try {
      const totalMinutes = (hours * 60) + minutes;
      const sessionId = await focusSessionService.startSession(mode, totalMinutes, null);
      
      setCurrentSessionId(sessionId);
      setSessionHours(hours);
      setSessionMinutes(minutes);
      setBreakMinutes(breakMin);
      setShowSetup(false);
      setShowCountdown(true);
      
      console.log('Focus session started:', { sessionId, mode: mode.title, duration: totalMinutes, breakDuration: breakMin });
    } catch (error) {
      console.error('Error starting focus session:', error);
      // Handle error - could show an alert or toast
    }
  };

  const handleCountdownComplete = async () => {
    try {
      if (currentSessionId) {
        await focusSessionService.completeSession(currentSessionId, true, 'completed');
        console.log('Focus session completed successfully!', { 
          mode: selectedMode?.title
        });
        
        // Notify dashboard that a session has completed (to refresh stats)
        onSessionComplete?.();
      }
    } catch (error) {
      console.error('Error completing focus session:', error);
    } finally {
      // Reset all states
      setShowCountdown(false);
      setSelectedMode(null);
      setCurrentSessionId(null);
    }
  };

  const handleStartClock = (title: string, style: string) => {
    setClockTitle(title);
    setClockStyle(style);
    setShowClockSetup(false);
    setShowClockMode(true);
  };

  const handleEarlyFinish = async () => {
    try {
      if (currentSessionId) {
        await focusSessionService.earlyFinishSession(currentSessionId);
        console.log('Focus session finished early with points!', { 
          mode: selectedMode?.title
        });
        
        // Notify dashboard that a session has completed (to refresh stats)
        onSessionComplete?.();
      }
    } catch (error) {
      console.error('Error early finishing focus session:', error);
    } finally {
      // Reset all states
      setShowCountdown(false);
      setSelectedMode(null);
      setCurrentSessionId(null);
    }
  };

  const handleAbort = async () => {
    try {
      if (currentSessionId) {
        await focusSessionService.abortSession(currentSessionId);
        console.log('Focus session aborted - no points awarded');
      }
    } catch (error) {
      console.error('Error aborting focus session:', error);
    } finally {
      // Reset all states
      setShowCountdown(false);
      setSelectedMode(null);
      setCurrentSessionId(null);
    }
  };

  const handleSetupClose = () => {
    setShowSetup(false);
    setSelectedMode(null);
  };

  const handleCountdownPause = () => {
    console.log('Session paused');
  };

  // Handle Android hardware back button while focus modal is open
  const handleHardwareBack = useCallback(() => {
    console.log('[FocusSession] hardwareBack pressed', { showSetup, showCountdown, showClockSetup, showClockMode });
    // If setup screen is open, close it and remain in selection
    if (showSetup) {
      setShowSetup(false);
      return true;
    }

    // If clock setup is open, close it and remain in selection
    if (showClockSetup) {
      setShowClockSetup(false);
      setSelectedMode(null);
      return true;
    }

    // If clock mode is active, close it and return to selection
    if (showClockMode) {
      setShowClockMode(false);
      setSelectedMode(null);
      return true;
    }

    // If countdown is active, close countdown and return to selection
    if (showCountdown) {
      setShowCountdown(false);
      setSelectedMode(null);
      setCurrentSessionId(null);
      return true;
    }

    // Otherwise close the focus modal (go back to dashboard)
    console.log('[FocusSession] closing focus modal via back button');
    onClose();
    return true;
  }, [showSetup, showCountdown, showClockSetup, showClockMode, onClose]);

  useEffect(() => {
    // Register hardware back handler when running on Android.
    // If this component is used as a modal, `visible` will control registration.
    // If it's mounted as a navigation screen `visible` may be undefined — in that case
    // we still want the handler active so Android back closes the screen.
    const shouldRegister = Platform.OS === 'android' && (visible === undefined || visible === true);
    if (shouldRegister) {
      const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
      return () => sub.remove();
    }

    return;
  }, [visible, handleHardwareBack]);

  return (
  <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleHardwareBack}>
      <SafeAreaView style={styles.container}>
        
        {/* Show Countdown Screen if active */}
        {showCountdown && selectedMode ? (
          <CountdownScreen
            visible={showCountdown}
            mode={selectedMode}
            totalHours={sessionHours}
            totalMinutes={sessionMinutes}
            breakMinutes={breakMinutes}
            onComplete={handleCountdownComplete}
            onPause={handleCountdownPause}
            onEarlyFinish={handleEarlyFinish}
            onAbort={handleAbort}
          />
        ) : (
          <>
            {/* Top bar with logo to match dashboard */}
            <View style={styles.topBarContainer}>
              <TouchableOpacity onPress={onClose} style={styles.topBarLeftButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              <Image source={require('../../assets/images/inzone-logo.png')} style={styles.topBarLogo} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                <View style={styles.contentHeader}>
                  <Text style={styles.title}>Select your focus mode</Text>
                </View>

                {/* Custom Focus Mode Button */}
                <TouchableOpacity
                  style={[styles.customModeButton, { borderColor: CUSTOM_MODE_COLOR }]}
                  onPress={() => {/* TODO: Handle custom mode */}}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.customModeText, { color: CUSTOM_MODE_COLOR }]}>Custom Focus Mode</Text>
                </TouchableOpacity>

                {/* 4-Leaf Clover Layout - Vertical Stack */}
                <View style={styles.cloverContainer}>
                  <TouchableOpacity
                    style={[styles.fullButton, { borderColor: flowMode.color }]}
                    onPress={() => handleModeSelect(flowMode)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.fullButtonText, { color: flowMode.color }]}>{flowMode.title}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.fullButton, { borderColor: executionerMode.color }]}
                    onPress={() => handleModeSelect(executionerMode)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.fullButtonText, { color: executionerMode.color }]}>{executionerMode.title}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.fullButton, { borderColor: meditateMode.color }]}
                    onPress={() => handleModeSelect(meditateMode)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.fullButtonText, { color: meditateMode.color }]}>{meditateMode.title}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.fullButton, { borderColor: bodyMode.color }]}
                    onPress={() => handleModeSelect(bodyMode)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.fullButtonText, { color: bodyMode.color }]}>{bodyMode.title}</Text>
                  </TouchableOpacity>
                </View>

                {/* Clock Mode Button */}
                <TouchableOpacity
                  style={[styles.customModeButton, { borderColor: clockMode.color }]}
                  onPress={() => handleModeSelect(clockMode)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.customModeText, { color: clockMode.color }]}>Clock Mode</Text>
                </TouchableOpacity>

              </View>
            </ScrollView>
          </>
        )}

        {/* Goal Selection Screen */}
        <GoalSelectionScreen
          visible={showGoalSelection}
          mode={selectedMode || executionerMode}
          onClose={() => setShowGoalSelection(false)}
          onGoalSelected={(goal) => {
            console.log('Goal selected for executioner mode:', goal.title);
            setShowGoalSelection(false);
            setShowSetup(true);
          }}
          onCreateGoal={() => {
            onClose();
            if (onOpenGoals) onOpenGoals();
          }}
        />

        {/* Setup Screen */}
        <FocusModeSetupScreen
          visible={showSetup}
          mode={selectedMode}
          onClose={handleSetupClose}
          onStartSession={handleStartSession}
          defaultDuration={settings.defaultFocusDuration}
        />

        {/* Clock Setup Screen */}
        <ClockModeSetupScreen
          visible={showClockSetup}
          onClose={() => {
            setShowClockSetup(false);
            setSelectedMode(null);
          }}
          onStartClock={handleStartClock}
        />

        {/* Clock Mode Screen */}
        <ClockModeScreen
          visible={showClockMode}
          onClose={() => {
            setShowClockMode(false);
            setSelectedMode(null);
          }}
          title={clockTitle}
          clockStyle={clockStyle}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButtonText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  cloverButton: {
    alignItems: 'center',
    backgroundColor: TRANSPARENT,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    flex: 1,
    height: 120,
    justifyContent: 'center',
    margin: theme.spacing.sm,
  },
  cloverButtonText: {
    ...theme.typography.h3,
    fontWeight: '700',
  },
  cloverContainer: {
    marginTop: theme.spacing.sm,
  },
  cloverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  contentHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  customModeButton: {
    alignItems: 'center',
    backgroundColor: TRANSPARENT,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    height: 80,
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
  },
  customModeText: {
    ...theme.typography.h3,
    fontSize: 20,
    fontWeight: '700',
  },
  fullButton: {
    alignItems: 'center',
    backgroundColor: TRANSPARENT,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    height: 80,
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
  },
  fullButtonText: {
    ...theme.typography.h3,
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  topBarContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  topBarLeftButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    left: 12,
    position: 'absolute',
    width: 48,
    zIndex: 1,
  },
  topBarLogo: {
    height: 128,
    resizeMode: 'contain',
    width: 200,
  },
});
