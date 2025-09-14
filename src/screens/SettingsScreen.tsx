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
import { useTranslation } from '../i18n/I18nProvider';
import { SUPPORTED_LANGUAGES, Language } from '../i18n';

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ visible, onClose }) => {
  const { 
    settings, 
    toggleTimerSounds, 
    updateVolume, 
    toggleFocusReminders,
    toggleDigitalWellbeingAlerts,
    toggleKeepScreenOn,
    updateLanguage,
  } = useSettings();
  const { t, language, setLanguage } = useTranslation();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const volumeSteps = [0.1, 0.3, 0.5, 0.7, 1.0];

  const handleLanguageSelect = async (languageCode: Language) => {
    try {
      await setLanguage(languageCode);
      updateLanguage(languageCode);
      setShowLanguagePicker(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const getCurrentLanguageName = () => {
    const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === language);
    return currentLang ? `${currentLang.flag} ${currentLang.nativeName}` : '🇺🇸 English';
  };

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
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Text style={styles.title}>{t('settings.title')}</Text>
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

            {/* Volume Control */}
            {settings.timerSoundsEnabled && (
              <View style={styles.settingRow}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Sound Volume</Text>
                  <Text style={styles.settingDescription}>
                    Adjust the volume of timer sounds
                  </Text>
                </View>
              </View>
            )}

            {/* Volume Buttons */}
            {settings.timerSoundsEnabled && (
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
            <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
            
            {/* Focus Reminders Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.focusReminders')}</Text>
                <Text style={styles.settingDescription}>
                  Get reminded to take breaks and start focus sessions
                </Text>
              </View>
              <Switch
                value={settings.focusRemindersEnabled}
                onValueChange={toggleFocusReminders}
                trackColor={{ false: '#333333', true: theme.colors.primary }}
                thumbColor={settings.focusRemindersEnabled ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>

            {/* Wellbeing Alerts Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.digitalWellbeingAlerts')}</Text>
                <Text style={styles.settingDescription}>
                  Receive warnings when exceeding daily screen time limits
                </Text>
              </View>
              <Switch
                value={settings.digitalWellbeingAlertsEnabled}
                onValueChange={toggleDigitalWellbeingAlerts}
                trackColor={{ false: '#333333', true: theme.colors.primary }}
                thumbColor={settings.digitalWellbeingAlertsEnabled ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FOCUS PREFERENCES</Text>
            
            {/* Default Session Duration */}
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.defaultFocusDuration')}</Text>
                <Text style={styles.settingDescription}>
                  Set your preferred session length (currently {settings.defaultFocusDuration} {t('common.minutes')})
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {/* Keep Screen On */}
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.keepScreenOn')}</Text>
                <Text style={styles.settingDescription}>
                  Prevent screen from dimming during focus sessions
                </Text>
              </View>
              <Switch
                value={settings.keepScreenOnEnabled}
                onValueChange={toggleKeepScreenOn}
                trackColor={{ false: '#333333', true: theme.colors.primary }}
                thumbColor={settings.keepScreenOnEnabled ? '#FFFFFF' : '#CCCCCC'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PERSONALIZATION</Text>
            
            {/* Language Selection */}
            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => setShowLanguagePicker(true)}
            >
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.language')}</Text>
                <Text style={styles.settingDescription}>
                  Choose your preferred language ({getCurrentLanguageName()})
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PRIVACY & DATA</Text>
            
            {/* Reset Data */}
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Reset All Data</Text>
                <Text style={styles.settingDescription}>
                  Clear all focus sessions, goals, and preferences
                </Text>
              </View>
              <Text style={[styles.chevron, { color: theme.colors.danger }]}>›</Text>
            </TouchableOpacity>

            {/* Privacy Policy */}
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
                <Text style={styles.settingDescription}>
                  Learn how we protect your data and privacy
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Kigen Focus App</Text>
                <Text style={styles.settingDescription}>
                  Version 1.0.0 - Focus modes with mindful productivity
                </Text>
              </View>
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

  {/* Language Picker Modal */}
  <Modal
    visible={showLanguagePicker}
    transparent={true}
    animationType="fade"
    onRequestClose={() => setShowLanguagePicker(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.languageModal}>
        <View style={styles.languageModalHeader}>
          <Text style={styles.languageModalTitle}>Select Language</Text>
          <TouchableOpacity 
            onPress={() => setShowLanguagePicker(false)}
            style={styles.modalCloseButton}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.languageList}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageOption,
                language === lang.code && styles.selectedLanguageOption
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <View style={styles.languageNames}>
                  <Text style={[
                    styles.languageOptionText,
                    language === lang.code && styles.selectedLanguageText
                  ]}>
                    {lang.nativeName}
                  </Text>
                  <Text style={styles.languageEnglishName}>
                    {lang.name}
                  </Text>
                </View>
              </View>
              {language === lang.code && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
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
  // Language Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  languageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  languageModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  languageList: {
    maxHeight: 400,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  selectedLanguageOption: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageNames: {
    flex: 1,
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  selectedLanguageText: {
    color: theme.colors.primary,
  },
  languageEnglishName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  checkMark: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});
