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
    
    // Common utility colors
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    
    // Progress and gamification
    progress: {
      background: '#00374A',
      fill: '#5AAFCC',
      success: '#2ECC40',
    },
    
    // Button states
    button: {
      primary: '#001428',
      secondary: '#5AAFCC',
      disabled: '#274F63',
      hover: '#002B3A',
    },
    
    // Tab navigation
    tab: {
      active: '#5AAFCC',
      inactive: '#274F63',
      background: '#001826',
    },
    
    // Menu items
    menu: {
      goals: '#FF6B6B',
      journaling: '#4ECDC4',
      focus: '#45B7D1',
      reminders: '#F6C85F',
      social: '#96CEB4',
      todo: '#FFEAA7',
      habit: '#DDA0DD',
    },
    
    // Focus session modes
    focus: {
      study: '#14B8A6',
      work: '#EF4444',
      meditation: '#22C55E',
      exercise: '#A855F7',
      reading: '#60A5FA',
      custom: '#F59E0B',
    },
    
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
    h5: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
    h6: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
    body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 22 },
    bodyLarge: { fontSize: 17, fontWeight: '400' as const, lineHeight: 22 },
    bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
    caption: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
    small: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
    tiny: { fontSize: 11, fontWeight: '400' as const, lineHeight: 14 },
    label: { fontSize: 10, fontWeight: '500' as const, lineHeight: 12 },
  },

  icons: {
    colors: {
      fire: '#FF6B35',
      success: '#34C759',
      white: '#FFFFFF',
      secondary: '#8FCFDF',
    },
    sizes: {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    },
  },
  
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
  },

  // Common component styles to avoid recreation
  components: {
    button: {
      primary: {
        backgroundColor: '#001428',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
      },
      secondary: {
        backgroundColor: '#5AAFCC',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
      },
    },
    
    card: {
      default: {
        backgroundColor: '#001826',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    },
    
    text: {
      heading: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '600',
      },
      body: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '400',
      },
      secondary: {
        color: '#8FCFDF',
        fontSize: 14,
        fontWeight: '400',
      },
    },
  },
};
