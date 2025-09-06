interface FocusRatingResponse {
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  reason: string;
}

/**
 * AI-powered focus session rating based on session data
 * Analyzes duration, completion rate, unlocks, and app usage to determine quality
 */
export const rateFocusSession = async (
  plannedDuration: number,
  actualDuration: number,
  unlocks: number,
  appUsageMinutes: number,
  status: 'completed' | 'aborted'
): Promise<FocusRatingResponse> => {
  
  // If session was aborted, it's automatically poor
  if (status === 'aborted') {
    return {
      rating: 'poor',
      reason: 'Session was aborted before completion'
    };
  }

  // Calculate completion percentage
  const completionRate = (actualDuration / plannedDuration) * 100;
  
  // Calculate distraction metrics
  const unlocksPerHour = (unlocks / (actualDuration / 60)) || 0;
  const appUsagePercentage = (appUsageMinutes / actualDuration) * 100;
  
  // Scoring algorithm
  let score = 100;
  
  // Penalize low completion rate
  if (completionRate < 50) {
    score -= 40;
  } else if (completionRate < 80) {
    score -= 20;
  } else if (completionRate < 95) {
    score -= 10;
  }
  
  // Penalize high unlock frequency
  if (unlocksPerHour > 10) {
    score -= 30;
  } else if (unlocksPerHour > 5) {
    score -= 15;
  } else if (unlocksPerHour > 2) {
    score -= 5;
  }
  
  // Penalize high app usage
  if (appUsagePercentage > 30) {
    score -= 25;
  } else if (appUsagePercentage > 15) {
    score -= 15;
  } else if (appUsagePercentage > 5) {
    score -= 5;
  }
  
  // Bonus for long sessions (shows sustained focus)
  if (actualDuration >= 120) { // 2+ hours
    score += 10;
  } else if (actualDuration >= 60) { // 1+ hour
    score += 5;
  }
  
  // Determine rating and reason
  if (score >= 85) {
    return {
      rating: 'excellent',
      reason: `Outstanding focus! ${Math.round(completionRate)}% completion with minimal distractions.`
    };
  } else if (score >= 65) {
    return {
      rating: 'good',
      reason: `Solid focus session. ${Math.round(completionRate)}% completion with some minor distractions.`
    };
  } else if (score >= 40) {
    return {
      rating: 'fair',
      reason: `Decent effort but room for improvement. ${Math.round(completionRate)}% completion with ${unlocks} unlocks.`
    };
  } else {
    return {
      rating: 'poor',
      reason: `Needs work. ${Math.round(completionRate)}% completion with frequent distractions (${unlocks} unlocks).`
    };
  }
};
