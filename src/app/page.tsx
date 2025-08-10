'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <Image
            src="/sean-evans-logo.png"
            alt="Sean Evans Photography"
            width={400}
            height={120}
            className="h-20 w-auto mx-auto opacity-80"
            priority
          />
        </div>
        <div className="w-8 h-8 bg-gradient-to-r from-verde to-gold rounded-full mx-auto mb-4 animate-pulse"></div>
        <p className="text-warm-gray">Redirecting to your portal...</p>
      </div>
    </div>
  );
}
