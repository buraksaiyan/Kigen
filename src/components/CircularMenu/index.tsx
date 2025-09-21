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

  // Create animated styles for each menu item based on your drawing pattern
  const itemStyles = menuItems.map((_, index) => {
    return useAnimatedStyle(() => {
      let x, y;
      
      // Position items according to the drawing pattern
      switch (index) {
        case 0: // Top left
          x = centerX - 80 - ITEM_SIZE / 2;
          y = centerY - 80 - ITEM_SIZE / 2;
          break;
        case 1: // Top center-left
          x = centerX - 40 - ITEM_SIZE / 2;
          y = centerY - 100 - ITEM_SIZE / 2;
          break;
        case 2: // Top center-right
          x = centerX + 40 - ITEM_SIZE / 2;
          y = centerY - 100 - ITEM_SIZE / 2;
          break;
        case 3: // Top right
          x = centerX + 80 - ITEM_SIZE / 2;
          y = centerY - 80 - ITEM_SIZE / 2;
          break;
        case 4: // Left of center (on the line)
          x = centerX - 100 - ITEM_SIZE / 2;
          y = centerY - ITEM_SIZE / 2;
          break;
        case 5: // Right of center (on the line)
          x = centerX + 100 - ITEM_SIZE / 2;
          y = centerY - ITEM_SIZE / 2;
          break;
        default:
          x = centerX - ITEM_SIZE / 2;
          y = centerY - ITEM_SIZE / 2;
      }

      // Apply rotation effect from gestures
      const rotatedX = x + (rotation.value * 10); // Subtle rotation effect
      const rotatedY = y;

      return {
        transform: [
          { translateX: rotatedX },
          { translateY: rotatedY },
          { scale: scale.value },
        ],
        opacity: opacity.value,
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
          {/* Horizontal line/bar as shown in the drawing */}
          <View 
            style={[
              styles.horizontalBar, 
              {
                left: centerX - 120,
                top: centerY - 2,
                width: 240,
                height: 4,
              }
            ]} 
          />
          
          {/* Central circle on the line */}
          <View 
            style={[
              styles.centralCircle,
              {
                left: centerX - 40,
                top: centerY - 40,
                width: 80,
                height: 80,
              }
            ]}
          />
          
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
  horizontalBar: {
    position: 'absolute',
    backgroundColor: theme.colors.text.secondary,
    borderRadius: 2,
    opacity: 0.6,
  },
  centralCircle: {
    position: 'absolute',
    backgroundColor: theme.colors.primary,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});