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
import { theme as defaultTheme } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface BottomBarProps {
  streakCount: number;
  onNavigate: (screen: string) => void;
  onToggleMenu: () => void;
  activeScreen?: string;
}

const createStyles = (theme: typeof defaultTheme) => StyleSheet.create({
  centerButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.background,
    borderRadius: 42,
    borderWidth: 3,
    elevation: 12,
    height: 84,
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: 84,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    zIndex: 10,
  },
  container: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    bottom: 0,
    elevation: 8,
    flexDirection: 'row',
    height: 84,
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: 16,
    position: 'absolute',
    right: 0,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginHorizontal: 8,
    width: 48,
  },
  leftSection: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-start',
  },
  rightSection: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  streakLabel: {
    color: theme.colors.text.primary,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  streakNumber: {
    color: theme.colors.text.primary,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
});

export const BottomBar: React.FC<BottomBarProps> = ({
  streakCount,
  onNavigate,
  onToggleMenu,
  activeScreen,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  
  const bottomPadding = Platform.OS === 'android' 
    ? Math.max(insets.bottom, 12) 
    : insets.bottom + 12;

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.leftSection}>
        <TouchableOpacity
          onPress={() => onNavigate('Dashboard')}
          style={styles.iconButton}
          accessibilityLabel="Dashboard"
          accessibilityRole="button"
        >
          {/** Use uploaded home icon if present, otherwise fallback to vector icon */}
          <Icon
            name="home"
            size={24}
            color={activeScreen === 'Dashboard' ? theme.colors.secondary : theme.colors.text.disabled}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNavigate('Leaderboard')}
          style={styles.iconButton}
          accessibilityLabel="Leaderboard"
          accessibilityRole="button"
        >
          <Icon 
            name="leaderboard" 
            size={24} 
            color={activeScreen === 'Leaderboard' ? theme.colors.secondary : theme.colors.text.disabled} 
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
          style={styles.iconButton}
          accessibilityLabel="History"
          accessibilityRole="button"
        >
          <Icon 
            name="history" 
            size={24} 
            color={activeScreen === 'History' ? theme.colors.secondary : theme.colors.text.disabled} 
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