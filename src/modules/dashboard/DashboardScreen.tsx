import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, RefreshControl, Platform, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { useTranslation } from '../../i18n/I18nProvider';
import { maybePromptForRating } from '../../services/rating';
import { theme } from '../../config/theme';
import { Button, Card } from '../../components/UI';
import { KigenLogo } from '../../components/KigenLogo';
import { JournalSection } from '../../components/JournalSection';
import { Sidebar } from '../../components/Sidebar';
import { KigenKanjiBackground } from '../../components/KigenKanjiBackground';
import { GoalsScreen } from '../../screens/GoalsScreen';
import { JournalsScreen } from '../../screens/JournalsScreen';
import { RatingsScreen } from '../../screens/RatingsScreen';
import { DigitalWellbeing } from '../../components/DigitalWellbeing';
import { UserStatsService } from '../../services/userStatsService';
import { AdminPanel } from '../../components/AdminPanel';
import { FlippableStatsCard } from '../../components/FlippableStatsCard';
import { LeaderboardScreen } from '../../screens/LeaderboardScreen';
import { FocusSessionScreen } from '../../screens/FocusSessionScreen';
import { ProgressScreen } from '../../screens/ProgressScreen';
import { SettingsScreen } from '../../screens/SettingsScreen';
import { ProfileScreen } from '../../screens/ProfileScreen';
import { AchievementsScreen } from '../../screens/AchievementsScreen';
import { achievementService } from '../../services/achievementService';
import { SupabaseTest } from '../../../debug/SupabaseTest';
import { env } from '../../config/env';

