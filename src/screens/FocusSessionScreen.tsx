import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startFocusSession, stopFocusSession, UsageData } from '../services/focusMode';
import { Notification } from '../components/Notification';
import { LinearGradient } from 'expo-linear-gradient';
import { FlowBackground } from '../components/FlowBackground';
import { GladiatorBackground } from '../components/GladiatorBackground';
import { CustomAlert } from '../components/CustomAlert';
import { rateFocusSession } from '../services/focusRating';

const { width, height } = Dimensions.get('window');

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  failed: boolean;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
}

interface FocusLog {
  id: string;
  type: 'free' | 'executioner';
  goalId?: string;
  goalTitle?: string;
  duration: number; // in minutes
  actualDuration: number; // actual time spent
  unlocks: number;
  appUsageMinutes: number;
  status: 'completed' | 'aborted';
  startTime: string;
  endTime: string;
  rating?: 'excellent' | 'good' | 'fair' | 'poor';
  ratingReason?: string;
}

interface FocusSessionScreenProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToGoals?: () => void;
}

export const FocusSessionScreen: React.FC<FocusSessionScreenProps> = ({
  visible,
  onClose,
  onNavigateToGoals,
}) => {
  const [sessionType, setSessionType] = useState<'selection' | 'free' | 'executioner'>('selection');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [duration, setDuration] = useState('25');
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [unlocks, setUnlocks] = useState(0);
  const [appUsageMinutes, setAppUsageMinutes] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  
  // Custom alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}>>([]);

  // Helper function to show custom alerts
  const showAlert = (title: string, message: string, buttons: Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}> = [{text: 'OK'}]) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(buttons);
    setAlertVisible(true);
  };

  useEffect(() => {
    if (visible) {
      loadGoals();
    }
  }, [visible]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            handleSessionComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const handleUsageUpdate = (usageData: UsageData) => {
    setUnlocks(usageData.unlocks);
    setAppUsageMinutes(usageData.appUsageMinutes);
  };

  const loadGoals = async () => {
    try {
      const storedGoals = await AsyncStorage.getItem('@kigen_goals');
      if (storedGoals) {
        const parsedGoals = JSON.parse(storedGoals);
        const activeGoals = parsedGoals.filter((goal: Goal) => 
          !goal.completed && !goal.failed
        );
        setGoals(activeGoals);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const startFreeSession = async () => {
    const durationMinutes = parseInt(duration);
    if (!durationMinutes || durationMinutes < 1) {
      showAlert('Invalid Duration', 'Please enter a valid duration in minutes.');
      return;
    }

    const sessionId = `free_${Date.now()}`;
    const success = await startFocusSession(sessionId, handleUsageUpdate);
    
    if (success) {
      setTimeLeft(durationMinutes * 60);
      setIsActive(true);
      setSessionStartTime(new Date().toISOString());
      setCurrentSessionId(sessionId);
      setUnlocks(0);
      setAppUsageMinutes(0);
      setSessionType('free');
      setShowNotification(true);
    } else {
      showAlert('Error', 'Failed to start focus session. Please try again.');
    }
  };

  const startExecutionerSession = async () => {
    if (!selectedGoal) {
      showAlert('No Goal Selected', 'Please select a goal to focus on.');
      return;
    }

    const durationMinutes = parseInt(duration);
    if (!durationMinutes || durationMinutes < 1) {
      showAlert('Invalid Duration', 'Please enter a valid duration in minutes.');
      return;
    }

    const sessionId = `executioner_${Date.now()}`;
    const success = await startFocusSession(sessionId, handleUsageUpdate);
    
    if (success) {
      setTimeLeft(durationMinutes * 60);
      setIsActive(true);
      setSessionStartTime(new Date().toISOString());
      setCurrentSessionId(sessionId);
      setUnlocks(0);
      setAppUsageMinutes(0);
      setSessionType('executioner');
      setShowNotification(true);
    } else {
      showAlert('Error', 'Failed to start focus session. Please try again.');
    }
  };

  const handleSessionComplete = async () => {
    const usageData = await stopFocusSession();
    setIsActive(false);
    await saveFocusLog('completed');
    showAlert(
      'Focus Session Complete!',
      `Great work! You completed your ${sessionType === 'free' ? 'Flow' : 'Executioner'} session.`,
      [{ text: 'OK', onPress: () => resetSession() }]
    );
  };

  const handleAbort = () => {
    showAlert(
      'Abort Session?',
      'Are you sure you want to abort this focus session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Abort',
          style: 'destructive',
          onPress: async () => {
            await stopFocusSession();
            setIsActive(false);
            await saveFocusLog('aborted');
            resetSession();
          },
        },
      ]
    );
  };

  const saveFocusLog = async (status: 'completed' | 'aborted') => {
    try {
      const originalDuration = parseInt(duration);
      const actualDuration = originalDuration - Math.floor(timeLeft / 60);
      
      // Get AI rating for the session
      const aiRating = await rateFocusSession(
        originalDuration,
        actualDuration,
        unlocks,
        appUsageMinutes,
        status
      );
      
      const focusLog: FocusLog = {
        id: Date.now().toString(),
        type: sessionType as 'free' | 'executioner',
        goalId: selectedGoal?.id,
        goalTitle: selectedGoal?.title,
        duration: originalDuration,
        actualDuration,
        unlocks,
        appUsageMinutes,
        status,
        startTime: sessionStartTime,
        endTime: new Date().toISOString(),
        rating: aiRating.rating,
        ratingReason: aiRating.reason,
      };

      const existingLogs = await AsyncStorage.getItem('@kigen_focus_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(focusLog);
      
      await AsyncStorage.setItem('@kigen_focus_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving focus log:', error);
    }
  };

  const resetSession = () => {
    setSessionType('selection');
    setSelectedGoal(null);
    setDuration('25');
    setTimeLeft(0);
    setUnlocks(0);
    setAppUsageMinutes(0);
    setSessionStartTime('');
    setCurrentSessionId('');
    setShowNotification(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = async () => {
    if (isActive) {
      showAlert(
        'Session Active',
        'You have an active focus session. Closing will abort it.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Close & Abort',
            style: 'destructive',
            onPress: async () => {
              await stopFocusSession();
              setIsActive(false);
              saveFocusLog('aborted');
              resetSession();
              onClose();
            },
          },
        ]
      );
    } else {
      resetSession();
      onClose();
    }
  };

  const navigateToGoals = () => {
    showAlert(
      'No Goals Found', 
      'You need goals to use Executioner Focus mode. Would you like to create one?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Create Goal',
          onPress: () => {
            onClose(); // Close focus session first
            onNavigateToGoals?.(); // Then navigate to goals
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.title}>起源 Focus</Text>
          <View style={styles.placeholder} />
        </View>

        {sessionType === 'selection' && (
          <View style={styles.selectionContainer}>
            <Text style={styles.subtitle}>Choose Your Focus Mode</Text>
            
            <TouchableOpacity
              style={[styles.modeButton, styles.freeMode]}
              onPress={() => setSessionType('free')}
            >
              <FlowBackground style={styles.modeBackgroundPreview} />
              <View style={styles.modeContent}>
                <Text style={styles.modeTitle}>Flow Focus</Text>
                <Text style={styles.modeDescription}>Flow as the timer goes. No distructions, pure work.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, styles.executionerMode]}
              onPress={() => {
                if (goals.length === 0) {
                  navigateToGoals();
                } else {
                  setSessionType('executioner');
                }
              }}
            >
              <GladiatorBackground style={styles.modeBackgroundPreview} />
              <View style={styles.modeContent}>
                <Text style={styles.modeTitle}>Executioner Focus</Text>
                <Text style={styles.modeDescription}>Fight with your own will to conquer your goals.</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {sessionType === 'free' && !isActive && (
          <View style={styles.setupContainer}>
            <FlowBackground style={styles.flowBackground} />
            <Text style={styles.setupTitle}>Flow Focus Setup</Text>
            <Text style={styles.setupDescription}>Flow as the timer goes. No distructions, pure work.</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="25"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startFreeSession}>
              <Text style={styles.startButtonText}>Start Flow Focus</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => setSessionType('selection')}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {sessionType === 'executioner' && !isActive && (
          <View style={styles.setupContainer}>
            <GladiatorBackground style={styles.gladiatorBackground} />
            <Text style={styles.setupTitle}>Executioner Focus Setup</Text>
            <Text style={styles.setupDescription}>Fight with your own will to conquer your goals.</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Select Goal</Text>
              <View style={styles.goalsList}>
                {goals.map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.goalItem,
                      selectedGoal?.id === goal.id && styles.selectedGoal,
                    ]}
                    onPress={() => setSelectedGoal(goal)}
                  >
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="25"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startExecutionerSession}>
              <Text style={styles.startButtonText}>Start Executioner Focus</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => setSessionType('selection')}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {isActive && (
          <View style={styles.timerContainer}>
            <Text style={styles.sessionTypeText}>
              {sessionType === 'free' ? 'Flow Focus' : 'Executioner Focus'}
            </Text>
            
            {sessionType === 'executioner' && selectedGoal && (
              <View style={styles.goalDisplay}>
                <Text style={styles.goalDisplayTitle}>{selectedGoal.title}</Text>
              </View>
            )}

            <View style={styles.flipClockContainer}>
              <Text style={styles.flipClock}>{formatTime(timeLeft)}</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Unlocks</Text>
                <Text style={styles.statValue}>{unlocks}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Usage</Text>
                <Text style={styles.statValue}>{appUsageMinutes}m</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.finishButton} onPress={handleSessionComplete}>
                <Text style={styles.finishButtonText}>Finish</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.abortButton} onPress={handleAbort}>
                <Text style={styles.abortButtonText}>Abort</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Focus Mode Notification */}
        <Notification
          visible={showNotification}
          title="Focus Mode Active"
          message="Your phone is now in focus mode. Notifications are disabled and your usage is being tracked."
          type="info"
          onClose={() => setShowNotification(false)}
        />
        
        {/* Custom Alert */}
        <CustomAlert
          visible={alertVisible}
          title={alertTitle}
          message={alertMessage}
          buttons={alertButtons}
          onClose={() => setAlertVisible(false)}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  modeButton: {
    backgroundColor: '#1F2937',
    padding: 0,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 2,
    overflow: 'hidden',
    minHeight: 140,
    position: 'relative',
  },
  freeMode: {
    borderColor: 'rgba(56, 178, 172, 0.8)',
  },
  executionerMode: {
    borderColor: 'rgba(251, 146, 60, 0.8)',
  },
  modeTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modeDescription: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  setupContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  setupTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  setupDescription: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#374151',
    color: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#6d28d9',
  },
  goalsList: {
    maxHeight: 200,
  },
  goalItem: {
    backgroundColor: '#374151',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  selectedGoal: {
    borderColor: '#6d28d9',
    backgroundColor: '#2D1B69',
  },
  goalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  goalDescription: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  startButton: {
    backgroundColor: '#6d28d9',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  sessionTypeText: {
    color: '#6d28d9',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  goalDisplay: {
    backgroundColor: '#374151',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  goalDisplayTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  goalDisplayDescription: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
  flipClockContainer: {
    backgroundColor: '#000000',
    paddingVertical: 40,
    paddingHorizontal: 60,
    borderRadius: 20,
    marginBottom: 40,
    shadowColor: '#6d28d9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  flipClock: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: '300',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 5,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  finishButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  abortButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  abortButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  flowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1.0,
    borderRadius: 20,
  },
  gladiatorBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1.0,
    borderRadius: 20,
  },
  modeBackgroundPreview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
    borderRadius: 12,
  },
  modeContent: {
    position: 'relative',
    zIndex: 1,
    padding: 20,
  },
});
