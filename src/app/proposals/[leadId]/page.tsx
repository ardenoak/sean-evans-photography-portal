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
  preferred_timeline?: string;
  preferred_time?: string;
  preferred_session_date?: string;
  lead_source?: string;
  status: string;
  message?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Package {
  id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  sessions: string;
  locations: string;
  gallery: string;
  looks: string;
  delivery: string;
  video?: string;
  turnaround: string;
  fineArt?: string;
  highlights: string[];
  investment_note: string;
  theme_keywords: string;
  image: string;
}


const addOns = [
  { name: 'Full Gallery Access', price: 250, description: 'Receive access to the complete gallery of unedited images (lightly processed, not retouched). Perfect for archiving every captured frame, not just the final editorial selection.' },
  { name: 'Studio Vignette', price: 150, description: 'Add an in-studio set for a controlled, stylized portrait vignette with editorial lighting. Vogue-level, clean, classic, or dramatic mood.' },
  { name: 'Additional Looks', price: 75, description: 'Add another outfit or concept to your shoot. Perfect for showing more sides of your story with style changes, headshots, or transformation moments.' },
  { name: 'Rush Delivery', price: 300, description: 'Need your full gallery ASAP? Get your complete curated collection delivered within 48 hours.' }
];

const videoAddOns = [
  { name: 'Motion Portrait (15 Sec.)', price: 100, description: 'A brief, artistic glimpse into your energy and expression. Perfect for Instagram, reels, and digital invites.' },
  { name: 'Highlight Reel (30 Sec.)', price: 250, description: 'Cinematic story of your session with dynamic cuts and elevated production value.' },
  { name: 'Editorial Feature (60-90 Sec.)', price: 400, description: 'Full narrative piece showcasing the complete arc of your experience with professional editing.' }
];

