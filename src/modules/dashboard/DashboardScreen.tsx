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
import { RatingsScreen } from '../../screens/RatingsScreen';
import { DigitalWellbeing } from '../../components/DigitalWellbeing';
import { AdminPanel } from '../../components/AdminPanel';
import { FlippableStatsCard } from '../../components/FlippableStatsCard';
import { LeaderboardScreen } from '../../screens/LeaderboardScreen';

export const DashboardScreen: React.FC = () => {
  const { signOut } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'leaderboard'>('dashboard');
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        setIsRatingsOpen(false);
        break;
      case 'ratings':
        setIsRatingsOpen(true);
        setIsGoalsOpen(false);
        setIsJournalOpen(false);
        break;
      case 'journals':
        setIsGoalsOpen(false);
        setIsRatingsOpen(false);
        break;
      case 'goals':
        setIsGoalsOpen(true);
        setIsJournalOpen(false);
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
            <FlippableStatsCard onPress={() => setIsRatingsOpen(true)} refreshTrigger={refreshTrigger} />

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
              
              <View style={styles.fullWidthButtonContainer}>
                <Button
                  title="View Progress"
                  onPress={() => {}}
                  variant="outline"
                  style={styles.fullWidthButton}
                />
              </View>
            </View>

            <DigitalWellbeing theme={theme} />

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
        
        {isRatingsOpen && (
          <RatingsScreen />
        )}
        
        <JournalsScreen
          visible={currentScreen === 'journals' && !isJournalOpen}
          onClose={() => setCurrentScreen('dashboard')}
        />

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
    paddingBottom: theme.spacing.xxl + 20,
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
});
