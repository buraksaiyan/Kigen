interface UserStats {
  DIS: number; // Discipline
  FOC: number; // Focus
  JOU: number; // Journaling
  DET: number; // Determination (renamed from Usage)
  MEN: number; // Mentality
  PHY: number; // Physical
  SOC: number; // Social
  PRD: number; // Productivity
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
  private static PHONE_USAGE_THRESHOLD = 3; // hours (legacy threshold kept for backwards compatibility where needed)

  // Card background images for each tier
  static getCardBackgroundImage(tier: CardTier) {
    const backgrounds = {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
      [CardTier.Bronze]: require('../../assets/images/bronze-card.png'),
      // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
      [CardTier.Silver]: require('../../assets/images/silver-card.png'),
      // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
      [CardTier.Gold]: require('../../assets/images/gold-card.png'),
      // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
      [CardTier.Platinum]: require('../../assets/images/platinum-card.png'),
      // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
      [CardTier.Diamond]: require('../../assets/images/diamond-card.png'),
      // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
      [CardTier.Carbon]: require('../../assets/images/carbon-card.png'),
      // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
      [CardTier.Obsidian]: require('../../assets/images/obsidian-card.png'),
    };
    return backgrounds[tier];
  }

  // Text color for each tier (white for dark backgrounds)
  static getCardTextColor(tier: CardTier): string {
    const darkTiers = [CardTier.Carbon, CardTier.Obsidian];
    return darkTiers.includes(tier) ? '#FFFFFF' : '#000000';
  }

  // Compute perceived luminance from an rgba/hex color string and return true if light
  static isColorLight(color: string): boolean {
    try {
      // Normalize hex like #RRGGBB or rgba(r,g,b,a)
      if (typeof color === 'string' && color.startsWith('#')) {
        const hex = color.replace('#', '');
        if (hex.length >= 6) {
          const r = Number.parseInt(hex.substring(0, 2), 16) || 0;
          const g = Number.parseInt(hex.substring(2, 4), 16) || 0;
          const b = Number.parseInt(hex.substring(4, 6), 16) || 0;
          // Perceived luminance formula
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          return luminance > 0.6; // threshold: >0.6 considered light
        }
      }

      if (typeof color === 'string' && (color.startsWith('rgba') || color.startsWith('rgb'))) {
        const nums = color.replace(/rgba?\(|\)/g, '').split(',').map(s => parseFloat(s.trim()));
        const r = nums[0] || 0;
        const g = nums[1] || 0;
        const b = nums[2] || 0;
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.6;
      }
    } catch (e) {
      // fallthrough - return conservative default (dark)
    }
    return false;
  }

  // Choose text color based on the tier's primary color luminance when available
  static getCardTextColorFromTier(tier: CardTier): string {
    try {
      const colors = this.getCardTierColors(tier);
      if (this.isColorLight(colors.primary)) return '#000000';
      return '#FFFFFF';
    } catch (e) {
      return this.getCardTextColor(tier);
    }
  }

  // Calculate discipline points
  static calculateDisciplinePoints(
    completedSessions: number,
    completedGoals: number,
    journalEntriesToday: number,
    executionHours: number,
    bodyFocusHours: number,
    abortedSessions: number
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
    
    // social-media based penalties were removed; social is tracked as its own stat (SOC)
    
    return Math.max(0, points);
  }

  // Calculate social points (SOC). Positive metric representing healthy social interactions.
  // Simple scale: +5 points per 10 minutes of social activity.
  static calculateSocialPoints(socialMediaMinutes: number): number {
    if (!socialMediaMinutes || socialMediaMinutes <= 0) return 0;
    return Math.floor(socialMediaMinutes / 10) * 5;
  }

  // Calculate productivity points (PRD) from execution and body focus minutes.
  // We award 15 points per productive hour (rounded up).
  static calculateProductivityPoints(executionMinutes: number, bodyFocusMinutes: number): number {
    const totalMinutes = (executionMinutes || 0) + (bodyFocusMinutes || 0);
    const hours = Math.ceil(totalMinutes / 60);
    return hours * 15;
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

  // Calculate Determination points (new stat replacing Usage)
  // Determination aggregates multiple achievement/productivity signals:
  // - Per 10 Goal completions -> +20 Points
  // - Per 10 Journal entries -> +15 Points
  // - Per 10 Focus Session completions -> +50 Points
  // - Per Achievement unlock -> +5 Points
  // - Per 7 days streak of habits -> +50 Points
  // - Per completed To-Do List Bullet -> +5 Points
  // It also inherits prior phone-usage related adjustments as a fallback.
  static calculateDeterminationPoints(
    totalCompletedGoals: number,
    totalJournalEntries: number,
    totalCompletedFocusSessions: number,
    achievementsUnlocked: number,
    habitStreakWeeks: number, // number of completed 7-day streaks
    completedTodoBullets: number,
    dailyPhoneMinutes: number = 0,
    noPhoneFocusMinutes: number = 0,
    hasUsageAccess: boolean = false
  ): number {
    let points = 0;

    // Per 10 Goal completions -> +20
    points += Math.floor(totalCompletedGoals / 10) * 20;

    // Per 10 Journal entries -> +15
    points += Math.floor(totalJournalEntries / 10) * 15;

    // Per 10 Focus Session completions -> +50
    points += Math.floor(totalCompletedFocusSessions / 10) * 50;

    // Per Achievement unlock -> +5
    points += achievementsUnlocked * 5;

    // Per 7 days streak (each completed block of 7 days) -> +50
    points += habitStreakWeeks * 50;

    // Per completed To-Do List Bullet -> +5
    points += completedTodoBullets * 5;

    // Inherit/keep some legacy phone-usage incentives if permission granted
    if (hasUsageAccess) {
      const dailyPhoneHours = dailyPhoneMinutes / 60;
      if (dailyPhoneHours <= this.PHONE_USAGE_THRESHOLD) {
        points += 10; // small bonus for staying under threshold
      } else {
        const hoursAbove = dailyPhoneHours - this.PHONE_USAGE_THRESHOLD;
        points -= Math.ceil(hoursAbove) * 5; // minor penalty
      }

      // +5 pts per no-phone focus hour
      const noPhoneFocusHours = Math.ceil(noPhoneFocusMinutes / 60);
      points += noPhoneFocusHours * 5;
    }

    return Math.max(0, Math.round(points));
  }

  // Calculate mentality points
  static calculateMentalityPoints(meditationMinutes: number): number {
    // +2 pts per minute meditated
    return meditationMinutes * 2;
  }

  // Calculate physical points
  static calculatePhysicalPoints(bodyFocusMinutes: number): number {
    // +20 pts per 30 minutes of body focus (proportional calculation)
    // Examples: 15 min = 10 pts, 30 min = 20 pts, 45 min = 30 pts
    const pointsPerMinute = 20 / 30; // 0.666... points per minute
    const totalPoints = bodyFocusMinutes * pointsPerMinute;
    return Math.ceil(totalPoints); // Round up to integer
  }

  // Calculate overall rating (mean of all stats)
  static calculateOverallRating(stats: UserStats): number {
    const total = stats.DIS + stats.FOC + stats.JOU + stats.DET + stats.MEN + stats.PHY + (stats.SOC || 0) + (stats.PRD || 0);
    return Math.round(total / 8);
  }

  // Determine card tier based on total points
  static getCardTier(totalPoints: number): CardTier {
    if (totalPoints >= 12001) return CardTier.Obsidian;
    if (totalPoints >= 10000) return CardTier.Carbon;
    if (totalPoints >= 8000) return CardTier.Diamond;
    if (totalPoints >= 6000) return CardTier.Platinum;
    if (totalPoints >= 4000) return CardTier.Gold;
    if (totalPoints >= 2000) return CardTier.Silver;
    return CardTier.Bronze;
  }

  // Get card tier colors with cooler gradients and semi-transparency
  static getCardTierColors(tier: CardTier): { primary: string; secondary: string; accent: string } {
    switch (tier) {
      case CardTier.Obsidian:
        return { primary: 'rgba(26, 26, 26, 0.9)', secondary: 'rgba(45, 45, 45, 0.7)', accent: '#8b5cf6' };
      case CardTier.Carbon:
        return { primary: 'rgba(15, 23, 42, 0.9)', secondary: 'rgba(51, 65, 85, 0.7)', accent: '#06b6d4' };
      case CardTier.Diamond:
        return { primary: 'rgba(30, 58, 138, 0.9)', secondary: 'rgba(55, 48, 163, 0.7)', accent: '#a855f7' };
      case CardTier.Platinum:
        return { primary: 'rgba(55, 65, 81, 0.9)', secondary: 'rgba(107, 114, 128, 0.7)', accent: '#e5e7eb' };
      case CardTier.Gold:
        return { primary: 'rgba(245, 158, 11, 0.9)', secondary: 'rgba(217, 119, 6, 0.7)', accent: '#fbbf24' };
      case CardTier.Silver:
        return { primary: 'rgba(107, 114, 128, 0.9)', secondary: 'rgba(156, 163, 175, 0.7)', accent: '#d1d5db' };
      case CardTier.Bronze:
      default:
        return { primary: 'rgba(146, 64, 14, 0.9)', secondary: 'rgba(180, 83, 9, 0.7)', accent: '#f59e0b' };
    }
  }

  // Calculate total points from all stats
  static calculateTotalPoints(stats: UserStats): number {
    return (
      stats.DIS +
      stats.FOC +
      stats.JOU +
      stats.DET +
      stats.MEN +
      stats.PHY +
      (stats.SOC || 0) +
      (stats.PRD || 0)
    );
  }
}

export type { UserStats, UserRating };
