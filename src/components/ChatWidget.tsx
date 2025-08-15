'use client';
import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/portal';

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  sessionId: string;
}

export default function ChatWidget({ isOpen, onClose, clientName, sessionId }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    { text: 'What should I wear?', icon: '👗', type: 'wardrobe' },
    { text: 'Can I reschedule?', icon: '📅', type: 'reschedule' },
    { text: 'What about weather?', icon: '☀️', type: 'weather' },
    { text: 'Adding family members?', icon: '👨‍👩‍👧‍👦', type: 'participants' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      const greeting: ChatMessage = {
        id: '1',
        message: `Hi ${clientName.split(' ')[0]}! I'm your Session Concierge. I'm here to help answer any questions about your upcoming portrait session. What can I help you with today?`,
        timestamp: new Date(),
        sender: 'assistant'
      };
      setMessages([greeting]);
    }
  }, [isOpen, clientName, messages.length]);

  const getAIResponse = (message: string, type?: string): string => {
    const responses = {
      wardrobe: `For your editorial portrait session, I recommend wearing solid colors that complement your skin tone. Avoid busy patterns, logos, or bright whites. Consider bringing 2-3 outfit options - one formal, one casual, and perhaps something that reflects your personality. Your style guide has specific recommendations based on your session location and goals!`,
      reschedule: `I understand things come up! To reschedule your session, please contact your photographer directly at least 48 hours before your session date. We can usually accommodate date changes based on availability. Would you like me to provide their contact information?`,
      weather: `Great question! We monitor weather closely leading up to your session. For outdoor sessions, we have backup indoor locations ready. Light rain can actually create beautiful, moody portraits! Your photographer will contact you the day before if any weather adjustments are needed.`,
      participants: `Adding family members is wonderful! Additional participants may adjust your session investment. Please let your photographer know at least one week before your session so we can plan appropriate timing and locations. Would you like me to help you contact them about this?`,
      default: `I'm here to help with any questions about your upcoming session! I can assist with wardrobe advice, rescheduling, weather concerns, location details, or adding participants. What specific aspect of your session would you like to know more about?`
    };

    return responses[type as keyof typeof responses] || responses.default;
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: action.text,
      timestamp: new Date(),
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI typing delay
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: getAIResponse(action.text, action.type),
        timestamp: new Date(),
        sender: 'assistant'
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: inputMessage,
      timestamp: new Date(),
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // Try n8n webhook first (configure this URL after setting up n8n)
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK || '/api/n8n/chat';
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          clientMessage: currentMessage,
          clientName,
          context: 'session_concierge'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          message: data.response || getAIResponse(currentMessage),
          timestamp: new Date(),
          sender: 'assistant'
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error('AI service unavailable');
      }
    } catch (error) {
      console.error('Chat API error:', error);
      // Fallback to local response
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: getAIResponse(currentMessage),
        timestamp: new Date(),
        sender: 'assistant'
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-96 h-[32rem] flex flex-col overflow-hidden border border-warm-gray/20">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-verde to-verde/90 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center text-sm font-semibold">
              A
            </div>
            <div>
              <h4 className="font-semibold">Session Concierge</h4>
              <div className="flex items-center text-sm opacity-90">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Online
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="p-4 border-b border-warm-gray/10">
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="flex items-center space-x-2 p-2 bg-ivory hover:bg-gold hover:text-white rounded-lg transition-all duration-200 text-sm transform hover:scale-105"
                >
                  <span>{action.icon}</span>
                  <span className="font-medium truncate">{action.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-verde text-white ml-8'
                    : 'bg-ivory text-charcoal mr-8'
                }`}
              >
                <p className="text-sm">{message.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-ivory text-charcoal max-w-xs px-4 py-2 rounded-lg mr-8">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-verde rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-verde rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-verde rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-warm-gray/10">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              className="flex-1 px-3 py-2 border border-warm-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent text-sm"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="bg-verde text-white px-4 py-2 rounded-lg hover:bg-verde/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}