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
  withSequence,
  runOnJS,
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
  const spinAnimation = useSharedValue(0);
  const itemPulse = useSharedValue(1);

  // Enhanced opening animation with spin effect
  React.useEffect(() => {
    if (isOpen) {
      // Entrance animation with spin
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
        mass: 0.8,
      });
      opacity.value = withTiming(1, { duration: 300 });
      spinAnimation.value = withSequence(
        withTiming(360, { duration: 600 }),
        withTiming(0, { duration: 0 })
      );
      // Pulse effect for items
      itemPulse.value = withSequence(
        withTiming(1.1, { duration: 150 }),
        withSpring(1, { damping: 10 })
      );
    } else {
      // Exit animation
      scale.value = withSpring(0, {
        damping: 20,
        stiffness: 300
      });
      opacity.value = withTiming(0, { duration: 200 });
      spinAnimation.value = withTiming(0, { duration: 200 });
      itemPulse.value = withTiming(1, { duration: 200 });
    }
  }, [isOpen]);

  // Enhanced gesture handling with better rotation feedback
  const panGesture = Gesture.Pan()
    .minDistance(3)
    .onStart(() => {
      'worklet';
      // Add subtle haptic feedback would go here
    })
    .onUpdate((event) => {
      'worklet';
      const deltaX = event.translationX;
      const deltaY = event.translationY;

      // Calculate rotation based on both X and Y movement for more natural feel
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const rotationFactor = Math.min(distance / 100, Math.PI / 2);
      const direction = deltaX > 0 ? 1 : -1;

      rotation.value = rotationFactor * direction;
    })
    .onEnd((event) => {
      'worklet';
      const velocity = Math.sqrt(
        event.velocityX * event.velocityX + event.velocityY * event.velocityY
      );

      // Smooth spring back with velocity consideration
      const springConfig = {
        damping: 15 + Math.min(velocity / 1000, 5),
        stiffness: 200,
      };

      rotation.value = withSpring(0, springConfig);
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${spinAnimation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  // Create enhanced animated styles for each menu item with staggered entrance
  const itemStyles = menuItems.map((_, index) => {
    return useAnimatedStyle(() => {
      // Arrange items in a circle around the center (streak button)
      const radius = 100; // Distance from center to each item
      const angleStep = (Math.PI * 2) / menuItems.length; // Evenly distribute around circle
      const baseAngle = index * angleStep - Math.PI / 2; // Start from top (-90 degrees)

      // Add rotation effect from gestures and spin animation
      const totalAngle = baseAngle + (rotation.value * 0.5) + (spinAnimation.value * Math.PI / 180);

      // Calculate position based on angle and radius
      const x = centerX + Math.cos(totalAngle) * radius - ITEM_SIZE / 2;
      const y = centerY + Math.sin(totalAngle) * radius - ITEM_SIZE / 2;

      // Staggered entrance animation
      const staggerDelay = index * 50;
      const itemScale = interpolate(
        scale.value,
        [0, 1],
        [0, 1],
        Extrapolate.CLAMP
      );

      // Enhanced scaling with pulse effect
      const finalScale = itemScale * itemPulse.value;

      return {
        transform: [
          { translateX: x },
          { translateY: y },
          { scale: finalScale },
          { rotate: `${rotation.value * 10}deg` }, // Slight rotation on items
        ],
        opacity: opacity.value,
      };
    });
  });

  // Enhanced item selection with visual feedback
  const handleItemSelect = (itemId: string, index: number) => {
    // Trigger selection animation
    itemPulse.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    // Slight rotation on selection
    rotation.value = withSequence(
      withTiming(0.2, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    // Delayed callback to allow animation
    setTimeout(() => {
      onSelect(itemId);
    }, 150);
  };

  // Handle backdrop press - only close if tap is outside menu orbit
  const handleBackdropPress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;

    // Calculate distance from tap to menu center
    const distance = Math.sqrt(
      Math.pow(pageX - centerX, 2) + Math.pow(pageY - centerY, 2)
    );

    // Close menu only if tap is outside the menu orbit (radius of 120px to include item positions)
    if (distance > 120) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      <GestureDetector gesture={panGesture}>
        <View style={styles.menuContainer}>
          <Animated.View style={containerStyle}>
            {/* Enhanced menu items with individual animations */}
            {menuItems.map((item, index) => (
              <Animated.View
                key={item.id}
                style={[styles.menuItem, itemStyles[index]]}
              >
                <TouchableOpacity
                  style={[styles.itemButton, { backgroundColor: item.color }]}
                  onPress={() => handleItemSelect(item.id, index)}
                  activeOpacity={0.7}
                >
                  <Icon name={item.icon} size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={[styles.itemLabel, { color: theme.colors.text.primary }]}>
                  {item.title}
                </Text>
              </Animated.View>
            ))}
          </Animated.View>
        </View>
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