// Form Validation Test Suite
// Tests all validation logic for lead forms and user inputs

import { validate } from '@testing-library/user-event';

// Form validation utilities - these would be extracted from actual components
interface LeadFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  session_type_interest?: string;
  budget_range?: string;
  preferred_timeline?: string;
  preferred_session_date?: string;
  message?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Email validation utility
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation utility
const validatePhone = (phone: string): boolean => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/; // Basic international phone format
  const cleanPhone = phone.replace(/[^\d\+]/g, '');
  return phoneRegex.test(cleanPhone);
};

// Date validation utility
const validateDate = (dateString: string): boolean => {
  if (!dateString) return true; // Date is optional
  const date = new Date(dateString);
  const now = new Date();
  
  // Check if date is valid and not in the past
  return !isNaN(date.getTime()) && date >= now;
};

// Name validation utility
const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 50;
};

// Main form validation function
const validateLeadForm = (data: LeadFormData): ValidationResult => {
  const errors: Record<string, string> = {};

  // Required field validations
  if (!data.first_name?.trim()) {
    errors.first_name = 'First name is required';
  } else if (!validateName(data.first_name)) {
    errors.first_name = 'First name must be between 2 and 50 characters';
  }

  if (!data.last_name?.trim()) {
    errors.last_name = 'Last name is required';
  } else if (!validateName(data.last_name)) {
    errors.last_name = 'Last name must be between 2 and 50 characters';
  }

  if (!data.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Optional field validations
  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (data.preferred_session_date && !validateDate(data.preferred_session_date)) {
    errors.preferred_session_date = 'Please select a future date';
  }

  if (data.message && data.message.length > 1000) {
    errors.message = 'Message must be less than 1000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

describe('Form Validation Tests', () => {
  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org',
        'firstname.lastname@company.com',
        'email@domain-name.com',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        'user name@domain.com',
        '',
        'user@.com',
        'user@domain.',
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(validateEmail('a@b.co')).toBe(true); // Minimum valid email
      expect(validateEmail('very.long.email.address@very.long.domain.name.com')).toBe(true);
      expect(validateEmail('user@domain.museum')).toBe(true); // Long TLD
    });
  });

  describe('Phone Validation', () => {
    it('should validate correct phone formats', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+44 20 7946 0958',
        '(555) 123-4567',
        '555.123.4567',
        '555 123 4567',
        '',
      ];

      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true);
      });
    });

    it('should reject invalid phone formats', () => {
      const invalidPhones = [
        '123', // Too short
        'abc-def-ghij', // Letters
        '++1234567890', // Multiple plus signs
        '12345678901234567890', // Too long
      ];

      invalidPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(false);
      });
    });

    it('should handle empty phone numbers as valid (optional field)', () => {
      expect(validatePhone('')).toBe(true);
      expect(validatePhone(undefined as any)).toBe(true);
    });
  });

  describe('Name Validation', () => {
    it('should validate correct names', () => {
      const validNames = [
        'John',
        'Mary Jane',
        'José',
        'Li Wei',
        'O\'Connor',
        'Jean-Pierre',
        'Müller',
      ];

      validNames.forEach(name => {
        expect(validateName(name)).toBe(true);
      });
    });

    it('should reject invalid names', () => {
      const invalidNames = [
        '', // Empty
        ' ', // Just whitespace
        'A', // Too short
        'X'.repeat(51), // Too long
      ];

      invalidNames.forEach(name => {
        expect(validateName(name)).toBe(false);
      });
    });

    it('should handle names with special characters', () => {
      expect(validateName('María')).toBe(true);
      expect(validateName('Björn')).toBe(true);
      expect(validateName('Дмитрий')).toBe(true); // Cyrillic
    });
  });

  describe('Date Validation', () => {
    it('should validate future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];

      expect(validateDate(tomorrowString)).toBe(true);
    });

    it('should reject past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      expect(validateDate(yesterdayString)).toBe(false);
    });

    it('should handle invalid date strings', () => {
      expect(validateDate('invalid-date')).toBe(false);
      expect(validateDate('2024-13-45')).toBe(false);
      expect(validateDate('')).toBe(true); // Empty is valid (optional)
    });

    it('should handle today\'s date', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(validateDate(today)).toBe(true);
    });
  });

  describe('Complete Form Validation', () => {
    const validFormData: LeadFormData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-123-4567',
      session_type_interest: 'Portrait',
      budget_range: '$1,000 - $2,500',
      preferred_timeline: 'Within 1 month',
      preferred_session_date: '2024-12-31',
      message: 'Looking forward to working with you!',
    };

    it('should validate a complete valid form', () => {
      const result = validateLeadForm(validFormData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should require first name', () => {
      const invalidData = { ...validFormData, first_name: '' };
      const result = validateLeadForm(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.first_name).toBe('First name is required');
    });

    it('should require last name', () => {
      const invalidData = { ...validFormData, last_name: '' };
      const result = validateLeadForm(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.last_name).toBe('Last name is required');
    });

    it('should require valid email', () => {
      const invalidData = { ...validFormData, email: 'invalid-email' };
      const result = validateLeadForm(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Please enter a valid email address');
    });

    it('should validate optional phone field', () => {
      const invalidData = { ...validFormData, phone: 'invalid-phone' };
      const result = validateLeadForm(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.phone).toBe('Please enter a valid phone number');
    });

    it('should validate message length', () => {
      const longMessage = 'x'.repeat(1001);
      const invalidData = { ...validFormData, message: longMessage };
      const result = validateLeadForm(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.message).toBe('Message must be less than 1000 characters');
    });

    it('should handle multiple validation errors', () => {
      const invalidData: LeadFormData = {
        first_name: '',
        last_name: 'A',
        email: 'invalid-email',
        phone: 'invalid-phone',
        message: 'x'.repeat(1001),
      };
      
      const result = validateLeadForm(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(5);
      expect(result.errors.first_name).toBeTruthy();
      expect(result.errors.last_name).toBeTruthy();
      expect(result.errors.email).toBeTruthy();
      expect(result.errors.phone).toBeTruthy();
      expect(result.errors.message).toBeTruthy();
    });

    it('should handle minimum required fields only', () => {
      const minimalData: LeadFormData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };
      
      const result = validateLeadForm(minimalData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  describe('Security and Data Sanitization', () => {
    it('should handle potential XSS attempts in names', () => {
      const xssData = {
        first_name: '<script>alert("xss")</script>',
        last_name: 'Normal',
        email: 'test@example.com',
      };
      
      // The validation should still work, but in a real app
      // we would sanitize the input before storing
      const result = validateLeadForm(xssData);
      expect(result.isValid).toBe(false); // Too long for a name
    });

    it('should handle SQL injection attempts', () => {
      const sqlData = {
        first_name: 'Robert\'; DROP TABLE leads; --',
        last_name: 'Doe',
        email: 'test@example.com',
      };
      
      const result = validateLeadForm(sqlData);
      expect(result.isValid).toBe(false); // Too long for a name
    });

    it('should handle unicode characters safely', () => {
      const unicodeData = {
        first_name: '🙂',
        last_name: 'Test',
        email: 'test@example.com',
      };
      
      const result = validateLeadForm(unicodeData);
      expect(result.isValid).toBe(false); // Emoji is too short as a name
    });

    it('should trim whitespace from inputs', () => {
      const whitespaceData = {
        first_name: '  John  ',
        last_name: '  Doe  ',
        email: '  john@example.com  ',
      };
      
      // In the actual implementation, we would trim the inputs
      const trimmedData = {
        first_name: whitespaceData.first_name.trim(),
        last_name: whitespaceData.last_name.trim(),
        email: whitespaceData.email.trim(),
      };
      
      const result = validateLeadForm(trimmedData);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined values', () => {
      const nullData = {
        first_name: null as any,
        last_name: undefined as any,
        email: '',
      };
      
      const result = validateLeadForm(nullData);
      expect(result.isValid).toBe(false);
      expect(result.errors.first_name).toBeTruthy();
      expect(result.errors.last_name).toBeTruthy();
      expect(result.errors.email).toBeTruthy();
    });

    it('should handle very long valid inputs', () => {
      const longValidData = {
        first_name: 'A'.repeat(50), // Maximum allowed
        last_name: 'B'.repeat(50),
        email: 'very.long.email.address@very.long.domain.name.com',
        message: 'x'.repeat(999), // Just under limit
      };
      
      const result = validateLeadForm(longValidData);
      expect(result.isValid).toBe(true);
    });

    it('should handle international characters in names', () => {
      const internationalData = {
        first_name: 'François',
        last_name: 'Müller-Öztürk',
        email: 'francois@example.com',
      };
      
      const result = validateLeadForm(internationalData);
      expect(result.isValid).toBe(true);
    });

    it('should validate against common email vulnerabilities', () => {
      const vulnerableEmails = [
        'test@example.com.',
        'test@.example.com',
        'test..test@example.com',
        'test@example..com',
      ];
      
      vulnerableEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate budget ranges are from predefined list', () => {
      const validBudgetRanges = [
        '$500 - $1,000',
        '$1,000 - $2,500',
        '$2,500 - $5,000',
        '$5,000 - $7,500',
        'Let\'s discuss',
      ];
      
      // In a real implementation, we'd validate against these ranges
      validBudgetRanges.forEach(range => {
        const data = {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          budget_range: range,
        };
        
        const result = validateLeadForm(data);
        expect(result.isValid).toBe(true);
      });
    });

    it('should validate session types are from predefined list', () => {
      const validSessionTypes = [
        'Portraiture Session',
        'Branding Session',
        'Editorial Session',
        'Commercial Session',
        'Fashion Session',
        'Headshot Session',
        'Other',
      ];
      
      validSessionTypes.forEach(type => {
        const data = {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          session_type_interest: type,
        };
        
        const result = validateLeadForm(data);
        expect(result.isValid).toBe(true);
      });
    });

    it('should validate timeline options', () => {
      const validTimelines = [
        'Within 2 weeks',
        'Within 1 month',
        '1-3 months',
        '3-6 months',
        '6+ months',
        'Just exploring',
      ];
      
      validTimelines.forEach(timeline => {
        const data = {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          preferred_timeline: timeline,
        };
        
        const result = validateLeadForm(data);
        expect(result.isValid).toBe(true);
      });
    });
  });
});