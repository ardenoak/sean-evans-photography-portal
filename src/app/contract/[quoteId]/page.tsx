'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Logo from '@/components/Logo';

interface Contract {
  id: string;
  contract_number: string;
  status: string;
  terms: string;
  cancellation_policy: string;
  payment_terms: string;
  signature_required: boolean;
  client_signature?: string;
  client_signed_at?: string;
  created_at: string;
}

interface Quote {
  id: string;
  quote_number: string;
  total_amount: number;
  special_notes: string;
  selected_package: string;
  client_name: string;
  accepted_at?: string;
}

export default function ContractPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params?.quoteId as string;
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    if (quoteId) {
      loadContractData();
    }
  }, [quoteId]);

  const loadContractData = async () => {
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
      console.error('Error loading contract data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signContract = async () => {
    if (!clientName.trim()) {
      alert('Please enter your full name to sign the contract');
      return;
    }

    setSigning(true);
    try {
      const response = await fetch(`/api/contracts/${contract?.id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_name: clientName.trim()
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Redirect to payment/booking page
        router.push(`/booking/${quoteId}`);
      } else {
        alert(result.error || 'Error signing contract');
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      alert('Error signing contract. Please try again.');
    } finally {
      setSigning(false);
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
          <div className="text-charcoal text-xl mb-4">Loading contract...</div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Contract not found</div>
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

  const isSigned = contract.client_signed_at;

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-gradient-to-b from-charcoal to-charcoal/90 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Logo 
                width={120} 
                height={40}
                variant="dark"
                className="opacity-90"
              />
              <div className="border-l border-white/20 pl-6">
                <h1 className="text-3xl font-light tracking-wide mb-2">Contract {contract.contract_number}</h1>
                <p className="text-white/70 font-light">Sean Evans Photography</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-light tracking-wide uppercase ${
                isSigned ? 'bg-verde text-white' : 'bg-white/20 text-white'
              }`}>
                {isSigned ? 'Signed' : 'Pending Signature'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Quote Reference */}
        {quote && (
          <div className="bg-verde/10 border border-verde/20 p-6 mb-8 rounded">
            <h3 className="text-lg font-light text-charcoal mb-4">Session Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-lg font-light text-charcoal mb-1">
                    {quote.selected_package} Photography Session
                  </div>
                  <div className="text-sm text-charcoal/70">
                    for {quote.client_name} • Quote #{quote.quote_number}
                  </div>
                  {quote.accepted_at && (
                    <div className="text-xs text-verde font-medium mt-1">
                      Accepted on {new Date(quote.accepted_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-light text-charcoal">
                    {formatCurrency(quote.total_amount)}
                  </div>
                  <div className="text-xs text-charcoal/60">
                    Session Investment
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contract Terms */}
        <div className="bg-white border border-charcoal/10 shadow-lg mb-8">
          <div className="p-8">
            <h3 className="text-xl font-light text-charcoal mb-6">Contract Terms</h3>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-line text-sm text-charcoal/80 font-light leading-relaxed">
                {contract.terms}
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Cancellation Policies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white border border-charcoal/10 shadow-lg p-6">
            <h4 className="text-lg font-light text-charcoal mb-4">Payment Terms</h4>
            <div className="text-sm text-charcoal/80 font-light">
              {contract.payment_terms}
            </div>
          </div>

          <div className="bg-white border border-charcoal/10 shadow-lg p-6">
            <h4 className="text-lg font-light text-charcoal mb-4">Cancellation Policy</h4>
            <div className="text-sm text-charcoal/80 font-light">
              {contract.cancellation_policy}
            </div>
          </div>
        </div>

        {/* Signature Section */}
        {!isSigned ? (
          <div className="bg-white border border-charcoal/10 shadow-lg p-8">
            <h3 className="text-xl font-light text-charcoal mb-6">Electronic Signature</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-light text-charcoal/70 mb-2">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter your full legal name"
                  className="w-full px-4 py-3 border border-charcoal/20 bg-white text-charcoal font-light focus:border-charcoal/40 focus:outline-none transition-colors"
                />
                <p className="text-xs text-charcoal/60 mt-2">
                  By entering your name above, you acknowledge that this constitutes your electronic signature.
                </p>
              </div>

              <div className="bg-charcoal/5 border border-charcoal/10 p-4 rounded">
                <div className="flex items-start space-x-3">
                  <input 
                    type="checkbox" 
                    id="agreement-check"
                    className="mt-1"
                    required
                  />
                  <label htmlFor="agreement-check" className="text-sm text-charcoal/80 font-light">
                    I have read and agree to all terms and conditions outlined in this contract. 
                    I understand that this electronic signature has the same legal effect as a handwritten signature.
                  </label>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center pt-4">
                <button 
                  onClick={signContract}
                  disabled={signing || !clientName.trim()}
                  className="bg-verde text-white py-4 px-8 text-sm font-light tracking-wide uppercase hover:bg-verde/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signing ? 'Processing Signature...' : 'Sign Contract & Continue to Payment'}
                </button>
                
                <button 
                  onClick={() => window.history.back()}
                  className="border border-charcoal/30 text-charcoal py-4 px-8 text-sm font-light tracking-wide uppercase hover:border-charcoal hover:bg-charcoal hover:text-white transition-all duration-300"
                >
                  Back to Quote
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-verde/10 border border-verde/20 p-8 text-center">
            <div className="text-verde text-6xl mb-4">✓</div>
            <h3 className="text-xl font-light text-charcoal mb-2">Contract Signed Successfully</h3>
            <p className="text-charcoal/70 mb-6">
              Signed on {new Date(contract.client_signed_at!).toLocaleDateString()} by {contract.client_signature}
            </p>
            <button 
              onClick={() => router.push(`/booking/${quoteId}`)}
              className="bg-charcoal text-white py-4 px-8 text-sm font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300"
            >
              Continue to Payment & Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}