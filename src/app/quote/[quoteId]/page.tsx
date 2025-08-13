'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

interface Quote {
  id: string;
  quote_number: string;
  status: string;
  valid_until: string;
  terms_and_conditions: string;
  special_notes: string;
  subtotal: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount: number;
  created_at: string;
  sent_at?: string;
  viewed_at?: string;
}

export default function QuotePage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params?.quoteId as string;
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (quoteId) {
      loadQuote();
      markAsViewed();
    }
  }, [quoteId]);

  const loadQuote = async () => {
    try {
      const response = await fetch(`/api/quotes?quote_id=${quoteId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      setQuote(result.data);
    } catch (error) {
      console.error('Error loading quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async () => {
    try {
      await fetch(`/api/quotes/${quoteId}/view`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking quote as viewed:', error);
    }
  };

  const acceptQuote = async () => {
    setAccepting(true);
    try {
      const response = await fetch(`/api/quotes/${quoteId}/accept`, {
        method: 'POST'
      });

      if (response.ok) {
        // Redirect to contract page
        router.push(`/contract/${quoteId}`);
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
    } finally {
      setAccepting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="text-charcoal text-xl mb-4">Loading quote...</div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Quote not found</div>
          <button 
            onClick={() => window.close()}
            className="px-6 py-3 bg-charcoal text-white font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(quote.valid_until) < new Date();

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-gradient-to-b from-charcoal to-charcoal/90 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Image 
                src="/sean-evans-logo.png" 
                alt="Sean Evans Photography" 
                width={120} 
                height={40}
                className="opacity-90"
              />
              <div className="border-l border-white/20 pl-6">
                <h1 className="text-3xl font-light tracking-wide mb-2">Quote {quote.quote_number}</h1>
                <p className="text-white/70 font-light">Sean Evans Photography</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-light tracking-wide uppercase ${
                quote.status === 'accepted' ? 'bg-verde text-white' :
                quote.status === 'sent' ? 'bg-blue-500 text-white' :
                isExpired ? 'bg-red-500 text-white' :
                'bg-white/20 text-white'
              }`}>
                {isExpired && quote.status !== 'accepted' ? 'Expired' : quote.status}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Quote Details */}
        <div className="bg-white border border-charcoal/10 shadow-lg mb-8">
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-light text-charcoal mb-4">Quote Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal/70">Quote Number:</span>
                    <span className="text-charcoal font-medium">{quote.quote_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/70">Created:</span>
                    <span className="text-charcoal font-medium">
                      {new Date(quote.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/70">Valid Until:</span>
                    <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-charcoal'}`}>
                      {new Date(quote.valid_until).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-light text-charcoal mb-4">Investment</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal/70">Subtotal:</span>
                    <span className="text-charcoal">{formatCurrency(quote.subtotal)}</span>
                  </div>
                  {(quote.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-verde">
                      <span>Discount:</span>
                      <span>-{formatCurrency(quote.discount_amount || 0)}</span>
                    </div>
                  )}
                  {(quote.tax_amount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-charcoal/70">Tax:</span>
                      <span className="text-charcoal">{formatCurrency(quote.tax_amount || 0)}</span>
                    </div>
                  )}
                  <div className="border-t border-charcoal/10 pt-2 mt-4">
                    <div className="flex justify-between">
                      <span className="text-charcoal font-medium">Total:</span>
                      <span className="text-charcoal font-medium text-xl">
                        {formatCurrency(quote.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Notes */}
            {quote.special_notes && (
              <div className="mb-8">
                <h3 className="text-lg font-light text-charcoal mb-4">Session Details</h3>
                <div className="bg-ivory/30 border border-charcoal/10 p-6">
                  <div className="whitespace-pre-line text-sm text-charcoal/80 font-light">
                    {quote.special_notes}
                  </div>
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
            <div className="mb-8">
              <h3 className="text-lg font-light text-charcoal mb-4">Terms & Conditions</h3>
              <div className="bg-charcoal/5 border border-charcoal/10 p-6 max-h-64 overflow-y-auto">
                <div className="whitespace-pre-line text-xs text-charcoal/70 font-light leading-relaxed">
                  {quote.terms_and_conditions}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              {quote.status !== 'accepted' && !isExpired && (
                <button 
                  onClick={acceptQuote}
                  disabled={accepting}
                  className="bg-verde text-white py-4 px-8 text-sm font-light tracking-wide uppercase hover:bg-verde/90 transition-all duration-300 disabled:opacity-50"
                >
                  {accepting ? 'Processing...' : 'Accept Quote & Continue to Contract'}
                </button>
              )}
              
              <button 
                onClick={() => window.print()}
                className="border border-charcoal/30 text-charcoal py-4 px-8 text-sm font-light tracking-wide uppercase hover:border-charcoal hover:bg-charcoal hover:text-white transition-all duration-300"
              >
                Print Quote
              </button>
              
              <button 
                onClick={() => window.close()}
                className="border border-charcoal/30 text-charcoal py-4 px-8 text-sm font-light tracking-wide uppercase hover:border-charcoal hover:bg-charcoal hover:text-white transition-all duration-300"
              >
                Close
              </button>
            </div>

            {isExpired && quote.status !== 'accepted' && (
              <div className="mt-6 text-center">
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                  This quote has expired. Please contact us to generate a new quote.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}