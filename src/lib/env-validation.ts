// Environment validation utility for production deployment
// Validates required environment variables and provides helpful error messages

interface EnvironmentConfig {
  NODE_ENV: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NEXT_PUBLIC_APP_URL?: string;
  TALLY_API_KEY?: string;
  JWT_SECRET?: string;
}

interface ValidationRule {
  key: keyof EnvironmentConfig;
  required: boolean;
  description: string;
  productionOnly?: boolean;
  format?: RegExp;
  example?: string;
}

const VALIDATION_RULES: ValidationRule[] = [
  {
    key: 'NODE_ENV',
    required: true,
    description: 'Application environment (development, production, test)',
    example: 'production'
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    format: /^https:\/\/[a-z0-9]+\.supabase\.co$/,
    example: 'https://yourproject.supabase.co'
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous public key',
    format: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    description: 'Supabase service role key (for server-side operations)',
    format: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    key: 'NEXT_PUBLIC_APP_URL',
    required: false,
    productionOnly: true,
    description: 'Public application URL',
    format: /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    example: 'https://tallyhq.io'
  },
  {
    key: 'TALLY_API_KEY',
    required: false,
    productionOnly: true,
    description: 'API authentication key for production',
    example: 'Generate with: openssl rand -hex 32'
  },
  {
    key: 'JWT_SECRET',
    required: false,
    description: 'JWT signing secret',
    example: 'Generate with: openssl rand -hex 64'
  }
];

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  missingOptional: string[];
}

export function validateEnvironment(): ValidationResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  console.log(`🔧 [ENV VALIDATION] Validating environment for: ${process.env.NODE_ENV || 'unknown'}`);

  for (const rule of VALIDATION_RULES) {
    const value = process.env[rule.key];
    const isEmpty = !value || value.trim() === '';

    // Check if required
    const isRequiredInThisEnv = rule.required || (rule.productionOnly && isProduction);

    if (isEmpty) {
      if (isRequiredInThisEnv) {
        missingRequired.push(rule.key);
        errors.push(`❌ Missing required environment variable: ${rule.key}`);
        errors.push(`   Description: ${rule.description}`);
        if (rule.example) {
          errors.push(`   Example: ${rule.example}`);
        }
        errors.push('');
      } else {
        missingOptional.push(rule.key);
        warnings.push(`⚠️  Optional environment variable not set: ${rule.key}`);
        warnings.push(`   Description: ${rule.description}`);
        if (rule.example) {
          warnings.push(`   Example: ${rule.example}`);
        }
        warnings.push('');
      }
      continue;
    }

    // Validate format if specified
    if (rule.format && !rule.format.test(value)) {
      errors.push(`❌ Invalid format for ${rule.key}: ${rule.description}`);
      if (rule.example) {
        errors.push(`   Expected format: ${rule.example}`);
      }
      errors.push('');
    }

    // Validate specific requirements
    if (rule.key === 'TALLY_API_KEY' && isProduction && value.length < 32) {
      warnings.push(`⚠️  ${rule.key} should be at least 32 characters for security`);
    }

    if (rule.key === 'JWT_SECRET' && value.length < 32) {
      warnings.push(`⚠️  ${rule.key} should be at least 32 characters for security`);
    }
  }

  // Production-specific checks
  if (isProduction) {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      errors.push('❌ NEXT_PUBLIC_APP_URL is required in production for CORS and security');
    }

    if (!process.env.TALLY_API_KEY) {
      warnings.push('⚠️  Consider setting TALLY_API_KEY for production API security');
    }

    // Check for development URLs in production
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
      errors.push('❌ Using localhost Supabase URL in production');
    }

    if (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
      errors.push('❌ Using localhost APP_URL in production');
    }
  }

  const isValid = errors.length === 0;

  if (isValid) {
    console.log('✅ [ENV VALIDATION] All required environment variables are valid');
  } else {
    console.error('❌ [ENV VALIDATION] Environment validation failed');
  }

  if (warnings.length > 0) {
    console.warn(`⚠️  [ENV VALIDATION] ${warnings.length} warnings found`);
  }

  return {
    isValid,
    errors,
    warnings,
    missingRequired,
    missingOptional
  };
}

export function validateEnvironmentOrExit(): void {
  const result = validateEnvironment();

  if (!result.isValid) {
    console.error('\n🚨 ENVIRONMENT VALIDATION FAILED 🚨\n');
    
    if (result.errors.length > 0) {
      console.error('ERRORS:');
      result.errors.forEach(error => console.error(error));
    }

    console.error('\n💡 NEXT STEPS:');
    console.error('1. Create .env.production file from .env.production.template');
    console.error('2. Fill in the required environment variables');
    console.error('3. Restart the application');
    console.error('\nFor help, see: PRODUCTION_DEPLOYMENT.md\n');

    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  ENVIRONMENT WARNINGS:\n');
    result.warnings.forEach(warning => console.warn(warning));
    console.warn('\nApplication will continue, but consider addressing these warnings for optimal security and functionality.\n');
  }
}

export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    hasSupabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasApiKey: !!process.env.TALLY_API_KEY,
    hasGoogleAuth: !!(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    hasN8nIntegration: !!process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK,
  };
}

// Auto-validate environment on import in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  validateEnvironmentOrExit();
}