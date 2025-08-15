'use client';
import { ReactNode } from 'react';
import DashboardCard from './DashboardCard';

interface PriorityCardProps {
  title: string;
  description: string;
  count: number;
  urgency: 'low' | 'medium' | 'high';
  icon?: ReactNode;
  action: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const urgencyConfig = {
  low: {
    bg: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    iconBg: 'bg-blue-200',
    iconText: 'text-blue-800',
    text: 'text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700',
    countBg: 'bg-blue-200',
    countText: 'text-blue-800'
  },
  medium: {
    bg: 'from-orange-50 to-orange-100',
    border: 'border-orange-200',
    iconBg: 'bg-orange-200',
    iconText: 'text-orange-800',
    text: 'text-orange-700',
    button: 'bg-orange-600 hover:bg-orange-700',
    countBg: 'bg-orange-200',
    countText: 'text-orange-800'
  },
  high: {
    bg: 'from-red-50 to-red-100',
    border: 'border-red-200',
    iconBg: 'bg-red-200',
    iconText: 'text-red-800',
    text: 'text-red-700',
    button: 'bg-red-600 hover:bg-red-700',
    countBg: 'bg-red-200',
    countText: 'text-red-800'
  }
};

export default function PriorityCard({
  title,
  description,
  count,
  urgency,
  icon,
  action,
  className = ''
}: PriorityCardProps) {
  const config = urgencyConfig[urgency];

  return (
    <DashboardCard 
      className={`bg-gradient-to-br ${config.bg} ${config.border} p-6 ${className}`}
      hover={false}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-light ${config.iconText}`}>
          {title}
        </h3>
        <div className={`w-12 h-12 ${config.countBg} rounded-full flex items-center justify-center relative`}>
          <span className={`text-lg font-light ${config.countText}`}>
            {count}
          </span>
          {count > 0 && urgency === 'high' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>
      
      <p className={`text-sm ${config.text} mb-6 leading-relaxed`}>
        {description}
      </p>
      
      <div className="flex items-center justify-between">
        {icon && (
          <div className={`w-8 h-8 ${config.iconBg} rounded flex items-center justify-center ${config.iconText}`}>
            {icon}
          </div>
        )}
        
        <button
          onClick={action.onClick}
          className={`flex-1 ${icon ? 'ml-3' : ''} ${config.button} text-white py-3 px-4 text-sm font-light tracking-wide uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-current`}
        >
          {action.label}
        </button>
      </div>
    </DashboardCard>
  );
}