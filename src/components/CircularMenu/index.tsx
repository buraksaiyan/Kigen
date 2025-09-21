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
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
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
  { id: 'goal', title: 'Goal', icon: 'flag', color: '#FF6B6B' },
  { id: 'journal', title: 'Journal', icon: 'book', color: '#4ECDC4' },
  { id: 'focus', title: 'Focus', icon: 'psychology', color: '#45B7D1' },
  { id: 'social', title: 'Social', icon: 'people', color: '#96CEB4' },
  { id: 'todo', title: 'To-Do', icon: 'check-circle', color: '#FFEAA7' },
  { id: 'habit', title: 'Habit', icon: 'repeat', color: '#DDA0DD' },
];

const MENU_RADIUS = 120;
const ITEM_SIZE = 64;
const VISIBLE_ANGLE = Math.PI / 2; // 90 degrees - only right side

export const CircularMenu: React.FC<CircularMenuProps> = ({
  isOpen,
  onClose,
  onSelect,
  centerX,
  centerY,
}) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (isOpen) {
      scale.value = withTiming(1, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isOpen]);

  const panGesture = Gesture.Pan()
    .minDistance(5) // Require minimum movement to activate
    .onStart(() => {
      'worklet';
      // Store initial rotation
    })
    .onUpdate((event) => {
      'worklet';
      const deltaX = event.translationX;
      // Make rotation more sensitive and smooth
      const rotationDelta = (deltaX / (screenWidth * 0.5)) * Math.PI; // More sensitive
      rotation.value = rotationDelta;
    })
    .onEnd((event) => {
      'worklet';
      // Smooth snap back with velocity consideration
      const velocity = Math.abs(event.velocityX);
      const duration = Math.max(200, Math.min(500, 1000 / (velocity + 1))); // Faster with more velocity
      rotation.value = withTiming(0, { duration });
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // Create animated styles for each menu item
  const itemStyles = menuItems.map((_, index) => {
    const baseAngle = 0; // Start from right
    const angleStep = VISIBLE_ANGLE / (menuItems.length - 1); // Distribute across visible angle
    const angle = baseAngle - (index * angleStep); // Go counterclockwise from right
    
    return useAnimatedStyle(() => {
      const currentAngle = angle + rotation.value;
      const x = centerX + MENU_RADIUS * Math.cos(currentAngle) - ITEM_SIZE / 2;
      const y = centerY - MENU_RADIUS * Math.sin(currentAngle) - ITEM_SIZE / 2;
      
      // Calculate visibility based on angle
      const normalizedAngle = ((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const isVisible = normalizedAngle >= (3 * Math.PI) / 2 || normalizedAngle <= Math.PI / 2; // Right side only
      
      const itemOpacity = interpolate(
        normalizedAngle,
        [0, Math.PI / 4, Math.PI / 2],
        [1, 1, 0.3],
        Extrapolate.CLAMP
      );

      const itemScale = interpolate(
        normalizedAngle,
        [0, Math.PI / 4, Math.PI / 2],
        [1, 1, 0.7],
        Extrapolate.CLAMP
      );

      return {
        transform: [
          { translateX: x },
          { translateY: y },
          { scale: itemScale },
        ],
        opacity: isVisible ? itemOpacity : 0,
      };
    });
  });

  if (!isOpen) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        onPress={onClose}
        activeOpacity={1}
      />
      
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.menuContainer, containerStyle]}>
          {menuItems.map((item, index) => (
            <Animated.View
              key={item.id}
              style={[styles.menuItem, itemStyles[index]]}
            >
              <TouchableOpacity
                style={[styles.itemButton, { backgroundColor: item.color }]}
                onPress={() => onSelect(item.id)}
                activeOpacity={0.8}
              >
                <Icon name={item.icon} size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={[styles.itemLabel, { color: theme.colors.text.primary }]}>{item.title}</Text>
            </Animated.View>
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  itemLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});