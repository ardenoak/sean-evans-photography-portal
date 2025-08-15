import { NextRequest } from 'next/server';

/**
 * 🚦 RATE LIMITING SYSTEM
 * 
 * Implements sliding window rate limiting to prevent abuse:
 * - 100 requests per minute per IP address
 * - Memory-based storage (suitable for single instance)
 * - Automatic cleanup of expired entries
 * - Configurable limits per endpoint type
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
  lastRequest: number;
}

interface RateLimitResult {
  allowed: boolean;
  clientIp: string;
  remaining?: number;
  retryAfter?: number;
  resetTime?: number;
}

// In-memory store for rate limiting (use Redis in multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMITS = {
  default: { requests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  webhook: { requests: 1000, windowMs: 60 * 1000 }, // Higher limit for webhooks
  auth: { requests: 10, windowMs: 60 * 1000 }, // Lower limit for auth endpoints
};

// Cleanup interval to remove expired entries
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to a default for development
  return '127.0.0.1';
}

function getRateLimitConfig(pathname: string) {
  if (pathname.includes('/webhook') || pathname.includes('/notify')) {
    return RATE_LIMITS.webhook;
  }
  
  if (pathname.includes('/auth') || pathname.includes('/login')) {
    return RATE_LIMITS.auth;
  }
  
  return RATE_LIMITS.default;
}

function cleanupExpiredEntries() {
  const now = Date.now();
  
  // Only cleanup periodically to avoid performance impact
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }
  
  const cutoff = now - (60 * 60 * 1000); // Remove entries older than 1 hour
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.lastRequest < cutoff) {
      rateLimitStore.delete(key);
    }
  }
  
  lastCleanup = now;
}

export async function rateLimit(request: NextRequest): Promise<RateLimitResult> {
  const clientIp = getClientIP(request);
  const pathname = request.nextUrl.pathname;
  const config = getRateLimitConfig(pathname);
  
  // Create a unique key for this IP and endpoint type
  const key = `${clientIp}:${pathname.startsWith('/api/webhook') ? 'webhook' : 'api'}`;
  
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Cleanup expired entries periodically
  cleanupExpiredEntries();
  
  // Get existing entry or create new one
  let entry = rateLimitStore.get(key);
  
  if (!entry) {
    // First request from this IP
    entry = {
      count: 1,
      windowStart: now,
      lastRequest: now
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      clientIp,
      remaining: config.requests - 1,
      resetTime: now + config.windowMs
    };
  }
  
  // Check if we're in a new window
  if (entry.windowStart <= windowStart) {
    // Reset the window
    entry.count = 1;
    entry.windowStart = now;
    entry.lastRequest = now;
    
    return {
      allowed: true,
      clientIp,
      remaining: config.requests - 1,
      resetTime: now + config.windowMs
    };
  }
  
  // We're in the current window, check if limit exceeded
  if (entry.count >= config.requests) {
    const retryAfter = Math.ceil((entry.windowStart + config.windowMs - now) / 1000);
    
    return {
      allowed: false,
      clientIp,
      remaining: 0,
      retryAfter,
      resetTime: entry.windowStart + config.windowMs
    };
  }
  
  // Increment counter
  entry.count++;
  entry.lastRequest = now;
  
  return {
    allowed: true,
    clientIp,
    remaining: config.requests - entry.count,
    resetTime: entry.windowStart + config.windowMs
  };
}

// Export for testing and monitoring
export function getRateLimitStats() {
  const stats = {
    totalEntries: rateLimitStore.size,
    entries: Array.from(rateLimitStore.entries()).map(([key, entry]) => ({
      key,
      count: entry.count,
      windowStart: new Date(entry.windowStart).toISOString(),
      lastRequest: new Date(entry.lastRequest).toISOString()
    }))
  };
  
  return stats;
}

// Manual cleanup function for testing
export function clearRateLimitStore() {
  rateLimitStore.clear();
}