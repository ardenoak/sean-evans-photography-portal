/**
 * Luxury Design Token System
 * 
 * Centralized design tokens for the Arden Oak Portal luxury interface
 * WCAG 2.1 AA compliant color palette with sophisticated styling
 */

export const luxuryTokens = {
  colors: {
    // Primary luxury palette (accessibility-compliant)
    charcoal: {
      DEFAULT: '#2c2c2c',
      light: '#404040',
      dark: '#1a1a1a',
    },
    verde: {
      DEFAULT: '#4a5d23',
      light: '#6B8E5A',
      dark: '#3a4a1b',
    },
    gold: {
      DEFAULT: '#876214', // WCAG AA compliant
      light: '#B8941F',
      dark: '#6B5412',
    },
    ivory: {
      DEFAULT: '#f8f6f0',
      warm: '#faf9f4',
      cool: '#f6f5f2',
    },
    warmGray: {
      DEFAULT: '#4B5563', // WCAG AA compliant
      light: '#6b7280',
      dark: '#374151',
    },
  },
  
  spacing: {
    luxuryXs: '0.25rem',    // 4px
    luxurySm: '0.5rem',     // 8px
    luxuryMd: '1rem',       // 16px
    luxuryLg: '1.5rem',     // 24px
    luxuryXl: '2rem',       // 32px
    luxury2xl: '3rem',      // 48px
    luxury3xl: '4rem',      // 64px
    luxury4xl: '6rem',      // 96px
  },
  
  typography: {
    fontFamily: {
      luxurySerif: 'Didot, "Times New Roman", serif',
      luxurySans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    fontSize: {
      luxuryXs: '0.75rem',    // 12px
      luxurySm: '0.875rem',   // 14px
      luxuryBase: '1rem',     // 16px
      luxuryLg: '1.125rem',   // 18px
      luxuryXl: '1.25rem',    // 20px
      luxury2xl: '1.5rem',    // 24px
      luxury3xl: '1.875rem',  // 30px
      luxury4xl: '2.25rem',   // 36px
      luxury5xl: '3rem',      // 48px
    },
    lineHeight: {
      luxuryTight: '1.1',
      luxurySnug: '1.25',
      luxuryNormal: '1.5',
      luxuryRelaxed: '1.75',
      luxuryLoose: '2',
    },
  },
  
  shadows: {
    luxurySm: '0 1px 2px 0 rgba(44, 44, 44, 0.05)',
    luxuryMd: '0 4px 6px -1px rgba(44, 44, 44, 0.1), 0 2px 4px -1px rgba(44, 44, 44, 0.06)',
    luxuryLg: '0 10px 15px -3px rgba(44, 44, 44, 0.1), 0 4px 6px -2px rgba(44, 44, 44, 0.05)',
    luxuryXl: '0 20px 25px -5px rgba(44, 44, 44, 0.1), 0 10px 10px -5px rgba(44, 44, 44, 0.04)',
  },
  
  borderRadius: {
    luxurySm: '0.125rem',   // 2px
    luxuryMd: '0.375rem',   // 6px
    luxuryLg: '0.5rem',     // 8px
    luxuryXl: '0.75rem',    // 12px
    luxury2xl: '1rem',      // 16px
    luxury3xl: '1.5rem',    // 24px
  },
  
  transitions: {
    luxury: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    luxurySlow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    luxuryOut: 'cubic-bezier(0, 0, 0.2, 1)',
    luxuryIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

// Type definitions for design tokens
export type LuxuryColors = typeof luxuryTokens.colors;
export type LuxurySpacing = typeof luxuryTokens.spacing;
export type LuxuryTypography = typeof luxuryTokens.typography;
export type LuxuryShadows = typeof luxuryTokens.shadows;
export type LuxuryBorderRadius = typeof luxuryTokens.borderRadius;
export type LuxuryTransitions = typeof luxuryTokens.transitions;

// Utility functions for accessing tokens
export const getColorToken = (colorPath: string): string => {
  const pathArray = colorPath.split('.');
  let value: any = luxuryTokens.colors;
  
  for (const key of pathArray) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Color token not found: ${colorPath}`);
      return '#000000'; // Fallback color
    }
  }
  
  return typeof value === 'string' ? value : value.DEFAULT || '#000000';
};

export const getSpacingToken = (spacing: keyof LuxurySpacing): string => {
  return luxuryTokens.spacing[spacing];
};

export const getTypographyToken = (category: keyof LuxuryTypography, token: string): string => {
  const categoryTokens = luxuryTokens.typography[category] as Record<string, string>;
  return categoryTokens[token] || '';
};