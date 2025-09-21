import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SocialScreenProps {
  visible: boolean;
  onClose: () => void;
}

interface Friend {
  id: string;
  name: string;
  avatar: string;
  streak: number;
  status: 'online' | 'offline' | 'away';
  lastActive: string;
  level: number;
  totalPoints: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'group';
  participants: number;
  maxParticipants: number;
  duration: string;
  reward: string;
  difficulty: 'easy' | 'medium' | 'hard';
  deadline: string;
  isJoined: boolean;
}

export const SocialScreen: React.FC<SocialScreenProps> = ({
  visible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'challenges' | 'leaderboard'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<Friend[]>([]);

  const theme = {
    colors: {
      background: '#000000',
      surface: '#1C1C1E',
      surfaceSecondary: '#2C2C2E',
      primary: '#007AFF',
      success: '#34C759',
      warning: '#FF9500',
      danger: '#FF3B30',
      text: {
        primary: '#FFFFFF',
        secondary: '#8E8E93',
      },
      border: '#38383A',
    },
  };

  // Mock data
  useEffect(() => {
    setFriends([
      {
        id: '1',
        name: 'Alex Chen',
        avatar: '🧑‍💻',
        streak: 12,
        status: 'online',
        lastActive: new Date().toISOString(),
        level: 8,
        totalPoints: 2450,
      },
      {
        id: '2',
        name: 'Sarah Wilson',
        avatar: '👩‍🎨',
        streak: 8,
        status: 'away',
        lastActive: new Date(Date.now() - 30 * 60000).toISOString(),
        level: 6,
        totalPoints: 1890,
      },
      {
        id: '3',
        name: 'Mike Johnson',
        avatar: '👨‍🚀',
        streak: 15,
        status: 'offline',
        lastActive: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
        level: 10,
        totalPoints: 3200,
      },
    ]);

    setChallenges([
      {
        id: '1',
        title: '7-Day Focus Sprint',
        description: 'Complete at least 25 minutes of focused work for 7 consecutive days',
        type: 'group',
        participants: 12,
        maxParticipants: 20,
        duration: '7 days',
        reward: '500 points + Focus Master badge',
        difficulty: 'medium',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        isJoined: false,
      },
      {
        id: '2',
        title: 'Meditation Master',
        description: 'Complete 10 minutes of meditation daily for 30 days',
        type: 'individual',
        participants: 45,
        maxParticipants: 100,
        duration: '30 days',
        reward: '1000 points + Zen Master badge',
        difficulty: 'hard',
        deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        isJoined: true,
      },
      {
        id: '3',
        title: 'Weekend Warrior',
        description: 'Complete your daily goals both Saturday and Sunday',
        type: 'group',
        participants: 8,
        maxParticipants: 15,
        duration: '2 days',
        reward: '200 points + Weekend badge',
        difficulty: 'easy',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        isJoined: false,
      },
    ]);

    setLeaderboard([...friends].sort((a, b) => b.totalPoints - a.totalPoints));
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleJoinChallenge = (challengeId: string) => {
    setChallenges(prev => prev.map(challenge => 
      challenge.id === challengeId 
        ? { ...challenge, isJoined: true, participants: challenge.participants + 1 }
        : challenge
    ));
    Alert.alert('Success!', 'You have joined the challenge. Good luck!');
  };

  const handleLeaveChallenge = (challengeId: string) => {
    Alert.alert(
      'Leave Challenge',
      'Are you sure you want to leave this challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => {
          setChallenges(prev => prev.map(challenge => 
            challenge.id === challengeId 
              ? { ...challenge, isJoined: false, participants: Math.max(0, challenge.participants - 1) }
              : challenge
          ));
        }},
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return theme.colors.success;
      case 'away': return theme.colors.warning;
      case 'offline': return theme.colors.text.secondary;
      default: return theme.colors.text.secondary;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return theme.colors.success;
      case 'medium': return theme.colors.warning;
      case 'hard': return theme.colors.danger;
      default: return theme.colors.primary;
    }
  };

  const formatLastActive = (lastActive: string) => {
    const diff = Date.now() - new Date(lastActive).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const renderFriendsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={theme.colors.text.secondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text.primary }]}
          placeholder="Search friends..."
          placeholderTextColor={theme.colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <TouchableOpacity style={[styles.addFriendButton, { backgroundColor: theme.colors.primary }]}>
        <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
        <Text style={styles.addFriendText}>Add Friends</Text>
      </TouchableOpacity>

      {friends.map((friend) => (
        <View key={friend.id} style={[styles.friendCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.friendInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{friend.avatar}</Text>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(friend.status) }]} />
            </View>
            <View style={styles.friendDetails}>
              <Text style={[styles.friendName, { color: theme.colors.text.primary }]}>
                {friend.name}
              </Text>
              <Text style={[styles.friendStats, { color: theme.colors.text.secondary }]}>
                Level {friend.level} • {friend.totalPoints} points
              </Text>
              <Text style={[styles.lastActive, { color: theme.colors.text.secondary }]}>
                {formatLastActive(friend.lastActive)}
              </Text>
            </View>
          </View>
          <View style={styles.friendActions}>
            <View style={styles.streakContainer}>
              <MaterialIcons name="local-fire-department" size={16} color={theme.colors.warning} />
              <Text style={[styles.streakText, { color: theme.colors.text.primary }]}>
                {friend.streak}
              </Text>
            </View>
            <TouchableOpacity style={[styles.messageButton, { backgroundColor: theme.colors.primary }]}>
              <MaterialIcons name="message" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderChallengesTab = () => (
    <View style={styles.tabContent}>
      {challenges.map((challenge) => (
        <View key={challenge.id} style={[styles.challengeCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.challengeHeader}>
            <View style={styles.challengeTitleContainer}>
              <Text style={[styles.challengeTitle, { color: theme.colors.text.primary }]}>
                {challenge.title}
              </Text>
              <View style={styles.challengeMeta}>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(challenge.difficulty) }]}>
                  <Text style={styles.difficultyText}>{challenge.difficulty}</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: theme.colors.surfaceSecondary }]}>
                  <MaterialIcons 
                    name={challenge.type === 'group' ? 'group' : 'person'} 
                    size={12} 
                    color={theme.colors.text.secondary} 
                  />
                  <Text style={[styles.typeText, { color: theme.colors.text.secondary }]}>
                    {challenge.type}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={[styles.challengeDescription, { color: theme.colors.text.secondary }]}>
            {challenge.description}
          </Text>

          <View style={styles.challengeStats}>
            <View style={styles.challengeStat}>
              <MaterialIcons name="people" size={16} color={theme.colors.text.secondary} />
              <Text style={[styles.challengeStatText, { color: theme.colors.text.secondary }]}>
                {challenge.participants}/{challenge.maxParticipants}
              </Text>
            </View>
            <View style={styles.challengeStat}>
              <MaterialIcons name="schedule" size={16} color={theme.colors.text.secondary} />
              <Text style={[styles.challengeStatText, { color: theme.colors.text.secondary }]}>
                {challenge.duration}
              </Text>
            </View>
            <View style={styles.challengeStat}>
              <MaterialIcons name="emoji-events" size={16} color={theme.colors.warning} />
              <Text style={[styles.challengeStatText, { color: theme.colors.text.secondary }]}>
                {challenge.reward.split(' + ')[0]}
              </Text>
            </View>
          </View>

          <View style={styles.challengeActions}>
            <Text style={[styles.deadlineText, { color: theme.colors.text.secondary }]}>
              Ends in {Math.ceil((new Date(challenge.deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days
            </Text>
            {challenge.isJoined ? (
              <TouchableOpacity 
                style={[styles.leaveButton, { backgroundColor: theme.colors.danger }]}
                onPress={() => handleLeaveChallenge(challenge.id)}
              >
                <Text style={styles.buttonText}>Leave</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.joinButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleJoinChallenge(challenge.id)}
              >
                <Text style={styles.buttonText}>Join</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderLeaderboardTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.leaderboardHeader, { backgroundColor: theme.colors.surface }]}>
        <MaterialIcons name="emoji-events" size={24} color={theme.colors.warning} />
        <Text style={[styles.leaderboardTitle, { color: theme.colors.text.primary }]}>
          Weekly Leaderboard
        </Text>
      </View>

      {leaderboard.map((user, index) => (
        <View key={user.id} style={[styles.leaderboardCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.rankContainer}>
            <Text style={[styles.rank, { color: getRankColor(index) }]}>
              #{index + 1}
            </Text>
            {index < 3 && (
              <MaterialIcons 
                name="emoji-events" 
                size={20} 
                color={getRankColor(index)} 
              />
            )}
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.avatar}>{user.avatar}</Text>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
                {user.name}
              </Text>
              <Text style={[styles.userLevel, { color: theme.colors.text.secondary }]}>
                Level {user.level}
              </Text>
            </View>
          </View>
          
          <View style={styles.pointsContainer}>
            <Text style={[styles.points, { color: theme.colors.text.primary }]}>
              {user.totalPoints}
            </Text>
            <Text style={[styles.pointsLabel, { color: theme.colors.text.secondary }]}>
              points
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return '#FFD700'; // Gold
      case 1: return '#C0C0C0'; // Silver
      case 2: return '#CD7F32'; // Bronze
      default: return theme.colors.text.secondary;
    }
  };

  const tabs = [
    { key: 'friends', label: 'Friends', icon: 'people' },
    { key: 'challenges', label: 'Challenges', icon: 'emoji-events' },
    { key: 'leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Social
          </Text>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialIcons name="notifications" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <MaterialIcons 
                name={tab.icon as any} 
                size={20} 
                color={activeTab === tab.key ? '#FFFFFF' : theme.colors.text.secondary} 
              />
              <Text style={[
                styles.tabText,
                { color: activeTab === tab.key ? '#FFFFFF' : theme.colors.text.secondary }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {activeTab === 'friends' && renderFriendsTab()}
          {activeTab === 'challenges' && renderChallengesTab()}
          {activeTab === 'leaderboard' && renderLeaderboardTab()}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  notificationButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 4,
    margin: 16,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addFriendText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    fontSize: 32,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1C1C1E',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendStats: {
    fontSize: 14,
    marginBottom: 2,
  },
  lastActive: {
    fontSize: 12,
  },
  friendActions: {
    alignItems: 'center',
    gap: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageButton: {
    padding: 8,
    borderRadius: 8,
  },
  challengeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  challengeHeader: {
    marginBottom: 12,
  },
  challengeTitleContainer: {
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  challengeStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  challengeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  challengeStatText: {
    fontSize: 14,
    fontWeight: '500',
  },
  challengeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: '500',
  },
  joinButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  leaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    gap: 4,
  },
  rank: {
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userLevel: {
    fontSize: 14,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 18,
    fontWeight: '700',
  },
  pointsLabel: {
    fontSize: 12,
  },
});