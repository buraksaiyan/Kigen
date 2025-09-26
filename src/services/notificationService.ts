// Simple notification service for non-React contexts
// This will store notification callbacks that can be set from React components

type NotificationCallback = (notification: {
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'achievement';
}) => void;

let notificationCallback: NotificationCallback | null = null;

export const setNotificationCallback = (callback: NotificationCallback) => {
  notificationCallback = callback;
};

export const showNotification = (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info' | 'achievement' = 'info') => {
  if (notificationCallback) {
    notificationCallback({ title, message, type });
  }
};

export const showAchievementNotification = (achievementTitle: string, achievementDescription: string) => {
  showNotification(
  `Achievement Unlocked!`,
    `${achievementTitle}: ${achievementDescription}`,
    'achievement'
  );
};