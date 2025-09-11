import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { KigenKanjiBackground } from '../components/KigenKanjiBackground';
import { useSettings } from '../hooks/useSettings';
import CustomMeditationSoundService, { CustomMeditationSound } from '../services/CustomMeditationSoundService';

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ visible, onClose }) => {
  const { settings, toggleTimerSounds, toggleMeditationSounds, updateVolume } = useSettings();
  const [customSounds, setCustomSounds] = useState<CustomMeditationSound[]>([]);
  const [showSoundManager, setShowSoundManager] = useState(false);
  const [loading, setLoading] = useState(false);

  const volumeSteps = [0.1, 0.3, 0.5, 0.7, 1.0];

  // Handle hardware back button
  useEffect(() => {
    if (!visible) return;

    const backAction = () => {
      console.log('📱 Hardware back button pressed in SettingsScreen');
      onClose();
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [visible, onClose]);

  const handleManageSounds = async () => {
    setShowSoundManager(true);
    setLoading(true);
    try {
      const sounds = await CustomMeditationSoundService.getCustomSoundsWithValidation();
      setCustomSounds(sounds);
    } catch (error) {
      console.error('Error loading custom sounds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSound = async () => {
    try {
      setLoading(true);
      const newSound = await CustomMeditationSoundService.importCustomSound();
      if (newSound) {
        setCustomSounds(prev => [...prev, newSound]);
        Alert.alert('Success', `"${newSound.name}" imported successfully!`);
      }
    } catch (error) {
      console.error('Error importing sound:', error);
      Alert.alert('Error', 'Failed to import sound file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSound = async (soundId: string) => {
    const sound = customSounds.find(s => s.id === soundId);
    if (!sound) return;

    Alert.alert(
      'Delete Sound',
      `Are you sure you want to delete "${sound.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CustomMeditationSoundService.deleteCustomSound(soundId);
              setCustomSounds(prev => prev.filter(s => s.id !== soundId));
            } catch (error) {
              console.error('Error deleting sound:', error);
              Alert.alert('Error', 'Failed to delete sound.');
            }
          },
        },
      ]
    );
  };

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <KigenKanjiBackground />
        
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Text style={styles.title}>Settings</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.subtitle}>Customize your Kigen experience</Text>
            </View>

            <View style={styles.content}>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SOUNDS</Text>
            
            {/* Timer Sounds Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Timer Tick Sounds</Text>
                <Text style={styles.settingDescription}>
                  Play soft tick sounds as seconds count down during focus sessions
                </Text>
              </View>
              <Switch
                value={settings.timerSoundsEnabled}
                onValueChange={toggleTimerSounds}
                trackColor={{ false: '#333333', true: theme.colors.primary }}
                thumbColor={settings.timerSoundsEnabled ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>

            {/* Meditation Sounds Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Meditation Sounds</Text>
                <Text style={styles.settingDescription}>
                  Enable ambient sounds during meditation focus mode
                </Text>
              </View>
              <Switch
                value={settings.meditationSoundsEnabled}
                onValueChange={toggleMeditationSounds}
                trackColor={{ false: '#333333', true: theme.colors.primary }}
                thumbColor={settings.meditationSoundsEnabled ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>

            {/* Volume Control */}
            {(settings.timerSoundsEnabled || settings.meditationSoundsEnabled) && (
              <View style={styles.settingRow}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Sound Volume</Text>
                  <Text style={styles.settingDescription}>
                    Adjust the volume of timer and meditation sounds
                  </Text>
                </View>
              </View>
            )}

            {/* Volume Buttons */}
            {(settings.timerSoundsEnabled || settings.meditationSoundsEnabled) && (
              <View style={styles.volumeContainer}>
                {volumeSteps.map((volume) => (
                  <TouchableOpacity
                    key={volume}
                    style={[
                      styles.volumeButton,
                      settings.soundVolume === volume && styles.volumeButtonActive
                    ]}
                    onPress={() => updateVolume(volume)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.volumeButtonText,
                      settings.soundVolume === volume && styles.volumeButtonTextActive
                    ]}>
                      {Math.round(volume * 100)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CUSTOM SOUNDS</Text>
            
            <TouchableOpacity 
              style={styles.settingRow} 
              onPress={handleManageSounds}
              activeOpacity={0.8}
            >
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Manage Custom Sounds</Text>
                <Text style={styles.settingDescription}>
                  Add, organize, or remove your custom meditation sounds
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ABOUT</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Kigen Focus App</Text>
                <Text style={styles.settingDescription}>
                  Version 1.0.0 - Focus modes with mindful productivity
                </Text>
              </View>
            </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
    </Modal>

    {/* Sound Management Modal */}
    <Modal
      visible={showSoundManager}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSoundManager(false)}
    >
      <View style={styles.container}>
        <KigenKanjiBackground />
        
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowSoundManager(false)} 
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Text style={styles.title}>Custom Sounds</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.subtitle}>Import and manage your meditation sounds</Text>
              </View>

              {/* Import Sound Button */}
              <TouchableOpacity 
                style={styles.importButton} 
                onPress={handleImportSound}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.importButtonText}>
                  {loading ? 'Importing...' : '+ Import Sound from Device'}
                </Text>
              </TouchableOpacity>

              {/* Custom Sounds List */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>MY SOUNDS ({customSounds.length})</Text>
                
                {customSounds.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No custom sounds yet</Text>
                    <Text style={styles.emptyStateDescription}>
                      Import audio files from your device to use as meditation sounds
                    </Text>
                  </View>
                ) : (
                  customSounds.map((sound) => (
                    <View key={sound.id} style={styles.soundItem}>
                      <View style={styles.soundContent}>
                        <Text style={styles.soundTitle}>{sound.name}</Text>
                        <Text style={styles.soundDescription}>
                          {sound.duration ? 
                            `${CustomMeditationSoundService.formatDuration(sound.duration)}` : 
                            'Unknown duration'
                          } • {sound.fileSize ? 
                            `${(sound.fileSize / 1024 / 1024).toFixed(1)}MB` : 
                            'Unknown size'
                          }
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleDeleteSound(sound.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    ...theme.typography.body,
    color: '#888691',
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888691',
    letterSpacing: 1.5,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  volumeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  volumeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 60,
    alignItems: 'center',
  },
  volumeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  volumeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  volumeButtonTextActive: {
    color: '#FFFFFF',
  },
  chevron: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '300',
  },
  importButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },
  emptyStateDescription: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  soundContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  soundTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  soundDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  deleteButton: {
    backgroundColor: 'rgba(255,68,68,0.2)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  deleteButtonText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
