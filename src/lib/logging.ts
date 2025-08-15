// Production logging and monitoring utility
// Provides structured logging, error tracking, and performance monitoring

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: string;
  environment?: string;
  version?: string;
  server?: boolean;
  client?: boolean;
  url?: string;
  [key: string]: any;
}

interface ErrorContext extends LogContext {
  stack?: string;
  component?: string;
  errorBoundary?: boolean;
  fatal?: boolean;
}

interface PerformanceContext extends LogContext {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

class Logger {
  private isProduction: boolean;
  private logLevel: LogLevel;
  private version: string;
  private environment: string;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = this.getLogLevel();
    this.version = process.env.npm_package_version || '0.1.2';
    this.environment = process.env.NODE_ENV || 'development';
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase();
    switch (level) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      case 'fatal': return LogLevel.FATAL;
      default: return this.isProduction ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): any {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      level: LogLevel[level],
      message,
      environment: this.environment,
      version: this.version,
      ...context
    };

    // Add request context if available
    if (typeof window === 'undefined' && context?.requestId) {
      baseLog.server = true;
    } else if (typeof window !== 'undefined') {
      baseLog.client = true;
      baseLog.url = window.location.href;
      baseLog.userAgent = navigator.userAgent;
    }

    return baseLog;
  }

  private sendToExternalService(logData: any): void {
    // Send to external monitoring service (Sentry, LogRocket, etc.)
    if (this.isProduction && process.env.SENTRY_DSN) {
      // This would integrate with Sentry or other monitoring service
      try {
        // Example: Sentry.captureMessage(logData.message, logData);
        console.log('📊 [EXTERNAL LOG]', JSON.stringify(logData));
      } catch (error) {
        console.error('Failed to send log to external service:', error);
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const logData = this.formatMessage(LogLevel.DEBUG, message, context);
    
    if (this.isProduction && process.env.CONSOLE_LOGGING !== 'true') {
      this.sendToExternalService(logData);
    } else {
      console.debug('🐛 [DEBUG]', message, context || '');
    }
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const logData = this.formatMessage(LogLevel.INFO, message, context);
    
    if (this.isProduction) {
      if (process.env.CONSOLE_LOGGING === 'true') {
        console.info('ℹ️  [INFO]', message, context || '');
      }
      this.sendToExternalService(logData);
    } else {
      console.info('ℹ️  [INFO]', message, context || '');
    }
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const logData = this.formatMessage(LogLevel.WARN, message, context);
    
    if (this.isProduction) {
      console.warn('⚠️  [WARN]', message, context || '');
      this.sendToExternalService(logData);
    } else {
      console.warn('⚠️  [WARN]', message, context || '');
    }
  }

  error(message: string, error?: Error, context?: ErrorContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const errorContext: ErrorContext = {
      ...context,
      stack: error?.stack,
      errorName: error?.name,
      errorMessage: error?.message
    };
    
    const logData = this.formatMessage(LogLevel.ERROR, message, errorContext);
    
    console.error('❌ [ERROR]', message, error || '', context || '');
    
    if (this.isProduction) {
      this.sendToExternalService(logData);
      
      // Send critical errors to external monitoring immediately
      if (context?.fatal) {
        this.sendCriticalAlert(message, error, context);
      }
    }
  }

  fatal(message: string, error?: Error, context?: ErrorContext): void {
    const fatalContext: ErrorContext = {
      ...context,
      fatal: true,
      stack: error?.stack,
      errorName: error?.name,
      errorMessage: error?.message
    };
    
    const logData = this.formatMessage(LogLevel.FATAL, message, fatalContext);
    
    console.error('💀 [FATAL]', message, error || '', fatalContext || '');
    
    if (this.isProduction) {
      this.sendToExternalService(logData);
      this.sendCriticalAlert(message, error, fatalContext);
    }
  }

  private sendCriticalAlert(message: string, error?: Error, context?: ErrorContext): void {
    // Send immediate alerts for critical errors
    if (process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL) {
      // Implementation would send to Slack/Discord for immediate notification
      console.log('🚨 [CRITICAL ALERT]', { message, error: error?.message, context });
    }
  }

  // Performance monitoring
  performance(context: PerformanceContext): void {
    const logData = this.formatMessage(LogLevel.INFO, `Performance: ${context.operation}`, context);
    
    if (this.isProduction) {
      // Send performance data to monitoring service
      this.sendToExternalService({
        ...logData,
        type: 'performance',
        metric: context.operation,
        value: context.duration,
        success: context.success
      });
      
      // Log slow operations
      if (context.duration > 5000) { // 5 seconds
        this.warn(`Slow operation detected: ${context.operation}`, {
          duration: context.duration,
          ...context.metadata
        });
      }
    } else {
      console.log(`⚡ [PERFORMANCE] ${context.operation}: ${context.duration}ms`, context.metadata || '');
    }
  }

  // Database operation logging
  database(operation: string, duration: number, success: boolean, metadata?: any): void {
    this.performance({
      operation: `database.${operation}`,
      duration,
      success,
      metadata
    });
  }

  // API endpoint logging
  api(method: string, endpoint: string, statusCode: number, duration: number, context?: LogContext): void {
    const success = statusCode >= 200 && statusCode < 400;
    const message = `${method} ${endpoint} - ${statusCode} (${duration}ms)`;
    
    if (success) {
      this.info(message, { ...context, method, endpoint, statusCode, duration });
    } else if (statusCode >= 400 && statusCode < 500) {
      this.warn(message, { ...context, method, endpoint, statusCode, duration });
    } else {
      this.error(message, undefined, { ...context, method, endpoint, statusCode, duration });
    }
    
    this.performance({
      operation: `api.${method}.${endpoint}`,
      duration,
      success,
      metadata: { statusCode, ...context }
    });
  }

  // User action logging
  userAction(action: string, userId?: string, metadata?: any): void {
    this.info(`User action: ${action}`, {
      userId,
      action,
      metadata
    });
  }

  // Security event logging
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    const message = `Security event: ${event}`;
    
    switch (severity) {
      case 'low':
        this.info(message, { ...context, securityEvent: event, severity });
        break;
      case 'medium':
        this.warn(message, { ...context, securityEvent: event, severity });
        break;
      case 'high':
      case 'critical':
        this.error(message, undefined, { ...context, securityEvent: event, severity, fatal: severity === 'critical' });
        break;
    }
  }

  // Create a timer for performance monitoring
  createTimer(operation: string) {
    const start = Date.now();
    
    return {
      end: (success = true, metadata?: any) => {
        const duration = Date.now() - start;
        this.performance({ operation, duration, success, metadata });
        return duration;
      }
    };
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Convenience functions
export const logError = (message: string, error?: Error, context?: ErrorContext) => 
  logger.error(message, error, context);

export const logInfo = (message: string, context?: LogContext) => 
  logger.info(message, context);

export const logWarn = (message: string, context?: LogContext) => 
  logger.warn(message, context);

export const logDebug = (message: string, context?: LogContext) => 
  logger.debug(message, context);

export const logPerformance = (operation: string, duration: number, success = true, metadata?: any) => 
  logger.performance({ operation, duration, success, metadata });

export const logUserAction = (action: string, userId?: string, metadata?: any) => 
  logger.userAction(action, userId, metadata);

export const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext) => 
  logger.security(event, severity, context);

export const createPerformanceTimer = (operation: string) => 
  logger.createTimer(operation);

// Error boundary helper
export const logComponentError = (error: Error, errorInfo: any, componentName: string) => {
  logger.error(`React component error in ${componentName}`, error, {
    component: componentName,
    errorBoundary: true,
    componentStack: errorInfo.componentStack
  });
};

// API middleware helper
export const createApiLogger = (req: any) => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  return {
    requestId,
    log: (message: string, context?: any) => logger.info(message, { 
      requestId, 
      endpoint: req.url, 
      method: req.method,
      ...context 
    }),
    error: (message: string, error?: Error, context?: any) => logger.error(message, error, { 
      requestId, 
      endpoint: req.url, 
      method: req.method,
      ...context 
    }),
    end: (statusCode: number) => {
      const duration = Date.now() - startTime;
      logger.api(req.method, req.url, statusCode, duration, { requestId });
    }
  };
};

export default logger;