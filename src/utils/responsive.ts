import { Dimensions, PixelRatio } from 'react-native';

export interface ResponsiveMetrics {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
  pixelRatio: number;
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
  isTablet: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  shortDimension: number;
  longDimension: number;
}

export const getResponsiveMetrics = (): ResponsiveMetrics => {
  const { width, height, scale, fontScale } = Dimensions.get('window');
  const pixelRatio = PixelRatio.get();
  const isLandscape = width > height;
  const shortDimension = Math.min(width, height);
  const longDimension = Math.max(width, height);
  
  return {
    width,
    height,
    scale,
    fontScale,
    pixelRatio,
    isSmallScreen: width < 360,
    isMediumScreen: width >= 360 && width < 414,
    isLargeScreen: width >= 414 && width < 768,
    isTablet: width >= 768,
    isLandscape,
    isPortrait: !isLandscape,
    shortDimension,
    longDimension,
  };
};

/**
 * Scale value based on device width
 * @param size - Base size for medium screens (375px width)
 * @param factor - Scaling factor (default: 0.5 means 50% scaling range)
 */
export const responsiveWidth = (size: number, factor: number = 0.5): number => {
  const { width } = Dimensions.get('window');
  const baseWidth = 375; // iPhone 6/7/8 width as baseline
  const scale = width / baseWidth;
  return Math.round(size * (1 + (scale - 1) * factor));
};

/**
 * Scale value based on device height
 * @param size - Base size for medium screens (667px height)
 * @param factor - Scaling factor (default: 0.5 means 50% scaling range)
 */
export const responsiveHeight = (size: number, factor: number = 0.5): number => {
  const { height } = Dimensions.get('window');
  const baseHeight = 667; // iPhone 6/7/8 height as baseline
  const scale = height / baseHeight;
  return Math.round(size * (1 + (scale - 1) * factor));
};

/**
 * Scale font size based on device characteristics
 * @param size - Base font size
 * @param options - Scaling options
 */
export const responsiveFontSize = (
  size: number,
  options: {
    maxScale?: number;
    minScale?: number;
    factor?: number;
  } = {}
): number => {
  const { fontScale } = Dimensions.get('window');
  const { maxScale = 1.3, minScale = 0.85, factor = 0.5 } = options;
  
  const scaledSize = size * (1 + (fontScale - 1) * factor);
  const clampedScale = Math.max(minScale, Math.min(maxScale, fontScale));
  
  return Math.round(scaledSize * clampedScale);
};

/**
 * Get responsive padding/margin values
 * @param base - Base spacing value
 * @returns Object with scaled spacing values
 */
export const responsiveSpacing = (base: number = 16) => {
  const metrics = getResponsiveMetrics();
  const scale = metrics.isSmallScreen ? 0.85 : metrics.isTablet ? 1.2 : 1;
  
  return {
    xs: Math.round(base * 0.25 * scale),  // 4px
    sm: Math.round(base * 0.5 * scale),   // 8px
    md: Math.round(base * scale),         // 16px
    lg: Math.round(base * 1.5 * scale),   // 24px
    xl: Math.round(base * 2 * scale),     // 32px
    xxl: Math.round(base * 3 * scale),    // 48px
  };
};

/**
 * Get device-specific measurements for components
 * @param component - Component type
 * @returns Responsive measurements
 */
export const getComponentSize = (component: string) => {
  const metrics = getResponsiveMetrics();
  const { width, height, isTablet, isSmallScreen } = metrics;
  
  switch (component) {
    case 'timer-clock':
      const maxSize = Math.min(width, height) * 0.7;
      const minSize = 200;
      const timerSize = isTablet ? 
        Math.min(maxSize, 400) : 
        Math.max(minSize, maxSize);
      return {
        size: timerSize,
        strokeWidth: isSmallScreen ? 8 : isTablet ? 12 : 10,
      };
      
    case 'dashboard-card':
      return {
        width: width - (isTablet ? 64 : 32),
        minHeight: isSmallScreen ? 120 : isTablet ? 160 : 140,
        padding: isSmallScreen ? 12 : isTablet ? 24 : 16,
      };
      
    case 'button':
      return {
        height: isSmallScreen ? 40 : isTablet ? 52 : 44,
        paddingHorizontal: isSmallScreen ? 12 : isTablet ? 24 : 16,
        fontSize: isSmallScreen ? 14 : isTablet ? 18 : 16,
      };
      
    case 'bottom-bar':
      return {
        height: isTablet ? 88 : isSmallScreen ? 72 : 80,
        paddingHorizontal: isSmallScreen ? 12 : isTablet ? 24 : 16,
        iconSize: isSmallScreen ? 20 : isTablet ? 28 : 24,
      };
      
    default:
      return { width, height };
  }
};

/**
 * Create responsive StyleSheet helper
 * @param createStyles - Function that creates styles with responsive metrics
 * @returns StyleSheet object
 */
export const createResponsiveStyles = <T>(
  createStyles: (metrics: ResponsiveMetrics, spacing: ReturnType<typeof responsiveSpacing>) => T
): T => {
  const metrics = getResponsiveMetrics();
  const spacing = responsiveSpacing();
  return createStyles(metrics, spacing);
};

/**
 * Get appropriate grid columns based on screen size
 * @param itemWidth - Minimum item width
 * @param gutter - Gutter size between items
 * @returns Number of columns
 */
export const getGridColumns = (itemWidth: number = 150, gutter: number = 16): number => {
  const { width } = getResponsiveMetrics();
  const availableWidth = width - gutter * 2; // Account for container padding
  return Math.max(1, Math.floor(availableWidth / (itemWidth + gutter)));
};

/**
 * Check if current screen size requires different layout
 * @param breakpoint - Minimum width for this layout
 * @returns boolean
 */
export const useBreakpoint = (breakpoint: number): boolean => {
  const { width } = getResponsiveMetrics();
  return width >= breakpoint;
};

/**
 * Get safe area adjustments for different screen types
 */
export const getSafeAreaAdjustments = () => {
  const metrics = getResponsiveMetrics();
  
  return {
    // Top safe area (notch/status bar)
    top: metrics.isTablet ? 24 : 16,
    // Bottom safe area (home indicator)
    bottom: metrics.isTablet ? 24 : 16,
    // Side safe areas (rounded corners)
    sides: metrics.isTablet ? 16 : 8,
  };
};

export default {
  getResponsiveMetrics,
  responsiveWidth,
  responsiveHeight,
  responsiveFontSize,
  responsiveSpacing,
  getComponentSize,
  createResponsiveStyles,
  getGridColumns,
  useBreakpoint,
  getSafeAreaAdjustments,
};