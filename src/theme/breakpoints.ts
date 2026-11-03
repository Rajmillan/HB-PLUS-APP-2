import { useWindowDimensions } from 'react-native';

/**
 * Standardized responsive breakpoints across HBPLUS applications.
 * Tested against standard device profiles:
 * - 320: Small mobile (iPhone SE, Galaxy Mini)
 * - 375: Standard mobile (iPhone 12/13/14/15)
 * - 430: Large mobile (iPhone 14/15 Pro Max, Galaxy Plus/Ultra)
 * - 768: Tablet portrait (iPad Mini, iPad Air)
 * - 1024: Tablet landscape / Small laptop (iPad Pro, 11-13" ultrabooks)
 * - 1366: Desktop / Full laptop (Standard 14-16" displays)
 * - 1920: Ultrawide / 1080p+ External Monitors
 */
export const breakpoints = {
  phoneSm: 320,
  phone: 375,
  phoneLg: 430,
  tablet: 768,
  laptop: 1024,
  desktop: 1366,
  wide: 1920,
} as const;

export const touchTargets = {
  minHeight: 44,
  minWidth: 44,
} as const;

export interface ResponsiveInfo {
  width: number;
  height: number;
  isPhoneSm: boolean;
  isPhone: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isWide: boolean;
  sidebarVisible: boolean;
  contentPadding: number;
  maxContentWidth: number;
}

/**
 * Hook providing dynamic window dimensions and semantic breakpoint flags.
 */
export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isPhoneSm = width < breakpoints.phone; // < 375
  const isPhone = width < breakpoints.tablet; // < 768
  const isTablet = width >= breakpoints.tablet && width < breakpoints.laptop; // 768 - 1023
  const isLaptop = width >= breakpoints.laptop && width < breakpoints.desktop; // 1024 - 1365
  const isDesktop = width >= breakpoints.desktop; // >= 1366
  const isWide = width >= breakpoints.wide; // >= 1920

  const sidebarVisible = width >= breakpoints.laptop; // Sidebar shows on laptop & desktop

  const contentPadding = isPhoneSm ? 12 : isPhone ? 16 : isTablet ? 24 : 32;
  const maxContentWidth = isWide ? 1400 : 1140;

  return {
    width,
    height,
    isPhoneSm,
    isPhone,
    isTablet,
    isLaptop,
    isDesktop,
    isWide,
    sidebarVisible,
    contentPadding,
    maxContentWidth,
  };
}
