import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { maybePromptForRating } from '../../services/rating';
import { theme } from '../../config/theme';
import { Button, Card } from '../../components/UI';
import { KigenLogo } from '../../components/KigenLogo';
import { JournalSection } from '../../components/JournalSection';
import { Sidebar } from '../../components/Sidebar';
import { KigenKanjiBackground } from '../../components/KigenKanjiBackground';
import { GoalsScreen } from '../../screens/GoalsScreen';
import { JournalsScreen } from '../../screens/JournalsScreen';
import { FocusSessionScreen } from '../../screens/FocusSessionScreen';
import FocusLogsScreen from '../../screens/FocusLogsScreen';
import { RatingsScreen } from '../../screens/RatingsScreen';
import UsageDashboard from '../../components/UsageDashboard';
import DigitalWellbeingDashboard from '../../components/DigitalWellbeingDashboard';
import { DigitalWellbeing } from '../../components/DigitalWellbeing';
import { AdminPanel } from '../../components/AdminPanel';
import { FlippableStatsCard } from '../../components/FlippableStatsCard';
import { LeaderboardScreen } from '../../screens/LeaderboardScreen';

export const DashboardScreen: React.FC = () => {
  const { signOut, session, showLoginScreen } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'leaderboard'>('dashboard'); // New state for top nav
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFocusSessionOpen, setIsFocusSessionOpen] = useState(false);
  const [isFocusLogsOpen, setIsFocusLogsOpen] = useState(false);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isRatingsOpen, setIsRatingsOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    maybePromptForRating();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1); // Trigger card refresh
    setIsRefreshing(false);
  };

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
    setIsSidebarOpen(false); // Close sidebar when navigating
    
    // Handle navigation based on screen
    switch(screen) {
      case 'dashboard':
        // Close all modals and return to dashboard
        setIsGoalsOpen(false);
        setIsJournalOpen(false);
        setIsFocusLogsOpen(false);
        setIsFocusSessionOpen(false);
        setIsRatingsOpen(false);
        break;
      case 'ratings':
        setIsRatingsOpen(true);
        setIsGoalsOpen(false);
        setIsJournalOpen(false);
        setIsFocusLogsOpen(false);
        setIsFocusSessionOpen(false);
        break;
      case 'journals':
        // Don't set isJournalOpen, let JournalsScreen modal handle it
        setIsGoalsOpen(false);
        setIsFocusLogsOpen(false);
        setIsFocusSessionOpen(false);
        setIsRatingsOpen(false);
        break;
      case 'goals':
        setIsGoalsOpen(true);
        setIsJournalOpen(false);
        setIsFocusLogsOpen(false);
        setIsFocusSessionOpen(false);
        setIsRatingsOpen(false);
        break;
      case 'focus-logs':
        setIsFocusLogsOpen(true);
        setIsGoalsOpen(false);
        setIsJournalOpen(false);
        setIsFocusSessionOpen(false);
        setIsRatingsOpen(false);
        break;
      default:
        console.log('Navigate to:', screen);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <SafeAreaView style={styles.container}>
        <KigenKanjiBackground />
        
        {/* Header with Logo and Top Navigation */}
        <View style={styles.topHeader}>
          {/* Left Side: Menu Button - Only show in dashboard */}
          <View style={styles.headerLeft}>
            {currentView === 'dashboard' && (
              <TouchableOpacity onPress={handleSidebar} style={styles.menuButton}>
                <Text style={styles.menuButtonText}>☰</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Center: Logo - Now perfectly centered */}
          <View style={styles.logoContainer}>
            <KigenLogo size="small" />
          </View>
          
          {/* Right Side: Empty for balance */}
          <View style={styles.headerRight}>
          </View>
        </View>

        {/* Top Navigation Bar - Dashboard vs Leaderboard */}
        <View style={styles.topNavContainer}>
          <TouchableOpacity
            style={[styles.topNavTab, currentView === 'dashboard' && styles.activeTopNavTab]}
            onPress={() => setCurrentView('dashboard')}
          >
            <Text style={[styles.topNavText, currentView === 'dashboard' && styles.activeTopNavText]}>
              Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.topNavTab, currentView === 'leaderboard' && styles.activeTopNavTab]}
            onPress={() => setCurrentView('leaderboard')}
          >
            <Text style={[styles.topNavText, currentView === 'leaderboard' && styles.activeTopNavText]}>
              Leaderboard
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conditional Content Based on Current View */}
        {currentView === 'dashboard' ? (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
                colors={['#8b5cf6']}
              />
            }
          >
            {/* Kigen Stats Card - Now in prime position */}
            <FlippableStatsCard onPress={() => setIsRatingsOpen(true)} refreshTrigger={refreshTrigger} />

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

            {/* Digital Wellbeing Dashboard */}
            <DigitalWellbeing theme={theme} />

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
        ) : (
          <LeaderboardScreen />
        )}
        
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
          onShowAdmin={() => setIsAdminPanelOpen(true)}
        />
        
        {/* Goals Screen */}
        <GoalsScreen
          visible={isGoalsOpen || currentScreen === 'goals'}
          onClose={() => {
            setIsGoalsOpen(false);
            setCurrentScreen('dashboard');
          }}
        />
        
        {/* Ratings Screen */}
        {isRatingsOpen && (
          <RatingsScreen />
        )}
        
        {/* Journals Screen */}
        <JournalsScreen
          visible={currentScreen === 'journals' && !isJournalOpen}
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

        {/* Admin Panel Modal */}
        {isAdminPanelOpen && (
          <View style={styles.fullScreenModal}>
            <AdminPanel 
              theme={theme} 
              onClose={() => setIsAdminPanelOpen(false)} 
            />
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
    padding: theme.spacing.sm, // Just padding, no circular background
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
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  headerLeft: {
    width: 80, // Increased for better balance
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
  },
  topNavTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  activeTopNavTab: {
    backgroundColor: theme.colors.primary,
  },
  topNavText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  activeTopNavText: {
    color: '#FFFFFF',
  },
  headerRight: {
    width: 80, // Same width as headerLeft for perfect balance
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  menuButtonText: {
    fontSize: 20,
    color: theme.colors.text.primary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
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
  authButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  authButtonText: {
    ...theme.typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  adminButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6, // Smaller gap between buttons
  },
  adminButtonText: {
    ...theme.typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});