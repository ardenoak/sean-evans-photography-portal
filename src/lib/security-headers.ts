import { NextRequest, NextResponse } from 'next/server';

/**
 * 🛡️ SECURITY HEADERS SYSTEM
 * 
 * Implements comprehensive security headers to protect against:
 * - XSS (Cross-Site Scripting) attacks
 * - Clickjacking attacks
 * - Content type sniffing
 * - HTTPS downgrade attacks
 * - Information leakage
 * - CSRF attacks
 */

interface SecurityConfig {
  development: SecurityHeaders;
  production: SecurityHeaders;
}

interface SecurityHeaders {
  contentSecurityPolicy: string;
  strictTransportSecurity: string;
  frameOptions: string;
  contentTypeOptions: string;
  referrerPolicy: string;
  permissionsPolicy: string;
}

// Security headers configuration
const SECURITY_CONFIG: SecurityConfig = {
  development: {
    // More permissive CSP for development
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://tally.so https://*.tally.so",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.tally.so",
      "frame-src 'self' https://tally.so https://*.tally.so",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://tally.so"
    ].join('; '),
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    frameOptions: 'SAMEORIGIN',
    contentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=()'
  },
  
  production: {
    // Strict CSP for production
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' https://tally.so https://*.tally.so 'sha256-YOUR_INLINE_SCRIPT_HASH'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://tallyhq.io https://*.tallyhq.io https://tally.so",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.tally.so",
      "frame-src 'self' https://tally.so https://*.tally.so",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://tally.so",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
    frameOptions: 'DENY',
    contentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()'
    ].join(', ')
  }
};

// Additional security headers for API responses
const API_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

export function addSecurityHeaders(response: NextResponse, request: NextRequest): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  
  // Select appropriate security configuration
  const config = isProduction ? SECURITY_CONFIG.production : SECURITY_CONFIG.development;
  
  // Core security headers for all responses
  response.headers.set('X-Content-Type-Options', config.contentTypeOptions);
  response.headers.set('X-Frame-Options', config.frameOptions);
  response.headers.set('Referrer-Policy', config.referrerPolicy);
  response.headers.set('Permissions-Policy', config.permissionsPolicy);
  
  // HSTS header for HTTPS (only in production)
  if (isProduction && request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', config.strictTransportSecurity);
  }
  
  // Content Security Policy
  if (!isApiRoute) {
    // Only add CSP to non-API routes (HTML responses)
    response.headers.set('Content-Security-Policy', config.contentSecurityPolicy);
  }
  
  // Additional headers for API routes
  if (isApiRoute) {
    Object.entries(API_SECURITY_HEADERS).forEach(([header, value]) => {
      response.headers.set(header, value);
    });
    
    // API-specific security headers
    response.headers.set('X-API-Version', 'v1');
    response.headers.set('X-Request-ID', generateRequestId());
    
    // Prevent caching of sensitive API responses
    if (request.nextUrl.pathname.includes('/auth') || 
        request.nextUrl.pathname.includes('/admin') ||
        request.nextUrl.pathname.includes('/sensitive')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
  }
  
  // Security-related meta headers
  response.headers.set('X-Powered-By', 'Arden Oak Security System');
  response.headers.set('X-Security-Version', '1.0.0');
  
  // Development-only headers
  if (!isProduction) {
    response.headers.set('X-Development-Mode', 'true');
    response.headers.set('X-Security-Level', 'development');
  } else {
    response.headers.set('X-Security-Level', 'production');
  }
}

// Generate unique request ID for tracking
function generateRequestId(): string {
  return [
    Date.now().toString(36),
    Math.random().toString(36).substring(2, 8)
  ].join('-');
}

// CSP violation reporting endpoint helper
export function handleCSPReport(request: NextRequest): NextResponse {
  return new NextResponse(JSON.stringify({
    message: 'CSP violation report received',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...API_SECURITY_HEADERS
    }
  });
}

// Security headers validation for testing
export function validateSecurityHeaders(headers: Headers): {
  valid: boolean;
  missing: string[];
  recommendations: string[];
} {
  const requiredHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'referrer-policy'
  ];
  
  const missing = requiredHeaders.filter(header => !headers.has(header));
  
  const recommendations: string[] = [];
  
  if (!headers.has('strict-transport-security')) {
    recommendations.push('Add HSTS header for HTTPS');
  }
  
  if (!headers.has('content-security-policy')) {
    recommendations.push('Add Content Security Policy');
  }
  
  if (!headers.has('permissions-policy')) {
    recommendations.push('Add Permissions Policy');
  }
  
  return {
    valid: missing.length === 0,
    missing,
    recommendations
  };
}

// Export configuration for testing
export { SECURITY_CONFIG };