'use client';
import { ReactNode } from 'react';

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export default function DashboardCard({ 
  children, 
  className = '', 
  hover = true,
  clickable = false,
  onClick 
}: DashboardCardProps) {
  const baseClasses = `
    bg-white 
    border border-charcoal/10 
    transition-all duration-300 
    backdrop-blur-sm
  `;

  const hoverClasses = hover ? `
    hover:border-charcoal/20 
    hover:shadow-lg 
    hover:shadow-charcoal/5
    hover:-translate-y-1
  ` : '';

  const clickableClasses = clickable ? `
    cursor-pointer 
    active:translate-y-0 
    active:shadow-md
  ` : '';

  const combinedClasses = `${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`.trim();

  return (
    <div 
      className={combinedClasses}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable && onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {children}
    </div>
  );
}