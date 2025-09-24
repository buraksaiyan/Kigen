// Utility to clear old data that might have duplicate keys
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearOldFocusData(): Promise<void> {
  try {
    console.log('🧹 Clearing old focus session data to prevent duplicate keys...');
    
    // Clear old focus sessions that might have duplicate timestamp keys
    await AsyncStorage.removeItem('@inzone_focus_sessions');
    await AsyncStorage.removeItem('@inzone_session_stats');
    await AsyncStorage.removeItem('@inzone_daily_points');
    await AsyncStorage.removeItem('@inzone_current_session');
    await AsyncStorage.removeItem('@inzone_last_session_date');
    
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
      '@inzone_user_profile',
      '@inzone_user_stats', 
      '@inzone_monthly_records',
      '@inzone_daily_activity',
      '@inzone_goals', // Keep goals data
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
