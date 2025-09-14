import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

interface NotificationProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  visible,
  title,
  message,
  type = 'info',
  duration = 4000,
  onClose,
}) => {
  const [opacity] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close after duration
      if (duration > 0) {
        const timer = globalThis.setTimeout(() => {
          onClose?.();
        }, duration);

        return () => globalThis.clearTimeout(timer);
      }
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, duration, onClose, opacity, translateY]);

  if (!visible) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#DC2626';
      case 'info':
      default:
        return '#6D28D9';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onClose}
        activeOpacity={0.9}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    elevation: 8,
    left: 20,
    position: 'absolute',
    right: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    top: 60,
    zIndex: 9999,
  },
  content: {
    padding: 16,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});
