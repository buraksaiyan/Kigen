import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { 
  DashboardCustomizationService, 
  DashboardSection, 
  DashboardSectionType, 
  DashboardLayout 
} from '../services/DashboardCustomizationService';
import themeService, { ColorPreset } from '../services/themeService';
import { theme } from '../config/theme';

interface DashboardCustomizationScreenProps {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function DashboardCustomizationScreen({ 
  visible, 
  onClose, 
  onSave 
}: DashboardCustomizationScreenProps) {
  const [sections, setSections] = useState<DashboardSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [presets, setPresets] = useState<ColorPreset[]>([]);
  const [currentPreset, setCurrentPreset] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<any>(null);



  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const layout = await DashboardCustomizationService.getDashboardLayout();
      setSections([...layout.sections]);
      
      const stats = await DashboardCustomizationService.getUsageStats();
      setUsageStats(stats);
      
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading dashboard layout:', error);
      Alert.alert('Error', 'Failed to load dashboard settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, loadData]);

  const handleToggleSection = async (sectionId: DashboardSectionType) => {
    try {
      const updatedSections = sections.map(section => {
        if (section.id === sectionId) {
          return { ...section, enabled: !section.enabled };
        }
        return section;
      });
      
      setSections(updatedSections);
      setHasChanges(true);
    } catch (error) {
      console.error('Error toggling section:', error);
      Alert.alert('Error', 'Failed to update section');
    }
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const enabledSections = sections.filter(s => s.enabled);
    const reorderedSections = [...enabledSections];
    const [movedSection] = reorderedSections.splice(fromIndex, 1);
    
    if (movedSection) {
      reorderedSections.splice(toIndex, 0, movedSection);
      
      // Update order values
      reorderedSections.forEach((section, index) => {
        section.order = index;
      });
      
      // Merge back with disabled sections
      const disabledSections = sections.filter(s => !s.enabled);
      const updatedSections = [...reorderedSections, ...disabledSections];
      
      setSections(updatedSections);
      setHasChanges(true);
    }
  };

  const handleMoveUp = (sectionId: DashboardSectionType) => {
    const enabledSections = sections.filter(s => s.enabled).sort((a, b) => a.order - b.order);
    const currentIndex = enabledSections.findIndex(s => s.id === sectionId);
    
    if (currentIndex > 0) {
      handleReorder(currentIndex, currentIndex - 1);
    }
  };

  const handleMoveDown = (sectionId: DashboardSectionType) => {
    const enabledSections = sections.filter(s => s.enabled).sort((a, b) => a.order - b.order);
    const currentIndex = enabledSections.findIndex(s => s.id === sectionId);
    
    if (currentIndex < enabledSections.length - 1) {
      handleReorder(currentIndex, currentIndex + 1);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const layout: DashboardLayout = {
        sections,
        version: 1,
        lastUpdated: new Date().toISOString(),
      };
      
      await DashboardCustomizationService.saveDashboardLayout(layout);
      setHasChanges(false);
      
      if (onSave) {
        onSave();
      }
      
      // Alert.alert('Success', 'Dashboard layout saved successfully!'); // Removed annoying success dialog
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      Alert.alert('Error', 'Failed to save dashboard layout');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Dashboard',
      'This will restore the default dashboard layout. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await DashboardCustomizationService.resetToDefault();
              await loadData();
              Alert.alert('Success', 'Dashboard reset to default layout');
            } catch {
              Alert.alert('Error', 'Failed to reset dashboard');
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before closing?',
        [
          { text: 'Discard', style: 'destructive', onPress: onClose },
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: handleSave },
        ]
      );
    } else {
      onClose();
    }
  };

  // Keep only All Sections view
  const enabledSections = sections.filter(s => s.enabled).sort((a, b) => a.order - b.order);
  const disabledSections = sections.filter(s => !s.enabled);

