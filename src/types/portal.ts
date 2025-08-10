export interface SessionData {
  clientName: string;
  sessionType: string;
  date: string;
  time: string;
  location: string;
  duration: string;
  photographer: string;
  investment: string;
  status: string;
}

export interface TimelineItem {
  date: string;
  task: string;
  highlight?: boolean;
  completed?: boolean;
  completedDate?: string | null;
}

export interface QuickAction {
  label: string;
  icon: string;
  action?: () => void;
}

export interface ChatMessage {
  id: string;
  message: string;
  timestamp: Date;
  sender: 'user' | 'assistant';
}

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'guide' | 'contract' | 'invoice';
  status: 'signed' | 'paid' | 'new' | 'ready';
  icon: string;
  gradient: string;
  actionText: string;
  date?: string;
}

export interface GalleryStats {
  totalImages: number;
  favorites: number;
  accessDays: number;
}

export type ActiveTab = 'dashboard' | 'resources' | 'gallery';