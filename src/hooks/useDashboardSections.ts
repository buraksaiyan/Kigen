import { useState, useEffect, useCallback } from 'react';
import { 
  DashboardCustomizationService, 
  DashboardSection, 
  DashboardSectionType 
} from '../services/DashboardCustomizationService';

export const useDashboardSections = () => {
  const [sections, setSections] = useState<DashboardSection[]>([]);
  const [enabledSections, setEnabledSections] = useState<DashboardSection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSections = useCallback(async () => {
    try {
      setLoading(true);
      const layout = await DashboardCustomizationService.getDashboardLayout();
      setSections(layout.sections);
      
      const enabled = layout.sections
        .filter(section => section.enabled)
        .sort((a, b) => a.order - b.order);
      setEnabledSections(enabled);
    } catch (error) {
      console.error('Error loading dashboard sections:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const isSectionEnabled = useCallback((sectionId: DashboardSectionType): boolean => {
    return enabledSections.some(section => section.id === sectionId);
  }, [enabledSections]);

  const getSectionOrder = useCallback((sectionId: DashboardSectionType): number => {
    const section = enabledSections.find(s => s.id === sectionId);
    return section ? section.order : -1;
  }, [enabledSections]);

  const getSortedSections = useCallback((): DashboardSection[] => {
    return enabledSections
      .filter(section => section.enabled)
      .sort((a, b) => a.order - b.order);
  }, [enabledSections]);

  const getSection = useCallback((sectionId: DashboardSectionType): DashboardSection | undefined => {
    return sections.find(section => section.id === sectionId);
  }, [sections]);

  return {
    sections,
    enabledSections,
    loading,
    isSectionEnabled,
    getSectionOrder,
    getSortedSections,
    getSection,
    refreshSections: loadSections,
  };
};