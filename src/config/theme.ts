// The Deep Blue theme - inspired by deep ocean colors
export const theme = {
  colors: {
    primary: '#001F3F',      // Deep navy blue as main color
    secondary: '#7FDBFF',    // Light sky blue for accents
    success: '#2ECC40',      // Emerald green for positive actions
    danger: '#FF4136',       // Bright red for warnings/mistakes
    warning: '#FFDC00',      // Bright yellow for moderate alerts
    
    // Deep blue theme with navy base
    background: '#001122',   // Very deep navy background
    surface: '#002244',      // Slightly lighter navy for cards
    surfaceSecondary: '#003366', // Medium navy for sections
    border: '#004488',       // Blue-tinted borders
    
    text: {
      primary: '#FFFFFF',    // Pure white for main text
      secondary: '#7FDBFF',  // Light blue for secondary text
      tertiary: '#7FDBFF99', // Translucent light blue
      disabled: '#336699',   // Muted blue for disabled
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
