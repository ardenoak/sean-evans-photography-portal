'use client';

import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';

// Sample experiences data with luxury resort styling
const experiences = [
  {
    id: 'opulence',
    title: 'Opulence',
    subtitle: 'The Grandest Expression',
    description: 'An elevated portrait experience where every detail speaks to luxury. Studio and location work crafted for those who demand excellence in both artistry and service.',
    startingPrice: 7500,
    duration: '6-8 hours',
    locations: '3-4 premium venues',
    gallery: '150+ refined images',
    styling: '4-5 curated looks',
    highlights: [
      'Private studio with professional styling team',
      'Luxury location shoots at exclusive venues',
      'Premium post-production and retouching',
      'Designer wardrobe consultation',
      'Professional hair and makeup artist'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&q=80',
    theme: 'Maximalist luxury with rich textures and dramatic lighting',
    category: 'signature'
  },
  {
    id: 'elegance',
    title: 'Elegance',
    subtitle: 'Refined Sophistication',
    description: 'A sophisticated portrait session that captures your essence through timeless elegance. Perfect balance of classic portraiture with contemporary editorial flair.',
    startingPrice: 4500,
    duration: '4-5 hours',
    locations: '2-3 curated settings',
    gallery: '100+ polished images',
    styling: '3-4 refined looks',
    highlights: [
      'Editorial portrait session with artistic direction',
      'Carefully selected indoor and outdoor locations',
      'Professional styling guidance',
      'Expert lighting and composition',
      'Comprehensive post-production workflow'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    theme: 'Classic elegance with modern sophistication',
    category: 'signature'
  },
  {
    id: 'essence',
    title: 'Essence',
    subtitle: 'Authentic Beauty',
    description: 'An intimate portrait experience focused on capturing your natural beauty and authentic self. Thoughtfully crafted for those seeking genuine connection through imagery.',
    startingPrice: 2800,
    duration: '3-4 hours',
    locations: '1-2 meaningful venues',
    gallery: '75+ authentic images',
    styling: '2-3 natural looks',
    highlights: [
      'Intimate portrait session with personal attention',
      'Natural lighting and organic compositions',
      'Authentic styling that reflects your personality',
      'Documentary-style approach to capturing moments',
      'Curated gallery of your most genuine expressions'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
    theme: 'Natural beauty with authentic storytelling',
    category: 'intimate'
  },
  {
    id: 'branding-luxe',
    title: 'Branding Luxe',
    subtitle: 'Executive Presence',
    description: 'Sophisticated branding imagery for discerning professionals. Elevated headshots and lifestyle images that command attention and build executive presence.',
    startingPrice: 3500,
    duration: '3-4 hours',
    locations: '2-3 professional settings',
    gallery: '60+ branded images',
    styling: '3-4 professional looks',
    highlights: [
      'Executive headshots with commanding presence',
      'Lifestyle branding images for digital platforms',
      'Professional wardrobe consultation',
      'Multiple backdrop and location options',
      'Brand-aligned editing and retouching'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    theme: 'Professional authority with approachable sophistication',
    category: 'professional'
  },
  {
    id: 'editorial-narrative',
    title: 'Editorial Narrative',
    subtitle: 'Storytelling Through Fashion',
    description: 'A fashion-forward editorial experience that tells your story through dramatic imagery. Conceptual photography that blends high fashion with personal narrative.',
    startingPrice: 5200,
    duration: '5-6 hours',
    locations: '2-3 editorial venues',
    gallery: '120+ editorial images',
    styling: '4-5 fashion looks',
    highlights: [
      'High-fashion editorial concepts and styling',
      'Dramatic lighting and artistic composition',
      'Designer wardrobe and accessory selection',
      'Creative direction and art direction',
      'Magazine-quality post-production'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80',
    theme: 'High fashion meets personal storytelling',
    category: 'editorial'
  },
  {
    id: 'couples-romance',
    title: 'Couples Romance',
    subtitle: 'Love Story Documentation',
    description: 'An intimate couples experience capturing the depth of your connection. Romantic imagery that celebrates your unique love story with elegance and authenticity.',
    startingPrice: 3800,
    duration: '3-4 hours',
    locations: '2 romantic settings',
    gallery: '100+ romantic images',
    styling: '2-3 complementary looks',
    highlights: [
      'Intimate couples portrait session',
      'Romantic location scouting and selection',
      'Guidance for natural couple interactions',
      'Golden hour and romantic lighting',
      'Storytelling approach to couple documentation'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&q=80',
    theme: 'Romantic intimacy with timeless elegance',
    category: 'couples'
  }
];

export default function ExperienceCatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [featuredExperience, setFeaturedExperience] = useState(experiences[0]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const categories = [
    { id: 'all', label: 'All Experiences' },
    { id: 'signature', label: 'Signature' },
    { id: 'professional', label: 'Professional' },
    { id: 'editorial', label: 'Editorial' },
    { id: 'couples', label: 'Couples' },
    { id: 'intimate', label: 'Intimate' }
  ];

  const filteredExperiences = selectedCategory === 'all' 
    ? experiences 
    : experiences.filter(exp => exp.category === selectedCategory);

  return (
    <div className="min-h-screen bg-ivory">
      {/* Epic Hero Section */}
      <div className="relative min-h-screen bg-charcoal overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=2000&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-16">
          <div className="max-w-6xl text-center text-white">
            
            {/* Elegant Logo */}
            <div className="mb-16">
              <Logo 
                width={200} 
                height={67}
                variant="dark"
                className="mx-auto opacity-95 filter drop-shadow-lg"
              />
            </div>
            
            {/* Hero Typography */}
            <div className="space-y-12">
              <div className="space-y-8">
                <h1 className="text-5xl md:text-8xl font-extralight leading-[0.85] tracking-tight">
                  Experience
                  <br />
                  <span className="text-4xl md:text-7xl opacity-90">Collection</span>
                </h1>
                <div className="w-24 h-px bg-white/40 mx-auto"></div>
              </div>
              
              <div className="space-y-8">
                <p className="text-xl md:text-2xl font-light leading-relaxed max-w-4xl mx-auto opacity-90">
                  Six distinct portrait experiences, each meticulously crafted to capture 
                  your unique story through the lens of luxury and artistry.
                </p>
                
                <p className="text-sm md:text-base font-light tracking-[0.2em] uppercase opacity-80">
                  Curated Experiences — 2025 Collection
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60">
          <div className="flex flex-col items-center space-y-2 animate-bounce">
            <span className="text-xs font-light tracking-widest uppercase">Explore</span>
            <div className="w-px h-8 bg-white/30"></div>
          </div>
        </div>
      </div>

      {/* Featured Experience Spotlight */}
      <div className="py-24 px-6 bg-gradient-to-b from-ivory to-warm-gray/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="space-y-6">
              <div className="w-16 h-px bg-charcoal/20 mx-auto"></div>
              <h2 className="text-3xl md:text-4xl font-light text-charcoal tracking-wide">Featured Experience</h2>
              <p className="text-base font-light text-charcoal/60 max-w-2xl mx-auto leading-relaxed">
                Discover our most sought-after portrait experience
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden bg-charcoal/5">
                <img
                  src={featuredExperience.imageUrl}
                  alt={featuredExperience.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              </div>
              
              {/* Image Overlay */}
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="space-y-2">
                  <h3 className="text-2xl font-light tracking-wide">{featuredExperience.title}</h3>
                  <p className="text-sm opacity-90">{featuredExperience.subtitle}</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-4xl font-light text-charcoal tracking-wide">
                    {featuredExperience.title}
                  </h3>
                  <p className="text-lg text-charcoal/80 font-light italic">
                    {featuredExperience.subtitle}
                  </p>
                  <div className="w-12 h-px bg-charcoal/30"></div>
                </div>
                
                <p className="text-base font-light text-charcoal/80 leading-relaxed">
                  {featuredExperience.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-charcoal/10">
                    <span className="text-charcoal/60">Duration</span>
                    <span className="font-medium text-charcoal">{featuredExperience.duration}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-charcoal/10">
                    <span className="text-charcoal/60">Locations</span>
                    <span className="font-medium text-charcoal">{featuredExperience.locations}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-charcoal/10">
                    <span className="text-charcoal/60">Gallery</span>
                    <span className="font-medium text-charcoal">{featuredExperience.gallery}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-charcoal/10">
                    <span className="text-charcoal/60">Styling</span>
                    <span className="font-medium text-charcoal">{featuredExperience.styling}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-light text-charcoal/60 tracking-wide uppercase">What's Included</h4>
                <div className="space-y-2">
                  {featuredExperience.highlights.slice(0, 3).map((highlight, idx) => (
                    <p key={idx} className="text-sm font-light text-charcoal/70 leading-relaxed flex items-start">
                      <span className="text-verde mr-2">•</span>
                      {highlight}
                    </p>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-charcoal/10">
                <div className="flex items-end justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-light text-charcoal/60 tracking-wide uppercase">Starting Investment</p>
                    <p className="text-3xl font-light text-charcoal">
                      {formatCurrency(featuredExperience.startingPrice)}
                    </p>
                  </div>
                  <button className="bg-charcoal text-white px-8 py-3 text-sm font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Experience Categories Filter */}
      <div className="py-16 px-6 bg-white border-t border-charcoal/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="space-y-6">
              <div className="w-16 h-px bg-charcoal/20 mx-auto"></div>
              <h2 className="text-3xl md:text-4xl font-light text-charcoal tracking-wide">Complete Collection</h2>
              <p className="text-base font-light text-charcoal/60 max-w-2xl mx-auto leading-relaxed">
                Browse our full range of curated portrait experiences
              </p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 text-sm font-light tracking-wide uppercase transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-charcoal text-white'
                    : 'border border-charcoal/30 text-charcoal hover:bg-charcoal hover:text-white'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Experience Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredExperiences.map((experience) => (
              <div
                key={experience.id}
                className="group cursor-pointer"
                onClick={() => setFeaturedExperience(experience)}
              >
                <div className="space-y-6">
                  {/* Experience Image */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-charcoal/5">
                    <img
                      src={experience.imageUrl}
                      alt={experience.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                    
                    {/* Price Overlay */}
                    <div className="absolute top-6 right-6">
                      <div className="bg-white/95 backdrop-blur-sm px-4 py-2 text-charcoal">
                        <p className="text-xs font-light tracking-wide uppercase">From</p>
                        <p className="text-lg font-light">{formatCurrency(experience.startingPrice)}</p>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-6 left-6">
                      <div className="bg-charcoal/90 text-white px-3 py-1 text-xs font-light tracking-wide uppercase">
                        {experience.category}
                      </div>
                    </div>
                    
                    {/* Bottom Info */}
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <div className="space-y-2">
                        <h3 className="text-xl font-light tracking-wide">{experience.title}</h3>
                        <p className="text-sm opacity-90">{experience.subtitle}</p>
                        <div className="w-8 h-px bg-white/40"></div>
                        <p className="text-xs font-light opacity-80 leading-relaxed">
                          {experience.description.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Experience Details */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-lg font-light text-charcoal tracking-wide">{experience.title}</h4>
                      <p className="text-sm text-charcoal/60 italic">{experience.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex justify-between py-1">
                        <span className="text-charcoal/60">Duration</span>
                        <span className="text-charcoal font-medium">{experience.duration}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-charcoal/60">Gallery</span>
                        <span className="text-charcoal font-medium">{experience.gallery}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-charcoal/10">
                      <p className="text-xs font-light text-charcoal/70 leading-relaxed">
                        {experience.theme}
                      </p>
                    </div>
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
                Ready to Begin Your
                <br />
                Portrait Experience?
              </h2>
              <p className="text-lg font-light leading-relaxed max-w-2xl mx-auto opacity-90">
                Each experience is thoughtfully crafted and personally tailored. 
                Let's discuss which collection speaks to your vision.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="bg-white text-charcoal px-8 py-4 text-sm font-light tracking-wide uppercase hover:bg-white/90 transition-all duration-300">
                Schedule Consultation
              </button>
              <button 
                onClick={() => window.open('/investment-guide', '_blank')}
                className="border border-white/30 text-white px-8 py-4 text-sm font-light tracking-wide uppercase hover:bg-white hover:text-charcoal transition-all duration-300"
              >
                View Investment Guide
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
                Experience Collection 2025
              </p>
              <p className="text-xs font-light text-charcoal/50 max-w-2xl mx-auto leading-relaxed">
                Each portrait experience is an investment in capturing your story with intention, 
                artistry, and the finest attention to detail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}