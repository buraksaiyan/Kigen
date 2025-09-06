import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { maybePromptForRating } from '../../services/rating';
import { theme } from '../../config/theme';
import { Button, Card } from '../../components/UI';
import { FocusGauge } from '../../components/FocusGauge';
import { KigenLogo } from '../../components/KigenLogo';
import { JournalSection } from '../../components/JournalSection';
import { TaskSection } from '../../components/TaskSection';
import { Sidebar } from '../../components/Sidebar';
import { GoalsScreen } from '../../screens/GoalsScreen';
import { JournalsScreen } from '../../screens/JournalsScreen';

export const DashboardScreen: React.FC = () => {
  const { signOut } = useAuth();
  const [disciplineScore] = useState(72); // Mock data - you'll replace this with real system
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  useEffect(() => {
    maybePromptForRating();
  }, []);

  const handleJournal = () => {
    setIsJournalOpen(true);
  };

  const handleTasks = () => {
    setIsTasksOpen(true);
  };

  const handleSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleSidebarNavigation = (screen: string) => {
    setCurrentScreen(screen);
    // Handle navigation based on screen
    switch(screen) {
      case 'dashboard':
        // Already on dashboard, just close sidebar
        break;
      case 'journals':
        setIsJournalOpen(true);
        break;
      case 'goals':
        setIsTasksOpen(true);
        break;
      // Add more cases as needed
      default:
        console.log('Navigate to:', screen);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Kigen Logo and Menu */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleSidebar} style={styles.menuButton}>
              <Text style={styles.menuButtonText}>☰</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <KigenLogo size="large" />
              <Text style={styles.welcomeSubtext}>
                Building discipline, one day at a time
              </Text>
            </View>
            <View style={styles.headerRight} />
          </View>

          {/* Main Discipline Score */}
          <Card style={styles.mainScoreCard}>
            <FocusGauge rating={disciplineScore} />
            
            <View style={styles.scoreDetails}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>+5</Text>
                  <Text style={styles.statLabel}>Today</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>+12</Text>
                  <Text style={styles.statLabel}>This Week</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>3</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Build Discipline</Text>
            
            <View style={styles.actionGrid}>
              <Button
                title="📝 Journal"
                onPress={handleJournal}
                style={styles.actionButton}
              />
              <Button
                title="📊 Track Usage"
                onPress={() => {}}
                variant="outline"
                style={styles.actionButton}
              />
            </View>
            
            <View style={styles.actionGrid}>
              <Button
                title="⚡ Focus Session"
                onPress={handleTasks}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title="� View Progress"
                onPress={() => {}}
                variant="outline"
                style={styles.actionButton}
              />
            </View>
          </View>

          {/* Current Status */}
          <Card style={styles.statusCard}>
            <Text style={styles.cardTitle}>Today's Usage</Text>
            
            <View style={styles.progressGrid}>
              <View style={styles.progressItem}>
                <Text style={[styles.progressNumber, { color: theme.colors.success }]}>2h</Text>
                <Text style={styles.progressLabel}>Screen Time</Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={[styles.progressNumber, { color: theme.colors.primary }]}>8</Text>
                <Text style={styles.progressLabel}>App Switches</Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={[styles.progressNumber, { color: theme.colors.success }]}>45m</Text>
                <Text style={styles.progressLabel}>Focus Time</Text>
              </View>
            </View>
          </Card>

          {/* Development Actions */}
          {__DEV__ && (
            <Card style={styles.devCard}>
              <Text style={styles.devTitle}>Development</Text>
              <Button
                title="Sign Out"
                onPress={signOut}
                variant="outline"
                size="small"
              />
            </Card>
          )}
        </ScrollView>
        
        {/* Sliding Sections */}
        <JournalSection 
          isExpanded={isJournalOpen}
          onClose={() => setIsJournalOpen(false)}
        />
        <TaskSection 
          isExpanded={isTasksOpen}
          onClose={() => setIsTasksOpen(false)}
        />
        
        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNavigate={handleSidebarNavigation}
          currentScreen={currentScreen}
        />
        
        {/* Full Screen Modals */}
        {currentScreen === 'goals' && (
          <View style={styles.fullScreenModal}>
            <GoalsScreen />
            <TouchableOpacity 
              style={styles.closeFullScreen}
              onPress={() => setCurrentScreen('dashboard')}
            >
              <Text style={styles.closeFullScreenText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {currentScreen === 'journals' && (
          <View style={styles.fullScreenModal}>
            <JournalsScreen />
            <TouchableOpacity 
              style={styles.closeFullScreen}
              onPress={() => setCurrentScreen('dashboard')}
            >
              <Text style={styles.closeFullScreenText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.sm,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonText: {
    fontSize: 20,
    color: theme.colors.text.primary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 44, // Same as menu button for balance
  },
  welcomeSubtext: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  welcomeText: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  emailText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  mainScoreCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  scoreDetails: {
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },
  statValue: {
    ...theme.typography.h4,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionsSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  statusCard: {
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressNumber: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  progressLabel: {
    ...theme.typography.small,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  devCard: {
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  devTitle: {
    ...theme.typography.body,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.sm,
  },
  fullScreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    zIndex: 2000,
  },
  closeFullScreen: {
    position: 'absolute',
    top: theme.spacing.lg + 30, // Account for status bar
    right: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    zIndex: 2001,
  },
  closeFullScreenText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
});