// Performance monitoring utilities
// 🔵 [PERFORMANCE] Request timing and optimization tools

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  endpoint: string;
  method: string;
  statusCode?: number;
  requestSize?: number;
  responseSize?: number;
}

export class PerformanceMonitor {
  private static metrics: Map<string, PerformanceMetrics> = new Map();
  
  static startTimer(requestId: string, endpoint: string, method: string): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      startTime: Date.now(),
      endpoint,
      method
    };
    
    this.metrics.set(requestId, metrics);
    return metrics;
  }
  
  static endTimer(requestId: string, statusCode: number, responseSize?: number): PerformanceMetrics | null {
    const metrics = this.metrics.get(requestId);
    if (!metrics) return null;
    
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.statusCode = statusCode;
    metrics.responseSize = responseSize;
    
    // Log performance data
    this.logMetrics(metrics);
    
    // Clean up
    this.metrics.delete(requestId);
    
    return metrics;
  }
  
  private static logMetrics(metrics: PerformanceMetrics) {
    const { endpoint, method, duration, statusCode } = metrics;
    
    // Color-coded performance logging
    let emoji = '🟢';
    let level = 'info';
    
    if (duration! > 1000) {
      emoji = '🔴';
      level = 'warn';
    } else if (duration! > 500) {
      emoji = '🟡';
      level = 'warn';
    }
    
    if (level === 'warn') {
      console.warn(`${emoji} [PERFORMANCE] ${method} ${endpoint} - ${duration}ms (${statusCode})`);
    } else {
      console.info(`${emoji} [PERFORMANCE] ${method} ${endpoint} - ${duration}ms (${statusCode})`);
    }
    
    // Log to performance table if available
    if (typeof window === 'undefined') {
      this.logToDatabase(metrics);
    }
  }
  
  private static async logToDatabase(metrics: PerformanceMetrics) {
    try {
      // This would integrate with your database logging
      // For now, we'll just console log the structured data
      console.log('📊 [METRICS]', {
        timestamp: new Date().toISOString(),
        endpoint: metrics.endpoint,
        method: metrics.method,
        duration: metrics.duration,
        statusCode: metrics.statusCode
      });
    } catch (error) {
      console.error('Failed to log performance metrics:', error);
    }
  }
  
  static getAverageResponseTime(endpoint?: string): number {
    // In a real implementation, this would query historical data
    // For now, return a mock value
    return endpoint ? 150 : 200;
  }
  
  static getSlowQueries(threshold: number = 500): PerformanceMetrics[] {
    // In a real implementation, this would query the database
    // Return mock slow queries for demonstration
    return [];
  }
}

// Request deduplication utility
export class RequestDeduplicator {
  private static cache: Map<string, { 
    promise: Promise<any>, 
    timestamp: number 
  }> = new Map();
  
  private static readonly CACHE_DURATION = 5000; // 5 seconds
  
  static async deduplicate<T>(
    key: string, 
    requestFn: () => Promise<T>
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);
    
    // Return cached promise if it's still fresh
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`🔄 [DEDUP] Using cached request for ${key}`);
      return cached.promise;
    }
    
    // Create new request
    console.log(`🆕 [DEDUP] Making new request for ${key}`);
    const promise = requestFn();
    
    // Cache the promise
    this.cache.set(key, {
      promise,
      timestamp: now
    });
    
    // Clean up after completion
    promise.finally(() => {
      setTimeout(() => {
        this.cache.delete(key);
      }, this.CACHE_DURATION);
    });
    
    return promise;
  }
  
  static clearCache() {
    this.cache.clear();
  }
}

// Response caching utility
export class ResponseCache {
  private static cache: Map<string, {
    data: any,
    timestamp: number,
    ttl: number
  }> = new Map();
  
  static set(key: string, data: any, ttlSeconds: number = 30) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }
  
  static get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`💾 [CACHE] Hit for ${key}`);
    return cached.data;
  }
  
  static clear() {
    this.cache.clear();
  }
  
  static invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// API response optimization
export function optimizeResponse(data: any): any {
  // Remove null/undefined values to reduce payload size
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (value === null || value === undefined) {
      return undefined;
    }
    return value;
  }));
}

// Database query optimization helpers
export class QueryOptimizer {
  static async withTiming<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      console.log(`⚡ [QUERY] ${queryName} completed in ${duration}ms`);
      
      if (duration > 1000) {
        console.warn(`🐌 [SLOW QUERY] ${queryName} took ${duration}ms - consider optimization`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [QUERY ERROR] ${queryName} failed after ${duration}ms:`, error);
      throw error;
    }
  }
  
  static createCacheKey(table: string, filters?: Record<string, any>): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `${table}:${filterStr}`;
  }
}

// All utilities exported individually above