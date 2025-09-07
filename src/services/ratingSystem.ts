interface UserStats {
  DIS: number; // Discipline
  FOC: number; // Focus
  JOU: number; // Journaling
  USA: number; // Usage
  MEN: number; // Mentality
  PHY: number; // Physical
}

interface UserRating {
  stats: UserStats;
  overallRating: number;
  totalPoints: number;
  monthlyPoints: number;
  cardTier: CardTier;
}

export enum CardTier {
  Bronze = 'Bronze',
  Silver = 'Silver',
  Gold = 'Gold',
  Platinum = 'Platinum',
  Diamond = 'Diamond',
  Carbon = 'Carbon',
  Obsidian = 'Obsidian'
}

export class RatingSystem {
  private static DAILY_JOURNAL_CAP = 1;
  private static PHONE_USAGE_THRESHOLD = 3; // hours

  // Calculate discipline points
  static calculateDisciplinePoints(
    completedSessions: number,
    completedGoals: number,
    journalEntriesToday: number,
    executionHours: number,
    bodyFocusHours: number,
    abortedSessions: number,
    socialMediaMinutes: number
  ): number {
    let points = 0;
    
    // +5 pts per complete focus session
    points += completedSessions * 5;
    
    // +10 pts per goal completed
    points += completedGoals * 10;
    
    // +5 pts per journal added (once a day cap)
    points += Math.min(journalEntriesToday, this.DAILY_JOURNAL_CAP) * 5;
    
    // +10 pts per execution & body focus hour
    points += Math.ceil(executionHours) * 10;
    points += Math.ceil(bodyFocusHours) * 10;
    
    // -5 pts per aborted focus session
    points -= abortedSessions * 5;
    
    // -1 points per 10 minutes of social media app usage
    points -= Math.floor(socialMediaMinutes / 10);
    
    return Math.max(0, points);
  }

  // Calculate focus points
  static calculateFocusPoints(
    sessionMinutes: number,
    flowFocusMinutes: number
  ): number {
    let points = 0;
    
    // +10 pts for each focus mode session complete (assuming session = completion)
    // +10 per focused hour (minutes calculated and rounded up)
    const focusedHours = Math.ceil(sessionMinutes / 60);
    points += focusedHours * 10;
    
    // Additional +10 for each flow focus mode hour
    const flowFocusHours = Math.ceil(flowFocusMinutes / 60);
    points += flowFocusHours * 10;
    
    return points;
  }

  // Calculate journaling points
  static calculateJournalingPoints(entriesCount: number): number {
    // +20 pts per entry, once a day cap
    return Math.min(entriesCount, this.DAILY_JOURNAL_CAP) * 20;
  }

  // Calculate usage points
  static calculateUsagePoints(
    dailyPhoneMinutes: number,
    noPhoneFocusMinutes: number
  ): number {
    let points = 0;
    const dailyPhoneHours = dailyPhoneMinutes / 60;
    
    if (dailyPhoneHours <= this.PHONE_USAGE_THRESHOLD) {
      // +20 if daily phone usage is below 3 hours
      points += 20;
      
      // Every hour below 3 hours grants additional +10 points
      const hoursBelow = this.PHONE_USAGE_THRESHOLD - dailyPhoneHours;
      points += Math.ceil(hoursBelow) * 10;
    } else {
      // -10 points for each hour above 3 hours
      const hoursAbove = dailyPhoneHours - this.PHONE_USAGE_THRESHOLD;
      points -= Math.ceil(hoursAbove) * 10;
    }
    
    // +10 points per no phone focus mode hour
    const noPhoneFocusHours = Math.ceil(noPhoneFocusMinutes / 60);
    points += noPhoneFocusHours * 10;
    
    return Math.max(0, points);
  }

  // Calculate mentality points
  static calculateMentalityPoints(meditationMinutes: number): number {
    // +2 pts per minute meditated
    return meditationMinutes * 2;
  }

  // Calculate physical points
  static calculatePhysicalPoints(bodyFocusMinutes: number): number {
    // +20 pts per 30 minutes of body focus
    return Math.floor(bodyFocusMinutes / 30) * 20;
  }

  // Calculate overall rating (mean of all stats)
  static calculateOverallRating(stats: UserStats): number {
    const total = stats.DIS + stats.FOC + stats.JOU + stats.USA + stats.MEN + stats.PHY;
    return Math.round(total / 6);
  }

  // Determine card tier based on total points
  static getCardTier(totalPoints: number): CardTier {
    if (totalPoints >= 50000) return CardTier.Obsidian;
    if (totalPoints >= 25000) return CardTier.Carbon;
    if (totalPoints >= 12500) return CardTier.Diamond;
    if (totalPoints >= 6000) return CardTier.Platinum;
    if (totalPoints >= 3000) return CardTier.Gold;
    if (totalPoints >= 1000) return CardTier.Silver;
    return CardTier.Bronze;
  }

  // Get card tier colors
  static getCardTierColors(tier: CardTier): { primary: string; secondary: string; accent: string } {
    switch (tier) {
      case CardTier.Obsidian:
        return { primary: '#1a1a1a', secondary: '#2d2d2d', accent: '#8b5cf6' };
      case CardTier.Carbon:
        return { primary: '#0f172a', secondary: '#334155', accent: '#06b6d4' };
      case CardTier.Diamond:
        return { primary: '#1e3a8a', secondary: '#3730a3', accent: '#a855f7' };
      case CardTier.Platinum:
        return { primary: '#374151', secondary: '#6b7280', accent: '#e5e7eb' };
      case CardTier.Gold:
        return { primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' };
      case CardTier.Silver:
        return { primary: '#6b7280', secondary: '#9ca3af', accent: '#d1d5db' };
      case CardTier.Bronze:
      default:
        return { primary: '#92400e', secondary: '#b45309', accent: '#f59e0b' };
    }
  }

  // Calculate total points from all stats
  static calculateTotalPoints(stats: UserStats): number {
    return stats.DIS + stats.FOC + stats.JOU + stats.USA + stats.MEN + stats.PHY;
  }
}

export type { UserStats, UserRating };
