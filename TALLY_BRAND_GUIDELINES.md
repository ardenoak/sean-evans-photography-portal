# Tally Photography Management Brand Guidelines

## Overview
Tally Photography Management represents a professional photography business management platform that maintains the premium quality and service excellence of professional portrait photography while providing brand-neutral, scalable business solutions.

## Brand Identity

### Primary Brand Name
**"Tally Photography Management"** - Use for:
- Official business communications
- Legal documents and contracts
- Client portal headers and important pages
- Admin interfaces and business correspondence

### Shortened Brand Name
**"Tally"** - Use for:
- Navigation elements and breadcrumbs
- Loading screens and informal communications
- Internal references and system messages
- Chat and conversational contexts

## Logo Implementation

### File Location
- Primary logo: `/public/tally-logo.png`
- Backup legacy logo: `/public/sean-evans-logo.png` (for reference only)

### Logo Component Usage
```tsx
import Logo from '@/components/Logo';

// Recommended implementation
<Logo 
  width={180}           // Default: 180px
  height={60}           // Default: 60px
  variant="auto"        // Options: 'auto', 'dark', 'light'
  className="opacity-90"
/>
```

### Logo Variants
- **Auto (Default)**: Adapts to background context
- **Dark**: White logo for dark backgrounds (charcoal headers)
- **Light**: Standard logo for light backgrounds

### Logo Sizing Standards
- **Header Logo**: 180x60px (primary navigation)
- **Admin Header**: 120x40px (admin interfaces)
- **Loading Screens**: 400x120px (large display)
- **Small Elements**: 100x33px (compact spaces)

## Visual Brand System

### Color Palette
```css
/* Existing brand colors maintained */
--ivory: /* Light backgrounds */
--charcoal: /* Dark text and headers */
--verde: /* Primary accent color */
--gold: /* Secondary accent color */
--warm-gray: /* Supporting text */
```

### Typography Hierarchy
- **Primary Heading**: "Tally Photography Management"
- **Secondary**: "Professional Portrait Sessions"
- **Descriptive**: "Photography business management platform"

## Brand Voice & Messaging

### Core Brand Positioning
"Professional photography business management that empowers photographers to deliver exceptional client experiences while maintaining premium service standards."

### Key Messaging Principles

#### Photography Context Maintained
- Always preserve professional photography terminology
- Maintain reference to "portrait sessions," "editorial photography," and "professional photography services"
- Continue using photography-specific language (sessions, galleries, portraits, etc.)

#### Photographer-Neutral Language
- Use "your photographer" instead of specific names
- Reference "photographer contact" instead of individual details
- Maintain "session concierge" and "photography management" terminology

#### Professional Service Positioning
- Emphasize "management" and "business solutions"
- Highlight "client portal" and "professional services"
- Maintain premium positioning with "investment" instead of "cost"

### Communication Examples

#### Preferred Phrasing:
✅ "Your photographer will contact you..."
✅ "Tally Photography Management provides..."
✅ "Professional portrait session management"
✅ "Contact your photographer directly"
✅ "hello@tallyhq.io for support"

#### Avoid:
❌ "Sean will contact you..."
❌ "Sean Evans Photography"
❌ Hard-coded photographer names in system messages
❌ "seanevansphoto.com" or similar specific references

## Technical Implementation

### Metadata Standards
```tsx
export const metadata: Metadata = {
  title: "Tally Photography Management | Client Portal",
  description: "Your personalized client portal for professional portrait sessions",
};
```

### Contact Information
- **Primary Email**: hello@tallyhq.io
- **Support Context**: "Contact us at hello@tallyhq.io"
- **Business Name**: Tally Photography Management

### Contract and Legal Language
```
This agreement is between Tally Photography Management (the "Photographer") 
and the client named in the associated quote (the "Client").

All images remain the property of Tally Photography Management with shared 
usage rights granted to Client.
```

## User Experience Guidelines

### Loading and Transition Messaging
- "Redirecting to Tally portal..."
- "Loading your photography session details..."
- "Connecting to your photographer..."

### Chat and Communication
- **Session Concierge**: Maintains friendly, professional tone
- **Automated Responses**: Brand-neutral but photography-focused
- **Contact References**: "your photographer" for personal touches

### Admin Interface Standards
- **Header Branding**: Tally logo with "Admin Portal" designation
- **Management Console**: Professional business management positioning
- **User Context**: "Welcome to Tally Photography Management admin team"

## Quality Assurance Checklist

### Before Deployment:
- [ ] All logo instances use `/tally-logo.png`
- [ ] No hard-coded "Sean Evans" references in user-facing content
- [ ] Email contacts use "hello@tallyhq.io"
- [ ] Contract terms reference "Tally Photography Management"
- [ ] Chat responses use photographer-neutral language
- [ ] Admin interfaces display Tally branding
- [ ] Loading screens and redirects use appropriate messaging

### Brand Consistency Verification:
- [ ] Photography terminology preserved throughout
- [ ] Professional service positioning maintained
- [ ] Photographer-neutral but personalized experience
- [ ] Premium business management branding evident
- [ ] Legal and contract language updated appropriately

## Future Brand Evolution

### Scalability Considerations
- Brand designed to support multiple photographers
- System architecture supports photographer-specific customization
- Neutral branding allows white-label potential
- Professional positioning enables enterprise expansion

### Maintenance Protocol
- Regular audits for brand consistency
- Systematic updates when adding new features
- Documentation updates with system changes
- Photographer onboarding brand guidelines

---

**Brand Implementation Date**: January 2025
**Last Updated**: January 2025
**Next Review**: Quarterly brand consistency audit

**Contact**: hello@tallyhq.io for brand guideline questions