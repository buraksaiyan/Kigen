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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../config/theme';
import { UserStatsService } from '../services/userStatsService';
import { supabase } from '../services/supabase';
import { env } from '../config/env';

interface UserProfile {
  id: string;
  username: string;
  profileImage?: string;
  createdAt: Date;
  lastUpdated: Date;
}

interface ProfileScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ visible, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  useEffect(() => {
    console.log('📱 ProfileScreen visibility changed:', visible);
    if (visible) {
      loadProfile();
    }
  }, [visible]);

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
      Alert.alert(
        'Warning', 
        'Could not verify username availability. Proceed with caution.'
      );
      return true;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    if (newUsername.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    if (newUsername.trim().length > 20) {
      Alert.alert('Error', 'Username cannot be more than 20 characters long');
      return;
    }

    // Check for invalid characters
    const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validUsernameRegex.test(newUsername.trim())) {
      Alert.alert('Error', 'Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    try {
      setIsSaving(true);

      // Check if username is available
      const isAvailable = await checkUsernameAvailability(newUsername.trim());
      
      if (!isAvailable) {
        Alert.alert('Error', 'This username is already taken. Please choose a different one.');
        return;
      }

      // Update the profile
      await UserStatsService.updateUserProfile({ 
        username: newUsername.trim() 
      });

      // Reload the profile to get updated data
      await loadProfile();
      
      setIsEditing(false);
      Alert.alert('Success', 'Username updated successfully!');
    } catch (error) {
      console.error('Error updating username:', error);
      Alert.alert('Error', 'Failed to update username. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileImageChange = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to change your profile picture.');
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
        
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>
            Loading Profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Profile
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
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                placeholder="Enter new username"
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
                    Cancel
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
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
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
                <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Account Information */}
        <View style={[styles.section, { borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Account Information
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
              Member Since
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              {formatDate(profile.createdAt)}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
              Last Updated
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              {formatDate(profile.lastUpdated)}
            </Text>
          </View>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={[styles.privacyText, { color: theme.colors.text.tertiary }]}>
            Your username is visible to other users on the leaderboard. 
            Make sure it's appropriate and follows our community guidelines.
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: theme.colors.primary,
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
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
  profilePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  editImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
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
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usernameText: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
