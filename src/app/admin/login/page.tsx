'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAdminAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Attempting to sign in with:', email);
    const { error, data } = await signIn(email, password);

    console.log('Sign in result:', { error, data });

    if (error) {
      console.error('Sign in error:', error);
      setError(error.message || 'An error occurred during sign in');
    } else {
      console.log('Sign in successful, redirecting to dashboard');
      router.push('/admin/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal to-charcoal/90 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/sean-evans-logo.png"
            alt="Sean Evans Photography"
            width={300}
            height={120}
            className="h-16 w-auto mx-auto mb-4 brightness-0 invert"
            priority
          />
          <h1 className="text-2xl font-didot text-white mb-2">Admin Portal</h1>
          <p className="text-gold/80 text-sm">Photographer Dashboard Access</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                placeholder="admin@ardenoak.co"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-warm-gray/30 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gold to-gold/90 text-white py-3 px-6 rounded-lg font-semibold hover:from-gold/90 hover:to-gold transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Access Admin Portal'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-warm-gray/20">
            <div className="text-center">
              <Link
                href="/"
                className="text-sm text-warm-gray hover:text-charcoal transition-colors"
              >
                ← Back to Client Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6">
          <p className="text-white/70 text-xs">
            🔒 Secure admin access • Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}