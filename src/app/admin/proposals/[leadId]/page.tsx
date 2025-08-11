'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import '../globals.css';

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

const packages: Package[] = [
  {
    id: 'opulence',
    name: 'OPULENCE',
    title: 'The Opulence',
    description: 'This is your full cinematic collection. Directed with precision and styled with grace. Your Opulence session is an immersive editorial experience where we document every facet of your evolution, from celebration to stillness, from glamour to gratitude. Designed to feel like a cover shoot and a connection. Art is more than documentation, it\'s a declaration.',
    price: 1650,
    sessions: '4 Hours',
    locations: '4',
    gallery: 'Full Gallery',
    looks: 'Unlimited',
    delivery: '7 Day Delivery',
    video: '60-90 Second Portrait Video',
    turnaround: '24 Hour Sneak Peek',
    fineArt: '$100 Fine Art Credit',
    highlights: [
      'Visual Themes: Power, Legacy, Radiance',
      'Style: Cinematic storytelling with luxury emotion',
      'Locations: 4 unique Charleston icons that echo power and symbolism',
      'Wardrobe: Up to 5 styled looks',
      'Creative Flow: Directed scenes, motion prompts, narrative building'
    ],
    investment_note: '(Optional Studio Scene Included)',
    theme_keywords: 'cinematic and intentional from start to finish',
    image: '/portfolio/opulence-sample.jpg'
  },
  {
    id: 'elegance',
    name: 'ELEGANCE',
    title: 'The Elegance',
    description: 'Elegance is intentional. This session distills your identity into a clean, powerful narrative layered with depth, but delivered with restraint. Perfect for those who want luxury without excess, this is your legacy told in quiet confidence and curated style.',
    price: 1350,
    sessions: '3 Hours',
    locations: '3',
    gallery: '40-60 Images',
    looks: '3',
    delivery: '10 Day Delivery',
    video: '30 Second Highlight Reel',
    turnaround: '48 Hour Sneak Peek',
    highlights: [
      'Visual Themes: Grace, Resilience, Expression',
      'Style: Minimalist editorial with focused drama',
      'Locations: 2-3 visually rich Charleston settings',
      'Wardrobe: Up to 3 intentional looks',
      'Creative Flow: Sculpted movement, posture play, and light choreography'
    ],
    investment_note: 'All editorial direction, production, and digital deliverables included',
    theme_keywords: 'clean, powerful, timeless',
    image: '/portfolio/elegance-sample.jpg'
  },
  {
    id: 'essence',
    name: 'ESSENCE',
    title: 'The Essence',
    description: 'This is a visual statement. It\'s short, poetic, and packed with presence. Essence captures a distilled chapter of who you are right now. It\'s intimate, elegant, and guided with intention. One location. One look. One story, told well.',
    price: 950,
    sessions: '90 Minutes',
    locations: '1',
    gallery: '20-30 Images',
    looks: '1',
    delivery: '14 Day Delivery',
    turnaround: 'No sneak peek',
    highlights: [
      'Visual Themes: Identity, Stillness, Becoming',
      'Style: Clean, personal editorial energy',
      'Locations: A singular Charleston location with depth and character',
      'Wardrobe: One look styled for contrast and texture',
      'Creative Flow: Portrait-led direction with audio-on-the-eye and mood'
    ],
    investment_note: 'All editorial direction, production, and digital deliverables included',
    theme_keywords: 'focused editorial statement',
    image: '/portfolio/essence-sample.jpg'
  }
];

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

