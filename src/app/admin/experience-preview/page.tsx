'use client';

import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';

interface ExperienceData {
  title: string;
  packages: any[];
  enhancements: any[];
  motion: any;
  discount: { type: string; value: string; label: string };
  subtotal: number;
  total: number;
}

export default function ExperiencePreviewPage() {
  const [experienceData, setExperienceData] = useState<ExperienceData | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);
  const [selectedMotion, setSelectedMotion] = useState<string[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('experiencePreview');
    if (stored) {
      setExperienceData(JSON.parse(stored));
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!experienceData) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="text-charcoal text-xl mb-4">Loading preview...</div>
        </div>
      </div>
    );
  }

  // Sort packages by price (highest to lowest for pricing psychology)
  const sortedPackages = [...experienceData.packages].sort((a, b) => b.price - a.price);

  return (
    <div className="min-h-screen bg-ivory">
      {/* Hero Section - Mobile Optimized */}
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
                  {experienceData.title}
                </h1>
                <div className="w-12 sm:w-16 h-px bg-charcoal/30 mx-auto"></div>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                <p className="text-base sm:text-lg md:text-xl font-light text-charcoal/70 leading-relaxed max-w-2xl mx-auto px-4">
                  A curated portrait experience designed around your story, crafted with intention and delivered with precision.
                </p>
                
                <p className="text-xs sm:text-sm font-light text-charcoal/50 tracking-widest uppercase">
                  Custom Experience — 2025
                </p>
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

          {/* Enhancements Section - Mobile Optimized */}
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
                {experienceData.enhancements.map((enhancement: any) => (
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

          {/* Motion Section - Mobile Optimized Black Background */}
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
                    {experienceData.motion.map((motion: any) => (
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

          {/* Investment Summary - Mobile Optimized */}
          <div className="border border-charcoal/20 bg-white">
            <div className="p-8 sm:p-12 lg:p-16 text-center space-y-8 sm:space-y-12">
              
              <div className="space-y-6 sm:space-y-8">
                <div className="w-12 sm:w-16 h-px bg-charcoal/20 mx-auto"></div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-charcoal tracking-wide">Investment</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  {(() => {
                    // Calculate dynamic total based on customer selections
                    let total = 0;
                    
                    // Add selected package price
                    if (selectedPackage) {
                      const selectedPkg = sortedPackages.find(pkg => pkg.id === selectedPackage);
                      if (selectedPkg) total += selectedPkg.price;
                    }
                    
                    // Add selected enhancements (required + optional selected)
                    if (experienceData.enhancements) {
                      experienceData.enhancements.forEach(enhancement => {
                        if (enhancement.is_required || selectedEnhancements.includes(enhancement.id)) {
                          total += enhancement.price;
                        }
                      });
                    }
                    
                    // Add selected motion (required + optional selected)
                    if (experienceData.motion) {
                      experienceData.motion.forEach(motion => {
                        if (motion.is_required || selectedMotion.includes(motion.id)) {
                          total += motion.price;
                        }
                      });
                    }
                    
                    return (
                      <div className="text-3xl sm:text-4xl md:text-5xl font-light text-charcoal">
                        {formatCurrency(total)}
                      </div>
                    );
                  })()}
                  <p className="text-sm font-light text-charcoal/60 max-w-md mx-auto leading-relaxed px-4">
                    Complete experience including editorial direction, production, and refined digital deliverables
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 max-w-lg mx-auto">
                <button 
                  onClick={() => {
                    // Store customer selections for potential quote generation
                    const customerSelections = {
                      selectedPackage,
                      selectedEnhancements,
                      selectedMotion,
                      experienceTitle: experienceData.title
                    };
                    sessionStorage.setItem('customerSelections', JSON.stringify(customerSelections));
                    window.close();
                  }}
                  className="flex-1 bg-charcoal text-white py-3 sm:py-4 px-6 sm:px-8 text-sm font-light tracking-wide uppercase hover:bg-charcoal/90 transition-all duration-300 min-h-[48px]"
                >
                  Reserve Experience
                </button>
                <button 
                  onClick={() => window.close()}
                  className="flex-1 border border-charcoal/30 text-charcoal py-3 sm:py-4 px-6 sm:px-8 text-sm font-light tracking-wide uppercase hover:border-charcoal hover:bg-charcoal hover:text-white transition-all duration-300 min-h-[48px]"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}