  const renderSectionItem = (section: DashboardSection, index: number, isEnabled: boolean = true) => (
    <View key={section.id} style={[styles.sectionItem, !isEnabled && styles.disabledSection]}>
      <View style={styles.sectionLeft}>
        {isEnabled && (
          <View style={styles.reorderButtons}>
            <TouchableOpacity 
              style={styles.reorderButton}
              onPress={() => handleMoveUp(section.id)}
              disabled={index === 0}
            >
              <MaterialIcons 
                name="keyboard-arrow-up" 
                size={20} 
                color={index === 0 ? theme.colors.text.disabled : theme.colors.text.secondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.reorderButton}
              onPress={() => handleMoveDown(section.id)}
              disabled={index === enabledSections.length - 1}
            >
              <MaterialIcons 
                name="keyboard-arrow-down" 
                size={20} 
                color={index === enabledSections.length - 1 ? theme.colors.text.disabled : theme.colors.text.secondary} 
              />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.sectionIcon}>
          <MaterialIcons 
            name={section.icon as any} 
            size={24} 
            color={isEnabled ? theme.colors.primary : theme.colors.text.disabled} 
          />
        </View>
        
        <View style={styles.sectionDetails}>
          <Text style={[styles.sectionTitle, !isEnabled && styles.disabledText]}>{section.title}</Text>
          <Text style={[styles.sectionDescription, !isEnabled && styles.disabledText]}>{section.description}</Text>
          <View style={styles.sectionMeta}>
            <Text style={styles.categoryTag}>{section.category.toUpperCase()}</Text>
            {isEnabled && <Text style={styles.orderTag}>Position {index + 1}</Text>}
          </View>
        </View>
      </View>
      
      <Switch
        value={section.enabled}
        onValueChange={() => handleToggleSection(section.id)}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
        thumbColor={section.enabled ? theme.colors.primary : theme.colors.text.disabled}
      />
    </View>
  );

  // category tabs removed - only All Sections are shown in this customization UI

  const renderUsageStats = () => {
    if (!usageStats) return null;
    
    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Dashboard Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{usageStats.enabledSections}</Text>
            <Text style={styles.statLabel}>Active Sections</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{usageStats.disabledSections}</Text>
            <Text style={styles.statLabel}>Hidden Sections</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Object.keys(usageStats.categories).length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Dashboard Settings</Text>
            <View style={styles.backButton} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading dashboard settings...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard Settings</Text>
          <TouchableOpacity 
            onPress={handleReset}
            style={styles.resetButton}
          >
            <MaterialIcons name="restore" size={22} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {renderUsageStats()}

          {/* Color options were moved to Settings. */}

          <View style={styles.sectionsContainer}>
            {enabledSections.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="visibility" size={20} color={theme.colors.primary} />
                  <Text style={styles.sectionHeaderText}>Active Sections</Text>
                  <Text style={styles.sectionCount}>({enabledSections.length})</Text>
                </View>
                
                <Text style={styles.helpText}>
                  Use up/down arrows to reorder sections on your dashboard
                </Text>

                {enabledSections.map((section, index) => renderSectionItem(section, index, true))}
              </>
            )}

            {disabledSections.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="visibility-off" size={20} color={theme.colors.text.secondary} />
                  <Text style={styles.sectionHeaderText}>Hidden Sections</Text>
                  <Text style={styles.sectionCount}>({disabledSections.length})</Text>
                </View>
                
                <Text style={styles.helpText}>
                  Toggle switches to show/hide sections
                </Text>

                {disabledSections.map((section, index) => renderSectionItem(section, index, false))}
              </>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {hasChanges && (
          <View style={styles.saveBar}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    width: 40,
  },
  bottomSpacer: {
    height: 40,
  },
  categoryTab: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryTabText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  categoryTabs: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  categoryTag: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 4,
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '600',
    marginRight: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  disabledSection: {
    opacity: 0.6,
  },
  disabledText: {
    color: theme.colors.text.disabled,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  helpText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    marginTop: 16,
  },
  orderTag: {
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    color: theme.colors.text.secondary,
    fontSize: 10,
    fontWeight: '500',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reorderButton: {
    alignItems: 'center',
    padding: 2,
  },
  reorderButtons: {
    flexDirection: 'column',
    marginRight: 8,
  },
  resetButton: {
    alignItems: 'center',
    width: 40,
  },
  saveBar: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    padding: 20,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  sectionCount: {
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  sectionDescription: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  sectionDetails: {
    flex: 1,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
    marginTop: 20,
  },
  sectionHeaderText: {
    color: theme.colors.text.primary,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  sectionItem: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionItemActive: {
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sectionLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  sectionMeta: {
    flexDirection: 'row',
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  sectionsContainer: {
    paddingHorizontal: 20,
  },
  statCard: {
    alignItems: 'center',
  },
  statLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    margin: 20,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
});