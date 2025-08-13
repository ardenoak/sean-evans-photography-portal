# Phase 1 Implementation Tasks: Today's Focus Widget

## **Overview**
Implement the highest-priority dashboard component that provides immediate daily value to the photographer. This widget serves as the command center for daily operations.

## **Technical Tasks**

### **1. Today's Schedule Component**
**File:** `/src/app/admin/dashboard/components/TodayWidget.tsx`

```typescript
interface TodayWidgetProps {
  sessions: TodaySession[];
  tasks: UrgentTask[];
  weather?: WeatherData;
}

interface TodaySession {
  id: string;
  time: string;
  client_name: string;
  session_type: string;
  location: string;
  duration: string;
  equipment_requirements: string[];
  is_outdoor: boolean;
}

interface UrgentTask {
  id: string;
  type: 'follow_up' | 'proposal_expiring' | 'contract_signature' | 'payment_due';
  priority: 'high' | 'medium' | 'low';
  description: string;
  due_date: string;
  related_client?: string;
}
```

**Implementation Steps:**
- [ ] Create base component structure
- [ ] Add session timeline visualization  
- [ ] Implement urgent task prioritization
- [ ] Add equipment checklist functionality
- [ ] Style with consistent admin theme

### **2. Weather Integration**
**File:** `/src/app/admin/dashboard/utils/weatherAPI.ts`

**API Integration:**
- OpenWeatherMap API for current conditions
- 24-hour forecast for session planning
- Alert system for outdoor session risks

```typescript
interface WeatherData {
  current: {
    temperature: number;
    conditions: string;
    humidity: number;
    wind_speed: number;
  };
  forecast: {
    time: string;
    conditions: string;
    precipitation_chance: number;
  }[];
  alerts: WeatherAlert[];
}
```

**Implementation Steps:**
- [ ] Sign up for OpenWeatherMap API key
- [ ] Create weather data fetching utilities
- [ ] Add weather display components
- [ ] Implement alert system for outdoor sessions
- [ ] Cache weather data to avoid API limits

### **3. Data Fetching Hook**
**File:** `/src/app/admin/dashboard/hooks/useTodaysSchedule.ts`

```typescript
export const useTodaysSchedule = () => {
  const [data, setData] = useState<TodayScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch today's sessions, urgent tasks, and weather
  // Implement real-time updates for critical changes
  // Handle error states gracefully
};
```

**Implementation Steps:**
- [ ] Create data fetching logic
- [ ] Add real-time subscriptions for session updates
- [ ] Implement error handling and retries
- [ ] Add loading states and skeletons
- [ ] Cache data appropriately

### **4. Database Schema Updates**
**File:** `/scripts/enhance-dashboard-schema.sql`

**New Tables:**
```sql
-- Equipment requirements for sessions
CREATE TABLE equipment_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  equipment_list JSONB,
  special_requirements TEXT,
  prep_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Urgent tasks and reminders
CREATE TABLE urgent_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_type VARCHAR(50),
  priority VARCHAR(10),
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  related_client_id UUID REFERENCES clients(id),
  related_session_id UUID REFERENCES sessions(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Implementation Steps:**
- [ ] Create migration script
- [ ] Add equipment requirements table
- [ ] Create urgent tasks tracking
- [ ] Update session table with outdoor flag
- [ ] Add indexes for performance

## **UI/UX Requirements**

### **Layout Structure**
```
┌─────────────────────────────────────────┐
│ Today's Focus - [Current Date]          │
├─────────────────────────────────────────┤
│ Weather Alert (if applicable)           │
├─────────────────────────────────────────┤
│ Session Timeline                        │
│ ├ 10:00 AM - Portrait Session           │
│ ├ 2:00 PM - Family Photos               │
│ └ 6:00 PM - Engagement Shoot            │
├─────────────────────────────────────────┤
│ Urgent Tasks (3)                        │
│ ├ Follow up: Sarah Johnson              │
│ ├ Contract: Wilson Wedding              │
│ └ Payment Due: Smith Family             │
├─────────────────────────────────────────┤
│ Equipment Check                         │
│ └ [Checklist based on today's sessions] │
└─────────────────────────────────────────┘
```

### **Visual Design**
- Consistent ivory/charcoal theme
- Clean typography with clear hierarchy
- Subtle animations for priority items
- Mobile-responsive for on-location use
- Touch-friendly interaction areas

### **Interaction Patterns**
- Click session → View details modal
- Click task → Mark complete or view details
- Click equipment item → Mark as prepared
- Swipe actions on mobile for quick updates

## **API Integration Points**

### **Weather Service**
- **Endpoint:** `https://api.openweathermap.org/data/2.5/`
- **Rate Limit:** 60 calls/minute (free tier)
- **Caching:** 30-minute cache for current conditions
- **Fallback:** Graceful degradation without weather data

### **Database Queries**
- Today's sessions with client details
- Urgent tasks due within 48 hours
- Equipment requirements for today's sessions
- Recent communication history for context

## **Performance Targets**

### **Load Times**
- Initial widget render: < 2 seconds
- Data updates: < 1 second
- Weather data: < 3 seconds (cached)

### **Responsiveness**
- Interactive feedback: < 100ms
- Smooth animations at 60fps
- Mobile-optimized touch targets (44px minimum)

## **Testing Strategy**

### **Unit Tests**
- Component rendering with various data states
- Weather API integration and error handling
- Data transformation and sorting logic
- Date/time calculations and formatting

### **Integration Tests**
- Database query performance
- Real-time update subscriptions
- Weather alert triggering
- Mobile responsive behavior

### **User Acceptance Tests**
- Photographer workflow validation
- Morning routine efficiency
- Critical information visibility
- Error state handling

## **Success Criteria**

### **Functional Requirements**
- [ ] All today's sessions visible immediately
- [ ] Weather alerts for outdoor sessions
- [ ] Urgent tasks prioritized correctly
- [ ] Equipment checklist auto-generated
- [ ] Real-time updates for changes

### **Performance Requirements**
- [ ] Widget loads in < 2 seconds
- [ ] Updates respond in < 1 second
- [ ] Mobile performance optimized
- [ ] Graceful error handling

### **Business Impact**
- [ ] 15-minute reduction in morning prep time
- [ ] Zero missed equipment items
- [ ] 100% awareness of urgent tasks
- [ ] Weather-proactive session planning

## **Rollout Plan**

### **Week 1: Development**
- Set up component structure
- Implement basic data fetching
- Add weather API integration
- Create database schema

### **Week 2: Enhancement**
- Add real-time updates
- Implement equipment checklist
- Complete UI/UX polish
- Performance optimization

### **Testing & Deployment**
- User testing with photographer
- Performance validation
- Mobile device testing
- Production deployment

This phase establishes the foundation for the enhanced dashboard while delivering immediate, tangible value to daily photography business operations.