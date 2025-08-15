'use client';

interface SkeletonLoaderProps {
  variant?: 'card' | 'metric' | 'activity' | 'priority';
  className?: string;
}

const SkeletonBase = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-charcoal/10 rounded ${className}`}></div>
);

export default function SkeletonLoader({ 
  variant = 'card', 
  className = '' 
}: SkeletonLoaderProps) {
  if (variant === 'metric') {
    return (
      <div className={`bg-white border border-charcoal/10 p-6 md:p-8 ${className}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <SkeletonBase className="h-10 w-20 mb-2" />
            <SkeletonBase className="h-4 w-24 mb-1" />
            <SkeletonBase className="h-3 w-32" />
          </div>
          <SkeletonBase className="w-12 h-12 rounded-lg" />
        </div>
        <div className="flex items-center justify-between">
          <SkeletonBase className="h-6 w-16" />
          <SkeletonBase className="h-4 w-20" />
        </div>
      </div>
    );
  }

  if (variant === 'activity') {
    return (
      <div className={`bg-white border border-charcoal/10 overflow-hidden ${className}`}>
        <div className="p-6 border-b border-charcoal/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonBase className="w-8 h-8 rounded-lg" />
              <SkeletonBase className="h-5 w-32" />
            </div>
            <SkeletonBase className="w-6 h-6 rounded-full" />
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start justify-between py-3">
                <div className="flex-1">
                  <SkeletonBase className="h-4 w-40 mb-1" />
                  <SkeletonBase className="h-3 w-24 mb-1" />
                  <SkeletonBase className="h-3 w-32" />
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <SkeletonBase className="h-6 w-16 rounded" />
                  <SkeletonBase className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'priority') {
    return (
      <div className={`bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <SkeletonBase className="h-5 w-32" />
          <SkeletonBase className="w-12 h-12 rounded-full" />
        </div>
        <SkeletonBase className="h-4 w-full mb-6" />
        <div className="flex items-center justify-between">
          <SkeletonBase className="w-8 h-8 rounded" />
          <SkeletonBase className="h-10 flex-1 ml-3" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-charcoal/10 p-6 ${className}`}>
      <SkeletonBase className="h-6 w-3/4 mb-4" />
      <SkeletonBase className="h-4 w-full mb-2" />
      <SkeletonBase className="h-4 w-2/3 mb-4" />
      <SkeletonBase className="h-10 w-32" />
    </div>
  );
}