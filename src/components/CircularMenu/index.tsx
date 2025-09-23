import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../config/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CircularMenuItem {
  id: string;
  title: string;
  icon: string;
  color: string;
}

interface CircularMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (itemId: string) => void;
  centerX: number;
  centerY: number;
}

const menuItems: CircularMenuItem[] = [
  { id: 'goals', title: 'Goals', icon: 'flag', color: '#FF6B6B' },
  { id: 'journaling', title: 'Journals', icon: 'book', color: '#4ECDC4' },
  { id: 'focus', title: 'Focus', icon: 'psychology', color: '#45B7D1' },
  { id: 'reminders', title: 'Reminders', icon: 'notifications', color: '#F6C85F' },
  { id: 'social', title: 'Social', icon: 'people', color: '#96CEB4' },
  { id: 'todo', title: 'To-Do', icon: 'check-circle', color: '#FFEAA7' },
  { id: 'habit', title: 'Habit', icon: 'repeat', color: '#DDA0DD' },
];

const MENU_RADIUS = 120;
const ITEM_SIZE = 64;

export const CircularMenu: React.FC<CircularMenuProps> = ({
  isOpen,
  onClose,
  onSelect,
  centerX,
  centerY,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Quick opening animation
  React.useEffect(() => {
    if (isOpen) {
      // Fast entrance animation
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
      opacity.value = withTiming(1, { duration: 150 });
    } else {
      // Fast exit animation
      scale.value = withSpring(0, {
        damping: 25,
        stiffness: 400
      });
      opacity.value = withTiming(0, { duration: 100 });
    }
  }, [isOpen]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!isOpen) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      <View style={styles.menuContainer}>
        <Animated.View style={containerStyle}>
          {menuItems.map((item, index) => {
            // Arrange items in a circle around the center
            const angleStep = (Math.PI * 2) / menuItems.length;
            const angle = index * angleStep - Math.PI / 2; // Start from top

            const x = centerX + Math.cos(angle) * MENU_RADIUS - ITEM_SIZE / 2;
            const y = centerY + Math.sin(angle) * MENU_RADIUS - ITEM_SIZE / 2;

            return (
              <View
                key={item.id}
                style={[
                  styles.menuItem,
                  {
                    left: x,
                    top: y,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.itemButton, { backgroundColor: item.color }]}
                  onPress={() => onSelect(item.id)}
                  activeOpacity={0.8}
                >
                  <Icon name={item.icon} size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={[styles.itemLabel, { color: theme.colors.text.primary }]}>
                  {item.title}
                </Text>
              </View>
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
};const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: -1, // Behind menu items but still clickable
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemButton: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  itemLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});