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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { 
  DashboardCustomizationService, 
  DashboardSection, 
  DashboardSectionType, 
  DashboardLayout 
} from '../services/DashboardCustomizationService';
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
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [usageStats, setUsageStats] = useState<any>(null);

  const categories = [
    { id: 'all', label: 'All Sections', icon: 'widgets' },
    { id: 'core', label: 'Core', icon: 'star' },
    { id: 'productivity', label: 'Productivity', icon: 'work' },
    { id: 'wellness', label: 'Wellness', icon: 'favorite' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  ];

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
      
      Alert.alert('Success', 'Dashboard layout saved successfully!');
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
            } catch (error) {
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

  const filteredSections = selectedCategory === 'all' 
    ? sections 
    : sections.filter(section => section.category === selectedCategory);

  const enabledSections = filteredSections.filter(s => s.enabled).sort((a, b) => a.order - b.order);
  const disabledSections = filteredSections.filter(s => !s.enabled);

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

  const renderCategoryTabs = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
      {categories.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryTab,
            selectedCategory === category.id && styles.categoryTabActive
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <MaterialIcons 
            name={category.icon as any} 
            size={20} 
            color={selectedCategory === category.id ? '#FFFFFF' : theme.colors.text.secondary} 
          />
          <Text style={[
            styles.categoryTabText,
            selectedCategory === category.id && styles.categoryTabTextActive
          ]}>
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

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
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
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
          {renderCategoryTabs()}

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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  resetButton: {
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  categoryTabs: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryTabText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginLeft: 6,
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  sectionsContainer: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 20,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  helpText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionItemActive: {
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledSection: {
    opacity: 0.6,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reorderButtons: {
    flexDirection: 'column',
    marginRight: 8,
  },
  reorderButton: {
    padding: 2,
    alignItems: 'center',
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionDetails: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  sectionMeta: {
    flexDirection: 'row',
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  orderTag: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  disabledText: {
    color: theme.colors.text.disabled,
  },
  saveBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});