# 🚀 Tally Production Deployment Guide

**Domain**: `tallyhq.io`  
**Environment**: Production  
**Last Updated**: 2025-08-15  
**Version**: 2.0.0 - Complete Production Infrastructure

## 🎯 Deployment Overview

Tally Photography Management System is now production-ready with comprehensive infrastructure automation for `tallyhq.io`. This guide covers the complete deployment process, automated deployment scripts, monitoring, and operational procedures.

## 🆕 New Infrastructure Features

- ✅ **Automated Deployment Scripts** - One-command deployment with validation
- ✅ **Health Monitoring Endpoint** - Real-time system health checks  
- ✅ **Environment Validation** - Automatic validation of required configuration
- ✅ **Production Logging** - Structured logging with external monitoring support
- ✅ **Bundle Analysis** - Performance optimization and bundle analysis tools
- ✅ **Emergency Rollback** - Automated rollback procedures for incidents
- ✅ **Security Headers** - Production security hardening
- ✅ **Performance Optimization** - Image optimization, compression, and caching

---

## 🚀 Quick Start - Automated Deployment

### Option 1: Automated Deployment (Recommended)
```bash
# 1. Clone and setup environment
git clone your-repo-url
cd arden-oak-portal
cp .env.production.template .env.production
# Edit .env.production with your values

# 2. Run automated deployment
./scripts/deploy.sh production

# 3. Verify deployment
curl https://tallyhq.io/api/health
```

### Option 2: Manual Deployment
Follow the detailed manual deployment steps below.

---

## 🏗️ Pre-Deployment Checklist

### Environment Configuration
- [ ] **Environment file created** - Copy `.env.production.template` to `.env.production`
- [ ] **Production environment variables configured** - Fill all required values
- [ ] **Environment validation passes** - Run `npm run validate-env`
- [ ] **Database connection strings updated** - Supabase production credentials
- [ ] **SSL certificates configured** - HTTPS enabled for domain
- [ ] **API authentication configured** - Production API keys generated
- [ ] **CORS settings configured** - Production domain allowlist

### Security Requirements
- [ ] **Supabase Row Level Security (RLS) policies reviewed** - Database security enabled
- [ ] **API rate limiting configured** - Protection against abuse
- [ ] **Authentication tokens/API keys generated** - Secure production credentials
- [ ] **Environment secrets secured** - No secrets in source code
- [ ] **Database backup strategy implemented** - Automated backups enabled
- [ ] **Security headers configured** - Production security headers active

### Performance Optimization  
- [ ] **Static assets optimized** - Image optimization and compression enabled
- [ ] **CDN configured** - Asset delivery optimization
- [ ] **Database indexes reviewed** - Query performance optimized
- [ ] **Caching strategies implemented** - Application and asset caching
- [ ] **Error logging and monitoring configured** - Production monitoring active
- [ ] **Bundle analysis completed** - Application bundle optimized

### Infrastructure Validation
- [ ] **Health monitoring endpoint active** - `/api/health` responding
- [ ] **Deployment scripts tested** - Automation scripts validated
- [ ] **Rollback procedures tested** - Emergency procedures verified
- [ ] **Performance benchmarks established** - Baseline metrics recorded

---

## ⚙️ Environment Configuration

### Environment Setup
1. **Copy template file:**
   ```bash
   cp .env.production.template .env.production
   ```

2. **Edit production environment:**
   ```bash
   # Use your preferred editor
   nano .env.production
   # or
   code .env.production
   ```

3. **Validate environment:**
   ```bash
   npm run validate-env
   ```

### Required Production Variables
```bash
# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tallyhq.io
PORT=3000

# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Security (REQUIRED for production)
TALLY_API_KEY=your_secure_api_key  # Generate with: openssl rand -hex 32
JWT_SECRET=your_jwt_secret          # Generate with: openssl rand -hex 64

# Monitoring & Logging (RECOMMENDED)
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
LOG_LEVEL=info
CONSOLE_LOGGING=false

# Health Check (OPTIONAL)
HEALTH_CHECK_TOKEN=your_health_check_token

# Notifications (OPTIONAL)
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### Environment Variables Reference
See `.env.production.template` for complete configuration options including:
- Google Calendar integration
- N8N automation webhooks  
- Email configuration
- Payment processing
- External storage
- Performance monitoring
- Feature flags

---

## 🛡️ Security Configuration

### API Authentication
For production, implement API key authentication:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip auth for development
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  // API routes requiring authentication
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey || apiKey !== process.env.TALLY_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*'
};
```

