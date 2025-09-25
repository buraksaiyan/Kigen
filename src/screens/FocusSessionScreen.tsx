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
import { focusSessionService } from '../services/FocusSessionService';
import { useSettings } from '../hooks/useSettings';

const CUSTOM_MODE_COLOR = '#F59E0B';
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
    title: 'Flow',
    subtitle: 'Deep Work Sessions',
    color: '#14B8A6',
    description: 'Enter a state of deep focus for creative and analytical work.',
  },
  {
    id: 'executioner',
    title: 'Executioner',
    subtitle: 'High-Intensity Tasks',
    color: '#EF4444',
    description: 'Tackle challenging tasks with maximum intensity and discipline.',
  },
  {
    id: 'meditation',
    title: 'Meditation',
    subtitle: 'Mindfulness & Awareness',
    color: '#22C55E',
    description: 'Cultivate mindfulness and inner awareness through meditation.',
  },
  {
    id: 'body',
    title: 'Body',
    subtitle: 'Physical Training',
    color: '#A855F7',
    description: 'Focus on physical training and body awareness exercises.',
  },
  {
    id: 'clock',
    title: 'Clock',
    subtitle: 'Time Management',
    color: '#0000FF',
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
  const [sessionHours, setSessionHours] = useState(0);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const { settings } = useSettings();

  // Destructure focus modes for type safety
  const [flowMode, executionerMode, meditateMode, bodyMode, clockMode] = focusModes as [FocusMode, FocusMode, FocusMode, FocusMode, FocusMode];

  const handleModeSelect = (mode: FocusMode) => {
    setSelectedMode(mode);
    
    if (mode.id === 'clock') {
      // Clock mode doesn't use standard setup - handle differently later
      return;
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

  const handleCountdownPause = () => {
    console.log('Session paused');
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

  // Handle Android hardware back button while focus modal is open
  const handleHardwareBack = useCallback(() => {
    console.log('[FocusSession] hardwareBack pressed', { showSetup, showCountdown });
    // If setup screen is open, close it and remain in selection
    if (showSetup) {
      setShowSetup(false);
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
  }, [showSetup, showCountdown, onClose]);

  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const sub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
      return () => sub.remove();
    }

    return;
  }, [visible, handleHardwareBack]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
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
                  style={styles.customModeButton}
                  onPress={() => {/* TODO: Handle custom mode */}}
                  activeOpacity={0.8}
                >
                  <Text style={styles.customModeText}>Custom Focus Mode</Text>
                </TouchableOpacity>

                {/* 4-Leaf Clover Layout */}
                <View style={styles.cloverContainer}>
                  <View style={styles.cloverRow}>
                    <TouchableOpacity
                      style={[styles.cloverButton, { borderColor: flowMode.color }]}
                      onPress={() => handleModeSelect(flowMode)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.cloverButtonText, { color: flowMode.color }]}>{flowMode.title}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.cloverButton, { borderColor: executionerMode.color }]}
                      onPress={() => handleModeSelect(executionerMode)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.cloverButtonText, { color: executionerMode.color }]}>{executionerMode.title}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.cloverButton, { borderColor: meditateMode.color }]}
                      onPress={() => handleModeSelect(meditateMode)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.cloverButtonText, { color: meditateMode.color }]}>{meditateMode.title}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.cloverRow}>
                    <TouchableOpacity
                      style={[styles.cloverButton, { borderColor: bodyMode.color }]}
                      onPress={() => handleModeSelect(bodyMode)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.cloverButtonText, { color: bodyMode.color }]}>{bodyMode.title}</Text>
                    </TouchableOpacity>
                  </View>
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

        {/* Setup Screen */}
        <FocusModeSetupScreen
          visible={showSetup}
          mode={selectedMode}
          onClose={handleSetupClose}
          onStartSession={handleStartSession}
          defaultDuration={settings.defaultFocusDuration}
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
    alignSelf: 'stretch',
    backgroundColor: theme.colors.surface,
    borderColor: CUSTOM_MODE_COLOR,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  customModeText: {
    ...theme.typography.h3,
    color: CUSTOM_MODE_COLOR,
    fontWeight: '600',
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
