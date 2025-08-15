'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SimpleAdminAuthProvider, useSimpleAdminAuth } from '@/contexts/SimpleAdminAuth';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useSimpleAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin-v2/login';

  useEffect(() => {
    if (!loading) {
      if (!user && !isLoginPage) {
        router.push('/admin-v2/login');
      } else if (user && isLoginPage) {
        router.push('/admin-v2/dashboard');
      }
    }
  }, [user, loading, isLoginPage, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Show login page without header
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show protected pages with header
  if (user) {
    return (
      <div className="min-h-screen bg-ivory">
        {/* Luxury Admin Header */}
        <header className="bg-charcoal/95 backdrop-blur-sm border-b border-gold/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-6">
                <div className="flex items-center justify-center">
                  <img
                    src="/tally-logo.png"
                    alt="Tally Photography Management"
                    className="h-16 w-auto brightness-0 invert"
                  />
                </div>
                <div className="border-l border-gold/30 pl-6">
                  <h1 className="text-xl font-light text-ivory tracking-wide">Admin Portal</h1>
                  <span className="text-gold/80 text-xs font-light tracking-wider uppercase">Management Console</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-ivory/90 text-sm font-light">Welcome back,</div>
                  <div className="text-gold text-sm font-medium">{user.first_name || user.email}</div>
                </div>
                <button
                  onClick={logout}
                  className="bg-charcoal/50 hover:bg-charcoal/70 text-ivory border border-gold/30 hover:border-gold/50 px-4 py-2 rounded-sm text-sm font-light tracking-wide transition-all duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="min-h-screen">
          <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return null;
}

export default function AdminV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SimpleAdminAuthProvider>
      <AuthGuard>
        {children}
      </AuthGuard>
    </SimpleAdminAuthProvider>
  );
}