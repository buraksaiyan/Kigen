import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, RefreshControl, Platform, Alert, Image, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthProvider';
import { useTranslation } from '../../i18n/I18nProvider';
import { maybePromptForRating } from '../../services/rating';
import { theme } from '../../config/theme';
import { Button, Card } from '../../components/UI';
import { JournalSection } from '../../components/JournalSection';
import { Sidebar } from '../../components/Sidebar';
import { RatingsScreen } from '../../screens/RatingsScreen';
import { DigitalWellbeing } from '../../components/DigitalWellbeing';
import { UserStatsService } from '../../services/userStatsService';
import { AdminPanel } from '../../components/AdminPanel';
import { FlippableStatsCard } from '../../components/FlippableStatsCard';
import { LeaderboardScreen } from '../../screens/LeaderboardScreen';
import { useNotifications } from '../../contexts/NotificationsContext';
import { NotificationsDropdown } from '../../components/NotificationsDropdown';
import { achievementService } from '../../services/achievementService';
import { SupabaseTest } from '../../../debug/SupabaseTest';
import { env } from '../../config/env';

export const DashboardScreen: React.FC = () => {
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [currentView, setCurrentView] = useState<'dashboard' | 'leaderboard'>('dashboard');
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSupabaseDebug, setShowSupabaseDebug] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const { unreadCount } = useNotifications();

  // Memoized close handlers to prevent BackHandler re-registration issues
  const handleCloseJournal = useCallback(() => {
    setIsJournalOpen(false);
  }, []);

  const handleCloseNotifications = useCallback(() => {
    setIsNotificationsOpen(false);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleCloseAdminPanel = useCallback(() => {
    setIsAdminPanelOpen(false);
  }, []);

  useEffect(() => {
    maybePromptForRating();
    // Ensure profile exists when dashboard loads
    UserStatsService.ensureUserProfile().catch(console.error);
  }, []);

  // Refresh stats when returning to dashboard from other screens
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('📊 Dashboard focused - refreshing stats');
      setRefreshTrigger(prev => prev + 1);
    });

    return unsubscribe;
  }, [navigation]);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // Close modals in order of priority (most recent first)
        if (isJournalOpen) {
          setIsJournalOpen(false);
          return true;
        }
        if (isNotificationsOpen) {
          setIsNotificationsOpen(false);
          return true;
        }
        if (isSidebarOpen) {
          setIsSidebarOpen(false);
          return true;
        }
        if (isAdminPanelOpen) {
          setIsAdminPanelOpen(false);
          return true;
        }
        
        // Handle view switches
        if (currentView === 'leaderboard') {
          setCurrentView('dashboard');
          return true;
        }
        
        // If no modals are open and we're on dashboard view, allow default back behavior (exit app)
        return false;
      });

      return () => backHandler.remove();
    }
  }, [isJournalOpen, isNotificationsOpen, isSidebarOpen, isAdminPanelOpen, currentView]);

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
    setIsSidebarOpen(false);
    
    switch(screen) {
      case 'dashboard':
        // Stay on dashboard
        break;
      case 'journals':
        navigation.navigate('Journals' as never);
        break;
      case 'goalsHistory':
        navigation.navigate('GoalsHistory' as never);
        break;
      case 'goals':
        navigation.navigate('Goals' as never);
        break;
      case 'focusSession':
        navigation.navigate('FocusSession' as never);
        break;
      case 'progress':
        navigation.navigate('Progress' as never);
        break;
      case 'settings':
        navigation.navigate('Settings' as never);
        break;
      case 'profile':
        navigation.navigate('Profile' as never);
        break;
      case 'achievements':
        navigation.navigate('Achievements' as never);
        break;
      default:
        console.log('Unknown screen:', screen);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <SafeAreaView style={styles.container}>
        
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            {currentView === 'dashboard' && (
              <TouchableOpacity onPress={handleSidebar} style={styles.menuButton}>
                <Text style={styles.menuButtonText}>☰</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setIsNotificationsOpen(true)} style={styles.notificationsButton}>
              <Image source={require('../../../assets/images/notification-icon.png')} style={styles.notificationsIcon} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount.toString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.topNavContainer}>
          <TouchableOpacity
            style={[styles.topNavTab, currentView === 'dashboard' && styles.activeTopNavTab]}
            onPress={() => {
              setCurrentView('dashboard');
              // Close journal modal when switching to dashboard
              setIsJournalOpen(false);
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
              // Close journal modal when switching to leaderboard
              setIsJournalOpen(false);
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
                  onPress={() => navigation.navigate('Goals' as never)}
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
                  onPress={() => navigation.navigate('FocusSession' as never)}
                  variant="primary"
                  style={styles.outlinedActionButton}
                />
                <Button
                  title="View Progress"
                  onPress={() => navigation.navigate('Progress' as never)}
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
          onEntryAdded={() => setRefreshTrigger(prev => prev + 1)}
        />
        
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          onNavigate={handleSidebarNavigation}
          onShowAdmin={() => setIsAdminPanelOpen(true)}
        />

        <NotificationsDropdown
          visible={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
        
        <JournalSection 
          isExpanded={isJournalOpen}
          onClose={() => setIsJournalOpen(false)}
          onEntryAdded={() => setRefreshTrigger(prev => prev + 1)}
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
              onClose={handleCloseAdminPanel} 
            />
          </View>
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  actionsSection: {
    marginBottom: theme.spacing.lg,
    marginTop: 60,
  },
  activeTopNavTab: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary, // Match border color to background for seamless look
  },
  activeTopNavText: {
    color: '#FFFFFF',
  },
  closeDebugButton: {
    backgroundColor: theme.colors.danger,
    borderRadius: 8,
    padding: 12,
    position: 'absolute',
    right: 20,
    top: 50,
    zIndex: 2001,
  },
  closeDebugText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
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
    backgroundColor: theme.colors.background,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2000,
  },
  fullWidthButton: {
    width: '100%',
  },
  fullWidthButtonContainer: {
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  headerLeft: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: 80,
  },
  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 80,
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  menuButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
  },
  menuButtonText: {
    color: theme.colors.text.primary,
    fontSize: 24,
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.danger,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -5,
    top: -5,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
  },
  notificationsIcon: {
    height: 40,
    tintColor: theme.colors.text.primary,
    width: 40,
  },
  outlinedActionButton: {
    borderColor: '#888691',
    borderWidth: 1, // Match outline variant border width
    borderStyle: 'solid',
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    // paddingBottom will be set dynamically based on safe area insets
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  statsCardContainer: {
    marginVertical: theme.spacing.md,
    paddingHorizontal: 4, // Add slight horizontal padding
  },
  topHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  topNavContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    padding: 4,
  },
  topNavTab: {
    alignItems: 'center',
    borderColor: '#888691',
    borderRadius: theme.borderRadius.md,
    borderWidth: 0.5, // Reduced from 1 to 0.5 for more subtle appearance
    flex: 1,
    paddingVertical: theme.spacing.sm,
  },
  topNavText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
});