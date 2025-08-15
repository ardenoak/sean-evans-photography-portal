'use client';
import { ReactNode } from 'react';
import DashboardCard from './DashboardCard';

interface MetricCardProps {
  title: string;
  value: string | number | ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'charcoal/60',
  trend,
  action,
  className = ''
}: MetricCardProps) {
  return (
    <DashboardCard 
      className={`p-6 md:p-8 ${className}`}
      hover={!!action}
      clickable={!!action}
      onClick={action?.onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="text-3xl md:text-4xl font-light text-charcoal mb-2 leading-none">
            {value}
          </div>
          <div className="text-sm font-light tracking-wider uppercase text-charcoal/60 mb-1">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-charcoal/50 leading-relaxed">
              {subtitle}
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 bg-${iconColor.replace('/', '/')}/10 flex items-center justify-center rounded-lg`}>
            <div className={`text-${iconColor}`}>
              {icon}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        {trend && (
          <div className="flex items-center gap-2">
            <div className={`text-xs px-2 py-1 rounded-full ${
              trend.isPositive 
                ? 'bg-verde/10 text-verde' 
                : 'bg-orange-500/10 text-orange-600'
            }`}>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            </div>
            <span className="text-xs text-charcoal/50">{trend.label}</span>
          </div>
        )}
        
        {action && (
          <button className="text-xs text-charcoal/60 hover:text-charcoal transition-colors border-b border-transparent hover:border-charcoal/30">
            {action.label} →
          </button>
        )}
      </div>
    </DashboardCard>
  );
}