export default function ProposalPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.leadId as string;
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>('elegance');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedVideoAddOns, setSelectedVideoAddOns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      if (!leadId) {
        console.log('No leadId provided');
        setLoading(false);
        return;
      }

      console.log('Fetching lead with ID:', leadId);

      try {
        // Fetch the lead using the admin API route
        const response = await fetch(`/api/admin/leads/${leadId}`);
        const result = await response.json();

        console.log('API response:', { status: response.status, result });

        if (!response.ok) {
          console.error('Error fetching lead:', result.error);
          if (response.status === 404) {
            console.log('Lead not found in database');
          }
          return;
        }

        if (result.data) {
          console.log('Lead found:', result.data);
          setLead(result.data);
        } else {
          console.log('No data returned for lead');
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="text-warm-brown text-xl mb-4">Loading proposal...</div>
          <div className="text-warm-brown/60 text-sm">Lead ID: {leadId}</div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-xl mb-4">Lead not found</div>
          <div className="text-warm-brown/60 text-sm mb-4">
            Looking for lead ID: <code className="bg-white px-2 py-1 rounded">{leadId}</code>
          </div>
          <div className="text-warm-brown/60 text-sm">
            Please check the browser console for debugging information, or verify this lead exists in the admin panel.
          </div>
          <button
            onClick={() => router.push('/admin/leads')}
            className="mt-4 px-4 py-2 bg-gold text-white rounded hover:bg-gold/90 transition-colors"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  const selectedPkg = packages.find(pkg => pkg.id === selectedPackage);

  return (
    <div className="min-h-screen bg-ivory">
      {/* Hero Section - Minimal & Editorial */}
      <div className="relative min-h-screen bg-ivory">
        <div className="absolute inset-0 bg-gradient-to-b from-ivory via-ivory/95 to-warm-gray/5"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-20">
          <div className="max-w-4xl text-center">
            
            {/* Minimal Logo */}
            <div className="mb-20">
              <Image 
                src="/sean-evans-logo.png" 
                alt="Sean Evans Photography" 
                width={180} 
                height={60}
                className="mx-auto opacity-90"
              />
            </div>
            
            {/* Clean Typography Hierarchy */}
            <div className="space-y-16">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl font-light text-charcoal leading-tight tracking-wide">
                  {lead.first_name} {lead.last_name}
                </h1>
                <div className="w-12 h-px bg-charcoal/30 mx-auto"></div>
              </div>
              
              <div className="space-y-8">
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

            <div className="space-y-4 mb-16">
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
                  className={`border cursor-pointer transition-all duration-300 ${
                    selectedAddOns.includes(addOn.name) 
                      ? 'border-charcoal/40 bg-white' 
                      : 'border-charcoal/10 hover:border-charcoal/20 bg-ivory/30'
                  }`}
                >
                  <div className="grid md:grid-cols-4 min-h-[120px]">
                    <div className="p-8 flex items-center">
                      <div className={`w-4 h-4 rounded-full border transition-all duration-300 ${
                        selectedAddOns.includes(addOn.name) 
                          ? 'border-charcoal bg-charcoal' 
                          : 'border-charcoal/30'
                      }`}>
                        {selectedAddOns.includes(addOn.name) && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-8 space-y-2">
                      <h4 className="text-base font-light text-charcoal">{addOn.name}</h4>
                      <div className="text-lg font-light text-charcoal">{formatCurrency(addOn.price)}</div>
                    </div>
                    <div className="md:col-span-2 p-8 border-l border-charcoal/10 flex items-center">
                      <p className="text-sm font-light text-charcoal/70 leading-relaxed">{addOn.description}</p>
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
                
                <div className="space-y-4">
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
                          ? 'border-white/60 bg-white/10'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <div className="grid md:grid-cols-4 min-h-[100px]">
                        <div className="p-6 flex items-center">
                          <div className={`w-4 h-4 rounded-full border transition-all duration-300 ${
                            selectedVideoAddOns.includes(video.name) 
                              ? 'border-white bg-white' 
                              : 'border-white/40'
                          }`}>
                            {selectedVideoAddOns.includes(video.name) && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-charcoal rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-6 space-y-1">
                          <h5 className="text-sm font-light">{video.name}</h5>
                          <div className="text-base font-light">{formatCurrency(video.price)}</div>
                        </div>
                        <div className="md:col-span-2 p-6 border-l border-white/20 flex items-center">
                          <p className="text-xs font-light opacity-80 leading-relaxed">{video.description}</p>
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
                <button className="flex-1 bg-charcoal text-white py-4 px-8 text-sm font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300">
                  Reserve Experience
                </button>
                <button 
                  onClick={() => router.push('/admin/leads')}
                  className="flex-1 border border-charcoal/30 text-charcoal py-4 px-8 text-sm font-light tracking-wide uppercase hover:border-charcoal hover:bg-charcoal hover:text-white transition-all duration-300"
                >
                  Return
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}