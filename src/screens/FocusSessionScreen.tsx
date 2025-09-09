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
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';
import { KigenLogo } from '../components/KigenLogo';
import { FocusModeSetupScreen } from './FocusModeSetupScreen';
import { CountdownScreen } from './CountdownScreen';

interface FocusMode {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  description: string;
}

interface FocusSessionScreenProps {
  visible: boolean;
  onClose: () => void;
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
    color: '#EC4899',
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

export const FocusSessionScreen: React.FC<FocusSessionScreenProps> = ({ visible, onClose }) => {
  const [selectedMode, setSelectedMode] = useState<FocusMode | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [sessionHours, setSessionHours] = useState(0);
  const [sessionMinutes, setSessionMinutes] = useState(0);

  const handleModeSelect = (mode: FocusMode) => {
    setSelectedMode(mode);
    setShowSetup(true);
  };

  const handleStartSession = (mode: FocusMode, hours: number, minutes: number) => {
    setSessionHours(hours);
    setSessionMinutes(minutes);
    setShowSetup(false);
    setShowCountdown(true);
  };

  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setSelectedMode(null);
    // Here you would typically save the session data and update stats
    console.log('Focus session completed!');
  };

  const handleCountdownPause = () => {
    console.log('Session paused');
  };

  const handleCountdownStop = () => {
    setShowCountdown(false);
    setSelectedMode(null);
    console.log('Session stopped');
  };

  const handleSetupClose = () => {
    setShowSetup(false);
    setSelectedMode(null);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <KigenKanjiBackground />
        
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

        {/* Setup Screen */}
        <FocusModeSetupScreen
          visible={showSetup}
          mode={selectedMode}
          onClose={handleSetupClose}
          onStartSession={handleStartSession}
        />

        {/* Countdown Screen */}
        {selectedMode && (
          <CountdownScreen
            visible={showCountdown}
            mode={selectedMode}
            totalHours={sessionHours}
            totalMinutes={sessionMinutes}
            onComplete={handleCountdownComplete}
            onPause={handleCountdownPause}
            onStop={handleCountdownStop}
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
    color: theme.colors.primary,
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
