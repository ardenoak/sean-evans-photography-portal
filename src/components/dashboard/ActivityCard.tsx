'use client';
import { ReactNode, useState } from 'react';
import DashboardCard from './DashboardCard';

interface ActivityItem {
  id: string | number;
  title: string;
  subtitle?: string;
  metadata?: string;
  status?: {
    label: string;
    variant: 'success' | 'warning' | 'info' | 'error';
  };
  timestamp?: string;
  priority?: boolean;
}

interface ActivityCardProps {
  title: string;
  items: ActivityItem[];
  icon?: ReactNode;
  maxVisible?: number;
  emptyMessage?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const statusVariants = {
  success: 'bg-verde/10 text-verde border-verde/20',
  warning: 'bg-orange-500/10 text-orange-600 border-orange-200',
  info: 'bg-blue-500/10 text-blue-600 border-blue-200',
  error: 'bg-red-500/10 text-red-600 border-red-200'
};

export default function ActivityCard({
  title,
  items,
  icon,
  maxVisible = 5,
  emptyMessage = 'No recent activity',
  action,
  className = ''
}: ActivityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const displayItems = expanded ? items : items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;

  return (
    <DashboardCard className={`overflow-hidden ${className}`}>
      <div className="p-6 border-b border-charcoal/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-8 h-8 bg-charcoal/10 rounded-lg flex items-center justify-center text-charcoal/60">
                {icon}
              </div>
            )}
            <h3 className="text-lg font-light text-charcoal">{title}</h3>
          </div>
          {items.length > 0 && (
            <div className="w-6 h-6 bg-charcoal/10 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-charcoal">{items.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-charcoal/40 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm text-charcoal/60">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {displayItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`flex items-start justify-between py-3 border-b border-charcoal/5 last:border-0 ${
                    item.priority ? 'bg-orange-50/50 -mx-3 px-3 rounded' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-light text-charcoal truncate">{item.title}</div>
                      {item.priority && index === 0 && (
                        <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded uppercase font-medium">
                          New
                        </span>
                      )}
                    </div>
                    
                    {item.subtitle && (
                      <div className="text-sm text-charcoal/60 mb-1">{item.subtitle}</div>
                    )}
                    
                    {item.metadata && (
                      <div className="text-xs text-charcoal/50">{item.metadata}</div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4">
                    {item.status && (
                      <div className={`px-2 py-1 text-xs font-light tracking-wide uppercase border rounded ${statusVariants[item.status.variant]}`}>
                        {item.status.label}
                      </div>
                    )}
                    
                    {item.timestamp && (
                      <div className="text-xs text-charcoal/60 whitespace-nowrap">
                        {item.timestamp}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              {hasMore && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-sm text-charcoal/60 hover:text-charcoal transition-colors"
                >
                  {expanded ? 'Show Less' : `Show ${items.length - maxVisible} More`} {expanded ? '↑' : '↓'}
                </button>
              )}
              
              {action && (
                <button
                  onClick={action.onClick}
                  className="text-sm text-charcoal hover:text-charcoal/70 transition-colors border-b border-transparent hover:border-charcoal/30"
                >
                  {action.label} →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardCard>
  );
}