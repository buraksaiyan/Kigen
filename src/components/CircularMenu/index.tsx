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
  // Individual animation values for each menu item
  const animations = React.useMemo(() => 
    menuItems.map(() => ({
      translateX: useSharedValue(0),
      translateY: useSharedValue(0),
      scale: useSharedValue(0),
      opacity: useSharedValue(0),
    })), []
  );

  // Quick opening animation - each item animates from streak button to its position
  React.useEffect(() => {
    if (isOpen) {
      // Stagger the animations for a nice effect
      menuItems.forEach((_, index) => {
        const delay = index * 50; // 50ms stagger between items
        
        setTimeout(() => {
          // Calculate final position
          const angleStep = (Math.PI * 2) / menuItems.length;
          const angle = index * angleStep - Math.PI / 2; // Start from top
          const finalX = Math.cos(angle) * MENU_RADIUS;
          const finalY = Math.sin(angle) * MENU_RADIUS;

          const anim = animations[index];
          if (!anim) return;

          // Animate from center (streak button) to final position
          anim.translateX.value = withSpring(finalX, {
            damping: 20,
            stiffness: 300,
          });
          anim.translateY.value = withSpring(finalY, {
            damping: 20,
            stiffness: 300,
          });
          anim.scale.value = withSpring(1, {
            damping: 20,
            stiffness: 300,
          });
          anim.opacity.value = withTiming(1, { duration: 150 });
        }, delay);
      });
    } else {
      // Animate back to center when closing
      animations.forEach((anim) => {
        anim.translateX.value = withSpring(0, {
          damping: 25,
          stiffness: 400
        });
        anim.translateY.value = withSpring(0, {
          damping: 25,
          stiffness: 400
        });
        anim.scale.value = withSpring(0, {
          damping: 25,
          stiffness: 400
        });
        anim.opacity.value = withTiming(0, { duration: 100 });
      });
    }
  }, [isOpen, animations]);

  if (!isOpen) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => {
          // Create animated style for each item
          const animatedStyle = useAnimatedStyle(() => {
            const anim = animations[index];
            if (!anim) return {};
            
            return {
              transform: [
                { translateX: anim.translateX.value },
                { translateY: anim.translateY.value },
                { scale: anim.scale.value },
              ],
              opacity: anim.opacity.value,
            };
          });

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.menuItem,
                {
                  left: centerX - ITEM_SIZE / 2,
                  top: centerY - ITEM_SIZE / 2,
                },
                animatedStyle,
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
            </Animated.View>
          );
        })}
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