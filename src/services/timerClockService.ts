import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@inzone_timer_clock_style';
const CUSTOM_KEY = '@inzone_timer_clock_custom';

export const timerClockService = {
  async saveStyle(styleId: string) {
    try { await AsyncStorage.setItem(KEY, styleId); } catch (e) { console.error('Error saving timer style', e); }
  },
  async getStyle(): Promise<string | null> {
    try { return await AsyncStorage.getItem(KEY); } catch (e) { console.error('Error getting timer style', e); return null; }
  },
  async saveCustom(config: any) {
    try { await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(config)); } catch (e) { console.error('Error saving custom clock config', e); }
  },
  async getCustom(): Promise<any> {
    try { const v = await AsyncStorage.getItem(CUSTOM_KEY); return v ? JSON.parse(v) : null; } catch (e) { console.error('Error getting custom config', e); return null; }
  }
};
