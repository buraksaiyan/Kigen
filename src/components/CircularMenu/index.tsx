import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../config/theme';

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
  // Individual animation values for each menu item - must be called at component level
  const translateX0 = useSharedValue(0);
  const translateY0 = useSharedValue(0);
  const scale0 = useSharedValue(0);
  const opacity0 = useSharedValue(0);
  
  const translateX1 = useSharedValue(0);
  const translateY1 = useSharedValue(0);
  const scale1 = useSharedValue(0);
  const opacity1 = useSharedValue(0);
  
  const translateX2 = useSharedValue(0);
  const translateY2 = useSharedValue(0);
  const scale2 = useSharedValue(0);
  const opacity2 = useSharedValue(0);
  
  const translateX3 = useSharedValue(0);
  const translateY3 = useSharedValue(0);
  const scale3 = useSharedValue(0);
  const opacity3 = useSharedValue(0);
  
  const translateX4 = useSharedValue(0);
  const translateY4 = useSharedValue(0);
  const scale4 = useSharedValue(0);
  const opacity4 = useSharedValue(0);
  
  const translateX5 = useSharedValue(0);
  const translateY5 = useSharedValue(0);
  const scale5 = useSharedValue(0);
  const opacity5 = useSharedValue(0);
  
  const translateX6 = useSharedValue(0);
  const translateY6 = useSharedValue(0);
  const scale6 = useSharedValue(0);
  const opacity6 = useSharedValue(0);

  // Group them into arrays for easier access
  const translateXValues = useMemo(() => [translateX0, translateX1, translateX2, translateX3, translateX4, translateX5, translateX6], [translateX0, translateX1, translateX2, translateX3, translateX4, translateX5, translateX6]);
  const translateYValues = useMemo(() => [translateY0, translateY1, translateY2, translateY3, translateY4, translateY5, translateY6], [translateY0, translateY1, translateY2, translateY3, translateY4, translateY5, translateY6]);
  const scaleValues = useMemo(() => [scale0, scale1, scale2, scale3, scale4, scale5, scale6], [scale0, scale1, scale2, scale3, scale4, scale5, scale6]);
  const opacityValues = useMemo(() => [opacity0, opacity1, opacity2, opacity3, opacity4, opacity5, opacity6], [opacity0, opacity1, opacity2, opacity3, opacity4, opacity5, opacity6]);

  // Create animated styles for each menu item
  const animatedStyle0 = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX0.value },
      { translateY: translateY0.value },
      { scale: scale0.value },
    ],
    opacity: opacity0.value,
  }));

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX1.value },
      { translateY: translateY1.value },
      { scale: scale1.value },
    ],
    opacity: opacity1.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX2.value },
      { translateY: translateY2.value },
      { scale: scale2.value },
    ],
    opacity: opacity2.value,
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX3.value },
      { translateY: translateY3.value },
      { scale: scale3.value },
    ],
    opacity: opacity3.value,
  }));

  const animatedStyle4 = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX4.value },
      { translateY: translateY4.value },
      { scale: scale4.value },
    ],
    opacity: opacity4.value,
  }));

  const animatedStyle5 = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX5.value },
      { translateY: translateY5.value },
      { scale: scale5.value },
    ],
    opacity: opacity5.value,
  }));

  const animatedStyle6 = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX6.value },
      { translateY: translateY6.value },
      { scale: scale6.value },
    ],
    opacity: opacity6.value,
  }));

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

          // Animate from center (streak button) to final position
          translateXValues[index]!.value = withSpring(finalX, {
            damping: 20,
            stiffness: 300,
          });
          translateYValues[index]!.value = withSpring(finalY, {
            damping: 20,
            stiffness: 300,
          });
          scaleValues[index]!.value = withSpring(1, {
            damping: 20,
            stiffness: 300,
          });
          opacityValues[index]!.value = withTiming(1, { duration: 150 });
        }, delay);
      });
    } else {
      // Animate back to center when closing
      translateXValues.forEach((translateX) => {
        translateX.value = withSpring(0, {
          damping: 25,
          stiffness: 400
        });
      });
      translateYValues.forEach((translateY) => {
        translateY.value = withSpring(0, {
          damping: 25,
          stiffness: 400
        });
      });
      scaleValues.forEach((scale) => {
        scale.value = withSpring(0, {
          damping: 25,
          stiffness: 400
        });
      });
      opacityValues.forEach((opacity) => {
        opacity.value = withTiming(0, { duration: 100 });
      });
    }
  }, [isOpen, translateXValues, translateYValues, scaleValues, opacityValues]);

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
          // Get the appropriate animated style for this index
          const getAnimatedStyle = () => {
            switch (index) {
              case 0: return animatedStyle0;
              case 1: return animatedStyle1;
              case 2: return animatedStyle2;
              case 3: return animatedStyle3;
              case 4: return animatedStyle4;
              case 5: return animatedStyle5;
              case 6: return animatedStyle6;
              default: return {};
            }
          };

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.menuItem,
                {
                  left: centerX - ITEM_SIZE / 2,
                  top: centerY - ITEM_SIZE / 2,
                },
                getAnimatedStyle(),
              ]}
            >
              <TouchableOpacity
                style={[styles.itemButton, { backgroundColor: item.color }]}
                onPress={() => onSelect(item.id)}
                activeOpacity={0.8}
              >
                <Icon name={item.icon} size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={[styles.itemLabel, { color: '#FFFFFF' }]}>
                {item.title}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};const styles = StyleSheet.create({
  // eslint-disable-next-line react-native/no-color-literals
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker overlay to indicate menu is open
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: -1, // Behind menu items but still clickable
  },
  itemButton: {
    alignItems: 'center',
    borderColor: theme.colors.surface,
    borderRadius: ITEM_SIZE / 2,
    borderWidth: 3,
    elevation: 12,
    height: ITEM_SIZE,
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    width: ITEM_SIZE,
  },
  itemLabel: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  menuContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  overlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
});