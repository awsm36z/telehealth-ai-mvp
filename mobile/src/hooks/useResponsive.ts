import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize, ViewStyle } from 'react-native';

const TABLET_BREAKPOINT = 768;
const MAX_CONTENT_WIDTH = 720;

interface ResponsiveValues {
  isTablet: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
  contentContainerStyle: ViewStyle;
}

export function useResponsive(): ResponsiveValues {
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription.remove();
  }, []);

  const isTablet = Math.min(dimensions.width, dimensions.height) >= TABLET_BREAKPOINT;
  const isLandscape = dimensions.width > dimensions.height;

  const contentContainerStyle: ViewStyle = isTablet
    ? { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }
    : {};

  return {
    isTablet,
    isLandscape,
    width: dimensions.width,
    height: dimensions.height,
    contentContainerStyle,
  };
}
