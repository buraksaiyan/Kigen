import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme as defaultTheme } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import ClockPreviewCarousel, { CLOCK_STYLES } from '../components/ClockPreviewCarousel';
import { Card } from '../components/UI';

interface ClockModeSetupScreenProps {
  visible: boolean;
  onClose: () => void;
  onStartClock: (title: string, clockStyle: string) => void;
}

const createStyles = (theme: typeof defaultTheme) => StyleSheet.create({
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
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    elevation: 5,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButtonText: {
    ...theme.typography.h3,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  titleInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  titleInputLabel: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  clockSelectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
});

export const ClockModeSetupScreen: React.FC<ClockModeSetupScreenProps> = ({
  visible,
  onClose,
  onStartClock,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [title, setTitle] = useState('');
  const [selectedClockStyle, setSelectedClockStyle] = useState('classic');

  const handleStartClock = () => {
    onStartClock(title.trim() || 'Clock Mode', selectedClockStyle);
    // Reset form
    setTitle('');
    setSelectedClockStyle('classic');
  };

  const handleClose = () => {
    // Reset form when closing
    setTitle('');
    setSelectedClockStyle('classic');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <View style={styles.placeholder} />
          <Text style={styles.sectionTitle}>Clock Mode Setup</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.contentHeader}>
              <Text style={styles.subtitle}>
                Set up your clock display with a custom title and style
              </Text>
            </View>

            <Card style={styles.setupCard}>
              <Text style={styles.titleInputLabel}>Title (Optional)</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Enter a title for your clock session..."
                placeholderTextColor={theme.colors.text.tertiary}
                value={title}
                onChangeText={setTitle}
                maxLength={50}
                autoCapitalize="sentences"
                autoCorrect={false}
              />
            </Card>

            <Card style={styles.setupCard}>
              <Text style={styles.clockSelectionTitle}>Choose Clock Style</Text>
              <ClockPreviewCarousel
                selected={selectedClockStyle}
                onSelect={setSelectedClockStyle}
              />
            </Card>

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartClock}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>Start Clock Mode</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};