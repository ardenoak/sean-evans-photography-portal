'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import Logo from '@/components/Logo';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  current?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Lead Management', href: '/leads', icon: '👥' },
  { name: 'Experience & Pricing', href: '/packages', icon: '📦' },
  { name: 'Session Management', href: '/sessions', icon: '📸' },
  { name: 'Client Relations', href: '/clients', icon: '🤝' },
];

export default function TallyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const isCurrentPath = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Expandable Sidebar */}
      <div className={`bg-charcoal transition-all duration-300 ease-in-out ${
        sidebarExpanded ? 'w-64' : 'w-16'
      } lg:relative fixed inset-y-0 left-0 z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
            {sidebarExpanded && (
              <Logo width={120} height={40} variant="dark" className="opacity-95" />
            )}
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <span className="text-sm">
                {sidebarExpanded ? '←' : '→'}
              </span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = isCurrentPath(item.href);
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false); // Close mobile sidebar
                  }}
                  className={`group flex items-center w-full px-3 py-3 text-sm font-light tracking-wide rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/10 text-white border-l-4 border-gold'
                      : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                  title={!sidebarExpanded ? item.name : undefined}
                >
                  <span className="text-lg flex-shrink-0 w-6 text-center">
                    {item.icon}
                  </span>
                  {sidebarExpanded && (
                    <span className="ml-3 tracking-wide">{item.name}</span>
                  )}
                  {!sidebarExpanded && isActive && (
                    <div className="absolute left-16 bg-charcoal text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.name}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            {sidebarExpanded ? (
              <div className="text-center">
                <p className="text-xs text-white/60 font-light tracking-wide uppercase mb-2">
                  Tally Photography
                </p>
                <p className="text-xs text-white/40 font-light">
                  Business Management
                </p>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-white/60 text-lg">📸</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-warm-gray/20">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-warm-gray hover:text-charcoal transition-colors"
            >
              <span className="text-lg">☰</span>
            </button>
            <Logo width={100} height={33} variant="light" className="opacity-90" />
            <div className="w-8"></div> {/* Spacer for center alignment */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}