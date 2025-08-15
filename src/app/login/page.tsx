'use client';
import Image from 'next/image';
import Logo from '@/components/Logo';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <Logo 
              width={200} 
              height={67} 
              variant="light" 
              className="opacity-90"
            />
          </div>

          {/* Maintenance Message */}
          <div className="bg-white border border-charcoal/10 shadow-lg p-8 space-y-6">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl">🔧</span>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-light text-charcoal tracking-wide">
                  Client Portal Maintenance
                </h1>
                <div className="w-12 h-px bg-charcoal/30 mx-auto"></div>
              </div>
              
              <p className="text-charcoal/70 font-light leading-relaxed">
                We're currently updating our client portal to serve you better. 
                The portal will be available again soon.
              </p>
              
              <div className="bg-ivory/50 border border-charcoal/10 p-4 rounded">
                <p className="text-sm text-charcoal/60">
                  <strong>Existing Clients:</strong> You'll receive an email notification when the portal is back online.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-charcoal/10">
              <p className="text-sm text-charcoal/50">
                Questions? Contact us at{' '}
                <a href="mailto:hello@tallyhq.io" className="text-charcoal hover:text-verde transition-colors">
                  hello@tallyhq.io
                </a>
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-charcoal/40">
              Tally Photography Management • Professional Portrait Sessions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}