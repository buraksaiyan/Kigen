// Dark, discipline-focused theme for Android
export const theme = {
  colors: {
    primary: '#888691',      // Changed from midnight purple to lighter gray
    secondary: '#7c3aed',    // Keep secondary as before  
    success: '#10b981',      // Green for positive actions
    danger: '#ef4444',       // Red for warnings/mistakes
    warning: '#f59e0b',      // Amber for moderate alerts
    
    // Very dark theme for discipline focus
    background: '#000000',   // Pure black background
    surface: '#111111',      // Slightly lighter for cards
    surfaceSecondary: '#1C1C1E', // Medium dark for sections
    border: '#2C2C2E',       // Subtle borders
    
    text: {
      primary: '#FFFFFF',    // Pure white for main text
      secondary: '#EBEBF5',  // Very light gray
      tertiary: '#EBEBF599', // Translucent light gray
      disabled: '#3A3A3C',   // Dark gray for disabled
    }
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  
  typography: {
    h1: { fontSize: 34, fontWeight: '700' as const, lineHeight: 40 },
    h2: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
    h3: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
    h4: { fontSize: 20, fontWeight: '600' as const, lineHeight: 25 },
    body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 22 },
    bodyLarge: { fontSize: 17, fontWeight: '400' as const, lineHeight: 22 },
    caption: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
    small: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  },
  
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
  }
};
