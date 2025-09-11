import { UserStatsService } from '../src/services/userStatsService';
import { RatingSystem } from '../src/services/ratingSystem';

export class StatsValidator {
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
      let lifetimeStats = { DIS: 0, FOC: 0, JOU: 0, USA: 0, MEN: 0, PHY: 0 };
      
      if (currentMonthRecord) {
        // Use all monthly records
        monthlyRecords.forEach(record => {
          lifetimeStats.DIS += record.stats.DIS;
          lifetimeStats.FOC += record.stats.FOC;
          lifetimeStats.JOU += record.stats.JOU;
          lifetimeStats.USA += record.stats.USA;
          lifetimeStats.MEN += record.stats.MEN;
          lifetimeStats.PHY += record.stats.PHY;
        });
      } else {
        // Use historical + current rating
        const historicalRecords = monthlyRecords.filter(record => record.month !== currentMonth);
        historicalRecords.forEach(record => {
          lifetimeStats.DIS += record.stats.DIS;
          lifetimeStats.FOC += record.stats.FOC;
          lifetimeStats.JOU += record.stats.JOU;
          lifetimeStats.USA += record.stats.USA;
          lifetimeStats.MEN += record.stats.MEN;
          lifetimeStats.PHY += record.stats.PHY;
        });
        
        lifetimeStats.DIS += currentRating.stats.DIS;
        lifetimeStats.FOC += currentRating.stats.FOC;
        lifetimeStats.JOU += currentRating.stats.JOU;
        lifetimeStats.USA += currentRating.stats.USA;
        lifetimeStats.MEN += currentRating.stats.MEN;
        lifetimeStats.PHY += currentRating.stats.PHY;
      }
      
      console.log('🌟 Calculated lifetime stats:', lifetimeStats);
      
      // Check for impossible values
      const errors: string[] = [];
      if (lifetimeStats.DIS < currentRating.stats.DIS) errors.push(`DIS: lifetime(${lifetimeStats.DIS}) < monthly(${currentRating.stats.DIS})`);
      if (lifetimeStats.FOC < currentRating.stats.FOC) errors.push(`FOC: lifetime(${lifetimeStats.FOC}) < monthly(${currentRating.stats.FOC})`);
      if (lifetimeStats.JOU < currentRating.stats.JOU) errors.push(`JOU: lifetime(${lifetimeStats.JOU}) < monthly(${currentRating.stats.JOU})`);
      if (lifetimeStats.USA < currentRating.stats.USA) errors.push(`USA: lifetime(${lifetimeStats.USA}) < monthly(${currentRating.stats.USA})`);
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
      console.log('   USA:', currentRating.stats.USA, '| MEN:', currentRating.stats.MEN, '| PHY:', currentRating.stats.PHY);
      console.log('   OVR:', monthlyOverall);
      
      console.log('🔹 Lifetime Card:');
      console.log('   DIS:', lifetimeStats.DIS, '| FOC:', lifetimeStats.FOC, '| JOU:', lifetimeStats.JOU);
      console.log('   USA:', lifetimeStats.USA, '| MEN:', lifetimeStats.MEN, '| PHY:', lifetimeStats.PHY);
      console.log('   OVR:', lifetimeOverall);
      
    } catch (error) {
      console.error('❌ Validation error:', error);
    }
    
    console.log('🔍 === STATS VALIDATION END ===\n');
  }
}
