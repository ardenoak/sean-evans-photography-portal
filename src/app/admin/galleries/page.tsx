'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/lib/supabase';

interface Gallery {
  id: string;
  session_id: string;
  title: string;
  status: 'preparing' | 'preview' | 'ready' | 'delivered' | 'archived';
  total_count: number;
  preview_count: number;
  delivery_date: string;
  expiry_date: string;
  access_days: number;
  sessions: {
    session_type: string;
    session_date: string;
    clients: {
      first_name: string;
      last_name: string;
    };
  };
}

interface UploadedImage {
  file: File;
  preview: string;
  isPreview: boolean;
}

export default function AdminGalleriesPage() {
  const { user, loading: authLoading, isAdmin, signOut } = useAdminAuth();
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [uploadingImages, setUploadingImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/admin/login');
      return;
    }

    if (user && isAdmin) {
      loadGalleries();
    }
  }, [user, isAdmin, authLoading, router]);

  const loadGalleries = async () => {
    try {
      const { data, error } = await supabase
        .from('galleries')
        .select(`
          *,
          sessions!inner (
            session_type,
            session_date,
            clients!inner (first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading galleries:', error);
      } else {
        setGalleries(data || []);
      }
    } catch (error) {
      console.error('Error loading galleries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
          isPreview: false
        });
      }
    });

    setUploadingImages(prev => [...prev, ...newImages]);
  };

  const removeUploadedImage = (index: number) => {
    setUploadingImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const togglePreviewStatus = (index: number) => {
    setUploadingImages(prev => 
      prev.map((img, i) => 
        i === index ? { ...img, isPreview: !img.isPreview } : img
      )
    );
  };

  const uploadImages = async () => {
    if (!selectedGallery || uploadingImages.length === 0) return;
    
    setUploading(true);
    
    try {
      const uploadPromises = uploadingImages.map(async (uploadedImage, index) => {
        const fileExt = uploadedImage.file.name.split('.').pop();
        const fileName = `${selectedGallery.id}/${Date.now()}-${index}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(fileName, uploadedImage.file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(fileName);

        // Create gallery image record
        const { error: insertError } = await supabase
          .from('gallery_images')
          .insert({
            gallery_id: selectedGallery.id,
            filename: uploadedImage.file.name,
            original_filename: uploadedImage.file.name,
            file_size: uploadedImage.file.size,
            image_url: urlData.publicUrl,
            is_preview: uploadedImage.isPreview,
            sort_order: index
          });

        if (insertError) {
          console.error('Error creating gallery image record:', insertError);
          throw insertError;
        }
      });

      await Promise.all(uploadPromises);
      
      // Clear uploaded images
      uploadingImages.forEach(img => URL.revokeObjectURL(img.preview));
      setUploadingImages([]);
      
      // Reload galleries to update counts
      await loadGalleries();
      
      alert('Images uploaded successfully!');
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const updateGalleryStatus = async (galleryId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('galleries')
        .update({ status: newStatus })
        .eq('id', galleryId);

      if (error) {
        console.error('Error updating gallery status:', error);
      } else {
        await loadGalleries();
      }
    } catch (error) {
      console.error('Error updating gallery status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'preparing': 'bg-yellow-100 text-yellow-800',
      'preview': 'bg-blue-100 text-blue-800',
      'ready': 'bg-green-100 text-green-800',
      'delivered': 'bg-purple-100 text-purple-800',
      'archived': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-gold to-verde rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-warm-gray">Loading galleries...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="text-warm-gray hover:text-charcoal transition-colors"
              >
                ←
              </button>
              <Image
                src="/sean-evans-logo.png"
                alt="Sean Evans Photography"
                width={200}
                height={80}
                className="h-8 w-auto"
                priority
              />
              <div>
                <h1 className="text-lg font-didot text-charcoal">Gallery Management</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSignOut}
                className="text-sm text-warm-gray hover:text-charcoal transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Galleries List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-didot text-charcoal mb-4">Client Galleries</h2>
              <div className="space-y-3">
                {galleries.map((gallery) => (
                  <div
                    key={gallery.id}
                    onClick={() => setSelectedGallery(gallery)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedGallery?.id === gallery.id
                        ? 'border-gold bg-gold/10'
                        : 'border-warm-gray/20 hover:border-warm-gray/40 hover:bg-ivory/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-charcoal">
                        {gallery.sessions.clients.first_name} {gallery.sessions.clients.last_name}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(gallery.status)}`}>
                        {gallery.status}
                      </span>
                    </div>
                    <div className="text-sm text-warm-gray">
                      {gallery.sessions.session_type} • {formatDate(gallery.sessions.session_date)}
                    </div>
                    <div className="text-sm text-warm-gray mt-1">
                      {gallery.total_count} images ({gallery.preview_count} preview)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gallery Management */}
          <div className="lg:col-span-2">
            {selectedGallery ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-didot text-charcoal">{selectedGallery.title}</h2>
                    <p className="text-warm-gray">
                      {selectedGallery.sessions.clients.first_name} {selectedGallery.sessions.clients.last_name} • 
                      {selectedGallery.sessions.session_type}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedGallery.status}
                      onChange={(e) => updateGalleryStatus(selectedGallery.id, e.target.value)}
                      className="px-3 py-1 border border-warm-gray/30 rounded text-sm"
                    >
                      <option value="preparing">Preparing</option>
                      <option value="preview">Preview</option>
                      <option value="ready">Ready</option>
                      <option value="delivered">Delivered</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Upload Section */}
                <div className="border-2 border-dashed border-warm-gray/30 rounded-lg p-8 text-center mb-6">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label htmlFor="imageUpload" className="cursor-pointer">
                    <div className="text-4xl mb-4">📸</div>
                    <div className="text-lg font-semibold text-charcoal mb-2">Upload Gallery Images</div>
                    <div className="text-warm-gray">Click to select multiple images or drag and drop</div>
                  </label>
                </div>

                {/* Preview uploaded images */}
                {uploadingImages.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-charcoal">Images to Upload ({uploadingImages.length})</h3>
                      <button
                        onClick={uploadImages}
                        disabled={uploading}
                        className="bg-verde text-white px-4 py-2 rounded hover:bg-verde/90 disabled:opacity-50"
                      >
                        {uploading ? 'Uploading...' : 'Upload All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {uploadingImages.map((uploadedImage, index) => (
                        <div key={index} className="relative">
                          <img
                            src={uploadedImage.preview}
                            alt={`Upload ${index}`}
                            className="w-full aspect-square object-cover rounded"
                          />
                          <button
                            onClick={() => removeUploadedImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                          <button
                            onClick={() => togglePreviewStatus(index)}
                            className={`absolute bottom-1 left-1 px-2 py-1 text-xs rounded ${
                              uploadedImage.isPreview
                                ? 'bg-gold text-white'
                                : 'bg-white/80 text-charcoal hover:bg-gold hover:text-white'
                            }`}
                          >
                            {uploadedImage.isPreview ? 'Preview' : 'Standard'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gallery Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-verde/10 rounded-lg">
                    <div className="text-2xl font-bold text-verde">{selectedGallery.total_count}</div>
                    <div className="text-sm text-warm-gray">Total Images</div>
                  </div>
                  <div className="text-center p-4 bg-gold/10 rounded-lg">
                    <div className="text-2xl font-bold text-gold">{selectedGallery.preview_count}</div>
                    <div className="text-sm text-warm-gray">Preview Images</div>
                  </div>
                  <div className="text-center p-4 bg-charcoal/10 rounded-lg">
                    <div className="text-2xl font-bold text-charcoal">{selectedGallery.access_days}</div>
                    <div className="text-sm text-warm-gray">Access Days</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-4xl mb-4">📸</div>
                <div className="text-lg font-semibold text-charcoal mb-2">Select a Gallery</div>
                <div className="text-warm-gray">Choose a client gallery from the list to manage images</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}