### CORS Configuration
```typescript
// api/leads/route.ts
export async function POST(request: NextRequest) {
  // CORS headers for production
  const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
      ? 'https://your-website-domain.com' 
      : '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Your existing lead creation logic...
  const response = NextResponse.json(result);
  
  // Add CORS headers to response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}
```

---

## 📊 Database Migration

### Supabase Production Setup
1. **Create Production Project**
   ```bash
   # Create new Supabase project for production
   # Copy database schema from development
   # Update connection strings in environment variables
   ```

2. **Row Level Security Policies**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
   ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
   ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
   
   -- Admin access policy (for API endpoints)
   CREATE POLICY "Admin full access" ON leads
   FOR ALL USING (true);
   
   -- Add similar policies for other tables
   ```

3. **Data Migration**
   ```bash
   # Export development data (if needed)
   # Import to production database
   # Verify data integrity
   ```

---

## 🚀 Automated Deployment

### Primary Deployment Method (Recommended)
```bash
# Complete automated deployment
./scripts/deploy.sh production

# With options
./scripts/deploy.sh production false false   # environment, skip_tests, dry_run
```

### Deployment Script Features
- ✅ **Pre-deployment validation** - Environment, git status, dependencies
- ✅ **Automated testing** - Type checking, linting, and tests
- ✅ **Production build** - Optimized build with bundle analysis
- ✅ **Database backup** - Automated backup before deployment
- ✅ **Health monitoring** - Post-deployment health verification
- ✅ **Rollback capability** - Automatic rollback on failure
- ✅ **Notifications** - Slack/Discord deployment notifications

### Manual Deployment Steps

#### 1. Pre-deployment Validation
```bash
# Validate environment
npm run validate-env

# Type checking
npm run type-check

# Linting
npm run lint
```

#### 2. Build Application
```bash
# Production build with optimization
npm run build:production

# Analyze bundle (optional)
npm run build:analyze
```

#### 3. Deploy Application
```bash
# Local production server
npm run start:production

# Or deploy to hosting platform
vercel --prod
# or
heroku git:remote -a your-app-name
git push heroku main
```

### 2. DNS Configuration
```
# DNS Records for tallyhq.io
A     @     your_server_ip
CNAME www   tallyhq.io
```

### 3. SSL Certificate
```bash
# If using Let's Encrypt
certbot --nginx -d tallyhq.io -d www.tallyhq.io

# Or configure SSL through your hosting provider
```

## 📊 Health Monitoring & Validation

### Health Check Endpoint
The application includes a comprehensive health monitoring endpoint at `/api/health`:

```bash
# Basic health check
curl https://tallyhq.io/api/health

# Authenticated health check (detailed info)
curl -H "Authorization: Bearer YOUR_HEALTH_TOKEN" https://tallyhq.io/api/health

# Simple uptime check (HEAD request)
curl -I https://tallyhq.io/api/health
```

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2025-08-15T10:30:00.000Z",
  "version": "0.1.2",
  "environment": "production",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "pass",
      "message": "Database connection successful",
      "duration_ms": 45
    },
    "environment": {
      "status": "pass", 
      "message": "Environment configuration valid",
      "duration_ms": 2
    },
    "external_services": {
      "status": "pass",
      "message": "External services check: 2 services checked",
      "duration_ms": 150
    }
  }
}
```

### Automated Health Monitoring
```bash
# Add to cron for regular health checks
# Check every 5 minutes
*/5 * * * * curl -f https://tallyhq.io/api/health || echo "Health check failed" | mail admin@tallyhq.io

# Use npm script
npm run health-check
```

---

## 🧪 Post-Deployment Testing

### 1. System Health Check
```bash
# Test health endpoint
curl https://tallyhq.io/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-08-15T10:30:00.000Z",
  "database": "connected"
}
```

### 2. API Integration Test
```bash
# Test lead creation with API key
curl -X POST https://tallyhq.io/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "first_name": "Production",
    "last_name": "Test",
    "email": "test@tallyhq.io",
    "session_type_interest": "Branding Session",
    "lead_source": "Website"
  }'
```

### 3. Frontend Access Test
- Visit `https://tallyhq.io/leads`
- Verify lead management interface loads
- Test lead creation and conversion
- Test portal access functionality

---

## 📈 Performance Monitoring & Optimization

### Production Logging System
The application includes comprehensive structured logging for production monitoring:

