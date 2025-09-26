import AsyncStorage from '@react-native-async-storage/async-storage';
import { journalStorage } from '../journalStorage';
import { PointsHistoryService } from '../PointsHistoryService';
import { UserStatsService } from '../userStatsService';

// Jest will use the AsyncStorage mock if configured in jest setup. If not, this test
// still exercises the in-memory AsyncStorage implementation provided by the mock package.

describe('Journal flow integration', () => {
  const today = new Date().toISOString().slice(0, 10);

  beforeEach(async () => {
    // Clear storage before each test
    await AsyncStorage.clear();
  });

  it('records journal points and updates daily summary & activity', async () => {
    // Add a journal entry
    await journalStorage.addEntry('Test journal entry');

    // Points history should contain journal entries (DIS, JOU, PRD)
    const history = await PointsHistoryService.getPointsHistory(20);
    const jouEntries = history.filter(h => h.source === 'journal' && h.category === 'JOU');
    const disEntries = history.filter(h => h.source === 'journal' && h.category === 'DIS');
    const prdEntries = history.filter(h => h.source === 'journal' && h.category === 'PRD');

    expect(jouEntries.length).toBeGreaterThanOrEqual(1);
    expect(disEntries.length).toBeGreaterThanOrEqual(1);
    expect(prdEntries.length).toBeGreaterThanOrEqual(1);

    // Daily summary for today should reflect the points: DIS(5) + JOU(20) + PRD(10) = 35
    const dailySummary = await PointsHistoryService.getDailySummary(today);
    expect(dailySummary).not.toBeNull();
    if (dailySummary) {
      expect(dailySummary.totalPoints).toBeGreaterThanOrEqual(35);
      expect(dailySummary.pointsByCategory['JOU']).toBeGreaterThanOrEqual(20);
    }

    // Daily activity should show 1 journal entry
    const activity = await UserStatsService.getDailyActivity(today);
    expect(activity.journalEntries).toBe(1);
  });
});
