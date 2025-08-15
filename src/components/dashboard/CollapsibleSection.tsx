'use client';
import { ReactNode, useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export default function CollapsibleSection({
  title,
  subtitle,
  children,
  defaultExpanded = true,
  className = ''
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`mb-8 md:mb-12 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-6 md:mb-8 group"
      >
        <div className="text-left">
          <h2 className="text-xl md:text-2xl font-light text-charcoal tracking-wide group-hover:text-charcoal/80 transition-colors">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-charcoal/60 mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
            <svg className="w-5 h-5 text-charcoal/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isExpanded 
          ? 'max-h-[5000px] opacity-100' 
          : 'max-h-0 opacity-0'
      }`}>
        {children}
      </div>
    </div>
  );
}