```typescript
import { logger, logError, logPerformance, createPerformanceTimer } from '@/lib/logging';

// Error logging with context
logError('Database connection failed', error, {
  component: 'LeadCreation',
  userId: 'user123',
  endpoint: '/api/leads'
});

// Performance monitoring
const timer = createPerformanceTimer('database.lead.create');
// ... perform operation
timer.end(true, { recordCount: 5 });

// API performance logging
logger.api('POST', '/api/leads', 200, 150, { userId: 'user123' });
```

### Bundle Analysis & Optimization
```bash
# Analyze production bundle
npm run build:analyze

# Check dependency usage
npm run analyze:deps

# Bundle analyzer output
npm run analyze:bundle
```

### Performance Metrics
Monitor these key performance indicators:

#### Application Performance
- **API Response Time**: < 500ms average
- **Database Query Time**: < 100ms average  
- **Page Load Time**: < 2 seconds
- **Bundle Size**: < 1MB gzipped
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1

#### Infrastructure Performance
- **Health Check Response**: < 200ms
- **Memory Usage**: < 512MB
- **CPU Usage**: < 70% average
- **Database Connections**: < 10 active

### Performance Optimization Features
- ✅ **Image Optimization** - WebP/AVIF format, lazy loading
- ✅ **Bundle Splitting** - Dynamic imports, code splitting
- ✅ **Compression** - Gzip/Brotli compression enabled
- ✅ **Caching** - Static asset caching, API response caching
- ✅ **CDN Ready** - Asset prefix configuration
- ✅ **Tree Shaking** - Unused code elimination

---

## 🔄 CMS Integration Updates

### Update CMS Configuration
Your CMS team needs to update their integration to use production endpoints:

```javascript
// CMS Configuration Update
const TALLY_CONFIG = {
  development: {
    apiBase: 'http://localhost:3004',
    apiKey: null
  },
  production: {
    apiBase: 'https://tallyhq.io',
    apiKey: process.env.TALLY_API_KEY
  }
};

const config = TALLY_CONFIG[process.env.NODE_ENV] || TALLY_CONFIG.development;
```

---

## ⚡ Emergency Rollback Procedures

### Automated Rollback (Recommended)
```bash
# Emergency rollback to previous version
./scripts/rollback.sh production

# Rollback to specific version
./scripts/rollback.sh production version 0.1.1

# Rollback to specific commit
./scripts/rollback.sh production commit abc123f

# Dry run rollback (test without applying)
./scripts/rollback.sh production previous '' true
```

### Rollback Script Features
- ✅ **Automatic backup** - Current state backup before rollback
- ✅ **Git-based rollback** - Rollback to previous commit/version
- ✅ **Application rebuild** - Automatic rebuild of rolled back version
- ✅ **Database restore** - Optional database restoration from backup
- ✅ **Health validation** - Post-rollback health verification
- ✅ **Notifications** - Automatic rollback notifications

### Manual Emergency Rollback
1. **Immediate Actions**
   ```bash
   # Stop current application
   pm2 stop all
   # or kill process
   kill $(cat .deployment.pid)
   
   # Rollback git
   git checkout HEAD~1
   git checkout -b emergency-rollback-$(date +%Y%m%d_%H%M%S)
   
   # Rebuild and restart
   npm install
   npm run build:production
   npm run start:production
   ```

2. **Database Rollback** (if needed)
   ```bash
   # List available backups
   ls -la backup_*.sql
   
   # Restore from backup (if using Supabase CLI)
   supabase db reset --with-seed backup_YYYYMMDD_HHMMSS.sql
   ```

3. **Verification**
   ```bash
   # Health check
   curl https://tallyhq.io/api/health
   
   # Functional test
   curl -X POST https://tallyhq.io/api/leads \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d '{"first_name":"Test","last_name":"User","email":"test@test.com"}'
   ```

4. **Communication**
   - Notify stakeholders via configured webhooks
   - Update status page
   - Document incident and resolution

---

## 📋 Post-Deployment Checklist

### Immediate (0-1 hours)
- [ ] Health check endpoint responding
- [ ] Lead API creation working
- [ ] Frontend dashboard accessible
- [ ] SSL certificate active
- [ ] DNS resolution correct

### Short-term (1-24 hours)
- [ ] Monitor error logs
- [ ] Verify database performance
- [ ] Test full lead-to-session workflow
- [ ] Confirm CMS integration working
- [ ] Monitor system performance

