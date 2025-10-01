import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Button,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useOrientation from '../hooks/useOrientation';
import { theme } from '../config/theme';

interface ScreenInfo {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
  orientation: 'portrait' | 'landscape';
}

const getScreenCategory = (width: number): string => {
  if (width < 360) return 'Small (< 360px)';
  if (width < 414) return 'Medium (360-414px)';
  if (width < 768) return 'Large (414-768px)';
  return 'Tablet (> 768px)';
};

const getPixelDensity = (scale: number): string => {
  if (scale <= 1) return 'MDPI (1x)';
  if (scale <= 1.5) return 'HDPI (1.5x)';
  if (scale <= 2) return 'XHDPI (2x)';
  if (scale <= 3) return 'XXHDPI (3x)';
  return 'XXXHDPI (3x+)';
};

export default function ResponsiveTestScreen() {
  const { orientation, screen } = useOrientation();
  const [dimensions, setDimensions] = useState<ScreenInfo>(() => {
    const { width, height, scale, fontScale } = Dimensions.get('window');
    return {
      width,
      height,
      scale,
      fontScale,
      orientation: width > height ? 'landscape' : 'portrait',
    };
  });
  
  const [testSizes, setTestSizes] = useState([
    { name: 'iPhone SE', width: 320, height: 568 },
    { name: 'iPhone 12 Mini', width: 360, height: 780 },
    { name: 'iPhone 12/13', width: 390, height: 844 },
    { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
    { name: 'Samsung Galaxy S21', width: 384, height: 854 },
    { name: 'Pixel 6', width: 412, height: 915 },
    { name: 'iPad Mini', width: 744, height: 1133 },
    { name: 'iPad Pro', width: 820, height: 1180 },
  ]);

  useEffect(() => {
    const updateDimensions = ({ window }: { window: any }) => {
      setDimensions({
        width: window.width,
        height: window.height,
        scale: window.scale || 1,
        fontScale: window.fontScale || 1,
        orientation: window.width > window.height ? 'landscape' : 'portrait',
      });
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  const testResponsiveElements = [
    {
      name: 'Timer Clock',
      component: (
        <View style={[styles.testComponent, { 
          width: Math.min(dimensions.width * 0.6, 300),
          height: Math.min(dimensions.width * 0.6, 300),
        }]}>
          <Text style={styles.componentText}>Timer Clock</Text>
          <Text style={styles.sizeText}>{Math.min(dimensions.width * 0.6, 300).toFixed(0)}px</Text>
        </View>
      )
    },
    {
      name: 'Dashboard Card',
      component: (
        <View style={[styles.testCard, { width: dimensions.width - 32 }]}>
          <Text style={styles.componentText}>Dashboard Card</Text>
          <Text style={styles.sizeText}>{dimensions.width - 32}px wide</Text>
        </View>
      )
    },
    {
      name: 'Button Row',
      component: (
        <View style={[styles.buttonRow, { width: dimensions.width - 32 }]}>
          <TouchableOpacity style={[styles.testButton, { flex: 1 }]}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.testButton, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.buttonText}>Pause</Text>
          </TouchableOpacity>
        </View>
      )
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Responsive Design Test</Text>
        
        {/* Current Screen Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Screen</Text>
          <Text style={styles.infoText}>Size: {dimensions.width}×{dimensions.height}px</Text>
          <Text style={styles.infoText}>Category: {getScreenCategory(dimensions.width)}</Text>
          <Text style={styles.infoText}>Orientation: {dimensions.orientation}</Text>
          <Text style={styles.infoText}>Scale: {getPixelDensity(dimensions.scale)}</Text>
          <Text style={styles.infoText}>Font Scale: {dimensions.fontScale.toFixed(2)}x</Text>
          
          {/* Physical size calculation */}
          <Text style={styles.infoText}>
            Physical: {(dimensions.width / dimensions.scale).toFixed(0)}×{(dimensions.height / dimensions.scale).toFixed(0)}dp
          </Text>
        </View>

        {/* Responsive Components Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Component Responsiveness</Text>
          {testResponsiveElements.map((element, index) => (
            <View key={index} style={styles.componentTest}>
              <Text style={styles.componentName}>{element.name}</Text>
              {element.component}
            </View>
          ))}
        </View>

        {/* Typography Scale Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Typography Scale</Text>
          <Text style={[styles.typeTest, { fontSize: 12 }]}>Caption (12px)</Text>
          <Text style={[styles.typeTest, { fontSize: 14 }]}>Body Small (14px)</Text>
          <Text style={[styles.typeTest, { fontSize: 16 }]}>Body (16px)</Text>
          <Text style={[styles.typeTest, { fontSize: 18 }]}>Subtitle (18px)</Text>
          <Text style={[styles.typeTest, { fontSize: 20 }]}>Title (20px)</Text>
          <Text style={[styles.typeTest, { fontSize: 24 }]}>Heading (24px)</Text>
          <Text style={[styles.typeTest, { fontSize: 32 }]}>Large Heading (32px)</Text>
        </View>

        {/* Spacing Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spacing & Layout</Text>
          <View style={styles.spacingTest}>
            <View style={[styles.spacingBlock, { margin: 4 }]}>
              <Text style={styles.spacingText}>4px</Text>
            </View>
            <View style={[styles.spacingBlock, { margin: 8 }]}>
              <Text style={styles.spacingText}>8px</Text>
            </View>
            <View style={[styles.spacingBlock, { margin: 16 }]}>
              <Text style={styles.spacingText}>16px</Text>
            </View>
            <View style={[styles.spacingBlock, { margin: 24 }]}>
              <Text style={styles.spacingText}>24px</Text>
            </View>
          </View>
        </View>

        {/* Common Screen Sizes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Device Sizes</Text>
          {testSizes.map((device, index) => {
            const isCurrent = Math.abs(device.width - dimensions.width) < 10 && 
                             Math.abs(device.height - dimensions.height) < 10;
            return (
              <View key={index} style={[styles.deviceInfo, isCurrent && styles.currentDevice]}>
                <Text style={[styles.deviceName, isCurrent && styles.currentText]}>{device.name}</Text>
                <Text style={[styles.deviceSize, isCurrent && styles.currentText]}>
                  {device.width}×{device.height}px
                </Text>
              </View>
            );
          })}
        </View>

        {/* Potential Issues */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Potential Issues</Text>
          <View style={styles.issuesList}>
            {dimensions.width < 360 && (
              <Text style={styles.warningText}>⚠️ Small screen: Content might be cramped</Text>
            )}
            {dimensions.fontScale > 1.3 && (
              <Text style={styles.warningText}>⚠️ Large font scale: Text might overflow</Text>
            )}
            {dimensions.orientation === 'landscape' && dimensions.width < 600 && (
              <Text style={styles.warningText}>⚠️ Small landscape: Vertical space limited</Text>
            )}
            {dimensions.scale > 3 && (
              <Text style={styles.infoText}>ℹ️ High DPI: Ensure assets are crisp</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  infoText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    marginBottom: 4,
  },
  componentTest: {
    marginBottom: 16,
    alignItems: 'center',
  },
  componentName: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  testComponent: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testCard: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  componentText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  sizeText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  testButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  typeTest: {
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  spacingTest: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  spacingBlock: {
    backgroundColor: theme.colors.accent,
    padding: 8,
    borderRadius: 4,
  },
  spacingText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '500',
  },
  deviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 4,
    marginBottom: 4,
  },
  currentDevice: {
    backgroundColor: theme.colors.accent,
  },
  deviceName: {
    color: theme.colors.text.primary,
    fontSize: 14,
  },
  deviceSize: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  currentText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  issuesList: {
    gap: 8,
  },
  warningText: {
    color: theme.colors.warning,
    fontSize: 14,
    fontWeight: '500',
  },
});