export type FeatureFlagKey =
  | 'experimentalJournalSync'
  | 'enableInAppRatingPrompt'
  | 'adsPlaceholder'
  | 'lemonSqueezyWebhooks';

const defaults: Record<FeatureFlagKey, boolean> = {
  experimentalJournalSync: false,
  enableInAppRatingPrompt: true,
  adsPlaceholder: false,
  lemonSqueezyWebhooks: false
};

const overrides: Partial<Record<FeatureFlagKey, boolean>> = {};

export function isFlagEnabled(key: FeatureFlagKey): boolean {
  return overrides[key] ?? defaults[key];
}

// Simple override (not persisted)
export function setFlag(key: FeatureFlagKey, value: boolean) {
  overrides[key] = value;
}