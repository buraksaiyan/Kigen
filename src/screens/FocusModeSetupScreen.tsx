import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { Card } from '../components/UI';
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';
import { KigenLogo } from '../components/KigenLogo';

interface FocusMode {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  description: string;
}

interface FocusModeSetupScreenProps {
  visible: boolean;
  onClose: () => void;
  mode: FocusMode | null;
  onStartSession: (mode: FocusMode, hours: number, minutes: number) => void;
}

export const FocusModeSetupScreen: React.FC<FocusModeSetupScreenProps> = ({
  visible,
  onClose,
  mode,
  onStartSession,
}) => {
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');

  const handleStartSession = () => {
    if (!mode) return;
    
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    
    if (h === 0 && m === 0) {
      return; // Don't start if no time set
    }
    
    onStartSession(mode, h, m);
  };

  const presetTimes = [
    { label: '15 min', hours: 0, minutes: 15 },
    { label: '30 min', hours: 0, minutes: 30 },
    { label: '45 min', hours: 0, minutes: 45 },
    { label: '1 hour', hours: 1, minutes: 0 },
    { label: '1.5 hours', hours: 1, minutes: 30 },
    { label: '2 hours', hours: 2, minutes: 0 },
  ];

  if (!mode) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <KigenKanjiBackground />
        
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <KigenLogo size="small" variant="image" showJapanese={false} />
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.contentHeader}>
              <View style={[styles.modeIndicator, { backgroundColor: mode.color }]} />
              <Text style={[styles.title, { color: mode.color }]}>{mode.title}</Text>
              <Text style={styles.subtitle}>{mode.description}</Text>
            </View>

            <Card style={styles.setupCard}>
              <Text style={styles.sectionTitle}>Set Session Duration</Text>
              
              {/* Time Input */}
              <View style={styles.timeInputContainer}>
                <View style={styles.timeInputGroup}>
                  <TextInput
                    style={[styles.timeInput, { borderColor: mode.color }]}
                    value={hours}
                    onChangeText={setHours}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="0"
                    placeholderTextColor={theme.colors.text.tertiary}
                  />
                  <Text style={styles.timeLabel}>hours</Text>
                </View>
                
                <Text style={styles.timeSeparator}>:</Text>
                
                <View style={styles.timeInputGroup}>
                  <TextInput
                    style={[styles.timeInput, { borderColor: mode.color }]}
                    value={minutes}
                    onChangeText={setMinutes}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="0"
                    placeholderTextColor={theme.colors.text.tertiary}
                  />
                  <Text style={styles.timeLabel}>minutes</Text>
                </View>
              </View>

              {/* Preset Times */}
              <Text style={styles.presetTitle}>Quick Select</Text>
              <View style={styles.presetsContainer}>
                {presetTimes.map((preset, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.presetButton, { borderColor: mode.color }]}
                    onPress={() => {
                      setHours(preset.hours.toString());
                      setMinutes(preset.minutes.toString());
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetText, { color: mode.color }]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Start Button */}
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: mode.color }]}
              onPress={handleStartSession}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>
                Start {mode.title} Session
              </Text>
            </TouchableOpacity>

            {/* Tips Card */}
            <Card style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>💡 Focus Tips</Text>
              {mode.id === 'flow' && (
                <Text style={styles.tipsText}>
                  • Find a quiet environment{'\n'}
                  • Turn off notifications{'\n'}
                  • Have your materials ready{'\n'}
                  • Take breaks every 90 minutes
                </Text>
              )}
              {mode.id === 'executioner' && (
                <Text style={styles.tipsText}>
                  • Set clear, specific goals{'\n'}
                  • Remove all distractions{'\n'}
                  • Use time pressure to your advantage{'\n'}
                  • Stay hydrated
                </Text>
              )}
              {mode.id === 'meditation' && (
                <Text style={styles.tipsText}>
                  • Sit comfortably with spine straight{'\n'}
                  • Focus on your breath{'\n'}
                  • Don't judge wandering thoughts{'\n'}
                  • Start with shorter sessions
                </Text>
              )}
              {mode.id === 'body' && (
                <Text style={styles.tipsText}>
                  • Warm up properly{'\n'}
                  • Stay hydrated{'\n'}
                  • Listen to your body{'\n'}
                  • Focus on form over intensity
                </Text>
              )}
              {mode.id === 'notech' && (
                <Text style={styles.tipsText}>
                  • Put devices in another room{'\n'}
                  • Engage with physical activities{'\n'}
                  • Practice mindful observation{'\n'}
                  • Connect with nature if possible
                </Text>
              )}
            </Card>
          </View>
        </ScrollView>
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
  modeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h2,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontWeight: '700',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  setupCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    fontWeight: '600',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  timeInputGroup: {
    alignItems: 'center',
  },
  timeInput: {
    borderWidth: 2,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.surface,
    textAlign: 'center',
    minWidth: 80,
    marginBottom: theme.spacing.sm,
  },
  timeLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginHorizontal: theme.spacing.md,
  },
  presetTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  presetButton: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'transparent',
  },
  presetText: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  startButton: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButtonText: {
    ...theme.typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tipsCard: {
    backgroundColor: theme.colors.surface,
  },
  tipsTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  tipsText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
});
