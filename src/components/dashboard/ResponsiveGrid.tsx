'use client';
import { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  variant?: 'metrics' | 'priorities' | 'activities' | 'tools' | 'custom';
  className?: string;
}

const gridVariants = {
  metrics: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6',
  priorities: 'grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6',
  activities: 'grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8',
  tools: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6',
  custom: 'grid gap-4 md:gap-6'
};

export default function ResponsiveGrid({ 
  children, 
  variant = 'custom', 
  className = '' 
}: ResponsiveGridProps) {
  const gridClasses = gridVariants[variant];
  
  return (
    <div className={`${gridClasses} ${className}`}>
      {children}
    </div>
  );
}