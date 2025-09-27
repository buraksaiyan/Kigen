import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme as defaultTheme } from '../config/theme';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PointRulesScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Point Rules</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.description}>
            Understanding how you earn points in Kigen and maintain streaks for maximum rewards.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Points System</Text>
            <Text style={styles.explainTitle}>How points are earned</Text>
            <Text style={styles.sectionDescription}>
              Points are earned across 8 categories that contribute to your overall rating and card tier.
            </Text>

            <View style={styles.ruleCard}>
              <Text style={styles.categoryTitle}>Categories</Text>
              <Text style={styles.ruleText}>Discipline — Points for consistent task completion and execution</Text>
              <Text style={styles.ruleText}>Focus — Points for focused work / sessions</Text>
              <Text style={styles.ruleText}>Journaling — Points for writing journal entries</Text>
              <Text style={styles.ruleText}>Determination — Aggregate long-term achievements and streak bonuses</Text>
              <Text style={styles.ruleText}>Mentality — Points for meditation and mental exercises</Text>
              <Text style={styles.ruleText}>Physical — Points for body-focused activities and exercise</Text>
              <Text style={styles.ruleText}>Social — Points for social/outdoor interactions</Text>
              <Text style={styles.ruleText}>Productivity — Points tied to goals, todos, and efficiency</Text>
            </View>

            <View style={styles.ruleCard}>
              <Text style={styles.categoryTitle}>Discipline</Text>
              <Text style={styles.subCategoryTitle}>Discipline Points:</Text>
              <Text style={styles.ruleText}>• +5 points per completed focus session</Text>
              <Text style={styles.ruleText}>• +10 points per goal completed</Text>
              <Text style={styles.ruleText}>• +5 points per journal entry (1 per day max)</Text>
              <Text style={styles.ruleText}>• +10 points per hour of execution/body focus</Text>
            </View>

            <View style={styles.ruleCard}>
              <Text style={styles.categoryTitle}>Focus</Text>
              <Text style={styles.subCategoryTitle}>Focus Points:</Text>
              <Text style={styles.ruleText}>• +10 points per hour of focused work</Text>
              <Text style={styles.ruleText}>• +10 points per hour of flow focus mode</Text>
            </View>

            <View style={styles.ruleCard}>
              <Text style={styles.categoryTitle}>Journaling</Text>
              <Text style={styles.subCategoryTitle}>Journaling Points:</Text>
              <Text style={styles.ruleText}>• +20 points per journal entry (1 per day max)</Text>
            </View>

            <View style={styles.ruleCard}>
              <Text style={styles.categoryTitle}>Determination</Text>
              <Text style={styles.subCategoryTitle}>Determination Points:</Text>
              <Text style={styles.ruleText}>• +20 points per 10 goals completed</Text>
              <Text style={styles.ruleText}>• +15 points per 10 journal entries</Text>
              <Text style={styles.ruleText}>• +50 points per 10 focus sessions</Text>
              <Text style={styles.ruleText}>• +5 points per achievement unlocked</Text>
              <Text style={styles.ruleText}>• +50 points per completed 7-day habit streak</Text>
              <Text style={styles.ruleText}>• +5 points per completed todo item</Text>
            </View>

            <View style={styles.ruleCard}>
              <Text style={styles.categoryTitle}>Mentality</Text>
              <Text style={styles.subCategoryTitle}>Mentality Points:</Text>
              <Text style={styles.ruleText}>• +2 points per minute of meditation</Text>
            </View>

            <View style={styles.ruleCard}>
              <Text style={styles.categoryTitle}>Physical</Text>
              <Text style={styles.subCategoryTitle}>Physical Points:</Text>
              <Text style={styles.ruleText}>• +20 points per 30 minutes of body focus</Text>
            </View>

            <View style={styles.ruleCard}>
              <Text style={styles.categoryTitle}>Social</Text>
              <Text style={styles.subCategoryTitle}>Social Points:</Text>
              <Text style={styles.ruleText}>• +15 points per hour spent outside</Text>
              <Text style={styles.ruleText}>• +20 points per hour spent with friends</Text>
            </View>

            <View style={styles.ruleCard}>
              <Text style={styles.categoryTitle}>Productivity</Text>
              <Text style={styles.subCategoryTitle}>Productivity Points:</Text>
              <Text style={styles.ruleText}>• +10 points per goal completed</Text>
              <Text style={styles.ruleText}>• +10 points per journal entry</Text>
              <Text style={styles.ruleText}>• +5 points per hour of focus sessions</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Streak Rules</Text>
            <Text style={styles.explainTitle}>App & habit streaks explained</Text>
            <Text style={styles.sectionDescription}>
              Streaks are consecutive days with at least one focus session. Maintain them for bonus achievements and points.
            </Text>

            <View style={styles.ruleCard}>
              <Text style={styles.categoryTitle}>Current Streak</Text>
              <Text style={styles.ruleText}>• Counts consecutive days with focus sessions</Text>
              <Text style={styles.ruleText}>• Resets to 0 if you miss a day</Text>
              <Text style={styles.ruleText}>• Displayed on your profile card</Text>
            </View>

            <View style={styles.ruleCard}>
              <Text style={styles.categoryTitle}>How a Streak Continues</Text>
              <Text style={styles.ruleText}>• App streak requires BOTH:</Text>
              <Text style={styles.ruleText}>  - At least one journal entry for the day</Text>
              <Text style={styles.ruleText}>  - At least 30 minutes of completed focus sessions that day</Text>
              <Text style={styles.ruleText}>• If both conditions are met, your app streak increments for that day.</Text>
              <Text style={styles.ruleText}>• Habit streaks are per-habit: completing the habit for 7 consecutive days grants the habit streak reward and +50 Determination points. Habit streak rules are independent of the app streak above.</Text>
            </View>

            <View style={styles.ruleCard}>
              <Text style={styles.categoryTitle}>Streak Achievements</Text>
              <Text style={styles.ruleText}>• 7 days: Week Warrior</Text>
              <Text style={styles.ruleText}>• 15 days: Fortnight Focus</Text>
              <Text style={styles.ruleText}>• 30 days: Monthly Master</Text>
              <Text style={styles.ruleText}>• 50 days: Disciplined Mind</Text>
              <Text style={styles.ruleText}>• 75 days: Iron Will</Text>
              <Text style={styles.ruleText}>• 100 days: Centurion</Text>
              <Text style={styles.ruleText}>• 250 days: Eternal Flame</Text>
              <Text style={styles.ruleText}>• 500 days: Transcendent</Text>
              <Text style={styles.ruleText}>• 750 days: Phoenix Rising</Text>
              <Text style={styles.ruleText}>• 1000 days: The Immortal</Text>
            </View>

            <View style={styles.ruleCard}>
              <Text style={styles.categoryTitle}>Habit Streaks</Text>
              <Text style={styles.ruleText}>• Complete 7 consecutive days of a habit</Text>
              <Text style={styles.ruleText}>• Earn +50 Determination points per streak</Text>
              <Text style={styles.ruleText}>• Multiple habits can run simultaneously</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Card Tiers</Text>
            <Text style={styles.explainTitle}>How tiers are assigned</Text>
            <Text style={styles.sectionDescription}>
              Your total points determine your card tier with special colors and backgrounds.
            </Text>

            <View style={styles.tierGrid}>
              <View style={styles.tierItem}>
                <Text style={styles.tierName}>Bronze</Text>
                <Text style={styles.tierRange}>0 - 1,999 pts</Text>
              </View>
              <View style={styles.tierItem}>
                <Text style={styles.tierName}>Silver</Text>
                <Text style={styles.tierRange}>2,000 - 3,999 pts</Text>
              </View>
              <View style={styles.tierItem}>
                <Text style={styles.tierName}>Gold</Text>
                <Text style={styles.tierRange}>4,000 - 5,999 pts</Text>
              </View>
              <View style={styles.tierItem}>
                <Text style={styles.tierName}>Platinum</Text>
                <Text style={styles.tierRange}>6,000 - 7,999 pts</Text>
              </View>
              <View style={styles.tierItem}>
                <Text style={styles.tierName}>Diamond</Text>
                <Text style={styles.tierRange}>8,000 - 9,999 pts</Text>
              </View>
              <View style={styles.tierItem}>
                <Text style={styles.tierName}>Carbon</Text>
                <Text style={styles.tierRange}>10,000 - 11,999 pts</Text>
              </View>
              <View style={styles.tierItem}>
                <Text style={styles.tierName}>Obsidian</Text>
                <Text style={styles.tierRange}>12,000+ pts</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: defaultTheme.colors.surface,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    padding: 0,
  },
  closeButtonText: {
    ...defaultTheme.typography.body,
    color: defaultTheme.colors.text.secondary,
    fontWeight: '600',
    fontSize: 16,
  },
  categoryTitle: {
    color: defaultTheme.colors.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  container: {
    backgroundColor: defaultTheme.colors.background,
    flex: 1,
  },
  content: {
    padding: 20,
  },
  description: {
    color: defaultTheme.colors.text.secondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: defaultTheme.colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: defaultTheme.colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  subCategoryTitle: {
    color: defaultTheme.colors.primary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  ruleCard: {
    backgroundColor: defaultTheme.colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  ruleText: {
    color: defaultTheme.colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionDescription: {
    color: defaultTheme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: defaultTheme.colors.text.primary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  explainTitle: {
    color: defaultTheme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tierItem: {
    backgroundColor: defaultTheme.colors.surface,
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
    padding: 12,
  },
  tierName: {
    color: defaultTheme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tierRange: {
    color: defaultTheme.colors.text.secondary,
    fontSize: 12,
  },
});

export default PointRulesScreen;