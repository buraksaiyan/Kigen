import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { Card } from '../components/UI';
import { FocusModeSetupScreen } from './FocusModeSetupScreen';
import { CountdownScreen } from './CountdownScreen';
import { GoalSelectionScreen } from './GoalSelectionScreen';
import { focusSessionService } from '../services/FocusSessionService';
import { useSettings } from '../hooks/useSettings';

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

  const { settings } = useSettings();

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
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                <View style={styles.contentHeader}>
                  <Text style={styles.title}>Select your focus mode</Text>
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
          defaultDuration={settings.defaultFocusDuration}
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
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    ...theme.typography.body,
    color: '#888691',
    fontWeight: '600',
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modeCard: {
    borderColor: theme.colors.border,
    borderWidth: 2,
  },
  modeContent: {
    padding: theme.spacing.md,
  },
  modeDescription: {
    ...theme.typography.body,
    color: theme.colors.text.tertiary,
    lineHeight: 20,
  },
  modeHeader: {
    marginBottom: theme.spacing.sm,
  },
  modeSubtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  modeTitle: {
    ...theme.typography.h3,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  modesContainer: {
    gap: theme.spacing.md,
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
});
