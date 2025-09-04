import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { maybePromptForRating } from '../../services/rating';
import { isFlagEnabled } from '../../config/featureFlags';

export const DashboardScreen: React.FC = () => {
  const { signOut } = useAuth();

  useEffect(() => {
    maybePromptForRating();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kigen Dashboard</Text>
      {isFlagEnabled('adsPlaceholder') && <Text style={styles.ad}>[Ad Placeholder]</Text>}
      <Button title="Sign Out" onPress={() => signOut()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: '600' },
  ad: { backgroundColor: '#eee', padding: 12, borderRadius: 8 }
});