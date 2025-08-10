'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSimpleAdminAuth } from '@/contexts/SimpleAdminAuth';

export default function AdminV2LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useSimpleAdminAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    const result = await login(email, password, stayLoggedIn);

    if (result.success) {
      router.push('/admin-v2/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal via-charcoal to-warm-brown flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-repeat" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-charcoal font-bold text-xl">SE</span>
          </div>
          <h1 className="text-3xl font-light text-ivory tracking-wide mb-2">Admin Portal</h1>
          <p className="text-gold/80 text-sm font-light tracking-wider uppercase">Sean Evans Photography</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-ivory/95 backdrop-blur-sm py-12 px-8 shadow-2xl border border-gold/20" style={{ backdropFilter: 'blur(10px)' }}>
          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50/80 border border-red-200/50 text-red-700 px-4 py-3 text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-light text-charcoal/80 mb-3 tracking-wide">
                  Admin Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-0 py-3 border-0 border-b border-charcoal/20 bg-transparent text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-gold focus:ring-0 transition-colors duration-200"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-light text-charcoal/80 mb-3 tracking-wide">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-0 py-3 border-0 border-b border-charcoal/20 bg-transparent text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-gold focus:ring-0 transition-colors duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="stay-logged-in"
                  name="stay-logged-in"
                  type="checkbox"
                  checked={stayLoggedIn}
                  onChange={(e) => setStayLoggedIn(e.target.checked)}
                  className="h-4 w-4 text-gold focus:ring-gold border-charcoal/30 rounded-sm"
                />
                <label htmlFor="stay-logged-in" className="ml-3 block text-sm font-light text-charcoal/80 tracking-wide">
                  Stay logged in
                </label>
              </div>
              <div className="text-xs text-charcoal/60 font-light">
                {stayLoggedIn ? (
                  "You'll remain authenticated until manually signing out."
                ) : (
                  "Session expires after 30 minutes of inactivity."
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-charcoal hover:bg-charcoal/90 text-ivory border border-gold/30 hover:border-gold/50 px-8 py-4 text-sm font-light tracking-wider uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-ivory/30 border-t-ivory rounded-full"></div>
                    Authenticating...
                  </div>
                ) : (
                  'Enter Portal'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-charcoal/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-ivory/95 text-charcoal/60 font-light tracking-wide">Security Notice</span>
              </div>
            </div>
            <div className="mt-4 text-center text-xs text-charcoal/50 font-light">
              🔒 Secure administrative access • Authorized personnel only
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-charcoal/60 hover:text-gold font-light tracking-wide transition-colors duration-200"
            >
              ← Return to Client Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}