import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { KigenLogo } from './KigenLogo';
import { useAuth } from '../modules/auth/AuthProvider';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  currentScreen?: string;
  onShowAdmin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, currentScreen, onShowAdmin }) => {
  const { session, signOut, showLoginScreen } = useAuth();
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
    { id: 'ratings', title: 'Kigen Stats', icon: '' },
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

  return (
    <>
      {/* Backdrop - Only show when open */}
      {isOpen && (
        <TouchableOpacity 
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />
      )}
      
      {/* Sidebar - Always present for animation */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <KigenLogo size="medium" variant="image" showJapanese={false} />
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
            {/* Auth Section */}
            <View style={styles.authSection}>
              <TouchableOpacity
                style={styles.authButton}
                onPress={() => {
                  if (session) {
                    signOut();
                  } else {
                    showLoginScreen();
                  }
                  onClose();
                }}
              >
                <Text style={styles.authButtonText}>
                  {session ? 'Sign Out' : 'Sign In'}
                </Text>
              </TouchableOpacity>
              
              {/* Admin Button - Only show if signed in */}
              {session && onShowAdmin && (
                <TouchableOpacity
                  style={styles.adminButton}
                  onPress={() => {
                    onShowAdmin();
                    onClose();
                  }}
                >
                  <Text style={styles.adminButtonText}>Admin Panel</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.appInfo}>
              <Text style={styles.footerText}>Version 1.0.0</Text>
              <Text style={styles.footerText}>Build discipline daily</Text>
            </View>
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
  authSection: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  authButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  authButtonText: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  adminButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  adminButtonText: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  appInfo: {
    alignItems: 'center',
  },
  footerText: {
    ...theme.typography.small,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
