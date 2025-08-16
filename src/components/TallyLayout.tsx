'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Logo from '@/components/Logo';
import { useLuxuryTokens } from '@/components/design-system/foundations/useLuxuryTokens';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  current?: boolean;
  description?: string;
}

// Enhanced Professional Photography-Themed Navigation Icons
// Luxury design system aligned with charcoal/verde/gold/ivory palette
// Optimized for accessibility and visual sophistication
const NavigationIcons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
      {/* Analytics grid with sophisticated visual hierarchy */}
      <rect x="3" y="4" width="6" height="5" rx="1" strokeWidth={1.2} />
      <rect x="11" y="4" width="6" height="5" rx="1" strokeWidth={1.2} />
      <rect x="19" y="4" width="2" height="5" rx="0.5" strokeWidth={1.2} />
      <rect x="3" y="11" width="6" height="9" rx="1" strokeWidth={1.2} />
      <rect x="11" y="14" width="6" height="6" rx="1" strokeWidth={1.2} />
      <rect x="19" y="11" width="2" height="9" rx="0.5" strokeWidth={1.2} />
      
      {/* Analytics indicators with luxury accents */}
      <circle cx="6" cy="6.5" r="0.8" fill="currentColor" opacity="0.7" />
      <circle cx="14" cy="6.5" r="0.8" fill="currentColor" opacity="0.7" />
      <path d="M4 15.5L6 13.5L8 16L8.5 15.5" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <path d="M12 17L14 15L16 17.5L17 16.5" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      
      {/* Subtle luxury accent */}
      <circle cx="20" cy="7" r="0.3" fill="currentColor" opacity="0.5" />
      <circle cx="20" cy="13" r="0.3" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  leads: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
      {/* Lead funnel representation */}
      <path d="M3 6L21 6C21 6 18 9 12 9C6 9 3 6 3 6Z" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9L19 9C19 9 16.5 12 12 12C7.5 12 5 9 5 9Z" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 12L17 12C17 12 15 15 12 15C9 15 7 12 7 12Z" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 15L15 15C15 15 13.5 18 12 18C10.5 18 9 15 9 15Z" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Lead indicators with professional styling */}
      <circle cx="8" cy="6" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="12" cy="6" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="16" cy="6" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="12" cy="9" r="0.8" fill="currentColor" opacity="0.7" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" opacity="0.8" />
      
      {/* Success indicator */}
      <path d="M10.5 17.5L12 19L15 16" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  ),
  packages: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
      {/* Elegant package tiers representation */}
      <rect x="3" y="7" width="5" height="13" rx="1" strokeWidth={1.2} />
      <rect x="9.5" y="5" width="5" height="15" rx="1" strokeWidth={1.2} />
      <rect x="16" y="3" width="5" height="17" rx="1" strokeWidth={1.2} />
      
      {/* Package content indicators */}
      <path d="M4.5 10H6.5M4.5 12H6.5M4.5 14H6.5" strokeWidth={1} strokeLinecap="round" opacity="0.7" />
      <path d="M11 8H13M11 10H13M11 12H13M11 14H13" strokeWidth={1} strokeLinecap="round" opacity="0.7" />
      <path d="M17.5 6H19.5M17.5 8H19.5M17.5 10H19.5M17.5 12H19.5M17.5 14H19.5" strokeWidth={1} strokeLinecap="round" opacity="0.7" />
      
      {/* Premium indicators */}
      <circle cx="5.5" cy="8.5" r="0.4" fill="currentColor" opacity="0.5" />
      <circle cx="12" cy="6.5" r="0.4" fill="currentColor" opacity="0.6" />
      <path d="M17.8 4.2L18.5 3.5L19.2 4.2" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      
      {/* Luxury ribbon accent */}
      <path d="M18.5 2L18.5 4.5" strokeWidth={1.5} strokeLinecap="round" opacity="0.7" />
    </svg>
  ),
  sessions: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
      {/* Professional camera body */}
      <path d="M7 6.5L8.5 5H15.5L17 6.5H20C20.5 6.5 21 7 21 7.5V18C21 18.5 20.5 19 20 19H4C3.5 19 3 18.5 3 18V7.5C3 7 3.5 6.5 4 6.5H7Z" strokeWidth={1.2} strokeLinejoin="round" />
      
      {/* Camera lens with sophisticated details */}
      <circle cx="12" cy="12.5" r="3.5" strokeWidth={1.2} />
      <circle cx="12" cy="12.5" r="2.2" strokeWidth={1} opacity="0.8" />
      <circle cx="12" cy="12.5" r="1" strokeWidth={0.8} opacity="0.6" />
      
      {/* Lens reflections and highlights */}
      <path d="M10.5 11L11.5 10" strokeWidth={0.8} strokeLinecap="round" opacity="0.7" />
      <circle cx="13.2" cy="11.3" r="0.3" fill="currentColor" opacity="0.5" />
      
      {/* Camera details */}
      <rect x="17.5" y="8.5" width="1.5" height="1" rx="0.2" strokeWidth={0.8} opacity="0.7" />
      <circle cx="18.5" cy="8" r="0.3" fill="currentColor" opacity="0.6" />
      
      {/* Viewfinder */}
      <rect x="5" y="8.5" width="1" height="0.5" rx="0.1" strokeWidth={0.8} opacity="0.7" />
      
      {/* Photography elegance accent */}
      <path d="M8 4.5L8.5 4L9 4.5" strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  ),
  clients: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
      {/* Sophisticated client representation */}
      <circle cx="12" cy="7" r="3" strokeWidth={1.2} />
      
      {/* Client relationship indicators */}
      <path d="M5.5 20C5.5 16.5 8.5 13.5 12 13.5C15.5 13.5 18.5 16.5 18.5 20" strokeWidth={1.2} strokeLinecap="round" />
      
      {/* Professional relationship symbols */}
      <circle cx="6" cy="9" r="1.5" strokeWidth={1} opacity="0.7" />
      <circle cx="18" cy="9" r="1.5" strokeWidth={1} opacity="0.7" />
      <path d="M6 12.5C6 13.5 6.5 14.5 7.5 15" strokeWidth={1} strokeLinecap="round" opacity="0.6" />
      <path d="M18 12.5C18 13.5 17.5 14.5 16.5 15" strokeWidth={1} strokeLinecap="round" opacity="0.6" />
      
      {/* Client satisfaction indicators */}
      <path d="M10 6L12 5L14 6" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <circle cx="12" cy="7" r="0.8" fill="currentColor" opacity="0.3" />
      
      {/* Connection lines */}
      <path d="M8.5 10.5L10 12" strokeWidth={0.8} strokeLinecap="round" opacity="0.5" />
      <path d="M15.5 10.5L14 12" strokeWidth={0.8} strokeLinecap="round" opacity="0.5" />
      
      {/* Trust indicator */}
      <path d="M11 8.5L11.5 9L12.5 8" strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
      {/* Professional settings gear */}
      <circle cx="12" cy="12" r="6.5" strokeWidth={1.2} />
      <circle cx="12" cy="12" r="3.5" strokeWidth={1} opacity="0.8" />
      <circle cx="12" cy="12" r="1.5" strokeWidth={1.2} />
      
      {/* Primary gear teeth */}
      <path d="M12 5.5V7.5M12 16.5V18.5M18.5 12H16.5M7.5 12H5.5" strokeWidth={1.2} strokeLinecap="round" />
      
      {/* Secondary gear teeth */}
      <path d="M16.6 7.4L15.2 8.8M8.8 15.2L7.4 16.6M16.6 16.6L15.2 15.2M8.8 8.8L7.4 7.4" strokeWidth={1} strokeLinecap="round" opacity="0.7" />
      
      {/* Tertiary gear teeth for luxury detail */}
      <path d="M14.8 6.2L14 7.6M10 16.4L9.2 17.8M17.8 10L16.4 10.8M6.2 14L7.6 13.2" strokeWidth={0.8} strokeLinecap="round" opacity="0.5" />
      
      {/* Center mechanism */}
      <circle cx="12" cy="12" r="0.8" fill="currentColor" opacity="0.6" />
      <circle cx="12" cy="12" r="0.3" fill="currentColor" opacity="0.9" />
      
      {/* Professional indicators */}
      <path d="M12 8.5L12.2 8.3L12.4 8.5" strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <path d="M15.5 12L15.7 11.8L15.9 12" strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  ),
};

