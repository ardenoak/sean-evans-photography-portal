# 🔗 Tally Photography Management System - CMS Integration Guide

**Version**: 1.0  
**Last Updated**: 2025-08-15  
**Development**: `http://localhost:3004`  
**Production**: `https://tallyhq.io`

## 📋 Overview

This document provides comprehensive integration instructions for connecting your Content Management System (CMS) with the Tally Photography Management System. This integration allows your website's contact forms to automatically create leads in Tally for seamless business workflow management.

---

## 🎯 Integration Objectives

✅ **Capture complete lead information** from website contact forms  
✅ **Automatically create leads** in Tally system  
✅ **Maintain data consistency** between CMS and Tally  
✅ **Enable lead-to-session conversion** workflow  
✅ **Support client portal access** through session management  

---

## 🏗️ System Architecture

```
Website Contact Form → CMS Backend → Tally API → Lead Management → Client Conversion → Session Creation → Portal Access
```

### Data Flow
1. **Lead Capture**: Website visitor submits contact form
2. **CMS Processing**: CMS validates and processes form data
3. **Tally Integration**: CMS sends lead data to Tally API
4. **Lead Management**: Tally creates lead record with status tracking
5. **Business Workflow**: Lead converts to client → session → portal access

---

## 📊 Lead Data Structure

### Required Fields
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `first_name` | string | Client's first name | "Sarah" |
| `last_name` | string | Client's last name | "Johnson" |
| `email` | string | Valid email address | "sarah@example.com" |

