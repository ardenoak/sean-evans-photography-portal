'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Logo from '@/components/Logo';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  session_type_interest?: string;
  budget_range?: string;
  message?: string;
}

interface CustomService {
  id: string;
  category: 'experiences' | 'enhancements' | 'motion';
  name: string;
  description: string;
  price: number;
  details?: string;
}

// Available services for custom proposals
const availableServices: CustomService[] = [
  // Experiences
  {
    id: 'portrait-90min',
    category: 'experiences',
    name: 'Portrait Session (90 min)',
    description: 'Professional portrait session with editorial direction',
    price: 650,
    details: 'Single location, 1 look, 15-20 edited images'
  },
  {
    id: 'portrait-3hr',
    category: 'experiences', 
    name: 'Extended Portrait Session (3 hrs)',
    description: 'Extended session with multiple looks and locations',
    price: 1200,
    details: '2-3 locations, 3 looks, 40-50 edited images'
  },
  {
    id: 'editorial-shoot',
    category: 'experiences',
    name: 'Editorial Shoot (4 hrs)',
    description: 'Full editorial experience with cinematic storytelling',
    price: 1600,
    details: '4 locations, unlimited looks, full gallery'
  },
  {
    id: 'headshot-session',
    category: 'experiences',
    name: 'Professional Headshots',
    description: 'Business headshots with multiple outfit changes',
    price: 450,
    details: 'Studio or single location, 3 looks, 10-15 images'
  },

  // Enhancements
  {
    id: 'full-gallery',
    category: 'enhancements',
    name: 'Full Gallery Access',
    description: 'Access to all unedited images from the session',
    price: 250,
    details: 'Lightly processed, not retouched'
  },
  {
    id: 'studio-vignette',
    category: 'enhancements',
    name: 'Studio Vignette',
    description: 'Controlled studio portraits with editorial lighting',
    price: 150,
    details: 'Professional studio setup, dramatic lighting'
  },
  {
    id: 'additional-looks',
    category: 'enhancements',
    name: 'Additional Looks',
    description: 'Extra outfit changes and styling concepts',
    price: 75,
    details: 'Per additional look/outfit change'
  },
  {
    id: 'rush-delivery',
    category: 'enhancements', 
    name: 'Rush Delivery',
    description: 'Expedited delivery of final gallery',
    price: 300,
    details: 'Complete gallery within 48 hours'
  },

  // Motion
  {
    id: 'motion-portrait',
    category: 'motion',
    name: 'Motion Portrait (15 sec)',
    description: 'Brief artistic video capturing your energy',
    price: 100,
    details: 'Perfect for social media and digital use'
  },
  {
    id: 'highlight-reel',
    category: 'motion',
    name: 'Highlight Reel (30 sec)',
    description: 'Cinematic story with dynamic cuts',
    price: 250,
    details: 'Professional editing with elevated production'
  },
  {
    id: 'editorial-feature',
    category: 'motion',
    name: 'Editorial Feature (60-90 sec)',
    description: 'Full narrative showcasing complete experience',
    price: 400,
    details: 'Complete story arc with professional editing'
  }
];

