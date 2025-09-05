import * as StoreReview from 'expo-store-review';
import { isFlagEnabled } from '../config/featureFlags';

export async function maybePromptForRating(): Promise<boolean> {
  if (!isFlagEnabled('enableInAppRatingPrompt')) return false;
  if (await StoreReview.isAvailableAsync()) {
    await StoreReview.requestReview();
    return true;
  }
  return false;
}