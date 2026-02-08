import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4A90E2',      // Calm blue - trust, health
    secondary: '#50C878',     // Medical green - healing
    tertiary: '#FF6B6B',      // Warm accent - urgency/alerts
    background: '#F8FAFB',    // Soft white
    surface: '#FFFFFF',       // Pure white
    surfaceVariant: '#E8F4F8', // Light blue tint
    error: '#FF3B30',         // Error red
    onPrimary: '#FFFFFF',     // White text on primary
    onSurface: '#1A1A1A',     // Dark text
    onSurfaceVariant: '#6B7280', // Gray text
    outline: '#D1D5DB',       // Border gray
    success: '#10B981',       // Success green
    warning: '#F59E0B',       // Warning orange
    info: '#3B82F6',          // Info blue
  },
  roundness: 12,
  fonts: {
    ...DefaultTheme.fonts,
    titleLarge: {
      fontFamily: 'System',
      fontSize: 28,
      fontWeight: '700' as '700',
      letterSpacing: 0,
      lineHeight: 36,
    },
    titleMedium: {
      fontFamily: 'System',
      fontSize: 20,
      fontWeight: '600' as '600',
      letterSpacing: 0,
      lineHeight: 28,
    },
    bodyLarge: {
      fontFamily: 'System',
      fontSize: 16,
      fontWeight: '400' as '400',
      letterSpacing: 0.5,
      lineHeight: 24,
    },
    bodyMedium: {
      fontFamily: 'System',
      fontSize: 14,
      fontWeight: '400' as '400',
      letterSpacing: 0.25,
      lineHeight: 20,
    },
    labelLarge: {
      fontFamily: 'System',
      fontSize: 14,
      fontWeight: '600' as '600',
      letterSpacing: 0.1,
      lineHeight: 20,
    },
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
