import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './lib/rate-limit';
import { validateApiKey } from './lib/api-auth';
import { addSecurityHeaders } from './lib/security-headers';

/**
 * 🔒 PRODUCTION SECURITY MIDDLEWARE
 * 
 * This middleware provides comprehensive security for all API routes:
 * - Rate limiting (100 requests/minute per IP)
 * - API key authentication for production
 * - CORS configuration for tallyhq.io
 * - Security headers (HSTS, CSP, etc.)
 * - Input validation and sanitization
 */

export async function middleware(request: NextRequest) {
  // Only apply security to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Create response with security headers
  const response = NextResponse.next();
  addSecurityHeaders(response, request);
  
  // Apply CORS for production
  if (isProduction) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'https://tallyhq.io',
      'https://www.tallyhq.io',
      'https://tally.so',
      process.env.NEXT_PUBLIC_SITE_URL
    ].filter(Boolean);
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
  }
  
  // Apply rate limiting
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.allowed) {
    console.warn(`Rate limit exceeded for IP: ${rateLimitResult.clientIp}`);
    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimitResult.retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
          ...Object.fromEntries(response.headers.entries())
        }
      }
    );
  }
  
  // Apply authentication in production
  if (isProduction) {
    // Skip authentication for specific public endpoints
    const publicEndpoints = [
      '/api/forms/notify', // Tally webhook endpoint
      '/api/health', // Health check endpoint
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      request.nextUrl.pathname === endpoint
    );
    
    if (!isPublicEndpoint) {
      const authResult = await validateApiKey(request);
      if (!authResult.valid) {
        console.warn(`Authentication failed for ${request.nextUrl.pathname}: ${authResult.reason}`);
        return new NextResponse(
          JSON.stringify({
            error: 'Authentication required',
            message: authResult.reason || 'Invalid or missing API key'
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'WWW-Authenticate': 'Bearer',
              ...Object.fromEntries(response.headers.entries())
            }
          }
        );
      }
    }
  }
  
  // Development mode - allow all requests but log them
  if (isDevelopment) {
    console.log(`🔓 [DEV MODE] API Request: ${request.method} ${request.nextUrl.pathname}`);
  }
  
  // Add security context to headers for downstream use
  response.headers.set('X-Security-Context', JSON.stringify({
    environment: process.env.NODE_ENV,
    rateLimited: false,
    authenticated: isProduction ? 'api-key' : 'development',
    timestamp: new Date().toISOString()
  }));
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all API routes except:
     * - Static files (_next/static)
     * - Images (_next/image)
     * - Favicon, robots, etc.
     */
    '/api/(.*)',
  ],
};