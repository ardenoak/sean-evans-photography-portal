'use client';

import { useState } from 'react';
import Logo from '@/components/Logo';

const investmentTiers = [
  {
    id: 'essential',
    name: 'Essential',
    subtitle: 'Authentic Portrait Foundation',
    priceRange: '$2,800 - $3,500',
    experience: 'Essence',
    duration: '3-4 hours',
    locations: '1-2 venues',
    images: '75+ refined images',
    styling: '2-3 natural looks',
    includes: [
      'Pre-session consultation and planning',
      'Professional portrait session with artistic direction',
      'Natural lighting and authentic compositions',
      'Personal styling guidance and wardrobe consultation',
      '75+ professionally edited high-resolution images',
      'Online gallery for sharing and downloading',
      'Print release for personal use'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
    philosophy: 'Perfect for those seeking authentic, natural portraits that capture genuine beauty and personality.'
  },
  {
    id: 'signature',
    name: 'Signature',
    subtitle: 'Elevated Portrait Experience',
    priceRange: '$4,500 - $5,500',
    experience: 'Elegance & Editorial Narrative',
    duration: '4-6 hours',
    locations: '2-3 curated venues',
    images: '100-120+ polished images',
    styling: '3-5 refined looks',
    includes: [
      'Comprehensive pre-session consultation and location scouting',
      'Extended portrait session with multiple locations',
      'Professional hair and makeup artist (4 hours)',
      'Wardrobe styling and accessory consultation',
      'Artistic direction and creative concepts',
      '100+ professionally retouched high-resolution images',
      'Premium online gallery with slideshow presentation',
      'Complimentary 16x20 signature print',
      'Full commercial license for business use'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    philosophy: 'Our most popular choice for those seeking sophisticated, magazine-quality portraits with creative flair.'
  },
  {
    id: 'luxury',
    name: 'Luxury',
    subtitle: 'The Ultimate Portrait Investment',
    priceRange: '$7,500+',
    experience: 'Opulence',
    duration: '6-8 hours',
    locations: '3-4 premium venues',
    images: '150+ masterwork images',
    styling: '4-6 couture looks',
    includes: [
      'VIP consultation with creative director and location scouting',
      'Full-day luxury portrait experience',
      'Celebrity hair and makeup team (full day)',
      'Professional wardrobe stylist and designer pieces',
      'Exclusive venue access and premium locations',
      'Artistic direction with conceptual storytelling',
      '150+ museum-quality retouched images',
      'Luxury leather-bound album (20 pages)',
      'Gallery wall design consultation',
      'Three signature prints (up to 30x40)',
      'Lifetime archive and re-print privileges',
      'Complete commercial and editorial licensing'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&q=80',
    philosophy: 'For discerning clients who demand nothing less than extraordinary artistry and white-glove service.'
  }
];

const addOnServices = [
  {
    category: 'Beauty & Styling',
    services: [
      { name: 'Hair & Makeup Artist (4 hours)', price: '$650', description: 'Professional beauty team for flawless presentation' },
      { name: 'Wardrobe Stylist Consultation', price: '$450', description: 'Expert styling guidance and outfit coordination' },
      { name: 'Additional Outfit Change', price: '$200', description: 'Each additional styled look beyond package inclusion' },
      { name: 'Designer Wardrobe Rental', price: '$400', description: 'Access to high-end designer pieces for your session' }
    ]
  },
  {
    category: 'Session Enhancements',
    services: [
      { name: 'Additional Location', price: '$500', description: 'Each premium venue beyond package inclusion' },
      { name: 'Extended Session Time', price: '$400', description: 'Each additional hour of photography coverage' },
      { name: 'Rush Delivery (48 hours)', price: '$800', description: 'Expedited editing and gallery delivery' },
      { name: 'Same-Day Preview', price: '$300', description: '10-15 edited previews delivered within 6 hours' }
    ]
  },
  {
    category: 'Luxury Products',
    services: [
      { name: 'Custom Album Design', price: '$1,200', description: '20-page leather-bound album with museum-quality printing' },
      { name: 'Gallery Wall Curation', price: '$800', description: 'Professional gallery wall design and layout consultation' },
      { name: 'Signature Canvas Collection', price: '$1,800', description: 'Set of three museum-quality canvas prints (20x30)' },
      { name: 'Metal Print Collection', price: '$1,400', description: 'Set of five aluminum prints with float mounting (16x24)' }
    ]
  }
];

export default function InvestmentGuidePage() {
  const [selectedTier, setSelectedTier] = useState(investmentTiers[1]);
  const [activeSection, setActiveSection] = useState('packages');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Elegant Hero Section */}
      <div className="relative min-h-[80vh] bg-charcoal overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=2000&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-[80vh] px-6 py-16">
          <div className="max-w-5xl text-center text-white">
            
            {/* Elegant Logo */}
            <div className="mb-12">
              <Logo 
                width={180} 
                height={60}
                variant="dark"
                className="mx-auto opacity-95 filter drop-shadow-lg"
              />
            </div>
            
            {/* Hero Typography */}
            <div className="space-y-10">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl font-extralight leading-tight tracking-tight">
                  Investment Guide
                </h1>
                <div className="w-20 h-px bg-white/40 mx-auto"></div>
                <p className="text-lg md:text-xl font-light leading-relaxed max-w-3xl mx-auto opacity-90">
                  Understanding the artistry, time, and expertise that creates your portrait legacy
                </p>
              </div>
              
              <p className="text-sm md:text-base font-light tracking-[0.15em] uppercase opacity-80">
                Portrait Investment — Luxury Experience Pricing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="py-20 px-6 bg-gradient-to-b from-ivory to-warm-gray/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="w-16 h-px bg-charcoal/20 mx-auto"></div>
              <h2 className="text-3xl md:text-4xl font-light text-charcoal tracking-wide">Our Investment Philosophy</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="space-y-4">
                <div className="w-8 h-8 bg-charcoal/10 rounded-full flex items-center justify-center">
                  <span className="text-charcoal font-light">01</span>
                </div>
                <h3 className="text-lg font-light text-charcoal">Timeless Artistry</h3>
                <p className="text-sm font-light text-charcoal/70 leading-relaxed">
                  Your portraits are not just photographs—they are heirloom pieces of art that will be treasured for generations.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-8 h-8 bg-charcoal/10 rounded-full flex items-center justify-center">
                  <span className="text-charcoal font-light">02</span>
                </div>
                <h3 className="text-lg font-light text-charcoal">Expert Craftsmanship</h3>
                <p className="text-sm font-light text-charcoal/70 leading-relaxed">
                  Each session involves meticulous planning, artistic vision, and hours of specialized post-production work.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="w-8 h-8 bg-charcoal/10 rounded-full flex items-center justify-center">
                  <span className="text-charcoal font-light">03</span>
                </div>
                <h3 className="text-lg font-light text-charcoal">Luxury Experience</h3>
                <p className="text-sm font-light text-charcoal/70 leading-relaxed">
                  From consultation to final delivery, every moment is designed to exceed expectations and create lasting memories.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Tiers Navigation */}
      <div className="py-12 px-6 bg-white border-t border-charcoal/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="space-y-6">
              <div className="w-16 h-px bg-charcoal/20 mx-auto"></div>
              <h2 className="text-3xl md:text-4xl font-light text-charcoal tracking-wide">Investment Tiers</h2>
              <p className="text-base font-light text-charcoal/60 max-w-2xl mx-auto leading-relaxed">
                Three distinct levels of luxury portrait experiences, each crafted to meet different needs and visions
              </p>
            </div>
          </div>

          {/* Tier Selection */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {investmentTiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier)}
                className={`px-8 py-4 text-sm font-light tracking-wide uppercase transition-all duration-300 ${
                  selectedTier.id === tier.id
                    ? 'bg-charcoal text-white'
                    : 'border border-charcoal/30 text-charcoal hover:bg-charcoal hover:text-white'
                }`}
              >
                {tier.name}
                <div className="text-xs opacity-70 mt-1">{tier.priceRange}</div>
              </button>
            ))}
          </div>

          {/* Selected Tier Details */}
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden bg-charcoal/5">
                <img
                  src={selectedTier.imageUrl}
                  alt={selectedTier.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>
              
              {/* Image Overlay */}
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="space-y-3">
                  <h3 className="text-2xl font-light tracking-wide">{selectedTier.name}</h3>
                  <p className="text-base opacity-90">{selectedTier.subtitle}</p>
                  <div className="text-lg font-light">{selectedTier.priceRange}</div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-4xl font-light text-charcoal tracking-wide">
                    {selectedTier.name}
                  </h3>
                  <p className="text-lg text-charcoal/80 font-light italic">
                    {selectedTier.subtitle}
                  </p>
                  <div className="text-3xl font-light text-charcoal">
                    {selectedTier.priceRange}
                  </div>
                  <div className="w-12 h-px bg-charcoal/30"></div>
                </div>
                
                <p className="text-base font-light text-charcoal/80 leading-relaxed">
                  {selectedTier.philosophy}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-charcoal/10">
                    <span className="text-charcoal/60">Experience</span>
                    <span className="font-medium text-charcoal">{selectedTier.experience}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-charcoal/10">
                    <span className="text-charcoal/60">Duration</span>
                    <span className="font-medium text-charcoal">{selectedTier.duration}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-charcoal/10">
                    <span className="text-charcoal/60">Locations</span>
                    <span className="font-medium text-charcoal">{selectedTier.locations}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-charcoal/10">
                    <span className="text-charcoal/60">Images</span>
                    <span className="font-medium text-charcoal">{selectedTier.images}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-light text-charcoal/60 tracking-wide uppercase">Complete Experience Includes</h4>
                <div className="space-y-3">
                  {selectedTier.includes.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <div className="w-1.5 h-1.5 bg-verde rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm font-light text-charcoal/70 leading-relaxed">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add-On Services */}
      <div className="py-20 px-6 bg-gradient-to-b from-warm-gray/5 to-ivory">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="space-y-6">
              <div className="w-16 h-px bg-charcoal/20 mx-auto"></div>
              <h2 className="text-3xl md:text-4xl font-light text-charcoal tracking-wide">Enhancement Services</h2>
              <p className="text-base font-light text-charcoal/60 max-w-2xl mx-auto leading-relaxed">
                Curated add-on services to further elevate your portrait experience
              </p>
            </div>
          </div>

          <div className="space-y-12">
            {addOnServices.map((category, categoryIdx) => (
              <div key={categoryIdx}>
                <div className="mb-8">
                  <h3 className="text-2xl font-light text-charcoal tracking-wide mb-2">
                    {category.category}
                  </h3>
                  <div className="w-12 h-px bg-charcoal/20"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {category.services.map((service, serviceIdx) => (
                    <div key={serviceIdx} className="bg-white border border-charcoal/10 p-6 hover:shadow-lg transition-shadow duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-light text-charcoal leading-tight flex-1 mr-4">
                          {service.name}
                        </h4>
                        <div className="text-lg font-light text-charcoal">
                          {service.price}
                        </div>
                      </div>
                      <p className="text-sm font-light text-charcoal/70 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Investment Timeline */}
      <div className="py-20 px-6 bg-white border-t border-charcoal/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="space-y-6">
              <div className="w-16 h-px bg-charcoal/20 mx-auto"></div>
              <h2 className="text-3xl md:text-4xl font-light text-charcoal tracking-wide">The Experience Journey</h2>
              <p className="text-base font-light text-charcoal/60 max-w-2xl mx-auto leading-relaxed">
                Understanding the complete process from consultation to final delivery
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Consultation & Planning',
                description: 'Comprehensive discussion of your vision, style preferences, and desired outcomes. We\'ll plan every detail including locations, styling, and creative concepts.',
                timeline: '1-2 weeks before session'
              },
              {
                step: '02',
                title: 'Portrait Session',
                description: 'Your luxury portrait experience with full creative direction, professional styling, and meticulous attention to every detail.',
                timeline: 'Session day'
              },
              {
                step: '03',
                title: 'Artistic Post-Production',
                description: 'Careful selection and expert retouching of your images, ensuring each photograph meets our exacting standards of excellence.',
                timeline: '2-3 weeks after session'
              },
              {
                step: '04',
                title: 'Gallery Delivery',
                description: 'Private online gallery presentation with high-resolution downloads and guidance for print options and display.',
                timeline: '3-4 weeks after session'
              }
            ].map((phase, idx) => (
              <div key={idx} className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-charcoal text-white rounded-full flex items-center justify-center">
                    <span className="text-sm font-light">{phase.step}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="space-y-2">
                    <h3 className="text-xl font-light text-charcoal">{phase.title}</h3>
                    <p className="text-sm font-light text-charcoal/70 leading-relaxed">
                      {phase.description}
                    </p>
                    <p className="text-xs font-light text-charcoal/50 tracking-wide uppercase">
                      {phase.timeline}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Luxury CTA Section */}
      <div className="py-24 px-6 bg-charcoal text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-12">
            <div className="space-y-8">
              <div className="w-16 h-px bg-white/30 mx-auto"></div>
              <h2 className="text-3xl md:text-5xl font-light tracking-wide leading-tight">
                Ready to Invest in
                <br />
                Your Portrait Legacy?
              </h2>
              <p className="text-lg font-light leading-relaxed max-w-2xl mx-auto opacity-90">
                Each investment tier includes complimentary consultation to ensure your experience 
                perfectly aligns with your vision and expectations.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="bg-white text-charcoal px-8 py-4 text-sm font-light tracking-wide uppercase hover:bg-white/90 transition-all duration-300">
                Schedule Consultation
              </button>
              <button className="border border-white/30 text-white px-8 py-4 text-sm font-light tracking-wide uppercase hover:bg-white hover:text-charcoal transition-all duration-300">
                Download Complete Guide
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-16 px-6 bg-ivory border-t border-charcoal/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-8">
            <Logo 
              width={160} 
              height={53}
              variant="light"
              className="mx-auto opacity-80"
            />
            <div className="space-y-4">
              <p className="text-sm font-light text-charcoal/60 tracking-wide uppercase">
                Investment Guide 2025
              </p>
              <p className="text-xs font-light text-charcoal/50 max-w-2xl mx-auto leading-relaxed">
                Every portrait session is an investment in preserving your story with the highest level of 
                artistry, craftsmanship, and luxury service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}