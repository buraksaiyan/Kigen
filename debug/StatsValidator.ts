import { UserStatsService } from '../src/services/userStatsService';
import { RatingSystem } from '../src/services/ratingSystem';
import { PointsHistoryService } from '../src/services/PointsHistoryService';

export class StatsValidator {
  static async validatePointsIntegration(): Promise<void> {
    console.log('🔍 === POINTS INTEGRATION VALIDATION ===');
    
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const monthStartDate = `${currentMonth}-01`;
      const monthEndDate = `${currentMonth}-${daysInMonth.toString().padStart(2, '0')}`;
      
      console.log('📅 Checking month:', currentMonth);
      console.log('📅 Date range:', monthStartDate, 'to', monthEndDate);
      
      // Check point history entries for each category
      const statCategories = ['DIS', 'FOC', 'JOU', 'DET', 'MEN', 'PHY', 'SOC', 'PRD'];
      const pointsBreakdown: Record<string, any> = {};
      
      for (const category of statCategories) {
        const entries = await PointsHistoryService.getPointsHistory(
          1000,
          undefined,
          category as any,
          monthStartDate,
          monthEndDate
        );
        
        const totalPoints = entries.reduce((sum, entry) => sum + entry.points, 0);
        const sourceBreakdown = entries.reduce((acc, entry) => {
          acc[entry.source] = (acc[entry.source] || 0) + entry.points;
          return acc;
        }, {} as Record<string, number>);
        
        pointsBreakdown[category] = {
          totalPoints,
          entryCount: entries.length,
          sources: sourceBreakdown,
          recentEntries: entries.slice(0, 3).map(e => ({
            source: e.source,
            points: e.points,
            description: e.description,
            timestamp: e.timestamp.split('T')[0]
          }))
        };
        
        console.log(`📊 ${category}: ${totalPoints} points from ${entries.length} entries`);
        if (entries.length > 0) {
          console.log(`   Sources: ${JSON.stringify(sourceBreakdown)}`);
        }
      }
      
      // Get current rating calculation
      console.log('\n🎯 CURRENT MONTH STATS CALCULATION:');
      const monthlyStats = await UserStatsService.calculateCurrentMonthStats();
      console.log('📊 Final Monthly Stats:', monthlyStats);
      
      // Get current rating displayed on user card
      const currentRating = await UserStatsService.getCurrentRating();
      console.log('\n📱 USER CARD DISPLAY:');
      console.log('📊 Card Stats:', currentRating.stats);
      console.log('🔸 Overall Rating:', currentRating.overallRating);
      console.log('🏆 Card Tier:', currentRating.cardTier);
      console.log('💰 Total Points:', currentRating.totalPoints);
      
      // Comparison
      console.log('\n🔍 COMPARISON:');
      let hasDiscrepancies = false;
      for (const category of statCategories) {
        const pointHistoryTotal = pointsBreakdown[category].totalPoints;
        const cardDisplayValue = (currentRating.stats as any)[category];
        
        if (pointHistoryTotal !== cardDisplayValue) {
          console.log(`❌ ${category}: Point History=${pointHistoryTotal}, Card Display=${cardDisplayValue}`);
          hasDiscrepancies = true;
        } else if (pointHistoryTotal > 0) {
          console.log(`✅ ${category}: ${pointHistoryTotal} (matches)`);
        }
      }
      
      if (!hasDiscrepancies) {
        console.log('✅ ALL STATS MATCH: Points are correctly integrated!');
      } else {
        console.log('❌ DISCREPANCIES FOUND: Points are not properly showing on user card');
      }
      
      console.log('\n📈 DETAILED BREAKDOWN:', JSON.stringify(pointsBreakdown, null, 2));
      
    } catch (error) {
      console.error('❌ Error validating points integration:', error);
    }
  }

  static async validateStatsConsistency(): Promise<void> {
    console.log('🔍 === STATS VALIDATION START ===');
    
    try {
      // Get all the data
      const currentRating = await UserStatsService.getCurrentRating();
      const monthlyRecords = await UserStatsService.getMonthlyRecords();
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentMonthRecord = monthlyRecords.find(record => record.month === currentMonth);
      const todaysStats = await UserStatsService.calculateCurrentStats();
      
      console.log('📅 Current month:', currentMonth);
      console.log('📊 Monthly rating (now shows month-to-date):', currentRating.stats);
      console.log('📊 Today\'s calculated stats:', todaysStats);
      console.log('📋 Current month record:', currentMonthRecord?.stats || 'None');
      
      // Calculate lifetime stats using FlippableStatsCard logic
        // Calculate lifetime stats using centralized helper
        const lifetimeStats = await UserStatsService.calculateAllTimeStats();
        console.log('🌟 Calculated lifetime stats:', lifetimeStats);
      
      // Check for impossible values
      const errors: string[] = [];
      if (lifetimeStats.DIS < currentRating.stats.DIS) errors.push(`DIS: lifetime(${lifetimeStats.DIS}) < monthly(${currentRating.stats.DIS})`);
      if (lifetimeStats.FOC < currentRating.stats.FOC) errors.push(`FOC: lifetime(${lifetimeStats.FOC}) < monthly(${currentRating.stats.FOC})`);
      if (lifetimeStats.JOU < currentRating.stats.JOU) errors.push(`JOU: lifetime(${lifetimeStats.JOU}) < monthly(${currentRating.stats.JOU})`);
  if (lifetimeStats.DET < currentRating.stats.DET) errors.push(`DET: lifetime(${lifetimeStats.DET}) < monthly(${currentRating.stats.DET})`);
  if (lifetimeStats.SOC < (currentRating.stats.SOC || 0)) errors.push(`SOC: lifetime(${lifetimeStats.SOC}) < monthly(${currentRating.stats.SOC})`);
  if (lifetimeStats.PRD < (currentRating.stats.PRD || 0)) errors.push(`PRD: lifetime(${lifetimeStats.PRD}) < monthly(${currentRating.stats.PRD})`);
      if (lifetimeStats.MEN < currentRating.stats.MEN) errors.push(`MEN: lifetime(${lifetimeStats.MEN}) < monthly(${currentRating.stats.MEN})`);
      if (lifetimeStats.PHY < currentRating.stats.PHY) errors.push(`PHY: lifetime(${lifetimeStats.PHY}) < monthly(${currentRating.stats.PHY})`);
      
      if (errors.length === 0) {
        console.log('✅ VALIDATION PASSED: Lifetime stats >= Monthly stats');
      } else {
        console.log('❌ VALIDATION FAILED:');
        errors.forEach(error => console.log('  •', error));
      }
      
      // Show the actual values that will appear on cards
      const lifetimeOverall = RatingSystem.calculateOverallRating(lifetimeStats);
      const monthlyOverall = currentRating.overallRating;
      
      console.log('\n📱 CARD DISPLAY VALUES:');
      console.log('🔸 Monthly Card:');
      console.log('   DIS:', currentRating.stats.DIS, '| FOC:', currentRating.stats.FOC, '| JOU:', currentRating.stats.JOU);
  console.log('   DET:', currentRating.stats.DET, '| SOC:', currentRating.stats.SOC, '| PRD:', currentRating.stats.PRD, '| MEN:', currentRating.stats.MEN, '| PHY:', currentRating.stats.PHY);
      console.log('   OVR:', monthlyOverall);
      
      console.log('🔹 Lifetime Card:');
      console.log('   DIS:', lifetimeStats.DIS, '| FOC:', lifetimeStats.FOC, '| JOU:', lifetimeStats.JOU);
  console.log('   DET:', lifetimeStats.DET, '| SOC:', lifetimeStats.SOC, '| PRD:', lifetimeStats.PRD, '| MEN:', lifetimeStats.MEN, '| PHY:', lifetimeStats.PHY);
      console.log('   OVR:', lifetimeOverall);
      
    } catch (error) {
      console.error('❌ Validation error:', error);
    }
    
    console.log('🔍 === STATS VALIDATION END ===\n');
  }

  static async testGoalCompletionPoints(): Promise<void> {
    console.log('🎯 === TESTING GOAL COMPLETION POINTS ===');
    
    try {
      // Get initial state
      console.log('📊 BEFORE Goal Completion:');
      const initialRating = await UserStatsService.getCurrentRating();
      console.log('Initial Stats:', initialRating.stats);
      console.log('Initial Overall:', initialRating.overallRating);
      
      // Record a goal completion
      console.log('\n🎯 Recording goal completion...');
      await UserStatsService.recordGoalCompletion();
      
      // Wait a moment for cache invalidation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get updated state
      console.log('\n📊 AFTER Goal Completion:');
      const updatedRating = await UserStatsService.getCurrentRating();
      console.log('Updated Stats:', updatedRating.stats);
      console.log('Updated Overall:', updatedRating.overallRating);
      
      // Calculate differences
      const statCategories = ['DIS', 'FOC', 'JOU', 'DET', 'MEN', 'PHY', 'SOC', 'PRD'];
      console.log('\n📈 CHANGES:');
      let hasChanges = false;
      for (const category of statCategories) {
        const initial = (initialRating.stats as any)[category];
        const updated = (updatedRating.stats as any)[category];
        const difference = updated - initial;
        
        if (difference !== 0) {
          console.log(`✅ ${category}: ${initial} → ${updated} (${difference > 0 ? '+' : ''}${difference})`);
          hasChanges = true;
        }
      }
      
      if (!hasChanges) {
        console.log('❌ NO CHANGES DETECTED - Points might not be integrating properly');
      } else {
        console.log('✅ POINTS SUCCESSFULLY INTEGRATED!');
      }
      
      const overallChange = updatedRating.overallRating - initialRating.overallRating;
      console.log(`📊 Overall Rating: ${initialRating.overallRating} → ${updatedRating.overallRating} (${overallChange > 0 ? '+' : ''}${overallChange})`);
      
    } catch (error) {
      console.error('❌ Error testing goal completion:', error);
    }
  }
}

export const validatePointsAndDisplay = async () => {
  console.log('🚀 === COMPREHENSIVE POINTS VALIDATION ===');
  await StatsValidator.validatePointsIntegration();
  console.log('\n' + '='.repeat(50));
  await StatsValidator.testGoalCompletionPoints();
  console.log('\n' + '='.repeat(50));
  await StatsValidator.validateStatsConsistency();
};
