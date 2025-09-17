import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { KigenLogo } from './KigenLogo';
import { useAuth } from '../modules/auth/AuthProvider';
import { useTranslation } from '../i18n/I18nProvider';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  currentScreen?: string;
  onShowAdmin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, currentScreen, onShowAdmin }) => {
  const { session, signOut, showLoginScreen } = useAuth();
  const { t } = useTranslation();
  const slideAnim = React.useRef(new Animated.Value(-300)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  // Pan responder for swipe gesture
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dx < 0) {
        slideAnim.setValue(Math.max(-300, gestureState.dx));
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx < -100 || gestureState.vx < -0.5) {
        onClose();
      } else {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const menuItems = [
    { id: 'dashboard', title: t('sidebar.dashboard'), icon: require('../../assets/images/home-icon.png') },
    { id: 'journals', title: t('sidebar.pastJournals'), icon: require('../../assets/images/pastjournals-icon.png') },
    { id: 'goalsHistory', title: t('sidebar.pastGoals'), icon: require('../../assets/images/pastgoals-icon.png') },
    { id: 'progress', title: t('sidebar.progress'), icon: require('../../assets/images/progress-icon.png') },
    { id: 'achievements', title: t('sidebar.achievements'), icon: require('../../assets/images/achievements-icon.png') },
    { id: 'profile', title: t('sidebar.profile'), icon: require('../../assets/images/profile-icon.png') },
    { id: 'settings', title: t('sidebar.settings'), icon: require('../../assets/images/settings-icon.png') },
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
        {...panResponder.panHandlers}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <KigenLogo size="medium" variant="text" showJapanese={true} showText={false} />
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
                <Image source={item.icon} style={styles.menuIcon} />
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
  adminButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
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
  authButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  authButtonText: {
    ...theme.typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  authSection: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    width: '100%',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  footer: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    padding: theme.spacing.md,
  },
  footerText: {
    ...theme.typography.small,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    paddingTop: theme.spacing.lg,
  },
  menuContainer: {
    flex: 1,
    paddingTop: theme.spacing.sm,
  },
  menuIcon: {
    width: 40,
    height: 40,
    marginRight: theme.spacing.md,
    tintColor: '#888691',
  },
  menuItem: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 0.3, // Further reduced for sleeker look
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  menuTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  sidebar: {
    backgroundColor: theme.colors.surface,
    borderRightColor: theme.colors.border,
    borderRightWidth: 0.5, // Reduced for sleeker look
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 280,
    zIndex: 1001,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
