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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme as defaultTheme } from '../config/theme';
import { useSettings } from '../hooks/useSettings';
import { useTranslation } from '../i18n/I18nProvider';
import { UserStatsService } from '../services/userStatsService';
import themeService, { ColorPreset } from '../services/themeService';
import { useTheme } from '../contexts/ThemeContext';
// import { SUPPORTED_LANGUAGES, Language } from '../i18n';

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
  // Optional callback to open dashboard customization modal
  onOpenCustomization?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ visible, onClose, onOpenCustomization }) => {
  const { 
    settings, 
    toggleTimerSounds, 
    updateVolume, 
    toggleFocusReminders,
    toggleDigitalWellbeingAlerts,
    toggleKeepScreenOn,
    updateDefaultFocusDuration,
    // updateLanguage,
  } = useSettings();
  const { t } = useTranslation();
  const { currentPresetId, applyPreset, theme: currentTheme } = useTheme();

  const volumeSteps = [0.1, 0.3, 0.5, 0.7, 1.0];
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPresets, setColorPresets] = useState<ColorPreset[]>([]);

  // Handlers for settings actions
  const handleFocusDurationPress = () => {
    setShowDurationPicker(true);
  };

  const handleResetDataPress = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your focus sessions, goals, and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await UserStatsService.clearAllData();
              Alert.alert('Success', 'All data has been reset.');
            } catch {
              Alert.alert('Error', 'Failed to reset data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handlePrivacyPolicyPress = () => {
    Alert.alert(
      'Privacy Policy',
      'We respect your privacy. Your focus data is stored locally on your device and is never transmitted to external servers. Usage statistics are only used to provide you with insights about your productivity patterns.',
      [{ text: 'OK' }]
    );
  };

  // Load color presets when settings opens
  useEffect(() => {
    let mounted = true;
    const loadPresets = async () => {
      try {
        const presets = themeService.getPresets();
        if (!mounted) return;
        setColorPresets(presets);
      } catch (e) {
        console.error('Failed to load color presets', e);
      }
    };

    if (visible) loadPresets();
    return () => { mounted = false; };
  }, [visible]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: defaultTheme.colors.background,
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    modalHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
    },
    closeButton: {
      padding: 8,
      width: 60, // match placeholder width so title stays centered
      alignItems: 'flex-start',
    },
    closeButtonText: {
      ...defaultTheme.typography.body,
      color: defaultTheme.colors.text.secondary,
      fontWeight: '600',
    },
    logoContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    placeholder: {
      width: 60,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 40,
    },
    content: {
      padding: defaultTheme.spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: defaultTheme.spacing.xl,
      paddingTop: defaultTheme.spacing.md,
    },
    title: {
      color: defaultTheme.colors.text.primary,
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: defaultTheme.spacing.xs,
    },
    subtitle: {
      color: defaultTheme.colors.text.secondary,
      fontSize: 16,
      paddingHorizontal: defaultTheme.spacing.lg,
      textAlign: 'center',
    },
    section: {
      marginBottom: defaultTheme.spacing.xl,
    },
    sectionTitle: {
      color: defaultTheme.colors.text.tertiary,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 1.5,
      marginBottom: defaultTheme.spacing.md,
      textTransform: 'uppercase',
    },
    settingRow: {
      alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.06)',
      borderBottomWidth: 1,
      flexDirection: 'row',
      paddingVertical: defaultTheme.spacing.md,
    },
    settingContent: {
      flex: 1,
      marginRight: defaultTheme.spacing.md,
    },
    settingTitle: {
      color: defaultTheme.colors.text.primary,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: defaultTheme.spacing.xs,
    },
    settingDescription: {
      color: defaultTheme.colors.text.secondary,
      fontSize: 14,
      lineHeight: 20,
    },
    volumeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: defaultTheme.spacing.md,
      paddingHorizontal: defaultTheme.spacing.sm,
    },
    volumeButton: {
      alignItems: 'center',
    backgroundColor: defaultTheme.colors.surfaceSecondary,
      borderRadius: defaultTheme.borderRadius.md,
      minWidth: 60,
      paddingHorizontal: defaultTheme.spacing.md,
      paddingVertical: defaultTheme.spacing.sm,
    },
    volumeButtonActive: {
      backgroundColor: defaultTheme.colors.primary,
    },
    volumeButtonText: {
      color: defaultTheme.colors.text.secondary,
      fontSize: 14,
      fontWeight: '600',
    },
    volumeButtonTextActive: {
      color: defaultTheme.colors.text.primary,
    },
    chevron: {
      color: defaultTheme.colors.text.secondary,
      fontSize: 24,
      fontWeight: '300',
    },
    // Language Picker Modal Styles
    modalOverlay: {
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.8)',
      flex: 1,
      justifyContent: 'center',
    },
    languageModal: {
      backgroundColor: defaultTheme.colors.surface,
      borderRadius: 16,
      maxHeight: '70%',
      overflow: 'hidden',
      width: '85%',
    },
    languageModalHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    languageModalTitle: {
      color: defaultTheme.colors.text.primary,
      fontSize: 18,
      fontWeight: '700',
    },
    modalCloseButton: {
    backgroundColor: defaultTheme.colors.surfaceSecondary,
      borderRadius: 20,
      padding: 8,
    },
    modalCloseText: {
      color: defaultTheme.colors.text.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    colorModalCloseButtonInline: {
      left: 16,
      padding: 8,
      position: 'absolute',
      top: 12,
      width: 60,
    },
    modalHeaderCenteredTitle: {
      alignItems: 'center',
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
    },
    modalCenteredTitleText: {
      marginBottom: 0,
      textAlign: 'center',
    },
    // Header variant where the close button is absolutely positioned so the title is centered
    modalHeaderWithAbsoluteClose: {
      position: 'relative',
    },
    colorModalCloseButton: {
      alignItems: 'flex-start',
      left: 16,
      padding: 8,
      position: 'absolute',
      top: 12,
      width: 60,
    },
    languageList: {
      maxHeight: 400,
    },
    languageOption: {
      alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.04)',
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    selectedLanguageOption: {
      backgroundColor: defaultTheme.colors.surfaceSecondary,
    },
    languageInfo: {
      alignItems: 'center',
      flexDirection: 'row',
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
      color: defaultTheme.colors.text.primary,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    selectedLanguageText: {
      color: defaultTheme.colors.primary,
    },
    languageEnglishName: {
      color: defaultTheme.colors.text.secondary,
      fontSize: 14,
    },
    checkMark: {
      color: defaultTheme.colors.primary,
      fontSize: 18,
      fontWeight: 'bold',
    },
    // Duration Picker Modal Styles
    durationModal: {
      backgroundColor: defaultTheme.colors.surface,
      borderRadius: 16,
      maxHeight: '60%',
      overflow: 'hidden',
      width: '85%',
    },
    durationModalHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    durationModalTitle: {
      color: defaultTheme.colors.text.primary,
      fontSize: 18,
      fontWeight: '700',
    },
    durationOptions: {
      padding: 16,
    },
    durationOption: {
      alignItems: 'center',
    backgroundColor: defaultTheme.colors.surfaceSecondary,
      borderRadius: 8,
      marginBottom: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    durationOptionSelected: {
      backgroundColor: defaultTheme.colors.primary,
    },
    durationOptionText: {
      color: defaultTheme.colors.text.secondary,
      fontSize: 16,
      fontWeight: '500',
    },
    durationOptionTextSelected: {
      color: defaultTheme.colors.text.primary,
      fontWeight: '600',
    },
    presetRow: {
      alignItems: 'center',
      borderBottomColor: 'rgba(255,255,255,0.04)',
      borderBottomWidth: 1,
      flexDirection: 'row',
      paddingVertical: defaultTheme.spacing.md,
    },
    presetRowActive: {
      // Full-width rounded card highlight for selected preset
      backgroundColor: defaultTheme.colors.surfaceSecondary,
      borderRadius: defaultTheme.borderRadius.lg,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginVertical: 6,
    },
    presetPreview: {
      alignItems: 'center',
      flexDirection: 'row',
      marginRight: defaultTheme.spacing.md,
    },
    swatch: {
      borderColor: 'rgba(255,255,255,0.06)',
      borderRadius: 6,
      borderWidth: 1,
      height: 28,
      width: 28
    },
    signInButton: {
      alignItems: 'center',
      backgroundColor: defaultTheme.colors.primary,
      borderRadius: defaultTheme.borderRadius.md,
      elevation: 4,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    signInText: {
      color: '#fff',
      fontWeight: '700',
    },
  });

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        
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
          
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.header}>
              <Text style={styles.subtitle}>{t('settings.customize')}</Text>
            </View>

            <View style={styles.content}>

            {/* Customization entry - opens the dashboard customization modal */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CUSTOMIZATION</Text>

              <TouchableOpacity
                style={styles.settingRow}
                onPress={() => {
                  if (onOpenCustomization) {
                    onOpenCustomization();
                  } else {
                    // Fallback: inform the user that customization is not available
                    Alert.alert('Customization', 'Dashboard customization is currently unavailable.');
                  }
                }}
              >
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Dashboard customization</Text>
                  <Text style={styles.settingDescription}>
                    Change your dashboard lineup and visibility of sections
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              {/* Colors entry - opens the color picker modal separately */}
              <TouchableOpacity
                style={[styles.settingRow, { marginTop: 8 }]}
                onPress={() => setShowColorPicker(true)}
              >
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Colors</Text>
                  <Text style={styles.settingDescription}>
                    Pick a color preset for the app
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.soundsTitle')}</Text>
            
            {/* Timer Sounds Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('settings.timerTickSounds')}</Text>
                <Text style={styles.settingDescription}>
                  {t('settings.timerTickSoundsDesc')}
                </Text>
              </View>
              <Switch
                value={settings.timerSoundsEnabled}
                onValueChange={toggleTimerSounds}
                trackColor={{ false: currentTheme.colors.surfaceSecondary, true: currentTheme.colors.secondary }}
                thumbColor={settings.timerSoundsEnabled ? currentTheme.colors.white : currentTheme.colors.text.tertiary}
              />
            </View>

            {/* Volume Control */}
            {settings.timerSoundsEnabled && (
              <View style={styles.settingRow}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{t('settings.soundVolume')}</Text>
                  <Text style={styles.settingDescription}>
                    {t('settings.soundVolumeDesc')}
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
                trackColor={{ false: currentTheme.colors.surfaceSecondary, true: currentTheme.colors.secondary }}
                thumbColor={settings.focusRemindersEnabled ? currentTheme.colors.white : currentTheme.colors.text.tertiary}
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
                trackColor={{ false: currentTheme.colors.surfaceSecondary, true: currentTheme.colors.secondary }}
                thumbColor={settings.digitalWellbeingAlertsEnabled ? currentTheme.colors.white : currentTheme.colors.text.tertiary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FOCUS PREFERENCES</Text>
            
            {/* Default Session Duration */}
            <TouchableOpacity style={styles.settingRow} onPress={handleFocusDurationPress}>
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
                trackColor={{ false: currentTheme.colors.surfaceSecondary, true: currentTheme.colors.secondary }}
                thumbColor={settings.keepScreenOnEnabled ? currentTheme.colors.white : currentTheme.colors.text.tertiary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PRIVACY & DATA</Text>
            
            {/* Reset Data */}
            <TouchableOpacity style={styles.settingRow} onPress={handleResetDataPress}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Reset All Data</Text>
                <Text style={styles.settingDescription}>
                  Clear all focus sessions, goals, and preferences
                </Text>
              </View>
              <Text style={[styles.chevron, { color: currentTheme.colors.danger }]}>›</Text>
            </TouchableOpacity>

            {/* Privacy Policy */}
            <TouchableOpacity style={styles.settingRow} onPress={handlePrivacyPolicyPress}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
                <Text style={styles.settingDescription}>
                  Learn how we protect your data and privacy
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
            
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ABOUT</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>inzone Focus App</Text>
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

  {/* Duration Picker Modal */}
  <Modal
    visible={showDurationPicker}
    transparent={true}
    animationType="fade"
    onRequestClose={() => setShowDurationPicker(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.durationModal}>
        <View style={styles.durationModalHeader}>
          <Text style={styles.durationModalTitle}>Select Focus Duration</Text>
          <TouchableOpacity 
            onPress={() => setShowDurationPicker(false)}
            style={styles.modalCloseButton}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.durationOptions}>
          {[15, 25, 30, 45, 60, 90, 120].map((duration) => (
            <TouchableOpacity
              key={duration}
              style={[
                styles.durationOption,
                settings.defaultFocusDuration === duration && styles.durationOptionSelected
              ]}
              onPress={() => {
                updateDefaultFocusDuration(duration);
                setShowDurationPicker(false);
              }}
            >
              <Text style={[
                styles.durationOptionText,
                settings.defaultFocusDuration === duration && styles.durationOptionTextSelected
              ]}>
                {duration} minutes
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  </Modal>

  {/* Color Presets Modal */}
  <Modal
    visible={showColorPicker}
    animationType="slide"
    onRequestClose={() => setShowColorPicker(false)}
    presentationStyle="pageSheet"
  >
    <SafeAreaView style={[styles.container, { padding: 20 }]}> 
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => setShowColorPicker(false)} style={[styles.closeButton, styles.colorModalCloseButtonInline]}>
          <Text style={styles.closeButtonText}>{t('common.close')}</Text>
        </TouchableOpacity>
        <View style={styles.modalHeaderCenteredTitle} pointerEvents="none">
          <Text style={styles.title}>Color Options</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Choose a color preset</Text>
        {colorPresets.map((preset) => {
          const active = currentPresetId === preset.id;
          return (
            <TouchableOpacity
              key={preset.id}
              style={[styles.presetRow, active ? styles.presetRowActive : {}, { marginBottom: 6 }]}
              onPress={() => applyPreset(preset.id)}
              activeOpacity={0.85}
            >
              <View style={styles.presetPreview}>
                <View style={[styles.swatch, { backgroundColor: preset.colors.primary || currentTheme.colors.primary }]} />
                <View style={[styles.swatch, { backgroundColor: preset.colors.secondary || currentTheme.colors.secondary, marginLeft: 6 }]} />
                <View style={[styles.swatch, { backgroundColor: preset.colors.accent || currentTheme.colors.accent, marginLeft: 6 }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>{preset.title}</Text>
                {preset.description && <Text style={styles.settingDescription}>{preset.description}</Text>}
              </View>
              <Text style={styles.chevron}>{'›'}</Text>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 24 }} />
        <TouchableOpacity
          style={[styles.signInButton, { alignSelf: 'stretch' }]}
          onPress={() => setShowColorPicker(false)}
        >
          <Text style={styles.signInText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  </Modal>

  {/* Language Picker Modal - Commented out for now
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
  */}

  </>
);
};

export default SettingsScreen;