export default function CustomProposalBuilder() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.leadId as string;
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (leadId) {
      loadLead();
    }
  }, [leadId]);

  const loadLead = async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('Error loading lead:', result.error);
        setLoading(false);
        return;
      }
      
      if (!result.data) {
        console.error('No lead found with ID:', leadId);
        setLoading(false);
        return;
      }
      
      setLead(result.data);
    } catch (error) {
      console.error('Error loading lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const getSelectedServicesByCategory = (category: 'experiences' | 'enhancements' | 'motion') => {
    return availableServices.filter(service => 
      service.category === category && selectedServices.includes(service.id)
    );
  };

  const calculateTotal = () => {
    return availableServices
      .filter(service => selectedServices.includes(service.id))
      .reduce((total, service) => total + service.price, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const createCustomProposal = async () => {
    if (!lead || selectedServices.length === 0) {
      alert('Please select at least one service');
      return;
    }

    setCreating(true);
    try {
      const selectedServiceData = availableServices.filter(service => 
        selectedServices.includes(service.id)
      );

      const experiences = getSelectedServicesByCategory('experiences');
      const enhancements = getSelectedServicesByCategory('enhancements');  
      const motion = getSelectedServicesByCategory('motion');

      const quoteData = {
        lead_id: leadId,
        proposal_id: null,
        selected_package: `Custom Experience - ${experiences.map(e => e.name).join(', ')}`,
        selected_addons: enhancements.map(e => e.name),
        selected_video_addons: motion.map(m => m.name),
        total_amount: calculateTotal(),
        client_name: `${lead.first_name} ${lead.last_name}`,
        client_email: lead.email,
        package_details: {
          title: 'Custom Photography Experience',
          description: 'Personalized photography experience tailored to your specific needs and vision.',
          sessions: experiences.length > 0 ? experiences[0].details || 'Custom duration' : 'To be determined',
          locations: 'Custom locations based on selected experience',
          gallery: 'Curated selection of professionally edited images',
          looks: 'Multiple styling options available',
          delivery: '7-14 day delivery',
          video: motion.length > 0 ? motion.map(m => m.name).join(', ') : null,
          turnaround: experiences.length > 0 ? '48 Hour Sneak Peek' : 'No sneak peek',
          fineArt: null,
          investment_note: 'All services and production included',
          theme_keywords: 'custom tailored experience'
        }
      };

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quoteData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create custom proposal');
      }

      // Navigate to quote page
      window.location.href = `/quote/${result.quote.id}`;
    } catch (error) {
      console.error('Error creating custom proposal:', error);
      alert('Error creating custom proposal. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="text-charcoal text-xl mb-4">Loading...</div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Lead not found</div>
          <button 
            onClick={() => router.push('/tally/leads')}
            className="px-6 py-3 bg-charcoal text-white font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  const experiences = availableServices.filter(s => s.category === 'experiences');
  const enhancements = availableServices.filter(s => s.category === 'enhancements'); 
  const motionServices = availableServices.filter(s => s.category === 'motion');

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="relative bg-ivory border-b border-charcoal/10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push('/tally/leads')}
              className="text-charcoal/60 hover:text-charcoal transition-colors text-lg"
            >
              ←
            </button>
            <Logo 
              width={180} 
              height={60}
              variant="light"
              className="opacity-90"
            />
            <div className="border-l border-charcoal/20 pl-6">
              <h1 className="text-3xl font-light text-charcoal tracking-wide">Custom Proposal Builder</h1>
              <p className="text-charcoal/70 font-light">For {lead.first_name} {lead.last_name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Experiences Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-charcoal tracking-wide mb-4">Experiences</h2>
            <div className="w-16 h-px bg-charcoal/20 mx-auto"></div>
            <p className="text-charcoal/60 font-light mt-4">Select the core photography experience</p>
          </div>

          <div className="space-y-4">
            {experiences.map((service) => (
              <div
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`border cursor-pointer transition-all duration-300 ${
                  selectedServices.includes(service.id) 
                    ? 'border-charcoal/50 bg-white shadow-lg' 
                    : 'border-charcoal/20 hover:border-charcoal/40 bg-white hover:bg-ivory/50'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                          selectedServices.includes(service.id) 
                            ? 'border-charcoal bg-charcoal' 
                            : 'border-charcoal/40'
                        }`}>
                          {selectedServices.includes(service.id) && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          )}
                        </div>
                        <h3 className="text-lg font-light text-charcoal">{service.name}</h3>
                      </div>
                      <p className="text-charcoal/70 font-light mb-2">{service.description}</p>
                      {service.details && (
                        <p className="text-sm text-charcoal/60 font-light">{service.details}</p>
                      )}
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-2xl font-light text-charcoal">
                        {formatCurrency(service.price)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhancements Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-charcoal tracking-wide mb-4">Enhancements</h2>
            <div className="w-16 h-px bg-charcoal/20 mx-auto"></div>
            <p className="text-charcoal/60 font-light mt-4">Optional additions to enhance your experience</p>
          </div>

          <div className="space-y-4">
            {enhancements.map((service) => (
              <div
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`border cursor-pointer transition-all duration-300 ${
                  selectedServices.includes(service.id) 
                    ? 'border-charcoal/50 bg-white shadow-lg' 
                    : 'border-charcoal/20 hover:border-charcoal/40 bg-white hover:bg-ivory/50'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                          selectedServices.includes(service.id) 
                            ? 'border-charcoal bg-charcoal' 
                            : 'border-charcoal/40'
                        }`}>
                          {selectedServices.includes(service.id) && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          )}
                        </div>
                        <h3 className="text-lg font-light text-charcoal">{service.name}</h3>
                      </div>
                      <p className="text-charcoal/70 font-light mb-2">{service.description}</p>
                      {service.details && (
                        <p className="text-sm text-charcoal/60 font-light">{service.details}</p>
                      )}
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-2xl font-light text-charcoal">
                        {formatCurrency(service.price)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Motion Section */}
        <div className="mb-16">
          <div className="bg-charcoal text-white">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-light tracking-wide mb-4">Motion</h2>
                <div className="w-16 h-px bg-white/30 mx-auto"></div>
                <p className="text-white/70 font-light mt-4">Cinematic video elements</p>
              </div>

              <div className="space-y-4">
                {motionServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`border cursor-pointer transition-all duration-300 ${
                      selectedServices.includes(service.id) 
                        ? 'border-white/70 bg-white/15' 
                        : 'border-white/30 hover:border-white/50 hover:bg-white/5'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                              selectedServices.includes(service.id) 
                                ? 'border-white bg-white' 
                                : 'border-white/50'
                            }`}>
                              {selectedServices.includes(service.id) && (
                                <div className="w-2.5 h-2.5 bg-charcoal rounded-full"></div>
                              )}
                            </div>
                            <h3 className="text-lg font-light">{service.name}</h3>
                          </div>
                          <p className="text-white/80 font-light mb-2">{service.description}</p>
                          {service.details && (
                            <p className="text-sm text-white/70 font-light">{service.details}</p>
                          )}
                        </div>
                        <div className="text-right ml-6">
                          <div className="text-2xl font-light">
                            {formatCurrency(service.price)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary & Create */}
        <div className="border border-charcoal/20 bg-white p-8 text-center">
          <h3 className="text-2xl font-light text-charcoal tracking-wide mb-6">Custom Proposal Summary</h3>
          
          {selectedServices.length === 0 ? (
            <p className="text-charcoal/60 font-light">No services selected</p>
          ) : (
            <div className="space-y-4 mb-8">
              <div className="text-4xl font-light text-charcoal">
                {formatCurrency(calculateTotal())}
              </div>
              <div className="text-charcoal/70 font-light">
                {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={createCustomProposal}
              disabled={selectedServices.length === 0 || creating}
              className="bg-charcoal text-white py-4 px-8 text-sm font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating Proposal...' : 'Create Custom Proposal'}
            </button>
            
            <button
              onClick={() => router.push('/tally/leads')}
              className="border border-charcoal/30 text-charcoal py-4 px-8 text-sm font-light tracking-wide uppercase hover:border-charcoal hover:bg-charcoal hover:text-white transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}