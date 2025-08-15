# 🔐 Security Environment Variables Configuration

## Production Security Configuration

This document outlines the required environment variables for production security deployment. **These variables are CRITICAL for production security and must be configured before deployment.**

## Required Security Environment Variables

### API Authentication Keys

```bash
# Primary CMS Integration API Key (REQUIRED)
# Generate with: openssl rand -hex 32
CMS_API_KEY=your_primary_cms_api_key_here

# Backup CMS API Key for Key Rotation (RECOMMENDED)
# Generate with: openssl rand -hex 32
CMS_API_KEY_BACKUP=your_backup_cms_api_key_here

# Read-Only Analytics API Key (OPTIONAL)
# Generate with: openssl rand -hex 32
ANALYTICS_API_KEY=your_analytics_api_key_here

# Full Administrative API Key (REQUIRED for admin operations)
# Generate with: openssl rand -hex 32
ADMIN_API_KEY=your_admin_api_key_here
```

### Supabase Configuration (REQUIRED)

```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anonymous Key (Public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role Key (CRITICAL - Server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Application Configuration

```bash
# Node Environment (REQUIRED)
NODE_ENV=production

# Site URL for CORS Configuration (REQUIRED)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Security Features Enabled

### 🛡️ Middleware Security Features

- **Rate Limiting**: 100 requests per minute per IP address
- **API Key Authentication**: Required for all production API access
- **CORS Protection**: Only allows requests from tallyhq.io domains
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Input Validation**: Comprehensive sanitization and validation

### 🔒 Authentication Levels

1. **Development Mode** (`NODE_ENV=development`)
   - All API routes accessible without authentication
   - Detailed logging for debugging
   - Less restrictive security headers

2. **Production Mode** (`NODE_ENV=production`)
   - API key authentication required
   - Strict security headers enforced
   - Rate limiting active
   - Enhanced logging and monitoring

## API Key Management

### Generating Secure API Keys

Use one of these methods to generate cryptographically secure API keys:

```bash
# Method 1: Using OpenSSL (Recommended)
openssl rand -hex 32

# Method 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 3: Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Key Rotation Strategy

1. Generate new backup key and set as `CMS_API_KEY_BACKUP`
2. Test that backup key works correctly
3. Promote backup key to primary (`CMS_API_KEY`)
4. Generate new backup key
5. Update client applications with new primary key
6. Monitor for successful authentication

### API Key Permissions

| Key Type | Permissions | Use Case |
|----------|-------------|----------|
| `CMS_API_KEY` | read, write | Primary CMS integration |
| `CMS_API_KEY_BACKUP` | read, write | Key rotation and backup |
| `ANALYTICS_API_KEY` | read | Analytics and reporting |
| `ADMIN_API_KEY` | read, write, admin | Administrative operations |

## Security Headers Configuration

### Content Security Policy (CSP)

Production CSP allows:
- Scripts from `tally.so` and `tallyhq.io`
- Styles from `self` and Google Fonts
- Images from `self`, `data:`, and trusted domains
- Connections to Supabase and Tally API

### CORS Configuration

Production CORS allows:
- `https://tallyhq.io`
- `https://www.tallyhq.io`
- `https://tally.so`
- Your configured `NEXT_PUBLIC_SITE_URL`

## Monitoring and Logging

### Security Events Logged

- Authentication attempts (success/failure)
- Rate limit violations
- Invalid API key usage
- Security header violations
- Input validation failures

### Log Format

```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "endpoint": "/api/sessions",
  "method": "POST",
  "valid": true,
  "keyId": "cms-primary",
  "reason": null
}
```

## Production Deployment Checklist

### Pre-Deployment Security Verification

- [ ] All required environment variables configured
- [ ] API keys generated using secure methods
- [ ] Supabase service role key properly secured
- [ ] CORS origins correctly configured
- [ ] Security headers tested and validated
- [ ] Rate limiting thresholds appropriate for traffic

### Post-Deployment Security Validation

- [ ] Health check endpoint accessible (`/api/health`)
- [ ] Authentication working for protected endpoints
- [ ] Rate limiting functioning correctly
- [ ] Security headers present in responses
- [ ] CORS policy enforced correctly
- [ ] Logging and monitoring operational

## Security Best Practices

### Environment Variable Security

1. **Never commit secrets to version control**
2. **Use separate keys for different environments**
3. **Rotate keys regularly (quarterly recommended)**
4. **Use a secure secrets management system**
5. **Limit access to production environment variables**

### API Key Security

1. **Use HTTPS only for API key transmission**
2. **Include API keys in headers, not query parameters**
3. **Implement key expiration where possible**
4. **Monitor for unauthorized key usage**
5. **Revoke compromised keys immediately**

### Monitoring and Alerting

1. **Set up alerts for authentication failures**
2. **Monitor rate limit violations**
3. **Track API key usage patterns**
4. **Review security logs regularly**
5. **Implement automated threat detection**

## Emergency Security Procedures

### Compromised API Key Response

1. **Immediately revoke the compromised key**
2. **Generate and deploy new keys**
3. **Review logs for unauthorized access**
4. **Notify affected systems and users**
5. **Document the incident and response**

### Security Incident Response

1. **Isolate affected systems**
2. **Preserve logs and evidence**
3. **Assess the scope of compromise**
4. **Implement containment measures**
5. **Coordinate with security team**

## Support and Contact

For security-related questions or incidents:

- **Development Team**: Review middleware implementation
- **Security Team**: Contact for incident response
- **Infrastructure Team**: Environment configuration support

---

⚠️ **CRITICAL SECURITY NOTICE**: This configuration is essential for production security. Do not deploy to production without properly configuring all required environment variables and validating the security implementation.