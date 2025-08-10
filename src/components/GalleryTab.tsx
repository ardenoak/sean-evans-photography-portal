'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface GalleryData {
  id: string;
  title: string;
  status: 'preparing' | 'preview' | 'ready' | 'delivered' | 'archived';
  preview_count: number;
  total_count: number;
  delivery_date: string;
  expiry_date: string;
  access_days: number;
  is_wedding: boolean;
  images: GalleryImage[];
}

interface GalleryImage {
  id: string;
  filename: string;
  image_url: string;
  thumbnail_url?: string;
  is_preview: boolean;
  is_favorite: boolean;
  sort_order: number;
}

interface GalleryTabProps {
  sessionId: string;
  sessionType: string;
  sessionDate: string;
}

export default function GalleryTab({ sessionId, sessionType, sessionDate }: GalleryTabProps) {
  const [gallery, setGallery] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadGallery();
  }, [sessionId]);

  const loadGallery = async () => {
    if (!user) return;

    try {
      // Load gallery data for this session
      const { data: galleryData, error: galleryError } = await supabase
        .from('galleries')
        .select(`
          *,
          gallery_images (*)
        `)
        .eq('session_id', sessionId)
        .single();

      if (galleryError) {
        console.error('Error loading gallery:', galleryError);
        // Gallery might not exist yet, create default data
        setGallery(null);
      } else if (galleryData) {
        setGallery({
          ...galleryData,
          images: galleryData.gallery_images || []
        });
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (imageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('gallery_images')
        .update({ is_favorite: !currentStatus })
        .eq('id', imageId);

      if (error) {
        console.error('Error updating favorite:', error);
      } else {
        // Update local state
        setGallery(prev => prev ? {
          ...prev,
          images: prev.images.map(img => 
            img.id === imageId ? { ...img, is_favorite: !currentStatus } : img
          )
        } : null);
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateExpectedImages = () => {
    // Estimate based on session type
    const estimates = {
      'Editorial Portrait': 75,
      'Branding Session': 100,
      'Headshots': 50,
      'Creative Portrait': 85,
      'Wedding': 500,
      'Engagement': 80,
      'Event': 200
    };
    return estimates[sessionType as keyof typeof estimates] || 75;
  };

  const calculateDeliveryDays = () => {
    // Different delivery times based on session type
    const deliveryDays = {
      'Editorial Portrait': 3,
      'Branding Session': 2,
      'Headshots': 2,
      'Creative Portrait': 3,
      'Wedding': 21,
      'Engagement': 3,
      'Event': 5
    };
    return deliveryDays[sessionType as keyof typeof deliveryDays] || 3;
  };

  const calculateAccessDays = () => {
    return sessionType === 'Wedding' ? 365 : 90;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading gallery...</p>
        </div>
      </div>
    );
  }

  // Gallery exists and has images
  if (gallery && gallery.images.length > 0) {
    const previewImages = gallery.images.filter(img => img.is_preview).sort((a, b) => a.sort_order - b.sort_order);
    const allImages = gallery.images.sort((a, b) => a.sort_order - b.sort_order);
    
    return (
      <div className="animate-fade-in">
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-didot text-charcoal">{gallery.title}</h2>
              <p className="text-warm-gray mt-2">
                Status: <span className="capitalize font-semibold text-verde">{gallery.status}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-warm-gray">Expires</div>
              <div className="text-lg font-semibold text-charcoal">{formatDate(gallery.expiry_date)}</div>
            </div>
          </div>

          {/* Gallery Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-verde/10 rounded-lg">
              <div className="text-2xl font-bold text-verde">{gallery.total_count}</div>
              <div className="text-sm text-warm-gray">Total Images</div>
            </div>
            <div className="text-center p-4 bg-gold/10 rounded-lg">
              <div className="text-2xl font-bold text-gold">{gallery.preview_count}</div>
              <div className="text-sm text-warm-gray">Preview Selection</div>
            </div>
            <div className="text-center p-4 bg-charcoal/10 rounded-lg">
              <div className="text-2xl font-bold text-charcoal">{gallery.access_days}</div>
              <div className="text-sm text-warm-gray">Days Access</div>
            </div>
          </div>

          {/* Preview Images Grid */}
          {gallery.status === 'preview' && previewImages.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-didot text-charcoal mb-4">Preview Selection</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previewImages.map((image) => (
                  <div key={image.id} className="relative group cursor-pointer">
                    <img 
                      src={image.thumbnail_url || image.image_url}
                      alt={image.filename}
                      className="w-full aspect-square object-cover rounded-lg"
                      onClick={() => setSelectedImage(image.image_url)}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(image.id, image.is_favorite);
                      }}
                      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        image.is_favorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      ♥
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Gallery */}
          {gallery.status === 'ready' && (
            <div>
              <h3 className="text-xl font-didot text-charcoal mb-4">Complete Gallery</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {allImages.map((image) => (
                  <div key={image.id} className="relative group cursor-pointer">
                    <img 
                      src={image.thumbnail_url || image.image_url}
                      alt={image.filename}
                      className="w-full aspect-square object-cover rounded"
                      onClick={() => setSelectedImage(image.image_url)}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(image.id, image.is_favorite);
                      }}
                      className={`absolute top-1 right-1 w-6 h-6 text-xs rounded-full flex items-center justify-center transition-all ${
                        image.is_favorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      ♥
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
            <div className="relative max-w-7xl max-h-[90vh] mx-4">
              <img 
                src={selectedImage}
                alt="Gallery image"
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white text-xl font-bold transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Gallery preparing or no images yet
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="text-center max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-12 transform hover:scale-105 transition-transform duration-300">
          <div className="w-24 h-24 bg-gradient-to-r from-gold to-gold/80 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl text-white shadow-lg">
            📸
          </div>
          
          <h2 className="text-3xl font-didot text-charcoal mb-4">
            {sessionType} Gallery
          </h2>
          
          <p className="text-warm-gray text-lg mb-6">
            Your beautiful {sessionType.toLowerCase()} gallery will be delivered here after your session.
          </p>
          
          <div className="bg-ivory p-6 rounded-lg mb-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-3 h-3 bg-verde rounded-full animate-pulse"></div>
              <span className="text-charcoal font-semibold">Expected Delivery</span>
            </div>
            <p className="text-2xl font-didot text-charcoal">
              {formatDate(new Date(new Date(sessionDate).getTime() + calculateDeliveryDays() * 24 * 60 * 60 * 1000).toISOString())}
            </p>
            <p className="text-sm text-warm-gray">Preview gallery with curated selections</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-verde/10 rounded-lg">
              <div className="text-2xl font-bold text-verde">{calculateExpectedImages()}+</div>
              <div className="text-sm text-warm-gray">Images Expected</div>
            </div>
            <div className="p-4 bg-gold/10 rounded-lg">
              <div className="text-2xl font-bold text-gold">{calculateDeliveryDays()}</div>
              <div className="text-sm text-warm-gray">{sessionType === 'Wedding' ? 'Weeks' : 'Business Days'}</div>
            </div>
            <div className="p-4 bg-charcoal/10 rounded-lg">
              <div className="text-2xl font-bold text-charcoal">{calculateAccessDays()}</div>
              <div className="text-sm text-warm-gray">Days Access</div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-gradient-to-r from-verde/5 to-gold/5 rounded-lg border-l-4 border-verde">
            <p className="text-sm text-charcoal">
              <strong>What to expect:</strong> Your preview gallery will include professionally edited selections, 
              followed by the complete gallery with all images from your {sessionType.toLowerCase()} session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}