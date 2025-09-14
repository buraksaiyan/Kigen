import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Share,
  RefreshControl
} from 'react-native';
import { userManagementService, User, UserStats } from '../services/userManagementService';
import { KigenKanjiBackground } from './KigenKanjiBackground';

interface AdminPanelProps {
  theme: {
    colors: {
      primary: string;
      secondary: string;
      success: string;
      danger: string;
      warning: string;
      background: string;
      surface: string;
      surfaceSecondary: string;
      border: string;
      text: {
        primary: string;
        secondary: string;
        tertiary: string;
        disabled: string;
      };
    };
  };
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ theme, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [usersData, statsData] = await Promise.all([
        userManagementService.getAllUsers(),
        userManagementService.getUserStats()
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      await loadData();
    } else {
      try {
        const searchResults = await userManagementService.searchUsers(query);
        setUsers(searchResults);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    }
  };

  const handleExportUsers = async () => {
    try {
      const csvData = await userManagementService.exportUsersCSV();
      
      await Share.share({
        message: csvData,
        title: 'Kigen Users Export',
      });
    } catch (error) {
      console.error('Error exporting users:', error);
      Alert.alert('Error', 'Failed to export users');
    }
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.email}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await userManagementService.deleteUser(user.id);
              if (success) {
                Alert.alert('Success', 'User deleted successfully');
                await loadData();
              } else {
                Alert.alert('Error', 'Failed to delete user');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const handleSendPromoEmail = () => {
    Alert.prompt(
      'Send Promotional Email',
      'Enter email subject:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next',
          onPress: (subject?: string) => {
            if (subject) {
              Alert.prompt(
                'Email Message',
                'Enter email message:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Send',
                    onPress: async (message?: string) => {
                      if (message) {
                        try {
                          const result = await userManagementService.sendPromotionalEmail(subject, message);
                          Alert.alert(
                            'Email Sent', 
                            `Promotional email sent to ${result.sent} users`
                          );
                        } catch (error) {
                          Alert.alert('Error', 'Failed to send promotional email');
                        }
                      }
                    }
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>
          Loading user data...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KigenKanjiBackground />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Admin Panel
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeText, { color: theme.colors.primary }]}>
            Close
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Overview */}
        {stats && (
          <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              User Statistics
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                  {stats.totalUsers}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  Total Users
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.success }]}>
                  {stats.newUsersToday}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  New Today
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
                  {stats.activeUsersToday}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  Active Today
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
                  {stats.emailConfirmedCount}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  Confirmed
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleExportUsers}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.background }]}>
              Export Users
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
            onPress={handleSendPromoEmail}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.background }]}>
              Send Promo Email
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text.primary,
            },
          ]}
          placeholder="Search users by email or name..."
          placeholderTextColor={theme.colors.text.tertiary}
          value={searchQuery}
          onChangeText={handleSearch}
        />

        {/* Users List */}
        <View style={styles.usersContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Users ({users.length})
          </Text>
          
          {users.map((user) => (
            <View 
              key={user.id} 
              style={[styles.userCard, { backgroundColor: theme.colors.surface }]}
            >
              <View style={styles.userInfo}>
                <Text style={[styles.userEmail, { color: theme.colors.text.primary }]}>
                  {user.email}
                </Text>
                {user.name && (
                  <Text style={[styles.userName, { color: theme.colors.text.secondary }]}>
                    {user.name}
                  </Text>
                )}
                <Text style={[styles.userDate, { color: theme.colors.text.tertiary }]}>
                  Joined: {new Date(user.created_at).toLocaleDateString()}
                </Text>
                {user.last_sign_in_at && (
                  <Text style={[styles.userDate, { color: theme.colors.text.tertiary }]}>
                    Last active: {new Date(user.last_sign_in_at).toLocaleDateString()}
                  </Text>
                )}
                <View style={styles.userBadges}>
                  {user.email_confirmed_at && (
                    <View style={[styles.badge, { backgroundColor: theme.colors.success }]}>
                      <Text style={[styles.badgeText, { color: theme.colors.background }]}>
                        Verified
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: theme.colors.danger }]}
                onPress={() => handleDeleteUser(user)}
              >
                <Text style={[styles.deleteButtonText, { color: theme.colors.background }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    padding: 12,
  },
  actionButtonText: {
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  badge: {
    borderRadius: 4,
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  deleteButton: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 50,
    textAlign: 'center',
  },
  searchInput: {
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsContainer: {
    borderRadius: 12,
    marginBottom: 20,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userBadges: {
    flexDirection: 'row',
    marginTop: 8,
  },
  userCard: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 16,
  },
  userDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    marginBottom: 4,
  },
  usersContainer: {
    marginBottom: 20,
  },
});
