# Sean Evans Photography Client Portal

A sophisticated client portal for editorial portrait photographers, built with Next.js and designed for Sean Evans Photography.

## Features

### 🎨 **Brand-Focused Design**
- Custom color palette (Charcoal, Verde, Gold, Ivory)
- Elegant typography mixing Didot serif headers with clean sans-serif body text
- Sophisticated gradients and premium visual elements

### 📱 **Multi-Tab Navigation**
- **Dashboard**: Session details, timeline, and quick actions
- **Resources**: Document library with contracts, invoices, and guides
- **Gallery**: Placeholder for future gallery integration

### 🤖 **AI Session Concierge**
- Intelligent chat widget with contextual responses
- Quick action buttons for common questions
- Handles wardrobe, rescheduling, weather, and participant inquiries

### ✨ **Interactive Elements**
- Smooth animations and hover effects
- Responsive design for all screen sizes
- Real-time status indicators and notifications

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Hosting**: Optimized for Vercel deployment

## Getting Started

### Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the portal.

3. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

### Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial portal setup"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Connect your GitHub repository to Vercel
   - Auto-deployment will handle the rest
   - Custom domain setup available

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Custom styles and brand colors
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Home page (redirects to portal)
│   └── portal/[sessionId]/
│       └── page.tsx         # Main portal page
├── components/
│   ├── DashboardTab.tsx     # Session dashboard
│   ├── ResourcesTab.tsx     # Document library
│   ├── GalleryTab.tsx       # Gallery placeholder
│   └── ChatWidget.tsx       # AI chat functionality
└── types/
    └── portal.ts            # TypeScript interfaces
```

## Integration Opportunities

### Backend Connections
- **Tave Integration**: Pull session data, contracts, and invoices
- **Google Drive**: Serve style guides and location documents
- **Gallery Providers**: Connect to Pixieset, CloudSpot, etc.
- **n8n Workflows**: Automate notifications and updates

### AI Enhancement
- **Real AI Service**: Replace mock responses with actual AI
- **Context Awareness**: Pull information from all client documents
- **Smart Notifications**: Proactive session reminders

### Additional Features
- **Payment Processing**: Stripe integration for invoices
- **Calendar Integration**: Booking and rescheduling
- **Mobile App**: React Native version
- **Analytics**: Client engagement tracking

## Customization

### Brand Colors
Edit `src/app/globals.css` to modify the color palette:
```css
:root {
  --charcoal: #2c2c2c;
  --verde: #4a5d23;
  --gold: #d4af37;
  --ivory: #f8f6f0;
  --warm-gray: #6b7280;
}
```

### Session Data
Modify session information in `src/app/portal/[sessionId]/page.tsx`:
```typescript
const sessionData: SessionData = {
  clientName: 'Your Client Name',
  sessionType: 'Your Session Type',
  // ... other properties
};
```

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

---

Built with ❤️ for professional photographers who value exceptional client experiences.