### Optional Fields
| Field | Type | Description | Options/Example |
|-------|------|-------------|-----------------|
| `phone` | string | Phone number | "(555) 123-4567" |
| `session_type_interest` | string | Type of photography session | See [Session Types](#session-types) |
| `budget_range` | string | Client's budget range | See [Budget Ranges](#budget-ranges) |
| `preferred_timeline` | string | When they want the session | See [Timeline Options](#timeline-options) |
| `preferred_time` | string | Preferred time of day | "Morning", "Afternoon", "Evening" |
| `preferred_session_date` | string (ISO 8601) | Specific date preference | "2025-09-15" |
| `lead_source` | string | How they found you | See [Lead Sources](#lead-sources) |
| `message` | text | Client's message/notes | Free text, up to 1000 chars |

### System Fields (Auto-generated)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique lead identifier |
| `status` | string | Lead status ("new", "contacted", "qualified", "proposal_sent", "converted", "lost") |
| `created_at` | timestamp | When lead was created |
| `updated_at` | timestamp | Last modification time |

---

## 📝 Field Options & Validation

### Session Types
```javascript
const sessionTypes = [
  "Editorial Portrait",
  "Branding Session", 
  "Headshots",
  "Creative Portrait",
  "Wedding",
  "Event",
  "Portraiture Session",
  "Commercial Session",
  "Fashion Session"
];
```

### Budget Ranges
```javascript
const budgetRanges = [
  "$500 - $1,000",
  "$1,000 - $2,500", 
  "$2,500 - $5,000",
  "$5,000 - $7,500",
  "Let's discuss"
];
```

### Timeline Options
```javascript
const timelines = [
  "Within 2 weeks",
  "Within 1 month",
  "1-3 months",
  "3-6 months", 
  "6+ months",
  "Just exploring"
];
```

### Lead Sources
```javascript
const leadSources = [
  "Website",
  "Instagram",
  "Referral",
  "Email",
  "Phone Call",
  "Wedding Wire", 
  "Manual Entry",
  "Other"
];
```

---

## 🔌 API Integration

### Endpoints

**Development Environment:**
```
POST http://localhost:3004/api/leads
```

**Production Environment:**
```
POST https://tallyhq.io/api/leads
```

### Headers
```http
Content-Type: application/json
```

### Authentication
- **Development**: No authentication required
- **Production**: Contact system administrator for API key requirements

### Request Payload
```json
{
  "first_name": "Sarah",
  "last_name": "Johnson", 
  "email": "sarah@example.com",
  "phone": "(555) 123-4567",
  "session_type_interest": "Branding Session",
  "budget_range": "$2,500 - $5,000",
  "preferred_timeline": "1-3 months",
  "preferred_time": "Morning",
  "preferred_session_date": "2025-09-15",
  "lead_source": "Website",
  "message": "I'm interested in professional branding photos for my consulting business. I'd like to discuss creative concepts and locations."
}
```

### Success Response (201 Created)
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "email": "sarah@example.com",
      "phone": "(555) 123-4567",
      "session_type_interest": "Branding Session", 
      "budget_range": "$2,500 - $5,000",
      "preferred_timeline": "1-3 months",
      "preferred_time": "Morning",
      "preferred_session_date": "2025-09-15",
      "lead_source": "Website",
      "status": "new",
      "message": "I'm interested in professional branding photos...",
      "notes": null,
      "created_at": "2025-08-15T10:30:00.000Z",
      "updated_at": "2025-08-15T10:30:00.000Z",
      "last_contacted": null,
      "next_follow_up": null,
      "last_viewed_at": null
    }
  ]
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "Missing required field: email"
}
```

### Error Response (500 Internal Server Error)
```json
{
  "error": "Failed to create lead"
}
```

---

## 🎨 Recommended Contact Form Structure

### HTML Form Example
```html
<form id="contact-form" class="tally-lead-form">
  <!-- Required Fields -->
  <div class="form-group">
    <label for="first_name">First Name *</label>
    <input type="text" id="first_name" name="first_name" required>
  </div>
  
  <div class="form-group">
    <label for="last_name">Last Name *</label>
    <input type="text" id="last_name" name="last_name" required>
  </div>
  
  <div class="form-group">
    <label for="email">Email Address *</label>
    <input type="email" id="email" name="email" required>
  </div>

  <!-- Optional Fields -->
  <div class="form-group">
    <label for="phone">Phone Number</label>
    <input type="tel" id="phone" name="phone">
  </div>

  <div class="form-group">
    <label for="session_type_interest">Type of Session</label>
    <select id="session_type_interest" name="session_type_interest">
      <option value="">Select session type...</option>
      <option value="Branding Session">Branding Session</option>
      <option value="Editorial Portrait">Editorial Portrait</option>
      <option value="Headshots">Headshots</option>
      <option value="Creative Portrait">Creative Portrait</option>
      <option value="Wedding">Wedding</option>
      <option value="Event">Event</option>
    </select>
  </div>

  <div class="form-group">
    <label for="budget_range">Investment Range</label>
    <select id="budget_range" name="budget_range">
      <option value="">Select budget range...</option>
      <option value="$500 - $1,000">$500 - $1,000</option>
      <option value="$1,000 - $2,500">$1,000 - $2,500</option>
      <option value="$2,500 - $5,000">$2,500 - $5,000</option>
      <option value="$5,000 - $7,500">$5,000 - $7,500</option>
      <option value="Let's discuss">Let's discuss</option>
    </select>
  </div>

  <div class="form-group">
    <label for="preferred_timeline">Timeline</label>
    <select id="preferred_timeline" name="preferred_timeline">
      <option value="">Select timeline...</option>
      <option value="Within 2 weeks">Within 2 weeks</option>
      <option value="Within 1 month">Within 1 month</option>
      <option value="1-3 months">1-3 months</option>
      <option value="3-6 months">3-6 months</option>
      <option value="6+ months">6+ months</option>
      <option value="Just exploring">Just exploring</option>
    </select>
  </div>

  <div class="form-group">
    <label for="preferred_session_date">Preferred Session Date</label>
    <input type="date" id="preferred_session_date" name="preferred_session_date">
  </div>

  <div class="form-group">
    <label for="message">Tell us about your vision</label>
    <textarea id="message" name="message" rows="4" placeholder="Share details about your session goals, style preferences, or any questions you have..."></textarea>
  </div>

  <input type="hidden" name="lead_source" value="Website">
  
  <button type="submit">Send Inquiry</button>