export const DashboardScreen: React.FC = () => {
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [currentView, setCurrentView] = useState<'dashboard' | 'leaderboard'>('dashboard');
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isFocusSessionOpen, setIsFocusSessionOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSupabaseDebug, setShowSupabaseDebug] = useState(false);

  useEffect(() => {
    maybePromptForRating();
    // Ensure profile exists when dashboard loads
    UserStatsService.ensureUserProfile().catch(console.error);
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    setIsRefreshing(false);
  };

  const handleJournal = () => {
    setIsJournalOpen(true);
  };

  const handleSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleSidebarNavigation = (screen: string) => {
    setCurrentScreen(screen);
    setIsSidebarOpen(false);
    
    switch(screen) {
      case 'dashboard':
        setIsGoalsOpen(false);
        setIsJournalOpen(false);
        setIsFocusSessionOpen(false);
        setIsProgressOpen(false);
        setIsSettingsOpen(false);
        setIsProfileOpen(false);
        break;
      case 'journals':
        setIsGoalsOpen(false);
        setIsFocusSessionOpen(false);
        setIsProgressOpen(false);
        setIsSettingsOpen(false);
        setIsProfileOpen(false);
        setIsAchievementsOpen(false);
        break;
      case 'goals':
        setIsGoalsOpen(true);
        setIsJournalOpen(false);
        setIsFocusSessionOpen(false);
        setIsProgressOpen(false);
        setIsSettingsOpen(false);
        setIsProfileOpen(false);
        setIsAchievementsOpen(false);
        break;
      case 'progress':
        setIsProgressOpen(true);
        setIsGoalsOpen(false);
        setIsJournalOpen(false);
        setIsFocusSessionOpen(false);
        setIsSettingsOpen(false);
        setIsProfileOpen(false);
        setIsAchievementsOpen(false);
        break;
      case 'settings':
        setIsSettingsOpen(true);
        setIsGoalsOpen(false);
        setIsJournalOpen(false);
        setIsFocusSessionOpen(false);
        setIsProgressOpen(false);
        setIsProfileOpen(false);
        setIsAchievementsOpen(false);
        break;
      case 'achievements':
        setIsAchievementsOpen(true);
        setIsGoalsOpen(false);
        setIsJournalOpen(false);
        setIsFocusSessionOpen(false);
        setIsProgressOpen(false);
        setIsSettingsOpen(false);
        setIsProfileOpen(false);
        break;
      case 'profile':
        console.log('📱 Profile navigation triggered');
        // Switch to dashboard view when opening profile
        setCurrentView('dashboard');
        setIsProfileOpen(true);
        setIsGoalsOpen(false);
        setIsJournalOpen(false);
        setIsFocusSessionOpen(false);
        setIsProgressOpen(false);
        setIsSettingsOpen(false);
        setIsAchievementsOpen(false);
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
        
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            {currentView === 'dashboard' && (
              <TouchableOpacity onPress={handleSidebar} style={styles.menuButton}>
                <Text style={styles.menuButtonText}>☰</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.logoContainer}>
            <KigenLogo size="medium" variant="image" />
          </View>
          
          <View style={styles.headerRight}></View>
        </View>

        <View style={styles.topNavContainer}>
          <TouchableOpacity
            style={[styles.topNavTab, currentView === 'dashboard' && styles.activeTopNavTab]}
            onPress={() => {
              setCurrentView('dashboard');
              // Close all modals when switching to dashboard
              setIsProfileOpen(false);
              setIsSettingsOpen(false);
              setIsProgressOpen(false);
              setIsGoalsOpen(false);
              setIsJournalOpen(false);
              setIsFocusSessionOpen(false);
            }}
          >
            <Text style={[styles.topNavText, currentView === 'dashboard' && styles.activeTopNavText]}>
              {t('dashboard.title')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.topNavTab, currentView === 'leaderboard' && styles.activeTopNavTab]}
            onPress={() => {
              setCurrentView('leaderboard');
              // Close all modals when switching to leaderboard
              setIsProfileOpen(false);
              setIsSettingsOpen(false);
              setIsProgressOpen(false);
              setIsGoalsOpen(false);
              setIsJournalOpen(false);
              setIsFocusSessionOpen(false);
            }}
          >
            <Text style={[styles.topNavText, currentView === 'leaderboard' && styles.activeTopNavText]}>
              {t('dashboard.leaderboard')}
            </Text>
          </TouchableOpacity>
        </View>

        {currentView === 'dashboard' ? (
          <ScrollView 
            contentContainerStyle={[
              styles.scrollContent, 
              { paddingBottom: Math.max(insets.bottom + 20, theme.spacing.xxl + 20) }
            ]}
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor="#fff"
                colors={['#8b5cf6']}
              />
            }
          >
            <View style={styles.statsCardContainer}>
              <FlippableStatsCard onPress={() => {}} refreshTrigger={refreshTrigger} />
            </View>

            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>{t('dashboard.buildDiscipline')}</Text>
              
              <View style={styles.actionGrid}>
                <Button
                  title="Goals"
                  onPress={() => setCurrentScreen('goals')}
                  variant="primary"
                  style={styles.outlinedActionButton}
                />
                <Button
                  title="Journal"
                  onPress={handleJournal}
                  variant="primary"
                  style={styles.outlinedActionButton}
                />
              </View>
              
              <View style={styles.actionGrid}>
                <Button
                  title="Focus Session"
                  onPress={() => setIsFocusSessionOpen(true)}
                  variant="primary"
                  style={styles.outlinedActionButton}
                />
                <Button
                  title="View Progress"
                  onPress={() => setIsProgressOpen(true)}
                  variant="primary"
                  style={styles.outlinedActionButton}
                />
              </View>
            </View>

            <DigitalWellbeing theme={theme} />

            {__DEV__ && (
              <Card style={styles.devCard}>
                <Text style={styles.devTitle}>{t('dashboard.development')}</Text>
                {env.isDevelopment && (
                  <Button
                    title="🔍 Debug Supabase"
                    onPress={() => setShowSupabaseDebug(true)}
                    variant="outline"
                    size="small"
                    style={{ marginBottom: 8 }}
                  />
                )}
                <Button
                  title="🗑️ Clear All Data"
                  onPress={async () => {
                    try {
                      const { UserStatsService } = await import('../../services/userStatsService');
                      await UserStatsService.clearAllData();
                      Alert.alert('Success', 'All data cleared successfully!');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to clear data');
                      console.error(error);
                    }
                  }}
                  variant="outline"
                  size="small"
                  style={{ marginBottom: 8 }}
                />
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
        
        <JournalSection 
          isExpanded={isJournalOpen}
          onClose={() => setIsJournalOpen(false)}
        />
        
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNavigate={handleSidebarNavigation}
          currentScreen={currentScreen}
          onShowAdmin={() => setIsAdminPanelOpen(true)}
        />
        
        <GoalsScreen
          visible={isGoalsOpen || currentScreen === 'goals'}
          onClose={() => {
            setIsGoalsOpen(false);
            setCurrentScreen('dashboard');
          }}
        />
        
        <JournalsScreen
          visible={currentScreen === 'journals' && !isJournalOpen}
          onClose={() => setCurrentScreen('dashboard')}
        />

        <FocusSessionScreen
          visible={isFocusSessionOpen}
          onClose={() => setIsFocusSessionOpen(false)}
          onOpenGoals={() => {
            setIsFocusSessionOpen(false);
            setIsGoalsOpen(true);
          }}
          onSessionComplete={() => {
            // Force refresh of stats card when a session completes
            // Add slight delay to ensure data is saved before refreshing
            setTimeout(() => {
              setRefreshTrigger(prev => prev + 1);
            }, 500);
            
            // Check for new achievements after session completion
            setTimeout(async () => {
              try {
                await achievementService.checkAchievements();
                console.log('✅ Achievement check completed after session');
              } catch (error) {
                console.error('❌ Error checking achievements after session:', error);
              }
            }, 1000);
          }}
        />

        <ProgressScreen
          visible={isProgressOpen}
          onClose={() => setIsProgressOpen(false)}
        />

        <SettingsScreen
          visible={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        {currentView === 'dashboard' && (
          <ProfileScreen
            visible={isProfileOpen}
            onClose={() => {
              console.log('📱 ProfileScreen closing');
              setIsProfileOpen(false);
            }}
          />
        )}

        <AchievementsScreen
          visible={isAchievementsOpen}
          onClose={() => setIsAchievementsOpen(false)}
        />

        {showSupabaseDebug && (
          <View style={styles.fullScreenModal}>
            <SupabaseTest />
            <TouchableOpacity 
              style={styles.closeDebugButton}
              onPress={() => setShowSupabaseDebug(false)}
            >
              <Text style={styles.closeDebugText}>{t('dashboard.closeDebug')}</Text>
            </TouchableOpacity>
          </View>
        )}

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
    // paddingBottom will be set dynamically based on safe area insets
  },
  statsCardContainer: {
    marginVertical: theme.spacing.md,
    paddingHorizontal: 4, // Add slight horizontal padding
  },
  menuButton: {
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 80,
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
    borderWidth: 1,
    borderColor: '#888691',
  },
  activeTopNavTab: {
    backgroundColor: theme.colors.primary,
    borderColor: '#888691',
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
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  menuButtonText: {
    fontSize: 20,
    color: theme.colors.text.primary,
  },
  actionsSection: {
    marginTop: 60,
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
  outlinedActionButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#888691',
  },
  fullWidthButtonContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  fullWidthButton: {
    width: '100%',
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
  closeDebugButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: theme.colors.danger,
    padding: 12,
    borderRadius: 8,
    zIndex: 2001,
  },
  closeDebugText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});