import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../config/theme';
import { useNotifications } from '../contexts/NotificationsContext';
import { useTranslation } from '../i18n/I18nProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NotificationsDropdownProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  visible,
  onClose,
}) => {
  const { notifications, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return '🏆';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return '#FFD700'; // Gold
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.danger;
      default:
        return theme.colors.primary;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.dropdown}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <View style={styles.headerActions}>
                {notifications.length > 0 && (
                  <>
                    <TouchableOpacity
                      onPress={markAllAsRead}
                      style={styles.headerButton}
                    >
                      <Text style={styles.headerButtonText}>Mark All Read</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={clearAllNotifications}
                      style={styles.headerButton}
                    >
                      <Text style={styles.headerButtonText}>Clear All</Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notifications List */}
            <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>🔔</Text>
                  <Text style={styles.emptyStateTitle}>No Notifications</Text>
                  <Text style={styles.emptyStateMessage}>You&apos;re all caught up! Achievement notifications will appear here.</Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.read && styles.unreadNotification,
                    ]}
                    onPress={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text
                          style={[
                            styles.notificationIcon,
                            { color: getNotificationColor(notification.type) },
                          ]}
                        >
                          {getNotificationIcon(notification.type)}
                        </Text>
                        <View style={styles.notificationText}>
                          <Text style={styles.notificationTitle}>{notification.title}</Text>
                          <Text style={styles.notificationMessage}>{notification.message}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => clearNotification(notification.id)}
                          style={styles.deleteButton}
                        >
                          <Text style={styles.deleteButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.notificationTime}>
                        {formatTimestamp(notification.timestamp)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    padding: theme.spacing.sm,
  },
  closeButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  deleteButtonText: {
    color: theme.colors.text.tertiary,
    fontSize: 14,
  },
  dropdown: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
    marginTop: 60, // Account for status bar and header
    maxHeight: '80%',
    position: 'absolute',
    width: SCREEN_WIDTH,
    top: 0,
    left: 0,
    right: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
    opacity: 0.5,
  },
  emptyStateMessage: {
    ...theme.typography.body,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  emptyStateTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  headerButton: {
    padding: theme.spacing.sm,
  },
  headerButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
    marginTop: 2,
  },
  notificationItem: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    padding: theme.spacing.lg,
  },
  notificationMessage: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  notificationText: {
    flex: 1,
  },
  notificationTime: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
  },
  notificationTitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  notificationsList: {
    flex: 1,
  },
  overlay: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    bottom: 0,
    flex: 1,
    justifyContent: 'flex-start',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  safeArea: {
    flex: 1,
  },
  unreadNotification: {
    backgroundColor: theme.colors.surfaceSecondary,
  },
});