// Utility to clear old data that might have duplicate keys
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearOldFocusData(): Promise<void> {
  try {
    console.log('🧹 Clearing old focus session data to prevent duplicate keys...');
    
    // Clear old focus sessions that might have duplicate timestamp keys
    await AsyncStorage.removeItem('@kigen_focus_sessions');
    await AsyncStorage.removeItem('@kigen_session_stats');
    await AsyncStorage.removeItem('@kigen_daily_points');
    await AsyncStorage.removeItem('@kigen_current_session');
    await AsyncStorage.removeItem('@kigen_last_session_date');
    
    console.log('✅ Old focus session data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing old focus data:', error);
  }
}

export async function clearAllOldData(): Promise<void> {
  try {
    console.log('🧹 Clearing all old data to prevent duplicate keys...');
    
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToKeep = [
      '@kigen_user_profile',
      '@kigen_user_stats', 
      '@kigen_monthly_records',
      '@kigen_daily_activity',
      '@kigen_goals', // Keep goals data
      'usage_permission_granted',
      'hasUsagePermission'
    ];
    
    // Remove all keys except essential ones
    const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ Cleared old data keys:', keysToRemove);
    }
    
  } catch (error) {
    console.error('❌ Error clearing all old data:', error);
  }
}
