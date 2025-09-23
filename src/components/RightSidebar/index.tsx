import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
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
  }, [isOpen, backdropOpacity, translateX]);

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

        <Animated.View style={[styles.sidebar, sidebarStyle]}>
          <SafeAreaView style={styles.safeArea}>
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
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  backdropTouch: {
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 20,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
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
  headerLeft: {
    alignItems: 'flex-start',
    flex: 1,
    justifyContent: 'center',
  },
  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 80,
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuItem: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border + '20',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 16,
  },
  menuText: {
    color: theme.colors.text.primary,
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  sidebar: {
    backgroundColor: theme.colors.background,
    bottom: 0,
    elevation: 16,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    top: 0,
    width: SIDEBAR_WIDTH,
  },
  signInButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  signInIcon: {
    marginRight: 8,
  },
  signInText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});