'use client';
import { useState } from 'react';
import Image from 'next/image';
import { SessionData, TimelineItem, QuickAction, ActiveTab } from '@/types/portal';
import DashboardTab from '@/components/DashboardTab';
import ResourcesTab from '@/components/ResourcesTab';
import GalleryTab from '@/components/GalleryTab';
import ChatWidget from '@/components/ChatWidget';

export default function Portal({ params }: { params: { sessionId: string } }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const sessionData: SessionData = {
    clientName: 'Sarah Montgomery',
    sessionType: 'Montgomery Family Legacy Session',
    date: 'Saturday, March 15, 2025',
    time: '10:00 AM',
    location: 'Hampton Park & Rainbow Row',
    duration: '2.5 Hours',
    photographer: 'Sean Evans',
    investment: '$1,497',
    status: 'Confirmed & Scheduled'
  };

  const timeline: TimelineItem[] = [
    { date: 'February 28, 2025', task: 'Pre-session consultation call' },
    { date: 'March 10, 2025', task: 'Style guide & preparation materials sent' },
    { date: 'March 15, 2025', task: 'Session day', highlight: true },
    { date: 'March 17, 2025', task: 'Preview gallery delivery' },
    { date: 'March 22, 2025', task: 'Complete gallery delivery' },
  ];

  const quickActions: QuickAction[] = [
    { label: 'View Contract', icon: '📄' },
    { label: 'Style Guide', icon: '👗' },
    { label: 'Location Details', icon: '📍' },
    { label: 'Contact Sean', icon: '💬' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            sessionData={sessionData}
            timeline={timeline}
            quickActions={quickActions}
            onChatOpen={() => setIsChatOpen(true)}
          />
        );
      case 'resources':
        return <ResourcesTab />;
      case 'gallery':
        return <GalleryTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory to-white">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Image
                src="/sean-evans-logo.png"
                alt="Sean Evans Photography"
                width={300}
                height={120}
                className="h-10 sm:h-14 w-auto"
                priority
              />
            </div>
            <nav className="flex items-center space-x-4 sm:space-x-8">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`text-sm tracking-wide transition-colors relative ${
                  activeTab === 'dashboard' 
                    ? 'text-charcoal' 
                    : 'text-warm-gray hover:text-charcoal'
                }`}
              >
                Dashboard
                {activeTab === 'dashboard' && (
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gold animate-pulse"></div>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('resources')}
                className={`text-sm tracking-wide transition-colors relative flex items-center ${
                  activeTab === 'resources' 
                    ? 'text-charcoal' 
                    : 'text-warm-gray hover:text-charcoal'
                }`}
              >
                Resources
                <span className="ml-2 bg-verde text-white text-xs px-2 py-1 rounded-full animate-bounce">3</span>
                {activeTab === 'resources' && (
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gold animate-pulse"></div>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('gallery')}
                className={`text-sm tracking-wide transition-colors relative ${
                  activeTab === 'gallery' 
                    ? 'text-charcoal' 
                    : 'text-warm-gray hover:text-charcoal'
                }`}
              >
                Gallery
                {activeTab === 'gallery' && (
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gold animate-pulse"></div>
                )}
              </button>
              <span className="text-warm-gray text-sm hidden sm:inline">Welcome back, {sessionData.clientName.split(' ')[0]}</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12 transition-all duration-500 ease-in-out">
        {renderTabContent()}
      </div>

      {/* Chat Widget */}
      <ChatWidget 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        clientName={sessionData.clientName}
      />
    </div>
  );
}