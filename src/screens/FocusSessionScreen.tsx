import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { Card } from '../components/UI';
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';
import { KigenLogo } from '../components/KigenLogo';
import { FocusModeSetupScreen } from './FocusModeSetupScreen';
import { CountdownScreen } from './CountdownScreen';
import { GoalSelectionScreen } from './GoalSelectionScreen';
import { focusSessionService } from '../services/FocusSessionService';

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
    color: '#14B8A6',
    description: 'Enter a state of deep focus for creative and analytical work.',
  },
  {
    id: 'executioner',
    title: 'Executioner Focus',
    subtitle: 'High-Intensity Tasks',
    color: '#EF4444',
    description: 'Tackle challenging tasks with maximum intensity and discipline.',
  },
  {
    id: 'meditation',
    title: 'Meditation Focus',
    subtitle: 'Mindfulness & Awareness',
    color: '#22C55E',
    description: 'Cultivate mindfulness and inner awareness through meditation.',
  },
  {
    id: 'body',
    title: 'Body Focus',
    subtitle: 'Physical Training',
    color: '#7C2D42',
    description: 'Focus on physical training and body awareness exercises.',
  },
  {
    id: 'notech',
    title: 'No Tech Focus',
    subtitle: 'Digital Detox',
    color: '#F59E0B',
    description: 'Disconnect from technology and reconnect with reality.',
  },
];

export const FocusSessionScreen: React.FC<FocusSessionScreenProps> = ({ 
  visible, 
  onClose, 
  onOpenGoals,
  onSessionComplete 
}) => {
  const [selectedMode, setSelectedMode] = useState<FocusMode | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showGoalSelection, setShowGoalSelection] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [sessionHours, setSessionHours] = useState(0);
  const [sessionMinutes, setSessionMinutes] = useState(0);

  // Handle hardware back button
  useEffect(() => {
    if (!visible) return;

    const backAction = () => {
      console.log('📱 Hardware back button pressed in FocusSessionScreen');
      // If we're in a sub-screen, go back to main screen instead of closing
      if (showCountdown) {
        // Don't allow back button during countdown - user should use proper buttons
        return true;
      } else if (showSetup || showGoalSelection) {
        // Go back to focus mode selection
        setShowSetup(false);
        setShowGoalSelection(false);
        setSelectedMode(null);
        setSelectedGoal(null);
        return true;
      } else {
        // Close the focus session screen
        onClose();
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [visible, onClose, showCountdown, showSetup, showGoalSelection]);

  const handleModeSelect = (mode: FocusMode) => {
    setSelectedMode(mode);
    
    // For Executioner mode, show goal selection first
    if (mode.id === 'executioner') {
      setShowGoalSelection(true);
    } else {
      setShowSetup(true);
    }
  };

  const handleGoalSelected = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowGoalSelection(false);
    setShowSetup(true);
  };

  const handleCreateGoal = () => {
    // Navigate to goal creation screen
    setShowGoalSelection(false);
    setSelectedMode(null);
    onClose(); // Close focus session screen
    if (onOpenGoals) {
      onOpenGoals(); // Open goals screen
    }
  };

  const handleStartSession = async (mode: FocusMode, hours: number, minutes: number) => {
    try {
      const totalMinutes = (hours * 60) + minutes;
      const sessionId = await focusSessionService.startSession(mode, totalMinutes, selectedGoal);
      
      setCurrentSessionId(sessionId);
      setSessionHours(hours);
      setSessionMinutes(minutes);
      setShowSetup(false);
      setShowCountdown(true);
      
      console.log('Focus session started:', { sessionId, mode: mode.title, duration: totalMinutes, goal: selectedGoal?.title });
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
          mode: selectedMode?.title, 
          goal: selectedGoal?.title 
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
      setSelectedGoal(null);
      setCurrentSessionId(null);
    }
  };

  const handleCountdownPause = () => {
    console.log('Session paused');
  };

  const handleCountdownStop = async () => {
    try {
      if (currentSessionId) {
        await focusSessionService.completeSession(currentSessionId, false);
        console.log('Focus session stopped');
      }
    } catch (error) {
      console.error('Error stopping focus session:', error);
    } finally {
      // Reset all states
      setShowCountdown(false);
      setSelectedMode(null);
      setSelectedGoal(null);
      setCurrentSessionId(null);
    }
  };

  const handleEarlyFinish = async () => {
    try {
      if (currentSessionId) {
        await focusSessionService.earlyFinishSession(currentSessionId);
        console.log('Focus session finished early with points!', { 
          mode: selectedMode?.title, 
          goal: selectedGoal?.title 
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
      setSelectedGoal(null);
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
      setSelectedGoal(null);
      setCurrentSessionId(null);
    }
  };

  const handleSetupClose = () => {
    setShowSetup(false);
    setSelectedMode(null);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <KigenKanjiBackground />
        
        {/* Show Countdown Screen if active */}
        {showCountdown && selectedMode ? (
          <CountdownScreen
            visible={showCountdown}
            mode={selectedMode}
            totalHours={sessionHours}
            totalMinutes={sessionMinutes}
            selectedGoal={selectedGoal} // Pass the selected goal
            onComplete={handleCountdownComplete}
            onPause={handleCountdownPause}
            onEarlyFinish={handleEarlyFinish}
            onAbort={handleAbort}
          />
        ) : (
          <>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              <View style={styles.logoContainer}>
                <KigenLogo size="small" variant="image" showJapanese={false} />
              </View>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                <View style={styles.contentHeader}>
                  <Text style={styles.title}>Choose Your 起源 Focus Mode</Text>
                  <Text style={styles.subtitle}>Select the type of focus session to begin</Text>
                </View>

                <View style={styles.modesContainer}>
                  {focusModes.map((mode) => (
                    <TouchableOpacity
                      key={mode.id}
                      onPress={() => handleModeSelect(mode)}
                      activeOpacity={0.7}
                    >
                      <Card style={[styles.modeCard, { borderColor: mode.color }]}>
                        <View style={styles.modeContent}>
                          <View style={styles.modeHeader}>
                            <Text style={[styles.modeTitle, { color: mode.color }]}>
                              {mode.title}
                            </Text>
                            <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>
                          </View>
                          <Text style={styles.modeDescription}>{mode.description}</Text>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
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
        />

        {/* Goal Selection Screen for Executioner Mode */}
        {selectedMode && (
          <GoalSelectionScreen
            visible={showGoalSelection}
            mode={selectedMode}
            onClose={() => {
              setShowGoalSelection(false);
              setSelectedMode(null);
            }}
            onGoalSelected={handleGoalSelected}
            onCreateGoal={handleCreateGoal}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    ...theme.typography.body,
    color: '#888691',
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  contentHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontWeight: '700',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  modesContainer: {
    gap: theme.spacing.md,
  },
  modeCard: {
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  modeContent: {
    padding: theme.spacing.md,
  },
  modeHeader: {
    marginBottom: theme.spacing.sm,
  },
  modeTitle: {
    ...theme.typography.h3,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  modeSubtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  modeDescription: {
    ...theme.typography.body,
    color: theme.colors.text.tertiary,
    lineHeight: 20,
  },
});
