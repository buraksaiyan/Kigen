import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Image } from 'react-native';
import { theme } from '../../config/theme';

interface BottomBarProps {
  streakCount: number;
  onNavigate: (screen: string) => void;
  onToggleMenu: () => void;
  activeScreen?: string;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  streakCount,
  onNavigate,
  onToggleMenu,
  activeScreen,
}) => {
  const insets = useSafeAreaInsets();
  
  const bottomPadding = Platform.OS === 'android' 
    ? Math.max(insets.bottom, 12) 
    : insets.bottom + 12;

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.leftSection}>
        <TouchableOpacity
          onPress={() => onNavigate('Dashboard')}
          style={[styles.iconButton, activeScreen === 'Dashboard' && styles.activeIconButton]}
          accessibilityLabel="Dashboard"
          accessibilityRole="button"
        >
          {/** Use uploaded home icon if present, otherwise fallback to vector icon */}
          <Image
            source={require('../../../assets/images/home-icon.png')}
            style={{ width: 32, height: 32, tintColor: activeScreen === 'Dashboard' ? theme.colors.primary : theme.colors.text.secondary }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNavigate('Leaderboard')}
          style={[styles.iconButton, activeScreen === 'Leaderboard' && styles.activeIconButton]}
          accessibilityLabel="Leaderboard"
          accessibilityRole="button"
        >
          <Icon 
            name="leaderboard" 
            size={24} 
            color={activeScreen === 'Leaderboard' ? theme.colors.primary : theme.colors.text.secondary} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.centerSection}>
        <TouchableOpacity
          onPress={onToggleMenu}
          style={styles.centerButton}
          accessibilityLabel={`Daily streak: ${streakCount} days. Tap to open menu`}
          accessibilityRole="button"
        >
          <Text style={styles.streakNumber}>{streakCount}</Text>
          <Text style={styles.streakLabel}>STREAK</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity
          onPress={() => onNavigate('History')}
          style={[styles.iconButton, activeScreen === 'History' && styles.activeIconButton]}
          accessibilityLabel="History"
          accessibilityRole="button"
        >
          <Icon 
            name="history" 
            size={24} 
            color={activeScreen === 'History' ? theme.colors.primary : theme.colors.text.secondary} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNavigate('Sidebar')}
          style={styles.iconButton}
          accessibilityLabel="Menu"
          accessibilityRole="button"
        >
          <Icon name="menu" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 84,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    zIndex: 10,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  activeIconButton: {
    backgroundColor: theme.colors.primary + '20',
  },
  centerButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  streakNumber: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  streakLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});