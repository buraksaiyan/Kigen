import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const useStyles = <T extends Record<string, any>>(
  styleCreator: (theme: ReturnType<typeof useTheme>['theme']) => T
): T => {
  const { theme } = useTheme();

  return useMemo(() => {
    return StyleSheet.create(styleCreator(theme));
  }, [theme, styleCreator]);
};