import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { maybePromptForRating } from '../../services/rating';
import { theme } from '../../config/theme';
import { Button, Card } from '../../components/UI';
import { FocusGauge } from '../../components/FocusGauge';
import { KigenLogo } from '../../components/KigenLogo';
import { JournalSection } from '../../components/JournalSection';
import { Sidebar } from '../../components/Sidebar';
import { GoalsScreen } from '../../screens/GoalsScreen';
import { JournalsScreen } from '../../screens/JournalsScreen';
import { FocusSessionScreen } from '../../screens/FocusSessionScreen';
import { FocusLogsScreen } from '../../screens/FocusLogsScreen';

export const DashboardScreen: React.FC = () => {
  const { signOut } = useAuth();
  const [disciplineScore] = useState(72); // Mock data - you'll replace this with real system
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFocusSessionOpen, setIsFocusSessionOpen] = useState(false);
  const [isFocusLogsOpen, setIsFocusLogsOpen] = useState(false);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  useEffect(() => {
    maybePromptForRating();
  }, []);

  const handleJournal = () => {
    setIsJournalOpen(true);
  };

  const handleTasks = () => {
    setIsGoalsOpen(true);
  };

  const handleFocusSession = () => {
    setIsFocusSessionOpen(true);
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
        setIsGoalsOpen(true);
        break;
      case 'focus-logs':
        setIsFocusLogsOpen(true);
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
        {/* Header with Logo and Floating Menu */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={handleSidebar} style={styles.menuButton}>
            <Text style={styles.menuButtonText}>☰</Text>
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <KigenLogo size="small" />
          </View>
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
                title="Goals"
                onPress={() => setCurrentScreen('goals')}
                style={styles.actionButton}
              />
              <Button
                title="Journal"
                onPress={handleJournal}
                style={styles.actionButton}
              />
            </View>
            
            <View style={styles.actionGrid}>
              <Button
                title="Focus Session"
                onPress={handleFocusSession}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title="Focus Logs"
                onPress={() => setIsFocusLogsOpen(true)}
                style={styles.actionButton}
              />
            </View>
            
            <View style={styles.fullWidthButtonContainer}>
              <Button
                title="View Progress"
                onPress={() => {}}
                variant="outline"
                style={styles.fullWidthButton}
              />
            </View>
          </View>

          {/* Track Usage Section */}
          <View style={styles.usageSection}>
            <Text style={styles.usageTitle}>Track Usage</Text>
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
        
        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNavigate={handleSidebarNavigation}
          currentScreen={currentScreen}
        />
        
        {/* Goals Screen */}
        <GoalsScreen
          visible={currentScreen === 'goals'}
          onClose={() => setCurrentScreen('dashboard')}
        />
        
        {/* Goals Screen for Direct Access */}
        <GoalsScreen
          visible={isGoalsOpen}
          onClose={() => setIsGoalsOpen(false)}
        />
        
        {/* Journals Screen */}
        <JournalsScreen
          visible={currentScreen === 'journals'}
          onClose={() => setCurrentScreen('dashboard')}
        />

        {/* Focus Session Screen */}
        <FocusSessionScreen
          visible={isFocusSessionOpen}
          onClose={() => setIsFocusSessionOpen(false)}
          onNavigateToGoals={() => setIsGoalsOpen(true)}
        />

        {/* Focus Logs Screen */}
        <FocusLogsScreen
          visible={isFocusLogsOpen}
          onClose={() => setIsFocusLogsOpen(false)}
        />
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
    paddingBottom: theme.spacing.xxl + 20, // Extra space for navigation bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingMenuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 44, // Balance for menu button
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
  fullWidthButtonContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  fullWidthButton: {
    width: '100%',
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
  usageSection: {
    marginBottom: theme.spacing.md,
  },
  usageTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
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