</form>
```

---

## ⚙️ Implementation Examples

### Node.js/Express Implementation
```javascript
const express = require('express');
const axios = require('axios');

// Environment configuration
const TALLY_API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://tallyhq.io' 
  : 'http://localhost:3004';

app.post('/contact-form', async (req, res) => {
  try {
    const leadData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone,
      session_type_interest: req.body.session_type_interest,
      budget_range: req.body.budget_range,
      preferred_timeline: req.body.preferred_timeline,
      preferred_time: req.body.preferred_time,
      preferred_session_date: req.body.preferred_session_date,
      lead_source: 'Website',
      message: req.body.message
    };

    const headers = { 'Content-Type': 'application/json' };
    
    // Add API key for production
    if (process.env.NODE_ENV === 'production' && process.env.TALLY_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.TALLY_API_KEY}`;
    }

    const response = await axios.post(
      `${TALLY_API_BASE}/api/leads`,
      leadData,
      { headers }
    );

    if (response.status === 201) {
      res.json({ 
        success: true, 
        message: 'Lead created successfully',
        leadId: response.data.data[0].id
      });
    }
  } catch (error) {
    console.error('Tally API Error:', error.response?.data);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create lead' 
    });
  }
});
```

### PHP Implementation
```php
<?php
function createTallyLead($formData) {
    // Environment configuration
    $isProduction = ($_ENV['APP_ENV'] ?? 'development') === 'production';
    $tallyApiBase = $isProduction ? 'https://tallyhq.io' : 'http://localhost:3004';
    
    $leadData = [
        'first_name' => $formData['first_name'],
        'last_name' => $formData['last_name'], 
        'email' => $formData['email'],
        'phone' => $formData['phone'] ?? null,
        'session_type_interest' => $formData['session_type_interest'] ?? null,
        'budget_range' => $formData['budget_range'] ?? null,
        'preferred_timeline' => $formData['preferred_timeline'] ?? null,
        'preferred_time' => $formData['preferred_time'] ?? null,
        'preferred_session_date' => $formData['preferred_session_date'] ?? null,
        'lead_source' => 'Website',
        'message' => $formData['message'] ?? null
    ];

    $headers = [
        'Content-Type: application/json',
        'Content-Length: ' . strlen(json_encode($leadData))
    ];
    
    // Add API key for production
    if ($isProduction && !empty($_ENV['TALLY_API_KEY'])) {
        $headers[] = 'Authorization: Bearer ' . $_ENV['TALLY_API_KEY'];
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $tallyApiBase . '/api/leads');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($leadData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $isProduction); // Verify SSL in production

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 201) {
        return ['success' => true, 'data' => json_decode($response, true)];
    } else {
        return ['success' => false, 'error' => $response];
    }
}
?>
```

### Frontend JavaScript (Fetch API)
```javascript
async function submitContactForm(formData) {
  try {
    const response = await fetch('/api/contact-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    
    if (result.success) {
      // Show success message
      showSuccessMessage('Thank you! We\'ll be in touch soon.');
      // Optionally redirect or reset form
      document.getElementById('contact-form').reset();
    } else {
      showErrorMessage('Sorry, there was an issue. Please try again.');
    }
  } catch (error) {
    showErrorMessage('Network error. Please check your connection.');
  }
}

// Form submission handler
document.getElementById('contact-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const data = Object.fromEntries(formData.entries());
  
  submitContactForm(data);
});
```

---

## ✅ Form Validation

### Client-Side Validation
```javascript
function validateContactForm(formData) {
  const errors = [];

  // Required field validation
  if (!formData.first_name?.trim()) {
    errors.push('First name is required');
  }
  
  if (!formData.last_name?.trim()) {
    errors.push('Last name is required');
  }
  
  if (!formData.email?.trim()) {
    errors.push('Email is required');
  } else if (!isValidEmail(formData.email)) {
    errors.push('Please enter a valid email address');
  }

  // Optional field validation
  if (formData.phone && !isValidPhone(formData.phone)) {
    errors.push('Please enter a valid phone number');
  }

  if (formData.preferred_session_date && !isValidDate(formData.preferred_session_date)) {
    errors.push('Please enter a valid date');
  }

  return errors;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/\s/g, ''));
}

function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && date > new Date();
}
```

---

## 🔄 Lead Lifecycle in Tally

### Lead Statuses
1. **`new`** - Just created, not yet reviewed
2. **`contacted`** - Initial contact made  
3. **`qualified`** - Lead meets criteria, moving forward
4. **`proposal_sent`** - Experience proposal/quote sent
5. **`converted`** - Became a client with booked session
6. **`lost`** - Did not convert

### Workflow Process
```
Contact Form → New Lead → Contact & Qualify → Send Proposal → Convert to Session → Client Portal Access
```

---

## 🧪 Testing & Validation

### Test Lead Creation

**Development Environment:**
```bash
curl -X POST http://localhost:3004/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "Client", 
    "email": "test@example.com",
    "phone": "(555) 123-4567",
    "session_type_interest": "Branding Session",
    "budget_range": "$2,500 - $5,000",
    "preferred_timeline": "1-3 months",
    "lead_source": "Website",
    "message": "Test lead creation from CMS integration"
  }'
```

**Production Environment:**
```bash
curl -X POST https://tallyhq.io/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "first_name": "Test",
    "last_name": "Client", 
    "email": "test@example.com",
    "phone": "(555) 123-4567",
    "session_type_interest": "Branding Session",
    "budget_range": "$2,500 - $5,000",
    "preferred_timeline": "1-3 months",
    "lead_source": "Website",
    "message": "Test lead creation from CMS integration"
  }'
```

### Verify Lead in Tally

**Development:**
1. Go to `http://localhost:3004/leads`
2. Verify the test lead appears with status "new"
3. Check all fields populated correctly
4. Test lead conversion to session

**Production:**
1. Go to `https://tallyhq.io/leads`
2. Verify the test lead appears with status "new"
3. Check all fields populated correctly
4. Test lead conversion to session

---

## 🚨 Error Handling

### Common Error Scenarios
| Error | Cause | Solution |
|-------|-------|----------|
| `Missing required field: email` | Email not provided | Ensure email field is included |
| `Invalid email format` | Email doesn't match pattern | Validate email on frontend |
| `Failed to create lead` | Database error | Check Tally system status |
| `Network timeout` | Connection issues | Implement retry logic |

### Retry Logic Example
```javascript
async function createLeadWithRetry(leadData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await createTallyLead(leadData);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
```

---

## 📞 Support & Troubleshooting

### Debug Mode
Set environment variable for detailed logging:
```bash
DEBUG=tally:* node your-app.js
```

### Common Issues
1. **Lead not appearing**: Check required fields and API response
2. **Validation errors**: Verify field formats match requirements  
3. **Network errors**: Confirm Tally system is running on port 3004
4. **Duplicate emails**: System allows duplicates but check for client conversion

### Contact
For integration support or issues:
- Review this documentation
- Check Tally system logs
- Test with sample payloads provided
- Verify all required fields are included

---

## 📋 Integration Checklist

- [ ] CMS contact form includes all required fields
- [ ] Optional fields implemented for complete lead capture
- [ ] Client-side validation implemented
- [ ] Server-side integration to Tally API complete
- [ ] Error handling and retry logic implemented
- [ ] Success/failure user feedback implemented
- [ ] Test lead creation verified in Tally
- [ ] Lead conversion to session tested
- [ ] Production deployment configuration complete

---

*This integration enables seamless lead capture from your website directly into Tally's photography business management workflow, supporting the complete client journey from initial inquiry through session completion and portal access.*