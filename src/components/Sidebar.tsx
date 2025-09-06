import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { theme } from '../config/theme';
import { KigenLogo } from './KigenLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  currentScreen?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, currentScreen }) => {
  const slideAnim = React.useRef(new Animated.Value(-300)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: '' },
    { id: 'journals', title: 'Past Journals', icon: '' },
    { id: 'goals', title: 'Past Goals', icon: '' },
    { id: 'progress', title: 'Progress', icon: '' },
    { id: 'profile', title: 'Profile', icon: '' },
    { id: 'settings', title: 'Settings', icon: '' },
  ];

  const handleItemPress = (screenId: string) => {
    onNavigate(screenId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      
      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <KigenLogo size="medium" />
            <Text style={styles.subtitle}>Discipline & Focus</Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleItemPress(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Version 1.0.0</Text>
            <Text style={styles.footerText}>Build discipline daily</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: theme.colors.surface,
    zIndex: 1001,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
    paddingTop: theme.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
    width: 24,
    textAlign: 'center',
  },
  menuTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    flex: 1,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  footerText: {
    ...theme.typography.small,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