type IconKey = keyof typeof NavigationIcons;

// Navigation items with feature flag integration
const getNavigationItems = (dashboardAnalyticsEnabled: boolean, enhancedSearchEnabled: boolean): (NavItem & { iconKey: IconKey; featureFlag?: string })[] => [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: '📊',
    iconKey: 'dashboard',
    description: 'Overview and analytics'
  },
  { 
    name: 'Leads', 
    href: '/leads', 
    icon: '👥',
    iconKey: 'leads',
    description: 'Prospect pipeline'
  },
  { 
    name: 'Packages', 
    href: '/packages', 
    icon: '📦',
    iconKey: 'packages',
    description: 'Service offerings'
  },
  { 
    name: 'Sessions', 
    href: '/sessions', 
    icon: '📸',
    iconKey: 'sessions',
    description: 'Photo shoots'
  },
  { 
    name: 'Clients', 
    href: '/clients', 
    icon: '🤝',
    iconKey: 'clients',
    description: 'Client relationships'
  },
];

export default function TallyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { tokens } = useLuxuryTokens();
  
  // Enhanced Navigation is now the permanent default - no feature flag needed
  const useEnhancedNavigation = true;
  const trackInteraction = () => {}; // Placeholder for analytics
  
  // Additional feature flags for navigation enhancements
  const enhancedSearchEnabled = useFeatureFlag('enhancedSearch');
  const dashboardAnalyticsEnabled = useFeatureFlag('dashboardAnalytics');
  const debugModeEnabled = process.env.NODE_ENV === 'development';
  
  // Get navigation items based on feature flags
  const navigation = getNavigationItems(dashboardAnalyticsEnabled, enhancedSearchEnabled);
  
  // Enhanced Navigation is permanently enabled - analytics placeholder
  useEffect(() => {
    trackInteraction();
  }, []);
  
  // Responsive detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isCurrentPath = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Enhanced Navigation Component
  const EnhancedDesktopNav = () => (
    <div className="bg-white border-b border-warm-gray/10 shadow-luxury-sm">
      <div className="max-w-7xl mx-auto px-luxury-lg">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo width={140} height={45} variant="light" className="opacity-95" />
          </div>
          
          {/* Enhanced Horizontal Navigation with Improved Spacing */}
          <nav className="hidden lg:flex items-center space-x-luxury-xs xl:space-x-luxury-sm">
            {navigation.map((item) => {
              const isActive = isCurrentPath(item.href);
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-verde border-b-2 border-verde'
                      : 'text-charcoal/70 hover:text-verde'
                  }`}
                  title={item.description}
                  aria-label={`Navigate to ${item.name}`}
                >
                  <span className="mr-2">
                    {NavigationIcons[item.iconKey]}
                  </span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
          
          {/* Settings Menu */}
          <div className="hidden lg:flex items-center">
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center px-4 py-2 text-sm font-medium text-charcoal/70 hover:text-verde transition-colors"
              title="Settings"
              aria-label="Open settings"
            >
              {NavigationIcons.settings}
            </button>
          </div>
          
          {/* Enhanced Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-luxury-md text-warm-gray hover:text-verde transition-all duration-luxury hover:bg-verde/8 hover:scale-102 hover:shadow-luxury-sm rounded-luxury-lg min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Open navigation menu"
          >
            <svg className="w-6 h-6 transition-transform duration-luxury hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
  
  // Enhanced Mobile Bottom Navigation with Optimized Touch Targets
  const EnhancedMobileNav = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/96 backdrop-blur-luxury-md border-t border-warm-gray/12 shadow-luxury-lg">
        <div className="grid grid-cols-5 gap-0.5 px-1 py-2">
          {navigation.map((item) => {
            const isActive = isCurrentPath(item.href);
            return (
              <button
                key={item.name}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={`flex flex-col items-center justify-center py-2.5 px-1 min-h-[68px] min-w-[68px] rounded-luxury-lg transition-all duration-luxury transform ${
                  isActive
                    ? 'text-verde bg-verde/12 shadow-luxury-sm scale-105 border border-verde/20'
                    : 'text-warm-gray active:text-verde active:bg-verde/8 active:scale-95 hover:bg-verde/5'
                }`}
                aria-label={`Navigate to ${item.name}`}
                title={item.description}
              >
                <span className={`mb-1.5 transition-all duration-luxury ${
                  isActive ? 'scale-110 opacity-100' : 'scale-100 opacity-80 active:scale-90'
                }`}>
                  {NavigationIcons[item.iconKey]}
                </span>
                <span className={`text-luxury-xs font-medium font-luxury-sans leading-tight text-center transition-all duration-luxury ${
                  isActive ? 'opacity-100 text-verde' : 'opacity-70'
                }`}>
                  {item.name.split(' ')[0]}
                </span>
                
                {/* Enhanced active indicator */}
                {isActive && (
                  <>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-verde via-gold to-verde rounded-b-full shadow-sm" />
                    <div className="absolute inset-0 rounded-luxury-lg bg-gradient-to-br from-verde/8 via-transparent to-gold/6 opacity-60" />
                  </>
                )}
                
                {/* Feature flag indicator for mobile */}
                {item.featureFlag && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-gold rounded-full opacity-80" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Enhanced safe area padding with gradient */}
      <div className="h-[env(safe-area-inset-bottom)] bg-gradient-to-b from-white/96 to-white/98" />
    </div>
  );

  return (
    <div className="min-h-screen bg-ivory">
        <div className="flex flex-col min-h-screen">
          {/* Enhanced Desktop Navigation */}
          <EnhancedDesktopNav />
          
          {/* Enhanced Mobile Navigation */}
          <EnhancedMobileNav />
          
          {/* Enhanced Navigation Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Page content with optimized spacing for mobile bottom nav */}
            <main className="flex-1 overflow-hidden pb-[88px] lg:pb-0">
              <div className="h-full lg:pt-0">
                {children}
              </div>
            </main>
          </div>
        </div>
      
      {/* Enhanced Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-luxury-xl transform transition-transform duration-luxury">
            <div className="flex flex-col h-full">
              {/* Mobile Sidebar Header */}
              <div className="flex items-center justify-between h-16 px-luxury-lg border-b border-warm-gray/10">
                <Logo width={120} height={40} variant="light" className="opacity-95" />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-luxury-sm text-warm-gray hover:text-charcoal transition-colors duration-luxury"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Enhanced Mobile Sidebar Navigation with Optimized Touch Targets */}
              <nav className="flex-1 px-luxury-md py-luxury-lg space-y-luxury-xs overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = isCurrentPath(item.href);
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        router.push(item.href);
                        setSidebarOpen(false);
                      }}
                      className={`group flex items-center w-full px-luxury-md py-luxury-lg text-luxury-base font-medium tracking-wide rounded-luxury-xl transition-all duration-luxury min-h-[56px] ${
                        isActive
                          ? 'bg-verde/12 text-verde border-l-4 border-verde shadow-luxury-sm'
                          : 'text-warm-gray hover:bg-verde/6 hover:text-verde hover:shadow-luxury-sm'
                      }`}
                      aria-label={`Navigate to ${item.name}`}
                    >
                      <span className={`mr-luxury-md text-current transition-transform duration-luxury ${
                        isActive ? 'scale-110' : 'group-hover:scale-105'
                      }`}>
                        {NavigationIcons[item.iconKey]}
                      </span>
                      <div className="flex-1 text-left">
                        <span className="font-luxury-sans block">{item.name}</span>
                        {item.description && (
                          <p className="text-luxury-xs text-warm-gray/70 mt-0.5 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        {/* Feature flag badge for mobile sidebar */}
                        {item.featureFlag && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gold/15 text-gold text-luxury-xs font-medium rounded-full border border-gold/25">
                            Enhanced
                          </span>
                        )}
                      </div>
                      
                      {/* Hover effect enhancement */}
                      <div className="absolute inset-0 rounded-luxury-xl bg-gradient-to-br from-verde/6 via-transparent to-gold/4 opacity-0 group-hover:opacity-100 transition-opacity duration-luxury" />
                    </button>
                  );
                })}
              </nav>
              
              {/* Mobile Sidebar Footer */}
              <div className="p-luxury-lg border-t border-warm-gray/10">
                <div className="text-center">
                  <p className="text-luxury-sm text-warm-gray font-medium tracking-wide mb-1">
                    Tally Photography
                  </p>
                  <p className="text-luxury-xs text-warm-gray/60">
                    Business Management Platform
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
        
        {/* Debug Mode Indicator - Disabled for clean UI */}
        {false && debugModeEnabled && (
          <div className="fixed bottom-4 left-4 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium z-50 shadow-lg">
            🐛 Debug Mode Active
          </div>
        )}
        
        {/* Feature Flag Status Overlay - Disabled for clean UI */}
        {false && debugModeEnabled && (
          <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-xs">
            <h4 className="font-medium mb-2">🚀 Feature Flags Status</h4>
            <div className="space-y-1">
              <div>Enhanced Navigation: {useEnhancedNavigation ? '✅' : '❌'}</div>
              <div>Enhanced Search: {enhancedSearchEnabled ? '✅' : '❌'}</div>
              <div>Dashboard Analytics: {dashboardAnalyticsEnabled ? '✅' : '❌'}</div>
              <div>Debug Mode: {debugModeEnabled ? '✅' : '❌'}</div>
            </div>
          </div>
        )}
      </div>
  );
}