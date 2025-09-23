import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../config/theme';
import { UserStatsService } from '../services/userStatsService';
import { supabase } from '../services/supabase';
import { env } from '../config/env';
import { StatsValidator } from '../../debug/StatsValidator';
import { focusSessionService } from '../services/FocusSessionService';
import { useTranslation } from '../i18n/I18nProvider';

interface UserProfile {
  id: string;
  username: string;
  profileImage?: string;
  createdAt: Date;
  lastUpdated: Date;
}

interface ProfileStats {
  totalFocusTime: number; // in minutes
  sessionsThisWeek: number;
  currentStreak: number;
  longestSession: number; // in minutes
}

interface ProfileScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ visible, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({
    totalFocusTime: 0,
    sessionsThisWeek: 0,
    currentStreak: 0,
    longestSession: 0
  });

  useEffect(() => {
    console.log('📱 ProfileScreen visibility changed:', visible);
    if (visible) {
      loadProfile();
      loadStatistics();
    }
  }, [visible]);

  // Calculate real statistics from focus sessions
  const loadStatistics = async () => {
    try {
      const sessionStats = await focusSessionService.getSessionStats();
      const allSessions = await focusSessionService.getFocusSessions();
      
      // Calculate sessions this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekSessions = allSessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= oneWeekAgo && session.completed;
      });
      
      // Calculate total focus time from COMPLETED sessions only
      const completedSessions = allSessions.filter(session => session.completed);
      const totalFocusMinutes = completedSessions.reduce((total, session) => {
        return total + session.actualDuration;
      }, 0);
      
      // Find longest completed session
      const longestSessionMinutes = completedSessions.reduce((longest, session) => {
        return Math.max(longest, session.actualDuration);
      }, 0);
      
      setStats({
        totalFocusTime: totalFocusMinutes,
        sessionsThisWeek: thisWeekSessions.length,
        currentStreak: sessionStats.currentStreak,
        longestSession: longestSessionMinutes
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
      setStats({
        totalFocusTime: 0,
        sessionsThisWeek: 0,
        currentStreak: 0,
        longestSession: 0
      });
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  // Handle hardware back button
  const handleClose = () => {
    console.log('📱 ProfileScreen close button pressed');
    // Dismiss keyboard before closing
    Keyboard.dismiss();
    onClose();
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      // Use ensureUserProfile to create profile if it doesn't exist
      const userProfile = await UserStatsService.ensureUserProfile();
      if (userProfile) {
        setProfile(userProfile);
        setNewUsername(userProfile.username);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    // Skip validation if Supabase is not configured
    if (env.supabaseUrl.includes('placeholder')) {
      console.log('Supabase not configured - skipping username validation');
      return true;
    }

    try {
      setIsCheckingUsername(true);
      
      // Check if username exists in leaderboard table
      const { data, error } = await supabase
        .from('leaderboard')
        .select('username')
        .eq('username', username.trim())
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which means username is available
        console.error('Error checking username:', error);
        throw error;
      }

      // If data exists and it's not the current user's username, it's taken
      const isCurrentUsername = profile?.username.toLowerCase() === username.trim().toLowerCase();
      return !data || isCurrentUsername;
    } catch (error) {
      console.error('Error checking username availability:', error);
      // If there's an error, allow the change but warn the user
      Alert.alert(t('profile.alerts.loadErrorTitle'), t('profile.alerts.loadErrorMsg'));
      return true;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert(t('profile.alerts.usernameEmptyTitle'), t('profile.alerts.usernameEmptyMsg'));
      return;
    }

    if (newUsername.trim().length < 3) {
      Alert.alert(t('profile.alerts.usernameTooShortTitle'), t('profile.alerts.usernameTooShortMsg'));
      return;
    }

    if (newUsername.trim().length > 20) {
      Alert.alert(t('profile.alerts.usernameTooLongTitle'), t('profile.alerts.usernameTooLongMsg'));
      return;
    }

    // Check for invalid characters
    const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validUsernameRegex.test(newUsername.trim())) {
      Alert.alert(t('profile.alerts.usernameInvalidCharsTitle'), t('profile.alerts.usernameInvalidCharsMsg'));
      return;
    }

    try {
      setIsSaving(true);

      // Check if username is available
      const isAvailable = await checkUsernameAvailability(newUsername.trim());
      
      if (!isAvailable) {
        Alert.alert(t('profile.alerts.usernameTakenTitle'), t('profile.alerts.usernameTakenMsg'));
        return;
      }

      // Update the profile
      await UserStatsService.updateUserProfile({ 
        username: newUsername.trim() 
      });

      // Reload the profile to get updated data
      await loadProfile();
      
  setIsEditing(false);
  Alert.alert(t('profile.alerts.usernameUpdatedTitle'), t('profile.alerts.usernameUpdatedMsg'));
    } catch (error) {
      console.error('Error updating username:', error);
      Alert.alert(t('profile.alerts.usernameUpdateFailedTitle'), t('profile.alerts.usernameUpdateFailedMsg'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileImageChange = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t('profile.alerts.permissionNeededTitle'), t('profile.alerts.permissionNeededMsg'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]) {
        // Update the profile with new image
        await UserStatsService.updateUserProfile({ 
          profileImage: result.assets[0].uri 
        });
        
        // Reload the profile to get updated data
        await loadProfile();
        
  Alert.alert(t('profile.alerts.profilePicUpdatedTitle'), t('profile.alerts.profilePicUpdatedMsg'));
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert(t('profile.alerts.profilePicUpdateFailedTitle'), t('profile.alerts.profilePicUpdateFailedMsg'));
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Remove the loading state - just render directly
  // if (isLoading) {
  //   return (
  //     <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
  //       <View style={styles.loadingContainer}>
  //         <ActivityIndicator size="large" color="#FFFFFF" />
  //         <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>
  //           Loading Profile...
  //         </Text>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }
  //NOTE: THIS SHIT DOES NOTHING BUT SPINNING AND OCCUPYING SPACE ON SCREEN. AND THIS LITTLE SHIT STAYS THERE PERMANANTLY UNLESS YOU DISABLE IT FROM HERE.

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
          >
            <Text style={styles.closeButtonText}>{t('common.close')}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            {t('profile.title')}
          </Text>
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
            No profile found. Please create an account first.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Profile
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Picture Section */}
        <View style={styles.profileImageSection}>
          <TouchableOpacity style={styles.profileImageContainer} onPress={handleProfileImageChange}>
            {profile.profileImage ? (
              <Image 
                source={{ uri: profile.profileImage }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profilePlaceholder, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.profilePlaceholderText}>
                  {profile.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.editImageOverlay}>
              <Text style={styles.editImageText}>Edit</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Username Section */}
        <View style={[styles.section, { borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Username
          </Text>
          
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[
                  styles.usernameInput,
                  { 
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  }
                ]}
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder={t('profile.username')}
                placeholderTextColor={theme.colors.text.tertiary}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
              
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { backgroundColor: theme.colors.surface }
                  ]}
                  onPress={() => {
                    setIsEditing(false);
                    setNewUsername(profile.username);
                  }}
                  disabled={isSaving}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.text.secondary }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.saveButton,
                    { backgroundColor: theme.colors.primary }
                  ]}
                  onPress={handleSaveUsername}
                  disabled={isSaving || isCheckingUsername}
                >
                  {isSaving || isCheckingUsername ? (
                    <ActivityIndicator size="small" color={theme.colors.text.primary} />
                  ) : (
                    <Text style={[styles.saveButtonText, { color: theme.colors.text.primary }]}>{t('common.save')}</Text>
                  )}
                </TouchableOpacity>
              </View>
              
              {isCheckingUsername && (
                <Text style={[styles.checkingText, { color: theme.colors.text.secondary }]}>
                  Checking availability...
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.usernameDisplay}>
              <Text style={[styles.usernameText, { color: theme.colors.text.primary }]}>
                {profile.username}
              </Text>
              <TouchableOpacity
                style={[styles.editButton, { borderColor: theme.colors.border }]}
                onPress={() => setIsEditing(true)}
              >
                  <Text style={[styles.editButtonText, { 
                  color: '#888691',
                }]}> 
                  {t('common.edit')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Focus Statistics - Real Data */}
        <View style={[styles.section, { borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            {t('dashboard.disciplineAndFocus')}
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: theme.colors.text.primary }]}>
                {formatTime(stats.totalFocusTime)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>{t('profile.totalFocusTime')}</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                {stats.sessionsThisWeek}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>{t('profile.sessionsThisWeek')}</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
                {stats.currentStreak}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>{t('profile.currentStreak')}</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: theme.colors.secondary }]}>
                {formatTime(stats.longestSession)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>{t('profile.longestSession')}</Text>
            </View>
          </View>
        </View>

        {/* Account Details */}
        <View style={[styles.section, { borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            {t('profile.title')}
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
              {t('profile.memberSince')}
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              {formatDate(profile.createdAt)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
              {t('profile.lastUpdated')}
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              {formatDate(profile.lastUpdated)}
            </Text>
          </View>
        </View>

        {/* Debug Stats Validation - Only in development */}
        {__DEV__ && (
          <TouchableOpacity 
            style={{
              backgroundColor: 'rgba(0, 255, 0, 0.2)',
              padding: 15,
              borderRadius: 8,
              marginVertical: 10,
              borderWidth: 1,
              borderColor: '#00ff00'
            }}
            onPress={() => StatsValidator.validateStatsConsistency()}
          >
            <Text style={{ color: '#00ff00', textAlign: 'center', fontWeight: 'bold' }}>
              🔍 Debug Stats (Check Console)
            </Text>
          </TouchableOpacity>
        )}

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={[styles.privacyText, { color: theme.colors.text.tertiary }]}>
            Your username is visible to other users on the leaderboard. 
            Make sure it&apos;s appropriate and follows our community guidelines.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#888691',
    fontSize: 16,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 60,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  profileImageContainer: {
    borderRadius: 60,
    height: 120,
    overflow: 'hidden',
    position: 'relative',
    width: 120,
  },
  profileImage: {
    height: 120,
    width: 120,
  },
  profilePlaceholder: {
    alignItems: 'center',
    borderRadius: 60,
    height: 120,
    justifyContent: 'center',
    width: 120,
  },
  profilePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
  },
  editImageOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    bottom: 0,
    left: 0,
    paddingVertical: 4,
    position: 'absolute',
    right: 0,
  },
  editImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    borderBottomWidth: 1,
    marginBottom: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  editContainer: {
    gap: 16,
  },
  usernameInput: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelButton: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  saveButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  checkingText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  usernameDisplay: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usernameText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  privacyNotice: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 32,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  
  // Statistics styles  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
    padding: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
