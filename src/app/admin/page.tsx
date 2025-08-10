'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect directly to dashboard
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gold/20 mx-auto mb-4 flex items-center justify-center">
          <span className="text-gold text-2xl">→</span>
        </div>
        <p className="text-charcoal/60 font-light">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}