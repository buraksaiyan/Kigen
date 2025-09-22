// @ts-nocheck
import 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { journalStorage } from '../journalStorage';

describe('journalStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('saves and retrieves an entry', async () => {
    await journalStorage.addEntry('Test entry content');
    const entries = await journalStorage.getAllEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].content).toBe('Test entry content');
  });

  it('deletes an entry', async () => {
    await journalStorage.addEntry('To be deleted');
    const entries1 = await journalStorage.getAllEntries();
    expect(entries1.length).toBe(1);
    await journalStorage.deleteEntry(entries1[0].id);
    const entries2 = await journalStorage.getAllEntries();
    expect(entries2.length).toBe(0);
  });
});
