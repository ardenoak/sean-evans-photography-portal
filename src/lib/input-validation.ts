import { NextRequest } from 'next/server';

/**
 * 🔍 INPUT VALIDATION & SANITIZATION SYSTEM
 * 
 * Comprehensive input validation to prevent:
 * - SQL injection attacks
 * - XSS (Cross-Site Scripting) attacks
 * - NoSQL injection attacks
 * - Command injection attacks
 * - Path traversal attacks
 * - Data corruption and invalid data storage
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedData?: any;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'email' | 'uuid' | 'date' | 'url' | 'phone' | 'object' | 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: any[];
  sanitize?: boolean;
  customValidator?: (value: any) => boolean;
}

// Common validation patterns
const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  phone: /^\+?[\d\s\-\(\)]+$/,
  url: /^https?:\/\/[^\s$.?#].[^\s]*$/i,
  safeString: /^[a-zA-Z0-9\s\-_.@]+$/,
  sqlInjection: /(union|select|insert|update|delete|drop|create|alter|exec|execute|\-\-|\/\*|\*\/)/i,
  xssPattern: /(<script|<iframe|<object|<embed|javascript:|data:|vbscript:|onload|onerror|onclick)/i,
  pathTraversal: /(\.\.|\/\.\.\/|\\\.\.\\)/,
  commandInjection: /(\||&|;|\$\(|`|<|>)/
};

// Dangerous keywords that should be flagged
const DANGEROUS_KEYWORDS = [
  'script', 'iframe', 'object', 'embed', 'form', 'input',
  'select', 'union', 'drop', 'delete', 'truncate', 'exec',
  'eval', 'function', 'constructor', 'prototype'
];

// HTML entities for XSS prevention
const HTML_ENTITIES: { [key: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

// Sanitize string input to prevent XSS
function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // HTML encode dangerous characters
  return input.replace(/[&<>"'\/]/g, (char) => HTML_ENTITIES[char] || char);
}

// Deep sanitize object properties
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize both key and value
      const cleanKey = sanitizeString(key);
      sanitized[cleanKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Check for SQL injection patterns
function detectSQLInjection(input: string): boolean {
  return VALIDATION_PATTERNS.sqlInjection.test(input);
}

// Check for XSS patterns
function detectXSS(input: string): boolean {
  return VALIDATION_PATTERNS.xssPattern.test(input);
}

// Check for path traversal attempts
function detectPathTraversal(input: string): boolean {
  return VALIDATION_PATTERNS.pathTraversal.test(input);
}

// Check for command injection
function detectCommandInjection(input: string): boolean {
  return VALIDATION_PATTERNS.commandInjection.test(input);
}

// Check for dangerous keywords
function containsDangerousKeywords(input: string): string[] {
  const lowerInput = input.toLowerCase();
  return DANGEROUS_KEYWORDS.filter(keyword => lowerInput.includes(keyword));
}

// Validate individual field based on rules
function validateField(value: any, rule: ValidationRule): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push(`Field '${rule.field}' is required`);
    return { valid: false, errors };
  }
  
  // Skip validation for optional empty values
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return { valid: true, errors: [] };
  }
  
  // Type validation
  switch (rule.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push(`Field '${rule.field}' must be a string`);
        break;
      }
      
      // String length validation
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`Field '${rule.field}' must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`Field '${rule.field}' must be no more than ${rule.maxLength} characters`);
      }
      
      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`Field '${rule.field}' format is invalid`);
      }
      
      // Security checks
      if (detectSQLInjection(value)) {
        errors.push(`Field '${rule.field}' contains potential SQL injection`);
      }
      if (detectXSS(value)) {
        errors.push(`Field '${rule.field}' contains potential XSS`);
      }
      if (detectPathTraversal(value)) {
        errors.push(`Field '${rule.field}' contains path traversal attempt`);
      }
      if (detectCommandInjection(value)) {
        errors.push(`Field '${rule.field}' contains command injection attempt`);
      }
      
      const dangerousKeywords = containsDangerousKeywords(value);
      if (dangerousKeywords.length > 0) {
        errors.push(`Field '${rule.field}' contains dangerous keywords: ${dangerousKeywords.join(', ')}`);
      }
      break;
      
    case 'number':
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) {
        errors.push(`Field '${rule.field}' must be a valid number`);
        break;
      }
      
      if (rule.min !== undefined && numValue < rule.min) {
        errors.push(`Field '${rule.field}' must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && numValue > rule.max) {
        errors.push(`Field '${rule.field}' must be no more than ${rule.max}`);
      }
      break;
      
    case 'email':
      if (typeof value !== 'string' || !VALIDATION_PATTERNS.email.test(value)) {
        errors.push(`Field '${rule.field}' must be a valid email address`);
      }
      break;
      
    case 'uuid':
      if (typeof value !== 'string' || !VALIDATION_PATTERNS.uuid.test(value)) {
        errors.push(`Field '${rule.field}' must be a valid UUID`);
      }
      break;
      
    case 'url':
      if (typeof value !== 'string' || !VALIDATION_PATTERNS.url.test(value)) {
        errors.push(`Field '${rule.field}' must be a valid URL`);
      }
      break;
      
    case 'phone':
      if (typeof value !== 'string' || !VALIDATION_PATTERNS.phone.test(value)) {
        errors.push(`Field '${rule.field}' must be a valid phone number`);
      }
      break;
      
    case 'date':
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        errors.push(`Field '${rule.field}' must be a valid date`);
      }
      break;
      
    case 'array':
      if (!Array.isArray(value)) {
        errors.push(`Field '${rule.field}' must be an array`);
      }
      break;
      
    case 'object':
      if (typeof value !== 'object' || Array.isArray(value) || value === null) {
        errors.push(`Field '${rule.field}' must be an object`);
      }
      break;
  }
  
  // Allowed values validation
  if (rule.allowedValues && !rule.allowedValues.includes(value)) {
    errors.push(`Field '${rule.field}' must be one of: ${rule.allowedValues.join(', ')}`);
  }
  
  // Custom validation
  if (rule.customValidator && !rule.customValidator(value)) {
    errors.push(`Field '${rule.field}' failed custom validation`);
  }
  
  return { valid: errors.length === 0, errors };
}

// Calculate risk level based on validation errors
function calculateRiskLevel(errors: string[]): 'low' | 'medium' | 'high' | 'critical' {
  const criticalKeywords = ['sql injection', 'xss', 'command injection'];
  const highKeywords = ['path traversal', 'dangerous keywords'];
  
  for (const error of errors) {
    const lowerError = error.toLowerCase();
    
    if (criticalKeywords.some(keyword => lowerError.includes(keyword))) {
      return 'critical';
    }
    
    if (highKeywords.some(keyword => lowerError.includes(keyword))) {
      return 'high';
    }
  }
  
  if (errors.length > 3) {
    return 'medium';
  }
  
  return 'low';
}

// Main validation function
export function validateInput(data: any, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];
  const sanitizedData: any = {};
  
  // Validate each field
  for (const rule of rules) {
    const value = data[rule.field];
    const fieldResult = validateField(value, rule);
    
    if (!fieldResult.valid) {
      errors.push(...fieldResult.errors);
    }
    
    // Sanitize data if requested
    if (rule.sanitize) {
      sanitizedData[rule.field] = sanitizeObject(value);
    } else {
      sanitizedData[rule.field] = value;
    }
  }
  
  // Check for unexpected fields that might indicate an attack
  const expectedFields = rules.map(rule => rule.field);
  const unexpectedFields = Object.keys(data).filter(field => !expectedFields.includes(field));
  
  if (unexpectedFields.length > 0) {
    errors.push(`Unexpected fields detected: ${unexpectedFields.join(', ')}`);
  }
  
  const riskLevel = calculateRiskLevel(errors);
  
  return {
    valid: errors.length === 0,
    errors,
    sanitizedData,
    riskLevel
  };
}

// Quick validation for common API patterns
export function validateApiRequest(request: NextRequest): Promise<ValidationResult> {
  return new Promise(async (resolve) => {
    try {
      const contentType = request.headers.get('content-type') || '';
      
      if (!contentType.includes('application/json')) {
        resolve({
          valid: false,
          errors: ['Content-Type must be application/json'],
          riskLevel: 'medium'
        });
        return;
      }
      
      const body = await request.json();
      
      // Basic sanitization for all API requests
      const sanitizedBody = sanitizeObject(body);
      
      resolve({
        valid: true,
        errors: [],
        sanitizedData: sanitizedBody,
        riskLevel: 'low'
      });
      
    } catch (error) {
      resolve({
        valid: false,
        errors: ['Invalid JSON in request body'],
        riskLevel: 'medium'
      });
    }
  });
}

// Export validation patterns for reuse
export { VALIDATION_PATTERNS, sanitizeString, sanitizeObject };