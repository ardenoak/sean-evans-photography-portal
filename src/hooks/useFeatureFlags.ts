/**
 * useFeatureFlags Hook
 * Simple, reliable feature flag system for Tally Photography Management
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// Feature flags type definitions
export interface FeatureFlags {
  enhancedNavigation: boolean;
  enhancedSearch: boolean;
  dashboardAnalytics: boolean;
  calendarIntegration: boolean;
  realTimeFeatures: boolean;
  invoiceEnhancement: boolean;
  clientPortalV2: boolean;
}

// Default feature flags based on environment variables
const getDefaultFeatureFlags = (): FeatureFlags => ({
  enhancedNavigation: process.env.NEXT_PUBLIC_FEATURE_ENHANCED_NAVIGATION === 'true',
  enhancedSearch: process.env.NEXT_PUBLIC_FEATURE_ENHANCED_SEARCH === 'true',
  dashboardAnalytics: process.env.NEXT_PUBLIC_FEATURE_DASHBOARD_ANALYTICS === 'true',
  calendarIntegration: process.env.NEXT_PUBLIC_FEATURE_CALENDAR_INTEGRATION === 'true',
  realTimeFeatures: process.env.NEXT_PUBLIC_FEATURE_REAL_TIME_FEATURES === 'true',
  invoiceEnhancement: process.env.NEXT_PUBLIC_FEATURE_INVOICE_ENHANCEMENT === 'true',
  clientPortalV2: process.env.NEXT_PUBLIC_FEATURE_CLIENT_PORTAL_V2 === 'true',
});

// Local storage utilities
const STORAGE_KEY = 'tally_feature_flags';

const safeGetStorageItem = (key: string): any => {
  try {
    if (typeof window === 'undefined') return null;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn(`Failed to read from localStorage (${key}):`, error);
    return null;
  }
};

const safeSetStorageItem = (key: string, value: any): void => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to write to localStorage (${key}):`, error);
  }
};

// Main hook for feature flags
export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    const defaultFlags = getDefaultFeatureFlags();
    const storedFlags = safeGetStorageItem(STORAGE_KEY);
    return { ...defaultFlags, ...storedFlags };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if a specific feature is enabled
  const checkFeature = useCallback((flag: keyof FeatureFlags): boolean => {
    try {
      return Boolean(flags[flag]);
    } catch (err) {
      console.warn(`Failed to check feature flag ${flag}:`, err);
      return false;
    }
  }, [flags]);

  // Toggle a feature flag
  const toggleFeature = useCallback(async (flag: keyof FeatureFlags, enabled: boolean) => {
    try {
      setError(null);
      const newFlags = { ...flags, [flag]: enabled };
      setFlags(newFlags);
      safeSetStorageItem(STORAGE_KEY, newFlags);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Toggled ${flag} to ${enabled}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to toggle feature ${flag}:`, err);
      setError(errorMessage);
      throw err;
    }
  }, [flags]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    try {
      setError(null);
      const defaultFlags = getDefaultFeatureFlags();
      setFlags(defaultFlags);
      safeSetStorageItem(STORAGE_KEY, defaultFlags);
      console.log('🔄 Reset feature flags to defaults');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset flags';
      setError(errorMessage);
      console.error('Failed to reset feature flags:', err);
    }
  }, []);

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎛️ Current Feature Flags:', flags);
    }
  }, [flags]);

  return {
    flags,
    isLoading,
    error,
    checkFeature,
    toggleFeature,
    resetToDefaults
  };
};

// Individual feature flag hook
export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  const { checkFeature } = useFeatureFlags();
  
  return useMemo(() => {
    return checkFeature(flag);
  }, [checkFeature, flag]);
};

// Hook for multiple feature flags
export const useFeatureFlagsSubset = <T extends keyof FeatureFlags>(
  flagKeys: T[]
): Record<T, boolean> => {
  const { checkFeature } = useFeatureFlags();
  
  return useMemo(() => {
    const result = {} as Record<T, boolean>;
    flagKeys.forEach(flag => {
      (result as any)[flag] = checkFeature(flag);
    });
    return result;
  }, [checkFeature, flagKeys]);
};

// Feature flag with analytics tracking
export const useFeatureFlagWithAnalytics = (flag: keyof FeatureFlags) => {
  const isEnabled = useFeatureFlag(flag);
  
  const trackInteraction = useCallback(() => {
    if (isEnabled && process.env.NODE_ENV === 'development') {
      console.log(`📊 Feature interaction: ${flag}`);
    }
  }, [isEnabled, flag]);
  
  const trackCompletion = useCallback(() => {
    if (isEnabled && process.env.NODE_ENV === 'development') {
      console.log(`📊 Feature completion: ${flag}`);
    }
  }, [isEnabled, flag]);
  
  return {
    isEnabled,
    trackInteraction,
    trackCompletion
  };
};