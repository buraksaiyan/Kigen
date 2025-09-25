import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';

const CLOSE_BUTTON_COLOR = '#888691';
const TRANSPARENT = 'transparent';
const SHADOW_COLOR = '#000';
const WHITE = '#FFFFFF';
import { Card } from '../components/UI';

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
  onStartSession: (mode: FocusMode, hours: number, minutes: number, breakMinutes: number) => void;
  defaultDuration?: number; // in minutes
}

export const FocusModeSetupScreen: React.FC<FocusModeSetupScreenProps> = ({
  visible,
  onClose,
  mode,
  onStartSession,
  defaultDuration = 30,
}) => {
  const defaultHours = Math.floor(defaultDuration / 60);
  const defaultMinutes = defaultDuration % 60;
  
  const [hours, setHours] = useState(defaultHours.toString());
  const [minutes, setMinutes] = useState(defaultMinutes.toString());
  const [breakMinutes, setBreakMinutes] = useState('5'); // Default 5 minutes break

  // Picker state for Executioner mode
  const [showPicker, setShowPicker] = useState(false);
  const [pickerField, setPickerField] = useState<'hours' | 'minutes' | 'breakMinutes'>('hours');
  const [pickerMaxValue, setPickerMaxValue] = useState(99);

  const openPicker = (field: 'hours' | 'minutes' | 'breakMinutes') => {
    setPickerField(field);
    setPickerMaxValue(field === 'breakMinutes' ? 60 : 99);
    setShowPicker(true);
  };

  const selectPickerValue = (value: number) => {
    const valueStr = value.toString();
    if (pickerField === 'hours') setHours(valueStr);
    else if (pickerField === 'minutes') setMinutes(valueStr);
    else if (pickerField === 'breakMinutes') setBreakMinutes(valueStr);
    setShowPicker(false);
  };

  // Reset to default duration when modal becomes visible
  useEffect(() => {
    if (visible) {
      setHours(defaultHours.toString());
      setMinutes(defaultMinutes.toString());
    }
  }, [visible, defaultHours, defaultMinutes]);

  const handleStartSession = () => {
    if (!mode) return;
    
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const b = parseInt(breakMinutes) || 0;
    
    if (h === 0 && m === 0) {
      return; // Don't start if no time set
    }
    
    onStartSession(mode, h, m, b);
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
        
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.contentHeader}>
              <Text style={[styles.title, { color: mode.color }]}>{mode.title} Focus</Text>
              <Text style={styles.subtitle}>{mode.description}</Text>
            </View>

            <Card style={styles.setupCard}>
              <Text style={styles.sectionTitle}>Set Session Duration</Text>
              
              {/* Time Input */}
              <View style={styles.timeInputContainer}>
                <View style={[styles.timeInputGroup, mode.id === 'executioner' ? styles.executionerInputGroup : null]}>
                  {mode.id === 'executioner' ? (
                    <TouchableOpacity
                      style={styles.executionerTimeInput}
                      onPress={() => openPicker('hours')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.executionerTimeInputText}>{hours}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TextInput
                      style={[styles.timeInput, { borderColor: mode.color }]}
                      value={hours}
                      onChangeText={setHours}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="0"
                      placeholderTextColor={theme.colors.text.tertiary}
                      underlineColorAndroid={TRANSPARENT}
                    />
                  )}
                  <Text style={styles.timeLabel}>hours</Text>
                </View>
                
                {mode.id !== 'executioner' && <Text style={styles.timeSeparator}>:</Text>}
                
                <View style={[styles.timeInputGroup, mode.id === 'executioner' ? styles.executionerInputGroup : null]}>
                  {mode.id === 'executioner' ? (
                    <TouchableOpacity
                      style={styles.executionerTimeInput}
                      onPress={() => openPicker('minutes')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.executionerTimeInputText}>{minutes}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TextInput
                      style={[styles.timeInput, { borderColor: mode.color }]}
                      value={minutes}
                      onChangeText={setMinutes}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="0"
                      placeholderTextColor={theme.colors.text.tertiary}
                      underlineColorAndroid={TRANSPARENT}
                    />
                  )}
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

            <Card style={styles.setupCard}>
              <Text style={styles.sectionTitle}>Set Break Duration</Text>
              
              {/* Break Duration Input */}
              <View style={styles.timeInputContainer}>
                <View style={styles.timeInputGroup}>
                  {mode.id === 'executioner' ? (
                    <TouchableOpacity
                      style={styles.executionerTimeInput}
                      onPress={() => openPicker('breakMinutes')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.executionerTimeInputText}>{breakMinutes}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TextInput
                      style={[styles.timeInput, { borderColor: mode.color }]}
                      value={breakMinutes}
                      onChangeText={setBreakMinutes}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="5"
                      placeholderTextColor={theme.colors.text.tertiary}
                      underlineColorAndroid={TRANSPARENT}
                    />
                  )}
                  <Text style={styles.timeLabel}>minutes</Text>
                </View>
              </View>

              {/* Break Preset Times */}
              <Text style={styles.presetTitle}>Quick Select</Text>
              <View style={styles.presetsContainer}>
                {[
                  { label: '2 min', minutes: 2 },
                  { label: '5 min', minutes: 5 },
                  { label: '10 min', minutes: 10 },
                  { label: '15 min', minutes: 15 },
                ].map((preset, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.presetButton,
                      { borderColor: mode.color },
                    ]}
                    onPress={() => setBreakMinutes(preset.minutes.toString())}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        { color: mode.color },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Start Button */}
            <TouchableOpacity
              style={[styles.startButton, { borderColor: mode.color, borderWidth: 2 }]}
              onPress={handleStartSession}
              activeOpacity={0.8}
            >
              <Text style={[styles.startButtonText, { color: mode.color }]}>
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
                  • Don&apos;t judge wandering thoughts{'\n'}
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
              /*{mode.id === 'notech' && (
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

        {/* Number Picker Modal for Executioner Mode */}
        <Modal visible={showPicker} animationType="slide" transparent={true}>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>
                Select {pickerField === 'hours' ? 'Hours' : pickerField === 'minutes' ? 'Minutes' : 'Break Minutes'}
              </Text>
              <FlatList
                data={Array.from({ length: pickerMaxValue + 1 }, (_, i) => i)}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => selectPickerValue(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                initialScrollIndex={parseInt(
                  pickerField === 'hours' ? hours : 
                  pickerField === 'minutes' ? minutes : 
                  breakMinutes
                ) || 0}
                getItemLayout={(data, index) => ({
                  length: 50,
                  offset: 50 * index,
                  index,
                })}
              />
              <TouchableOpacity
                style={styles.pickerCloseButton}
                onPress={() => setShowPicker(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    color: CLOSE_BUTTON_COLOR,
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
    // Ensure the header sits above any underlying elements and masks
    // tiny stray artifacts (e.g. native caret/underline bleed-through).
    backgroundColor: theme.colors.background,
    zIndex: 10,
    paddingTop: theme.spacing.sm,
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  placeholder: {
    width: 60,
  },
  presetButton: {
    backgroundColor: TRANSPARENT,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  presetText: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  presetTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  setupCard: {
    marginBottom: theme.spacing.lg,
  },
  startButton: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    elevation: 5,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    shadowColor: SHADOW_COLOR,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButtonText: {
    ...theme.typography.h3,
    color: WHITE,
    fontWeight: '700',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  timeInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    color: theme.colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    minWidth: 80,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    textAlign: 'center',
  },
  timeInputContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  executionerInputGroup: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
  },
  executionerTimeInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: '#EF4444', // Executioner mode red color
    minWidth: 80,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  executionerTimeInputText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  timeInputGroup: {
    alignItems: 'center',
  },
  timeLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  timeSeparator: {
    color: theme.colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: theme.spacing.md,
  },
  tipsCard: {
    backgroundColor: theme.colors.surface,
  },
  tipsText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  tipsTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h2,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  pickerOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    maxHeight: '70%',
    width: '80%',
    padding: theme.spacing.lg,
  },
  pickerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  pickerItem: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  pickerItemText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  pickerCloseButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  pickerCloseText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
