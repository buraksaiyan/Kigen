import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../config/theme';
import { useAuth } from '../../modules/auth/AuthProvider';

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = screenWidth * 0.8;

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const insets = useSafeAreaInsets();
  const { session, showLoginScreen } = useAuth();
  
  const translateX = useSharedValue(SIDEBAR_WIDTH);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (isOpen) {
      translateX.value = withTiming(0, { duration: 300 });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateX.value = withTiming(SIDEBAR_WIDTH, { duration: 300 });
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isOpen]);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const menuItems = [
    {
      id: 'achievements',
      title: 'Achievements',
      icon: 'emoji-events',
      screen: 'Achievements',
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person',
      screen: 'Profile',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      screen: 'Settings',
    },
  ];

  const handleItemPress = (screen: string) => {
    onNavigate(screen);
    onClose();
  };

  const handleSignInPress = () => {
    showLoginScreen();
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableOpacity
            style={styles.backdropTouch}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View style={[styles.sidebar, sidebarStyle, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Menu</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.menuContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleItemPress(item.screen)}
                activeOpacity={0.7}
              >
                <Icon
                  name={item.icon}
                  size={24}
                  color={theme.colors.text.secondary}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuText}>{item.title}</Text>
                <Icon
                  name="chevron-right"
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
            {!session && (
              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleSignInPress}
                activeOpacity={0.8}
              >
                <Icon name="login" size={20} color="#FFFFFF" style={styles.signInIcon} />
                <Text style={styles.signInText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouch: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 16,
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
  headerLeft: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    flex: 1,
  },
  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 80,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '20',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  bottomSection: {
    paddingHorizontal: 20,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  signInIcon: {
    marginRight: 8,
  },
  signInText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});