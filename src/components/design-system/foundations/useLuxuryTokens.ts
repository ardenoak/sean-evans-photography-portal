/**
 * Luxury Tokens Hook
 * 
 * React hook for accessing luxury design tokens in components
 */

import { useMemo } from 'react';
import { luxuryTokens, luxuryVariants } from './index';

export const useLuxuryTokens = () => {
  return useMemo(() => ({
    tokens: luxuryTokens,
    variants: luxuryVariants,
    
    // Utility methods for common token access patterns
    getColor: (path: string, fallback = '#000000') => {
      try {
        const pathArray = path.split('.');
        let value: any = luxuryTokens.colors;
        
        for (const key of pathArray) {
          value = value[key];
          if (value === undefined) return fallback;
        }
        
        return typeof value === 'string' ? value : value.DEFAULT || fallback;
      } catch {
        return fallback;
      }
    },
    
    getSpacing: (key: keyof typeof luxuryTokens.spacing) => {
      return luxuryTokens.spacing[key];
    },
    
    getFontSize: (key: keyof typeof luxuryTokens.typography.fontSize) => {
      return luxuryTokens.typography.fontSize[key];
    },
    
    getShadow: (key: keyof typeof luxuryTokens.shadows) => {
      return luxuryTokens.shadows[key];
    },
    
    getRadius: (key: keyof typeof luxuryTokens.borderRadius) => {
      return luxuryTokens.borderRadius[key];
    },
  }), []);
};

export default useLuxuryTokens;