### Medium-term (1-7 days)
- [ ] Review analytics and usage patterns
- [ ] Optimize database queries if needed
- [ ] Monitor API response times
- [ ] Gather user feedback
- [ ] Plan scaling if needed

---

## 📞 Support & Maintenance

### Monitoring Alerts
Set up alerts for:
- API response time > 2 seconds
- Error rate > 1%
- Database connection failures
- SSL certificate expiration
- Disk space usage > 80%

### Backup Schedule
- **Database**: Daily automated backups
- **Application**: Version control with tagged releases
- **Configuration**: Environment variables documented and backed up

### Update Procedure
1. Test changes in development
2. Deploy to staging environment
3. Run automated tests
4. Deploy to production during low-traffic window
5. Monitor for issues post-deployment

---

## 🛠️ Operational Commands Reference

### Deployment Commands
```bash
# Automated production deployment
./scripts/deploy.sh production

# Manual deployment with validation
npm run deploy:production

# Environment validation
npm run validate-env

# Health check
npm run health-check

# Bundle analysis
npm run build:analyze
```

### Emergency Commands
```bash
# Emergency rollback
./scripts/rollback.sh production

# Stop application
kill $(cat .deployment.pid)

# Manual health check
curl -f https://tallyhq.io/api/health

# View logs
tail -f logs/production.log
```

### Monitoring Commands
```bash
# Performance analysis
npm run analyze:bundle
npm run analyze:deps

# Memory usage
ps aux | grep node

# Disk space
df -h

# Network connections
netstat -tulpn | grep :3000
```

---

## 📞 Operations Support

### 24/7 Monitoring Setup
```bash
# Cron job for health monitoring (every 5 minutes)
*/5 * * * * curl -f https://tallyhq.io/api/health > /dev/null 2>&1 || echo "ALERT: tallyhq.io health check failed" | mail ops@tallyhq.io

# Log rotation
/var/log/tally/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
}
```

### Alert Thresholds
- **Health Check Failures**: 2 consecutive failures = immediate alert
- **API Response Time**: > 2 seconds = warning, > 5 seconds = critical
- **Error Rate**: > 1% = warning, > 5% = critical
- **Memory Usage**: > 80% = warning, > 90% = critical
- **Disk Space**: > 85% = warning, > 95% = critical

### Incident Response Procedures
1. **Immediate Assessment** (0-5 minutes)
   - Check health endpoint: `curl https://tallyhq.io/api/health`
   - Review recent deployments and changes
   - Check system resources and error logs

2. **Mitigation** (5-15 minutes)
   - If deployment-related: Execute emergency rollback
   - If infrastructure-related: Scale resources or restart services
   - If database-related: Check connections and query performance

3. **Communication** (Within 15 minutes)
   - Notify stakeholders via configured channels
   - Update status page with incident details
   - Document timeline and actions taken

---

## 🎉 Production Launch Summary

### ✅ Infrastructure Ready
- **Automated Deployment**: One-command deployment with validation
- **Health Monitoring**: Real-time health checks and alerting
- **Emergency Procedures**: Automated rollback and incident response
- **Performance Optimization**: Bundle analysis, compression, and caching
- **Security Hardening**: Production security headers and validation
- **Comprehensive Logging**: Structured logging with external integration

### 🚀 Go-Live Checklist
1. **Final Validation**
   ```bash
   npm run validate-env
   npm run test:build
   curl https://tallyhq.io/api/health
   ```

2. **Update Documentation**
   - ✅ Integration docs updated with production URLs
   - ✅ API keys provided to CMS team  
   - ✅ Internal documentation updated
   - ✅ Operations procedures documented

3. **Stakeholder Notification**
   - ✅ CMS development team notified
   - ✅ Business stakeholders informed
   - ✅ Operations team briefed
   - ✅ Support documentation shared

4. **Post-Launch Monitoring** (First 48 hours)
   - ✅ Health check monitoring active
   - ✅ Performance metrics baseline established
   - ✅ Error tracking and alerting verified
   - ✅ Incident response procedures tested

---

**🚀 Tally Production Infrastructure is now fully operational at [tallyhq.io](https://tallyhq.io)!**

**Infrastructure Version**: 2.0.0  
**Deployment Method**: Automated with rollback capability  
**Monitoring**: Comprehensive health checks and performance tracking  
**Security**: Production-hardened with security headers and validation  
**Operations**: 24/7 ready with automated incident response