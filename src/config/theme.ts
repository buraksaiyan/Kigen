// The Deep Blue theme - inspired by deep ocean colors
export const theme = {
  colors: {
  primary: '#001428',      // Even deeper navy (less cyan)
  secondary: '#5AAFCC',    // Muted sky blue for accents (less saturated)
  accent: '#8B5CF6',       // Purple accent color
    success: '#2ECC40',      // Emerald green for positive actions
    danger: '#FF4136',       // Bright red for warnings/mistakes
    warning: '#FFDC00',      // Bright yellow for moderate alerts
    
    // Deep blue theme with navy base
  background: '#000F1A',   // Darker, less saturated navy background
  surface: '#001826',      // Subtle surface shade for cards
  surfaceSecondary: '#002B3A', // Deeper section background
  border: '#00374A',       // Muted blue-tinted borders
  shadow: '#000000',       // Shadow color for elevations
  overlay: 'rgba(0, 0, 0, 0.7)', // Semi-transparent overlay
  overlayLight: 'rgba(0, 0, 0, 0.05)', // Very light overlay
  borderLight: 'rgba(0, 0, 0, 0.1)', // Light border
    
    text: {
      primary: '#FFFFFF',    // Pure white for main text
      secondary: '#8FCFDF',  // Softer light blue for secondary text
      tertiary: '#8FCFDFFF', // Translucent soft blue
      disabled: '#274F63',   // Muted slate for disabled text
      dark: '#000000',       // Black text for dark backgrounds
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
