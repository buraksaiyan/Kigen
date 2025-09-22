import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../config/theme';
import { UserStatsService } from '../services/userStatsService';
import { Button, Card } from '../components/UI';
import { generateUniqueId } from '../utils/uniqueId';

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  failed: boolean;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
}

const GOALS_STORAGE_KEY = '@kigen_goals';

interface GoalsScreenProps {
  visible?: boolean;
  onClose?: () => void;
  onGoalComplete?: () => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({ visible = true, onClose }) => {
  // Placeholder: Goals screen temporarily removed. We'll rework goals like the Journals flow.
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 }}>Goals (Temporarily Disabled)</Text>
        <Text style={{ color: theme.colors.text.secondary, textAlign: 'center', paddingHorizontal: 24 }}>The goals entry page has been removed while we rework the feature. Please use the Goals manager in Settings or check back later.</Text>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 24, backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Close</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  addButton: {
    flex: 1,
  },
  addGoalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  addGoalCard: {
    marginBottom: theme.spacing.lg,
  },
  addGoalPrompt: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  addGoalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  completedCard: {
    backgroundColor: theme.colors.surfaceSecondary,
    opacity: 0.8,
  },
  completedTitle: {
    color: theme.colors.success,
    textDecorationLine: 'line-through',
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  contentHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  deleteButton: {
    minWidth: 50,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  failedCard: {
    backgroundColor: theme.colors.surfaceSecondary,
    opacity: 0.7,
  },
  failedTitle: {
    color: theme.colors.danger,
    textDecorationLine: 'line-through',
  },
  goalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  goalCard: {
    marginBottom: theme.spacing.md,
  },
  goalDate: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  goalHeader: {
    marginBottom: theme.spacing.md,
  },
  goalInput: {
    ...theme.typography.body,
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  goalTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
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
  promptButton: {
    minWidth: 120,
  },
  promptTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    marginVertical: theme.spacing.lg,
  },
  smallDeleteButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: theme.spacing.sm,
    top: theme.spacing.sm,
    width: 32,
  },
  smallDeleteText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  statDivider: {
    backgroundColor: theme.colors.border,
    height: 30,
    width: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginTop: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  statNumber: {
    ...theme.typography.h3,
    color: '#888691',
    fontWeight: '700',
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
});
