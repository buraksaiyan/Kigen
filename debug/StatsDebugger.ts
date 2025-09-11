import { UserStatsService } from '../src/services/userStatsService';
import { RatingSystem } from '../src/services/ratingSystem';

export class StatsDebugger {
  static async debugStatsCalculation() {
    console.log('\n🔍 ===== STATS DEBUG START =====');
    
    try {
      // Get all raw data
      const monthlyRecords = await UserStatsService.getMonthlyRecords();
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentStats = await UserStatsService.calculateCurrentStats();
      const currentRating = await UserStatsService.getCurrentRating();
      
      console.log('📅 Current month:', currentMonth);
      console.log('📊 Current calculated stats:', currentStats);
      console.log('📊 Current rating:', currentRating);
      console.log('📁 Monthly records count:', monthlyRecords.length);
      
      // Log all monthly records
      monthlyRecords.forEach((record, index) => {
        console.log(`📋 Monthly record ${index + 1}:`, {
          month: record.month,
          stats: record.stats,
          totalPoints: record.totalPoints
        });
      });
      
      // Calculate lifetime stats manually using the same logic as FlippableStatsCard
      let lifetimeStats = { DIS: 0, FOC: 0, JOU: 0, USA: 0, MEN: 0, PHY: 0 };
      const currentMonthRecord = monthlyRecords.find(record => record.month === currentMonth);
      
      console.log('🔍 Current month record found:', !!currentMonthRecord);
      
      if (currentMonthRecord) {
        // Current month is already saved, use all monthly records (including current)
        console.log('🔄 Using all monthly records (current month is saved)');
        monthlyRecords.forEach(record => {
          console.log(`➕ Adding record from ${record.month}:`, record.stats);
          lifetimeStats.DIS += record.stats.DIS;
          lifetimeStats.FOC += record.stats.FOC;
          lifetimeStats.JOU += record.stats.JOU;
          lifetimeStats.USA += record.stats.USA;
          lifetimeStats.MEN += record.stats.MEN;
          lifetimeStats.PHY += record.stats.PHY;
        });
      } else {
        // Current month not saved yet, use historical records + current month's live stats
        console.log('🔄 Using historical records + current live stats');
        const historicalRecords = monthlyRecords.filter(record => record.month !== currentMonth);
        
        // Add historical months
        historicalRecords.forEach(record => {
          console.log(`➕ Adding historical record from ${record.month}:`, record.stats);
          lifetimeStats.DIS += record.stats.DIS;
          lifetimeStats.FOC += record.stats.FOC;
          lifetimeStats.JOU += record.stats.JOU;
          lifetimeStats.USA += record.stats.USA;
          lifetimeStats.MEN += record.stats.MEN;
          lifetimeStats.PHY += record.stats.PHY;
        });
        
        // Add current month's live stats
        console.log('➕ Adding current month live stats:', currentStats);
        lifetimeStats.DIS += currentStats.DIS;
        lifetimeStats.FOC += currentStats.FOC;
        lifetimeStats.JOU += currentStats.JOU;
        lifetimeStats.USA += currentStats.USA;
        lifetimeStats.MEN += currentStats.MEN;
        lifetimeStats.PHY += currentStats.PHY;
      }
      
      const lifetimeTotalPoints = RatingSystem.calculateTotalPoints(lifetimeStats);
      const lifetimeOverallRating = RatingSystem.calculateOverallRating(lifetimeStats);
      
      console.log('\n📈 FINAL CALCULATIONS:');
      console.log('🔸 Monthly stats:', currentRating.stats);
      console.log('🔸 Monthly total points:', currentRating.monthlyPoints);
      console.log('🔸 Monthly overall rating:', currentRating.overallRating);
      console.log('🔹 Lifetime stats:', lifetimeStats);
      console.log('🔹 Lifetime total points:', lifetimeTotalPoints);
      console.log('🔹 Lifetime overall rating:', lifetimeOverallRating);
      
      // Check for anomalies
      const anomalies: string[] = [];
      if (lifetimeStats.DIS < currentRating.stats.DIS) anomalies.push(`DIS: lifetime(${lifetimeStats.DIS}) < monthly(${currentRating.stats.DIS})`);
      if (lifetimeStats.FOC < currentRating.stats.FOC) anomalies.push(`FOC: lifetime(${lifetimeStats.FOC}) < monthly(${currentRating.stats.FOC})`);
      if (lifetimeStats.JOU < currentRating.stats.JOU) anomalies.push(`JOU: lifetime(${lifetimeStats.JOU}) < monthly(${currentRating.stats.JOU})`);
      if (lifetimeStats.USA < currentRating.stats.USA) anomalies.push(`USA: lifetime(${lifetimeStats.USA}) < monthly(${currentRating.stats.USA})`);
      if (lifetimeStats.MEN < currentRating.stats.MEN) anomalies.push(`MEN: lifetime(${lifetimeStats.MEN}) < monthly(${currentRating.stats.MEN})`);
      if (lifetimeStats.PHY < currentRating.stats.PHY) anomalies.push(`PHY: lifetime(${lifetimeStats.PHY}) < monthly(${currentRating.stats.PHY})`);
      
      if (anomalies.length > 0) {
        console.log('\n🚨 ANOMALIES DETECTED:');
        anomalies.forEach(anomaly => console.log('❗', anomaly));
      } else {
        console.log('\n✅ No anomalies detected - lifetime stats are properly higher than or equal to monthly stats');
      }
      
    } catch (error) {
      console.error('❌ Error in stats debug:', error);
    }
    
    console.log('🔍 ===== STATS DEBUG END =====\n');
  }

  static async resetAllStatsData() {
    console.log('🔄 Resetting all stats data...');
    try {
      // This would clear all stored monthly records and daily activities
      // Implement if needed for debugging
      console.log('⚠️ Reset functionality not implemented yet');
    } catch (error) {
      console.error('❌ Error resetting stats data:', error);
    }
  }
}
