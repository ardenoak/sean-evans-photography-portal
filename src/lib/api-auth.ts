import { NextRequest } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';

/**
 * 🔐 API AUTHENTICATION SYSTEM
 * 
 * Multi-layer authentication for production API access:
 * - API key authentication for CMS integration
 * - Bearer token validation
 * - Timing-safe comparison to prevent timing attacks
 * - Key rotation support with multiple valid keys
 * - Audit logging for authentication attempts
 */

interface AuthResult {
  valid: boolean;
  reason?: string;
  keyId?: string;
  timestamp: string;
}

interface ApiKeyConfig {
  id: string;
  hash: string;
  permissions: string[];
  expiresAt?: string;
  description: string;
}

// Hash function for secure key comparison
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// Timing-safe string comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  const bufferA = Buffer.from(a, 'hex');
  const bufferB = Buffer.from(b, 'hex');
  
  return timingSafeEqual(bufferA, bufferB);
}

// Get valid API keys from environment configuration
function getValidApiKeys(): ApiKeyConfig[] {
  const keys: ApiKeyConfig[] = [];
  
  // Primary CMS integration key
  if (process.env.CMS_API_KEY) {
    keys.push({
      id: 'cms-primary',
      hash: hashApiKey(process.env.CMS_API_KEY),
      permissions: ['read', 'write'],
      description: 'Primary CMS integration key'
    });
  }
  
  // Secondary/backup key for key rotation
  if (process.env.CMS_API_KEY_BACKUP) {
    keys.push({
      id: 'cms-backup',
      hash: hashApiKey(process.env.CMS_API_KEY_BACKUP),
      permissions: ['read', 'write'],
      description: 'Backup CMS integration key'
    });
  }
  
  // Read-only analytics key
  if (process.env.ANALYTICS_API_KEY) {
    keys.push({
      id: 'analytics-readonly',
      hash: hashApiKey(process.env.ANALYTICS_API_KEY),
      permissions: ['read'],
      description: 'Read-only analytics access'
    });
  }
  
  // Admin maintenance key (full access)
  if (process.env.ADMIN_API_KEY) {
    keys.push({
      id: 'admin-full',
      hash: hashApiKey(process.env.ADMIN_API_KEY),
      permissions: ['read', 'write', 'admin'],
      description: 'Full administrative access'
    });
  }
  
  // Production API key for dashboard access (server-side only)
  if (process.env.ADMIN_API_KEY_DASHBOARD) {
    keys.push({
      id: 'dashboard-admin',
      hash: hashApiKey(process.env.ADMIN_API_KEY_DASHBOARD),
      permissions: ['read', 'write', 'admin'],
      description: 'Dashboard admin access key'
    });
  }
  
  // Tally integration key
  if (process.env.TALLY_API_KEY) {
    keys.push({
      id: 'tally-integration',
      hash: hashApiKey(process.env.TALLY_API_KEY),
      permissions: ['read', 'write'],
      description: 'Tally integration key'
    });
  }
  
  return keys;
}

// Extract API key from request headers
function extractApiKey(request: NextRequest): string | null {
  // Check X-API-Key header (preferred)
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }
  
  // Check Authorization header with Bearer scheme
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check query parameter (not recommended for production)
  const queryKey = request.nextUrl.searchParams.get('api_key');
  if (queryKey && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ API key in query parameter - not recommended for production');
    return queryKey;
  }
  
  return null;
}

// Check if key has required permissions for the endpoint
function hasPermission(permissions: string[], endpoint: string, method: string): boolean {
  // Admin permission grants all access
  if (permissions.includes('admin')) {
    return true;
  }
  
  // Check method-based permissions
  if (method === 'GET' && permissions.includes('read')) {
    return true;
  }
  
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && permissions.includes('write')) {
    return true;
  }
  
  return false;
}

// Log authentication attempts for security monitoring
function logAuthAttempt(result: AuthResult, request: NextRequest) {
  const logData = {
    timestamp: result.timestamp,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    endpoint: request.nextUrl.pathname,
    method: request.method,
    valid: result.valid,
    keyId: result.keyId,
    reason: result.reason
  };
  
  if (result.valid) {
    console.log(`✅ [AUTH SUCCESS] ${JSON.stringify(logData)}`);
  } else {
    console.warn(`❌ [AUTH FAILURE] ${JSON.stringify(logData)}`);
  }
}

export async function validateApiKey(request: NextRequest): Promise<AuthResult> {
  const timestamp = new Date().toISOString();
  
  try {
    // Extract API key from request
    const providedKey = extractApiKey(request);
    
    if (!providedKey) {
      const result: AuthResult = {
        valid: false,
        reason: 'Missing API key in X-API-Key header or Authorization Bearer token',
        timestamp
      };
      logAuthAttempt(result, request);
      return result;
    }
    
    // Get valid API keys
    const validKeys = getValidApiKeys();
    
    if (validKeys.length === 0) {
      const result: AuthResult = {
        valid: false,
        reason: 'No API keys configured - check environment variables',
        timestamp
      };
      logAuthAttempt(result, request);
      return result;
    }
    
    // Hash the provided key for comparison
    const providedKeyHash = hashApiKey(providedKey);
    
    // Find matching API key using timing-safe comparison
    let matchedKey: ApiKeyConfig | null = null;
    
    for (const keyConfig of validKeys) {
      if (secureCompare(providedKeyHash, keyConfig.hash)) {
        // Check if key has expired
        if (keyConfig.expiresAt && new Date() > new Date(keyConfig.expiresAt)) {
          const result: AuthResult = {
            valid: false,
            reason: `API key ${keyConfig.id} has expired`,
            keyId: keyConfig.id,
            timestamp
          };
          logAuthAttempt(result, request);
          return result;
        }
        
        matchedKey = keyConfig;
        break;
      }
    }
    
    if (!matchedKey) {
      const result: AuthResult = {
        valid: false,
        reason: 'Invalid API key',
        timestamp
      };
      logAuthAttempt(result, request);
      return result;
    }
    
    // Check permissions for this endpoint
    const hasRequiredPermission = hasPermission(
      matchedKey.permissions,
      request.nextUrl.pathname,
      request.method
    );
    
    if (!hasRequiredPermission) {
      const result: AuthResult = {
        valid: false,
        reason: `API key ${matchedKey.id} lacks permission for ${request.method} ${request.nextUrl.pathname}`,
        keyId: matchedKey.id,
        timestamp
      };
      logAuthAttempt(result, request);
      return result;
    }
    
    // Authentication successful
    const result: AuthResult = {
      valid: true,
      keyId: matchedKey.id,
      timestamp
    };
    logAuthAttempt(result, request);
    return result;
    
  } catch (error) {
    console.error('API authentication error:', error);
    const result: AuthResult = {
      valid: false,
      reason: 'Internal authentication error',
      timestamp
    };
    logAuthAttempt(result, request);
    return result;
  }
}

// Utility function to generate new API keys
export function generateApiKey(): string {
  // Use Web Crypto API for generating random bytes (works in Edge Runtime)
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Utility function for testing authentication
export function createTestApiKey(): string {
  return generateApiKey();
}