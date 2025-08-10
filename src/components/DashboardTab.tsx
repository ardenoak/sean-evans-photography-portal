import { SessionData, TimelineItem, QuickAction } from '@/types/portal';

interface DashboardTabProps {
  sessionData: SessionData;
  timeline: TimelineItem[];
  quickActions: QuickAction[];
  onChatOpen: () => void;
}

export default function DashboardTab({ sessionData, timeline, quickActions, onChatOpen }: DashboardTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Session Card */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
          {/* Session Header */}
          <div className="bg-gradient-to-r from-verde to-verde/90 text-white p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="relative z-10">
              <p className="text-sm uppercase tracking-widest opacity-90 mb-2 animate-slide-in">
                Editorial Portrait Experience
              </p>
              <h2 className="text-4xl font-didot mb-4 animate-slide-in-delay-1">{sessionData.sessionType}</h2>
              <div className="flex items-center space-x-2 animate-slide-in-delay-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"/>
                </svg>
                <span className="text-lg">{sessionData.date} at {sessionData.time}</span>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="p-8">
            <div className="grid grid-cols-2 gap-6 mb-8">
              {[
                { label: 'Location', value: sessionData.location },
                { label: 'Duration', value: sessionData.duration },
                { label: 'Photographer', value: sessionData.photographer },
                { label: 'Investment', value: sessionData.investment }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="bg-ivory p-4 rounded-lg hover:shadow-md hover:bg-gold/10 transition-all duration-300 transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <p className="text-xs uppercase tracking-wide text-warm-gray mb-1">{item.label}</p>
                  <p className="text-charcoal font-medium">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Status Badge */}
            <div className="inline-flex items-center space-x-2 bg-verde text-white px-4 py-2 rounded-full shadow-lg">
              <div className="w-2 h-2 bg-gold rounded-full animate-pulse"></div>
              <span className="text-sm">{sessionData.status}</span>
            </div>

            {/* Timeline */}
            <div className="mt-8 pt-8 border-t border-warm-gray/20">
              <h3 className="text-xl font-didot mb-6 text-charcoal">Your Journey</h3>
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-start space-x-4 group hover:bg-ivory/50 p-2 rounded-lg transition-colors duration-200"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className={`w-3 h-3 rounded-full mt-2 transition-colors duration-300 ${
                      item.highlight 
                        ? 'bg-gold shadow-lg shadow-gold/30' 
                        : 'bg-warm-gray/40 group-hover:bg-verde/60'
                    }`}></div>
                    <div>
                      <p className="text-sm text-warm-gray">{item.date}</p>
                      <p className={`transition-colors duration-200 ${
                        item.highlight 
                          ? 'font-semibold text-charcoal' 
                          : 'text-charcoal group-hover:text-verde'
                      }`}>
                        {item.task}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Sidebar */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
          <h3 className="text-lg font-didot mb-4 text-charcoal">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="w-full flex items-center space-x-3 p-3 bg-ivory hover:bg-gold hover:text-white rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="text-lg">{action.icon}</span>
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Session Concierge */}
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
              A
            </div>
            <div>
              <h4 className="font-medium text-charcoal">Session Concierge</h4>
              <p className="text-sm text-warm-gray flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Available to assist
              </p>
            </div>
          </div>
          <p className="text-sm text-warm-gray mb-4">
            Hi {sessionData.clientName.split(' ')[0]}! I'm here to help with any questions about your upcoming session.
          </p>
          <button 
            onClick={onChatOpen}
            className="w-full bg-verde text-white py-2 px-4 rounded-lg hover:bg-verde/90 transition-colors duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
}