export default function ClientProposalPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.leadId as string;
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedVideoAddOns, setSelectedVideoAddOns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  
  // New state for experience-based proposals
  const [experienceData, setExperienceData] = useState<any>(null);
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);
  const [selectedMotion, setSelectedMotion] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!leadId) {
        console.log('No leadId provided');
        setLoading(false);
        return;
      }

      console.log('Fetching lead and checking for custom experience for ID:', leadId);

      try {
        // First, check if there's a custom experience (proposal) for this lead
        const proposalResponse = await fetch(`/api/admin/proposals?leadId=${leadId}`);
        const proposalResult = await proposalResponse.json();

        console.log('Proposal check result:', proposalResult);

        if (proposalResponse.ok && proposalResult.data && proposalResult.data.length > 0) {
          // Found a custom experience for this lead
          const proposal = proposalResult.data[0]; // Get the most recent one
          console.log('Found custom experience for lead:', proposal);
          
          // Parse the stored package snapshots from custom_message
          let proposalPackages = [];
          try {
            const customMessage = typeof proposal.custom_message === 'string' ? 
              JSON.parse(proposal.custom_message) : proposal.custom_message;
            const packageSnapshots = customMessage?.package_snapshots || {};
            
            // Handle both old format (array) and new format (object)
            if (Array.isArray(packageSnapshots)) {
              proposalPackages = packageSnapshots;
            } else {
              // New format - combine all arrays
              proposalPackages = [
                ...(packageSnapshots.packages || []),
                ...(packageSnapshots.enhancements || []),
                ...(packageSnapshots.motion || [])
              ];
            }
          } catch (e) {
            // Fallback for old format - might be just text
            proposalPackages = [];
          }
          
          console.log('Parsed proposal packages:', proposalPackages);
          
          // Set up experience data in the same format as the preview
          setExperienceData({
            title: proposal.title,
            packages: proposalPackages.filter(item => item.type === 'package'),
            enhancements: proposalPackages.filter(item => item.type === 'enhancement'),
            motion: proposalPackages.filter(item => item.type === 'motion'),
            discount: {
              type: proposal.discount_percentage ? 'percentage' : 'fixed',
              value: proposal.discount_percentage || proposal.discount_amount || '0',
              label: 'Experience Discount'
            },
            subtotal: proposal.subtotal,
            total: proposal.total_amount
          });

          // Also fetch lead data for the header
          const leadResponse = await fetch(`/api/admin/leads/${leadId}`);
          const leadResult = await leadResponse.json();
          if (leadResponse.ok && leadResult.data) {
            setLead(leadResult.data);
          }
          
          setLoading(false);
          return;
        }

        // No custom experience found, fall back to template packages
        console.log('No custom experience found, fetching template packages');

        // Fetch both lead and template packages in parallel
        const [leadResponse, packagesResponse] = await Promise.all([
          fetch(`/api/admin/leads/${leadId}`),
          fetch('/api/packages/templates')
        ]);
        
        const leadResult = await leadResponse.json();
        const packagesResult = await packagesResponse.json();

        console.log('API responses:', { 
          lead: { status: leadResponse.status, result: leadResult },
          packages: { status: packagesResponse.status, result: packagesResult }
        });

        if (!leadResponse.ok) {
          console.error('Error fetching lead:', leadResult.error);
          if (leadResponse.status === 404) {
            console.log('Lead not found in database');
          }
          return;
        }

        if (!packagesResponse.ok) {
          console.error('Error fetching packages:', packagesResult.error);
          return;
        }

        if (leadResult.data) {
          console.log('Lead found:', leadResult.data);
          setLead(leadResult.data);
          
          // TODO: Add proposal viewing tracking when proposal_viewed_at column is added to database
          // markProposalAsViewed(leadId);
        } else {
          console.log('No data returned for lead');
        }

        if (packagesResult.data) {
          console.log('Template packages loaded:', packagesResult.data);
          const formattedPackages = packagesResult.data.map((pkg: any) => ({
            id: pkg.id,
            name: pkg.name,
            title: pkg.title,
            description: pkg.description,
            price: pkg.price,
            sessions: pkg.sessions || '',
            locations: pkg.locations || '',
            gallery: pkg.gallery || '',
            looks: pkg.looks || '',
            delivery: pkg.delivery || '',
            video: pkg.video || '',
            turnaround: pkg.turnaround || 'No sneak peek',
            fineArt: pkg.fine_art || '',
            highlights: pkg.highlights || [],
            investment_note: pkg.investment_note || '',
            theme_keywords: pkg.theme_keywords || '',
            image: pkg.image_url || '/portfolio/default-package.jpg'
          }));
          setPackages(formattedPackages);
          
          // Set default selected package to the first one (typically lowest price)
          if (formattedPackages.length > 0) {
            setSelectedPackage(formattedPackages[0].id);
          }
        } else {
          console.log('No template packages found');
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leadId]);


  const calculateTotal = () => {
    const selectedPkg = packages.find(pkg => pkg.id === selectedPackage);
    const packagePrice = selectedPkg?.price || 0;
    
    const addOnPrice = selectedAddOns.reduce((total, addOnName) => {
      const addOn = addOns.find(a => a.name === addOnName);
      return total + (addOn?.price || 0);
    }, 0);

    const videoPrice = selectedVideoAddOns.reduce((total, videoName) => {
      const video = videoAddOns.find(v => v.name === videoName);
      return total + (video?.price || 0);
    }, 0);

    return packagePrice + addOnPrice + videoPrice;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleReserveExperience = async () => {
    if (!selectedPackage || !lead) {
      alert('Please select a package first');
      return;
    }

    setReserving(true);
    try {
      const totalAmount = calculateTotal();
      const selectedPkg = packages.find(pkg => pkg.id === selectedPackage);

      const quoteData = {
        lead_id: leadId,
        proposal_id: null, // Template packages don't have custom proposal_id
        selected_package: selectedPkg?.name || selectedPackage,
        selected_addons: selectedAddOns,
        selected_video_addons: selectedVideoAddOns,
        total_amount: totalAmount,
        client_name: `${lead.first_name} ${lead.last_name}`,
        client_email: lead.email,
        package_details: selectedPkg ? {
          title: selectedPkg.title,
          description: selectedPkg.description,
          sessions: selectedPkg.sessions,
          locations: selectedPkg.locations,
          gallery: selectedPkg.gallery,
          looks: selectedPkg.looks,
          delivery: selectedPkg.delivery,
          video: selectedPkg.video,
          turnaround: selectedPkg.turnaround,
          fineArt: selectedPkg.fineArt,
          investment_note: selectedPkg.investment_note,
          theme_keywords: selectedPkg.theme_keywords
        } : null
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
        throw new Error(result.error || 'Failed to generate quote');
      }

      // Navigate to quote page
      window.location.href = `/quote/${result.quote.id}`;
    } catch (error) {
      console.error('Error generating quote:', error);
      alert('Error generating quote. Please try again.');
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="text-charcoal text-xl mb-4">Loading proposal...</div>
          <div className="text-charcoal/60 text-sm">Lead ID: {leadId}</div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-xl mb-4">Lead not found</div>
          <div className="text-charcoal/60 text-sm mb-4">
            Looking for lead ID: <code className="bg-white px-2 py-1 rounded">{leadId}</code>
          </div>
          <div className="text-charcoal/60 text-sm">
            Please verify this proposal link is correct.
          </div>
        </div>
      </div>
    );
  }

  // If we have experience data, render the new experience format
  if (experienceData) {
    return <ExperienceProposalView experienceData={experienceData} lead={lead} leadId={leadId} />;
  }

  if (packages.length === 0) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-xl mb-4">No packages available</div>
          <div className="text-charcoal/60 text-sm">
            Please contact us to create a custom proposal for you.
          </div>
        </div>
      </div>
    );
  }

  const selectedPkg = packages.find(pkg => pkg.id === selectedPackage);

  return (
    <div className="min-h-screen bg-ivory">
      {/* Hero Section - Minimal & Editorial */}
      <div className="relative min-h-[80vh] bg-ivory">
        <div className="absolute inset-0 bg-gradient-to-b from-ivory via-ivory/95 to-warm-gray/5"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-[80vh] px-6 py-16">
          <div className="max-w-4xl text-center">
            
            {/* Minimal Logo */}
            <div className="mb-16">
              <Logo 
                width={180} 
                height={60}
                variant="light"
                className="mx-auto opacity-90"
              />
            </div>
            
            {/* Clean Typography Hierarchy */}
            <div className="space-y-12">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-extralight text-charcoal leading-[0.9] tracking-tight">
                  {lead.first_name} {lead.last_name}
                </h1>
                <div className="w-16 h-px bg-charcoal/30 mx-auto"></div>
              </div>
              
              <div className="space-y-6">
                <p className="text-lg md:text-xl font-light text-charcoal/70 leading-relaxed max-w-2xl mx-auto">
                  A curated portrait experience designed around your story, crafted with intention and delivered with precision.
                </p>
                
                {lead.session_type_interest && (
                  <p className="text-sm font-light text-charcoal/50 tracking-widest uppercase">
                    {lead.session_type_interest} — 2025
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Package Selection */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <div className="space-y-8">
              <div className="w-16 h-px bg-charcoal/20 mx-auto"></div>
              <h2 className="text-3xl md:text-4xl font-light text-charcoal tracking-wide">Experiences</h2>
              <p className="text-base md:text-lg font-light text-charcoal/60 max-w-xl mx-auto leading-relaxed">
                Three distinct approaches to portraiture, each crafted with intention
              </p>
            </div>
          </div>

          <div className="space-y-8 mb-32">
            {packages.map((pkg, index) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`relative cursor-pointer transition-all duration-500 border overflow-hidden group ${
                  selectedPackage === pkg.id 
                    ? 'border-charcoal/40 shadow-2xl' 
                    : 'border-charcoal/10 hover:border-charcoal/20 hover:shadow-lg'
                }`}
              >
                <div className="grid lg:grid-cols-5 min-h-[500px]">
                  
                  {/* Left - Portfolio Image */}
                  <div className="lg:col-span-2 relative overflow-hidden bg-charcoal/5 min-h-[300px] lg:min-h-[500px]">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 z-10"></div>
                    
                    {/* Portfolio Image */}
                    <div className="relative w-full h-full">
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{
                          backgroundImage: `url('${pkg.image}')`,
                          backgroundPosition: 'center',
                        }}
                      />
                      
                      {/* Fallback gradient for missing images */}
                      <div className={`absolute inset-0 ${
                        pkg.id === 'opulence' ? 'bg-gradient-to-br from-red-900 via-red-700 to-gold' :
                        pkg.id === 'elegance' ? 'bg-gradient-to-br from-verde via-warm-brown to-charcoal' :
                        'bg-gradient-to-br from-charcoal via-warm-gray to-ivory'
                      } opacity-20`} />
                    </div>
                    
                    {/* Image Overlay with Package Name */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8">
                      <div className="text-white">
                        <div className="text-xs font-light tracking-[0.2em] uppercase opacity-90 mb-2">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <h3 className="text-xl font-light tracking-wide mb-1">
                          {pkg.title}
                        </h3>
                        <div className="text-xs font-light opacity-80">
                          {pkg.theme_keywords}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Center - Package Details */}
                  <div className="lg:col-span-2 p-8 lg:p-12 space-y-8 bg-white">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="text-3xl md:text-4xl font-light text-charcoal">
                          {formatCurrency(pkg.price)}
                        </div>
                        <div className="w-12 h-px bg-charcoal/30"></div>
                      </div>
                      
                      <div className="space-y-4 text-sm font-light text-charcoal/70">
                        <div className="flex justify-between py-3 border-b border-charcoal/10">
                          <span>Duration</span>
                          <span className="font-medium text-charcoal">{pkg.sessions}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-charcoal/10">
                          <span>Locations</span>
                          <span className="font-medium text-charcoal">{pkg.locations}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-charcoal/10">
                          <span>Gallery</span>
                          <span className="font-medium text-charcoal">{pkg.gallery}</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-charcoal/10">
                          <span>Styling</span>
                          <span className="font-medium text-charcoal">{pkg.looks} looks</span>
                        </div>
                        {pkg.video && (
                          <div className="flex justify-between py-3 border-b border-charcoal/10">
                            <span>Video</span>
                            <span className="font-medium text-charcoal">{pkg.video}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-3 border-b border-charcoal/10">
                          <span>Delivery</span>
                          <span className="font-medium text-charcoal">{pkg.delivery}</span>
                        </div>
                        {pkg.turnaround !== 'No sneak peek' && (
                          <div className="flex justify-between py-3 border-b border-charcoal/10">
                            <span>Sneak Peek</span>
                            <span className="font-medium text-charcoal">{pkg.turnaround}</span>
                          </div>
                        )}
                        {pkg.fineArt && (
                          <div className="flex justify-between py-3">
                            <span>Fine Art Credit</span>
                            <span className="font-medium text-charcoal">{pkg.fineArt}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <p className="text-sm font-light text-charcoal/80 leading-relaxed">
                        {pkg.description.substring(0, 200)}...
                      </p>
                      
                      <div className="space-y-4">
                        <h4 className="text-xs font-light text-charcoal/60 tracking-wide uppercase">Visual Approach</h4>
                        <div className="space-y-2">
                          {pkg.highlights.slice(0, 3).map((highlight, idx) => (
                            <p key={idx} className="text-xs font-light text-charcoal/60 leading-relaxed">
                              • {highlight}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right - Selection Column */}
                  <div className="p-8 lg:p-12 flex flex-col justify-center items-center bg-ivory/50 space-y-6">
                    <div className={`w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                      selectedPackage === pkg.id 
                        ? 'border-charcoal bg-charcoal' 
                        : 'border-charcoal/30 hover:border-charcoal/60'
                    }`}>
                      {selectedPackage === pkg.id && (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs font-light text-charcoal/60 uppercase tracking-wide">
                        {selectedPackage === pkg.id ? 'Selected' : 'Select'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add-Ons Section */}
          <div className="mb-32">
            <div className="text-center mb-16">
              <div className="w-16 h-px bg-charcoal/20 mx-auto mb-8"></div>
              <h3 className="text-2xl md:text-3xl font-light text-charcoal tracking-wide mb-6">Enhancements</h3>
              <p className="text-sm font-light text-charcoal/60 max-w-lg mx-auto leading-relaxed">
                Curated additions to elevate your experience
              </p>
            </div>

            <div className="space-y-3 mb-16">
              {addOns.map((addOn) => (
                <div
                  key={addOn.name}
                  onClick={() => {
                    if (selectedAddOns.includes(addOn.name)) {
                      setSelectedAddOns(selectedAddOns.filter(a => a !== addOn.name));
                    } else {
                      setSelectedAddOns([...selectedAddOns, addOn.name]);
                    }
                  }}
                  className={`border cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md ${
                    selectedAddOns.includes(addOn.name) 
                      ? 'border-charcoal/50 bg-white shadow-lg ring-1 ring-charcoal/10' 
                      : 'border-charcoal/20 hover:border-charcoal/40 bg-white hover:bg-ivory/50'
                  }`}
                >
                  <div className="grid md:grid-cols-4 min-h-[120px]">
                    <div className="p-6 flex items-center justify-center">
                      <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                        selectedAddOns.includes(addOn.name) 
                          ? 'border-charcoal bg-charcoal shadow-sm' 
                          : 'border-charcoal/40 hover:border-charcoal/60'
                      }`}>
                        {selectedAddOns.includes(addOn.name) && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <div className="p-6 space-y-2">
                      <h4 className="text-lg font-light text-charcoal">{addOn.name}</h4>
                      <div className="text-2xl font-light text-charcoal">{formatCurrency(addOn.price)}</div>
                    </div>
                    <div className="md:col-span-2 p-6 border-l border-charcoal/15 flex items-center">
                      <p className="text-sm font-light text-charcoal/80 leading-relaxed">{addOn.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Video Add-Ons */}
            <div className="border border-charcoal/20 bg-charcoal text-white">
              <div className="p-12 space-y-8">
                <div className="text-center space-y-4">
                  <h4 className="text-xl font-light tracking-wide">Motion</h4>
                  <div className="w-8 h-px bg-white/30 mx-auto"></div>
                  <p className="text-sm font-light opacity-70 max-w-lg mx-auto leading-relaxed">
                    Cinematic elements to complement your portrait experience
                  </p>
                </div>
                
                <div className="space-y-3">
                  {videoAddOns.map((video) => (
                    <div
                      key={video.name}
                      onClick={() => {
                        if (selectedVideoAddOns.includes(video.name)) {
                          setSelectedVideoAddOns(selectedVideoAddOns.filter(v => v !== video.name));
                        } else {
                          setSelectedVideoAddOns([...selectedVideoAddOns, video.name]);
                        }
                      }}
                      className={`border cursor-pointer transition-all duration-300 ${
                        selectedVideoAddOns.includes(video.name)
                          ? 'border-white/70 bg-white/15 shadow-lg'
                          : 'border-white/30 hover:border-white/50 hover:bg-white/5'
                      }`}
                    >
                      <div className="grid md:grid-cols-4 min-h-[100px]">
                        <div className="p-6 flex items-center justify-center">
                          <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                            selectedVideoAddOns.includes(video.name) 
                              ? 'border-white bg-white shadow-sm' 
                              : 'border-white/50 hover:border-white/70'
                          }`}>
                            {selectedVideoAddOns.includes(video.name) && (
                              <div className="w-2.5 h-2.5 bg-charcoal rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <div className="p-6 space-y-2">
                          <h5 className="text-base font-light">{video.name}</h5>
                          <div className="text-xl font-light">{formatCurrency(video.price)}</div>
                        </div>
                        <div className="md:col-span-2 p-6 border-l border-white/25 flex items-center">
                          <p className="text-sm font-light opacity-90 leading-relaxed">{video.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Investment Summary */}
          <div className="border border-charcoal/20 bg-white">
            <div className="p-16 text-center space-y-12">
              
              <div className="space-y-8">
                <div className="w-16 h-px bg-charcoal/20 mx-auto"></div>
                <h3 className="text-2xl md:text-3xl font-light text-charcoal tracking-wide">Investment</h3>
                
                <div className="space-y-4">
                  <div className="text-4xl md:text-5xl font-light text-charcoal">
                    {formatCurrency(calculateTotal())}
                  </div>
                  <p className="text-sm font-light text-charcoal/60 max-w-md mx-auto leading-relaxed">
                    Complete experience including editorial direction, production, and refined digital deliverables
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 max-w-lg mx-auto">
                <button 
                  onClick={handleReserveExperience}
                  disabled={!selectedPackage || reserving}
                  className="flex-1 bg-charcoal text-white py-4 px-8 text-sm font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reserving ? 'Generating Quote...' : 'Reserve Experience'}
                </button>
                <button 
                  onClick={() => window.close()}
                  className="flex-1 border border-charcoal/30 text-charcoal py-4 px-8 text-sm font-light tracking-wide uppercase hover:border-charcoal hover:bg-charcoal hover:text-white transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// New Experience-based proposal view
function ExperienceProposalView({ experienceData, lead, leadId }: { experienceData: any, lead: any, leadId: string }) {
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);
  const [selectedMotion, setSelectedMotion] = useState<string[]>([]);
  const [reserving, setReserving] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Sort packages by price (highest to lowest for pricing psychology)
  const sortedPackages = [...(experienceData.packages || [])].sort((a, b) => b.price - a.price);

  const handleReserveExperience = async () => {
    if (!selectedPackage || !lead) {
      alert('Please select a package first');
      return;
    }

    setReserving(true);
    try {
      const totalAmount = calculateCustomTotal();
      const selectedPkg = sortedPackages.find(pkg => pkg.id === selectedPackage);

      const quoteData = {
        lead_id: leadId,
        proposal_id: null,
        selected_package: selectedPkg?.title || selectedPackage,
        selected_addons: selectedEnhancements,
        selected_video_addons: selectedMotion,
        total_amount: totalAmount,
        client_name: `${lead.first_name} ${lead.last_name}`,
        client_email: lead.email,
        package_details: selectedPkg ? {
          title: selectedPkg.title,
          description: selectedPkg.description,
          sessions: selectedPkg.sessions,
          locations: selectedPkg.locations,
          gallery: selectedPkg.gallery,
          looks: selectedPkg.looks,
          delivery: selectedPkg.delivery,
          video: selectedPkg.video,
          turnaround: selectedPkg.turnaround,
          fineArt: selectedPkg.fine_art,
          investment_note: selectedPkg.investment_note,
          theme_keywords: selectedPkg.theme_keywords
        } : null
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
        throw new Error(result.error || 'Failed to generate quote');
      }

      // Navigate to quote page
      window.location.href = `/quote/${result.quote.id}`;
    } catch (error) {
      console.error('Error generating quote:', error);
      alert('Error generating quote. Please try again.');
    } finally {
      setReserving(false);
    }
  };

  const calculateCustomTotal = () => {
    let total = 0;
    
    // Add selected package price
    if (selectedPackage) {
      const selectedPkg = sortedPackages.find(pkg => pkg.id === selectedPackage);
      if (selectedPkg) total += selectedPkg.price;
    }
    
    // Add selected enhancements (required + optional selected)
    if (experienceData.enhancements) {
      experienceData.enhancements.forEach((enhancement: any) => {
        if (enhancement.is_required || selectedEnhancements.includes(enhancement.id)) {
          total += enhancement.price;
        }
      });
    }
    
    // Add selected motion (required + optional selected)
    if (experienceData.motion) {
      experienceData.motion.forEach((motion: any) => {
        if (motion.is_required || selectedMotion.includes(motion.id)) {
          total += motion.price;
        }
      });
    }
    
    return total;
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Hero Section - Same as preview */}
      <div className="relative min-h-[70vh] sm:min-h-[80vh] bg-ivory">
        <div className="absolute inset-0 bg-gradient-to-b from-ivory via-ivory/95 to-warm-gray/5"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-[70vh] sm:min-h-[80vh] px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-4xl text-center">
            
            {/* Minimal Logo */}
            <div className="mb-8 sm:mb-16">
              <Logo 
                width={140} 
                height={47}
                variant="light"
                className="mx-auto opacity-90 sm:w-[180px] sm:h-[60px]"
              />
            </div>
            
            {/* Clean Typography Hierarchy */}
            <div className="space-y-8 sm:space-y-12">
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-extralight text-charcoal leading-[0.9] tracking-tight px-2">
                  {lead.first_name} {lead.last_name}
                </h1>
                <div className="w-12 sm:w-16 h-px bg-charcoal/30 mx-auto"></div>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                <p className="text-base sm:text-lg md:text-xl font-light text-charcoal/70 leading-relaxed max-w-2xl mx-auto px-4">
                  A curated portrait experience designed around your story, crafted with intention and delivered with precision.
                </p>
                
                {lead.session_type_interest && (
                  <p className="text-xs sm:text-sm font-light text-charcoal/50 tracking-widest uppercase">
                    {lead.session_type_interest} — 2025
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Package Selection - Mobile Optimized */}
      <div className="py-12 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 sm:mb-24">
            <div className="space-y-6 sm:space-y-8">
              <div className="w-12 sm:w-16 h-px bg-charcoal/20 mx-auto"></div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-charcoal tracking-wide">Experiences</h2>
              <p className="text-sm sm:text-base md:text-lg font-light text-charcoal/60 max-w-xl mx-auto leading-relaxed px-4">
                Choose your approach to portraiture, each crafted with intention
              </p>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8 mb-20 sm:mb-32">
            {sortedPackages.map((pkg, index) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`relative cursor-pointer transition-all duration-500 border overflow-hidden group ${
                  selectedPackage === pkg.id 
                    ? 'border-charcoal/40 shadow-2xl' 
                    : 'border-charcoal/10 hover:border-charcoal/20 hover:shadow-lg'
                }`}
              >
                <div className="grid lg:grid-cols-5 min-h-[500px]">
                  
                  {/* Left - Portfolio Image */}
                  <div className="lg:col-span-2 relative overflow-hidden bg-charcoal/5 min-h-[250px] sm:min-h-[300px] lg:min-h-[500px]">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 z-10"></div>
                    
                    {/* Portfolio Image */}
                    <div className="relative w-full h-full">
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{
                          backgroundImage: `url('${pkg.image_url || '/portfolio/default-package.jpg'}')`,
                          backgroundPosition: 'center',
                        }}
                      />
                      
                      {/* Fallback gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-warm-gray to-ivory opacity-20" />
                    </div>
                    
                    {/* Image Overlay with Package Name */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 sm:p-6 lg:p-8">
                      <div className="text-white">
                        <div className="text-xs font-light tracking-[0.2em] uppercase opacity-90 mb-1 sm:mb-2">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <h3 className="text-base sm:text-lg lg:text-xl font-light tracking-wide mb-1">
                          {pkg.title}
                        </h3>
                        <div className="text-xs font-light opacity-80">
                          {pkg.theme_keywords || 'Custom Component'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Center - Package Details */}
                  <div className="lg:col-span-2 p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8 bg-white">
                    <div className="space-y-4 lg:space-y-6">
                      <div className="space-y-3 lg:space-y-4">
                        <div className="text-2xl sm:text-3xl lg:text-4xl font-light text-charcoal">
                          {formatCurrency(pkg.price)}
                        </div>
                        <div className="w-10 sm:w-12 h-px bg-charcoal/30"></div>
                      </div>
                      
                      <div className="space-y-3 lg:space-y-4 text-xs sm:text-sm font-light text-charcoal/70">
                        {pkg.sessions && (
                          <div className="flex justify-between py-2 lg:py-3 border-b border-charcoal/10">
                            <span>Duration</span>
                            <span className="font-medium text-charcoal">{pkg.sessions}</span>
                          </div>
                        )}
                        {pkg.locations && (
                          <div className="flex justify-between py-2 lg:py-3 border-b border-charcoal/10">
                            <span>Locations</span>
                            <span className="font-medium text-charcoal">{pkg.locations}</span>
                          </div>
                        )}
                        {pkg.gallery && (
                          <div className="flex justify-between py-2 lg:py-3 border-b border-charcoal/10">
                            <span>Gallery</span>
                            <span className="font-medium text-charcoal">{pkg.gallery}</span>
                          </div>
                        )}
                        {pkg.looks && (
                          <div className="flex justify-between py-2 lg:py-3 border-b border-charcoal/10">
                            <span>Styling</span>
                            <span className="font-medium text-charcoal">{pkg.looks} looks</span>
                          </div>
                        )}
                        {pkg.video && (
                          <div className="flex justify-between py-2 lg:py-3 border-b border-charcoal/10">
                            <span>Video</span>
                            <span className="font-medium text-charcoal">{pkg.video}</span>
                          </div>
                        )}
                        {pkg.delivery && (
                          <div className="flex justify-between py-2 lg:py-3 border-b border-charcoal/10">
                            <span>Delivery</span>
                            <span className="font-medium text-charcoal">{pkg.delivery}</span>
                          </div>
                        )}
                        {pkg.turnaround && (
                          <div className="flex justify-between py-2 lg:py-3 border-b border-charcoal/10">
                            <span>Sneak Peek</span>
                            <span className="font-medium text-charcoal">{pkg.turnaround}</span>
                          </div>
                        )}
                        {pkg.fine_art && (
                          <div className="flex justify-between py-2 lg:py-3">
                            <span>Fine Art Credit</span>
                            <span className="font-medium text-charcoal">{pkg.fine_art}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4 lg:space-y-6">
                      <p className="text-xs sm:text-sm font-light text-charcoal/80 leading-relaxed">
                        {pkg.description ? (pkg.description.length > 200 ? pkg.description.substring(0, 200) + '...' : pkg.description) : 'Custom component crafted for your experience.'}
                      </p>
                      
                      {pkg.highlights && pkg.highlights.length > 0 && (
                        <div className="space-y-3 lg:space-y-4">
                          <h4 className="text-xs font-light text-charcoal/60 tracking-wide uppercase">Visual Approach</h4>
                          <div className="space-y-1 lg:space-y-2">
                            {pkg.highlights.slice(0, 3).map((highlight: string, idx: number) => (
                              <p key={idx} className="text-xs font-light text-charcoal/60 leading-relaxed">
                                • {highlight}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right - Selection Column */}
                  <div className="p-4 sm:p-6 lg:p-12 flex flex-col justify-center items-center bg-ivory/50 space-y-4 lg:space-y-6">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                      selectedPackage === pkg.id 
                        ? 'border-charcoal bg-charcoal' 
                        : 'border-charcoal/30 hover:border-charcoal/60'
                    }`}>
                      {selectedPackage === pkg.id && (
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs font-light text-charcoal/60 uppercase tracking-wide">
                        {selectedPackage === pkg.id ? 'Selected' : 'Select'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhancements Section - Same as preview */}
          {experienceData.enhancements && experienceData.enhancements.length > 0 && (
            <div className="mb-20 sm:mb-32">
              <div className="text-center mb-12 sm:mb-16">
                <div className="w-12 sm:w-16 h-px bg-charcoal/20 mx-auto mb-6 sm:mb-8"></div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-charcoal tracking-wide mb-4 sm:mb-6">Enhancements</h3>
                <p className="text-sm font-light text-charcoal/60 max-w-lg mx-auto leading-relaxed px-4">
                  Curated additions to elevate your experience
                </p>
              </div>

              <div className="space-y-3 mb-12 sm:mb-16">
                {experienceData.enhancements.map((enhancement) => (
                  <div
                    key={enhancement.id}
                    onClick={() => {
                      if (!enhancement.is_required) {
                        if (selectedEnhancements.includes(enhancement.id)) {
                          setSelectedEnhancements(selectedEnhancements.filter(id => id !== enhancement.id));
                        } else {
                          setSelectedEnhancements([...selectedEnhancements, enhancement.id]);
                        }
                      }
                    }}
                    className={`border transition-all duration-300 shadow-sm hover:shadow-md ${
                      enhancement.is_required 
                        ? 'border-red-500 bg-red-50 cursor-default' 
                        : selectedEnhancements.includes(enhancement.id) 
                          ? 'border-charcoal/50 bg-white shadow-lg ring-1 ring-charcoal/10 cursor-pointer' 
                          : 'border-charcoal/20 hover:border-charcoal/40 bg-white hover:bg-ivory/50 cursor-pointer'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 min-h-[140px] lg:min-h-[160px]">
                      <div className="p-4 lg:p-6 flex items-start sm:items-center justify-center pt-6">
                        {enhancement.is_required ? (
                          <div className="text-red-600 font-bold text-lg">★</div>
                        ) : (
                          <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                            selectedEnhancements.includes(enhancement.id) 
                              ? 'border-charcoal bg-charcoal shadow-sm' 
                              : 'border-charcoal/40 hover:border-charcoal/60'
                          }`}>
                            {selectedEnhancements.includes(enhancement.id) && (
                              <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-white rounded-full"></div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="p-4 lg:p-6 space-y-2 flex flex-col justify-center">
                        <h4 className="text-base lg:text-lg font-light text-charcoal leading-tight">
                          {enhancement.title}
                          {enhancement.is_required && <span className="text-red-600 ml-1">*</span>}
                        </h4>
                        <div className="text-lg lg:text-2xl font-light text-charcoal">{formatCurrency(enhancement.price)}</div>
                      </div>
                      <div className="col-span-1 sm:col-span-2 p-4 lg:p-6 sm:border-l border-charcoal/15 flex flex-col justify-center">
                        <div className="space-y-3">
                          <p className="text-sm font-light text-charcoal/80 leading-relaxed">
                            {enhancement.description || 'Enhancement for your experience.'}
                          </p>
                          {enhancement.is_required && (
                            <div className="bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                              <span className="text-xs text-red-600 font-medium flex items-center">
                                <span className="text-red-600 mr-1">★</span>
                                Required for this experience
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motion Section - Same as preview */}
          {experienceData.motion && experienceData.motion.length > 0 && (
            <div className="mb-20 sm:mb-32">
              <div className="border border-charcoal/20 bg-charcoal text-white">
                <div className="p-6 sm:p-8 lg:p-12 space-y-6 sm:space-y-8">
                  <div className="text-center space-y-3 sm:space-y-4">
                    <h4 className="text-lg sm:text-xl font-light tracking-wide">Motion</h4>
                    <div className="w-6 sm:w-8 h-px bg-white/30 mx-auto"></div>
                    <p className="text-sm font-light opacity-70 max-w-lg mx-auto leading-relaxed px-4">
                      Cinematic elements to complement your portrait experience
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {experienceData.motion.map((motion) => (
                      <div
                        key={motion.id}
                        onClick={() => {
                          if (!motion.is_required) {
                            if (selectedMotion.includes(motion.id)) {
                              setSelectedMotion(selectedMotion.filter(id => id !== motion.id));
                            } else {
                              setSelectedMotion([...selectedMotion, motion.id]);
                            }
                          }
                        }}
                        className={`border transition-all duration-300 ${
                          motion.is_required
                            ? 'border-red-400 bg-red-900/20 cursor-default'
                            : selectedMotion.includes(motion.id)
                              ? 'border-white/70 bg-white/15 shadow-lg cursor-pointer'
                              : 'border-white/30 hover:border-white/50 hover:bg-white/5 cursor-pointer'
                        }`}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-4 min-h-[120px] lg:min-h-[140px]">
                          <div className="p-4 lg:p-6 flex items-start sm:items-center justify-center pt-6">
                            {motion.is_required ? (
                              <div className="text-red-400 font-bold text-lg">★</div>
                            ) : (
                              <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                                selectedMotion.includes(motion.id) 
                                  ? 'border-white bg-white shadow-sm' 
                                  : 'border-white/50 hover:border-white/70'
                              }`}>
                                {selectedMotion.includes(motion.id) && (
                                  <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-charcoal rounded-full"></div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="p-4 lg:p-6 space-y-2 flex flex-col justify-center">
                            <h5 className="text-sm lg:text-base font-light leading-tight">
                              {motion.title}
                              {motion.is_required && <span className="text-red-400 ml-1">*</span>}
                            </h5>
                            <div className="text-base lg:text-xl font-light">{formatCurrency(motion.price)}</div>
                          </div>
                          <div className="col-span-1 sm:col-span-2 p-4 lg:p-6 sm:border-l border-white/25 flex flex-col justify-center">
                            <div className="space-y-3">
                              <p className="text-sm font-light opacity-90 leading-relaxed">
                                {motion.description || 'Motion enhancement for your experience.'}
                              </p>
                              {motion.is_required && (
                                <div className="bg-red-900/30 border border-red-400/50 rounded-sm px-3 py-2">
                                  <span className="text-xs text-red-300 font-medium flex items-center">
                                    <span className="text-red-400 mr-1">★</span>
                                    Required for this experience
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Investment Summary - Same as preview */}
          <div className="border border-charcoal/20 bg-white">
            <div className="p-8 sm:p-12 lg:p-16 text-center space-y-8 sm:space-y-12">
              
              <div className="space-y-6 sm:space-y-8">
                <div className="w-12 sm:w-16 h-px bg-charcoal/20 mx-auto"></div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-charcoal tracking-wide">Investment</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-light text-charcoal">
                    {formatCurrency(calculateCustomTotal())}
                  </div>
                  <p className="text-sm font-light text-charcoal/60 max-w-md mx-auto leading-relaxed px-4">
                    Complete experience including editorial direction, production, and refined digital deliverables
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 max-w-lg mx-auto">
                <button 
                  onClick={handleReserveExperience}
                  disabled={!selectedPackage || reserving}
                  className="flex-1 bg-charcoal text-white py-3 sm:py-4 px-6 sm:px-8 text-sm font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                >
                  {reserving ? 'Generating Quote...' : 'Reserve Experience'}
                </button>
                <button 
                  onClick={() => window.close()}
                  className="flex-1 border border-charcoal/30 text-charcoal py-3 sm:py-4 px-6 sm:px-8 text-sm font-light tracking-wide uppercase hover:border-charcoal hover:bg-charcoal hover:text-white transition-all duration-300 min-h-[48px]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}