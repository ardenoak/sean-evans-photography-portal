'use client';
import { ResourceItem, GalleryStats } from '@/types/portal';

export default function ResourcesTab() {
  const galleryStats: GalleryStats = {
    totalImages: 87,
    favorites: 12,
    accessDays: 365
  };

  const resources: ResourceItem[] = [
    {
      id: '1',
      title: 'Session Contract',
      description: 'Signed agreement for your portrait session',
      type: 'contract',
      status: 'signed',
      icon: '📄',
      gradient: 'from-verde to-verde/80',
      actionText: 'View PDF',
      date: 'February 15, 2025'
    },
    {
      id: '2',
      title: 'Invoice',
      description: 'Payment confirmation and receipt',
      type: 'invoice',
      status: 'paid',
      icon: '💰',
      gradient: 'from-gold to-gold/80',
      actionText: 'Download',
      date: 'February 16, 2025'
    },
    {
      id: '3',
      title: 'Style Guide',
      description: 'Comprehensive wardrobe recommendations and styling tips',
      type: 'guide',
      status: 'new',
      icon: '👗',
      gradient: 'from-charcoal to-charcoal/80',
      actionText: 'View Guide',
      date: 'March 10, 2025'
    },
    {
      id: '4',
      title: 'Location Details',
      description: 'Parking information and meeting points',
      type: 'guide',
      status: 'ready',
      icon: '📍',
      gradient: 'from-verde/80 to-verde/60',
      actionText: 'View Details',
      date: 'March 10, 2025'
    },
    {
      id: '5',
      title: 'Preparation Checklist',
      description: 'Everything you need for session day',
      type: 'guide',
      status: 'ready',
      icon: '✅',
      gradient: 'from-gold/80 to-gold/60',
      actionText: 'View Checklist',
      date: 'March 10, 2025'
    },
    {
      id: '6',
      title: 'Print & Product Guide',
      description: 'Professional printing recommendations',
      type: 'guide',
      status: 'ready',
      icon: '🖼️',
      gradient: 'from-charcoal/80 to-charcoal/60',
      actionText: 'View Guide',
      date: 'March 22, 2025'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      signed: { text: 'Signed', bg: 'bg-verde', textColor: 'text-white' },
      paid: { text: 'Paid', bg: 'bg-gold', textColor: 'text-white' },
      new: { text: 'New', bg: 'bg-red-500', textColor: 'text-white' },
      ready: { text: 'Ready', bg: 'bg-gray-100', textColor: 'text-gray-700' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.textColor}`}>
        {config.text}
      </span>
    );
  };

  const handleResourceClick = (resource: ResourceItem) => {
    console.log(`Opening ${resource.title}`);
    // This would normally open/download the actual resource
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Gallery Access Section */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
        <div className="relative p-4 sm:p-8 text-white overflow-hidden min-h-[250px] sm:min-h-[300px] gallery-background" style={{ backgroundImage: 'url(/gallery-bg.jpg)' }}>
          {/* Black fade overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gold/20 rounded-full -translate-y-24 translate-x-24"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-verde/20 rounded-full translate-y-16 -translate-x-16"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-didot mb-4 drop-shadow-lg">Your Gallery</h2>
            <p className="text-sm opacity-90 mb-4 sm:mb-6 drop-shadow">Your beautiful portraits will be delivered here</p>
            
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6">
              <div className="text-center bg-black/30 backdrop-blur-sm rounded-lg p-2 sm:p-3">
                <div className="text-xl sm:text-2xl font-bold drop-shadow-lg">{galleryStats.totalImages}</div>
                <div className="text-xs sm:text-sm opacity-90 drop-shadow">Images Expected</div>
              </div>
              <div className="text-center bg-black/30 backdrop-blur-sm rounded-lg p-2 sm:p-3">
                <div className="text-xl sm:text-2xl font-bold drop-shadow-lg">{galleryStats.favorites}</div>
                <div className="text-xs sm:text-sm opacity-90 drop-shadow">Favorites Ready</div>
              </div>
              <div className="text-center bg-black/30 backdrop-blur-sm rounded-lg p-2 sm:p-3">
                <div className="text-xl sm:text-2xl font-bold drop-shadow-lg">{galleryStats.accessDays}</div>
                <div className="text-xs sm:text-sm opacity-90 drop-shadow">Days Access</div>
              </div>
            </div>
            
            <button className="bg-white/90 backdrop-blur-sm text-charcoal px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-xl border border-white/20 text-sm sm:text-base">
              Access Your Gallery
            </button>
          </div>
        </div>
      </div>

      {/* Document Library */}
      <div>
        <h2 className="text-2xl font-didot mb-6 text-charcoal">Document Library</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <div
              key={resource.id}
              onClick={() => handleResourceClick(resource)}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 hover:scale-105"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Resource Header */}
              <div className={`bg-gradient-to-r ${resource.gradient} text-white p-6 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="text-3xl">{resource.icon}</div>
                  {getStatusBadge(resource.status)}
                </div>
              </div>

              {/* Resource Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-2">{resource.title}</h3>
                <p className="text-sm text-warm-gray mb-4">{resource.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-warm-gray">{resource.date}</span>
                  <button className="bg-ivory hover:bg-gold hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-110">
                    {resource.actionText}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}