'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Quote {
  id: string;
  quote_number: string;
  total_amount: number;
  special_notes: string;
}

interface Contract {
  id: string;
  contract_number: string;
  client_signature: string;
  client_signed_at: string;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params?.quoteId as string;
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (quoteId) {
      loadBookingData();
    }
  }, [quoteId]);

  const loadBookingData = async () => {
    try {
      // Load quote data
      const quoteResponse = await fetch(`/api/quotes?quote_id=${quoteId}`);
      const quoteResult = await quoteResponse.json();

      if (quoteResponse.ok) {
        setQuote(quoteResult.data);
      }

      // Load contract data
      const contractResponse = await fetch(`/api/contracts?quote_id=${quoteId}`);
      const contractResult = await contractResponse.json();

      if (contractResponse.ok) {
        setContract(contractResult.data);
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (paymentType: 'deposit' | 'full') => {
    setPaymentProcessing(true);
    try {
      const amount = paymentType === 'deposit' 
        ? Math.round(quote!.total_amount * 0.5) 
        : quote!.total_amount;

      // In a real implementation, this would integrate with Stripe, PayPal, etc.
      // For now, we'll simulate the payment process
      
      alert(`Processing ${paymentType === 'deposit' ? 'deposit' : 'full'} payment of $${amount}...

This would integrate with your payment processor (Stripe, PayPal, etc.).

After payment, the client would receive:
- Payment confirmation
- Session booking calendar link
- Welcome packet with session details

Your admin dashboard would show the new booking and payment status.`);

      // Simulate successful payment
      setTimeout(() => {
        alert('Payment processed successfully! The photographer will contact you within 24 hours to schedule your session.');
        window.close();
      }, 2000);

    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment. Please try again.');
    } finally {
      setPaymentProcessing(false);
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
          <div className="text-charcoal text-xl mb-4">Loading booking details...</div>
        </div>
      </div>
    );
  }

  if (!quote || !contract) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Booking information not found</div>
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

  const depositAmount = Math.round(quote.total_amount * 0.5);
  const remainingAmount = quote.total_amount - depositAmount;

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-gradient-to-b from-verde to-verde/90 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-light tracking-wide mb-4">Congratulations!</h1>
            <p className="text-xl font-light text-white/90 mb-2">Your contract has been signed</p>
            <p className="text-white/70 font-light">Complete your booking with payment below</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Contract Confirmation */}
        <div className="bg-white border border-charcoal/10 shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className="text-verde text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-light text-charcoal mb-2">Contract Signed Successfully</h2>
            <p className="text-charcoal/70">
              Contract #{contract.contract_number} signed by {contract.client_signature}
            </p>
            <p className="text-charcoal/60 text-sm">
              {new Date(contract.client_signed_at).toLocaleDateString()}
            </p>
          </div>

          {/* Session Summary */}
          <div className="bg-ivory/30 border border-charcoal/10 p-6 rounded mb-8">
            <h3 className="text-lg font-light text-charcoal mb-4">Session Summary</h3>
            <div className="whitespace-pre-line text-sm text-charcoal/80">
              {quote.special_notes}
            </div>
          </div>

          {/* Payment Options */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-light text-charcoal mb-2">Complete Your Booking</h3>
              <p className="text-charcoal/70 text-sm mb-6">
                Choose your payment option below. A deposit secures your session date.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deposit Option */}
              <div className="bg-white border-2 border-verde/30 p-6 rounded-lg shadow-sm">
                <div className="text-center mb-4">
                  <div className="bg-verde/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-verde text-2xl">50%</span>
                  </div>
                  <h4 className="text-lg font-light text-charcoal mb-2">Deposit Payment</h4>
                  <div className="text-2xl font-light text-charcoal mb-2">
                    {formatCurrency(depositAmount)}
                  </div>
                  <p className="text-sm text-charcoal/70 mb-4">
                    Secure your session date. Balance due 24 hours before session.
                  </p>
                </div>
                <button 
                  onClick={() => processPayment('deposit')}
                  disabled={paymentProcessing}
                  className="w-full bg-verde text-white py-3 px-6 text-sm font-light tracking-wide uppercase hover:bg-verde/90 transition-all duration-300 disabled:opacity-50"
                >
                  {paymentProcessing ? 'Processing...' : `Pay ${formatCurrency(depositAmount)} Deposit`}
                </button>
                <p className="text-xs text-charcoal/60 mt-2 text-center">
                  Remaining: {formatCurrency(remainingAmount)}
                </p>
              </div>

              {/* Full Payment Option */}
              <div className="bg-white border-2 border-charcoal/20 p-6 rounded-lg shadow-sm">
                <div className="text-center mb-4">
                  <div className="bg-charcoal/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-charcoal text-2xl">💳</span>
                  </div>
                  <h4 className="text-lg font-light text-charcoal mb-2">Full Payment</h4>
                  <div className="text-2xl font-light text-charcoal mb-2">
                    {formatCurrency(quote.total_amount)}
                  </div>
                  <p className="text-sm text-charcoal/70 mb-4">
                    Pay in full now and you're all set!
                  </p>
                </div>
                <button 
                  onClick={() => processPayment('full')}
                  disabled={paymentProcessing}
                  className="w-full bg-charcoal text-white py-3 px-6 text-sm font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300 disabled:opacity-50"
                >
                  {paymentProcessing ? 'Processing...' : `Pay ${formatCurrency(quote.total_amount)} Full`}
                </button>
                <p className="text-xs text-verde/70 mt-2 text-center">
                  ✓ Payment complete - nothing more due
                </p>
              </div>
            </div>

            <div className="text-center pt-6 border-t border-charcoal/10">
              <p className="text-sm text-charcoal/70 mb-4">
                🔒 Secure payment processing • 100% satisfaction guaranteed
              </p>
              <button 
                onClick={() => window.history.back()}
                className="text-charcoal/60 text-sm font-light tracking-wide uppercase hover:text-charcoal transition-colors"
              >
                ← Back to Contract
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}