/**
 * Tally CMS Integration - Form Validation
 * 
 * Frontend validation utilities for contact forms integrating with Tally
 * Photography Management System.
 * 
 * Version: 1.0
 * Last Updated: 2025-08-15
 */

// Field validation configuration
const TALLY_VALIDATION_CONFIG = {
  sessionTypes: [
    "Editorial Portrait",
    "Branding Session",
    "Headshots",
    "Creative Portrait",
    "Wedding",
    "Event",
    "Portraiture Session",
    "Commercial Session",
    "Fashion Session"
  ],
  
  budgetRanges: [
    "$500 - $1,000",
    "$1,000 - $2,500",
    "$2,500 - $5,000",
    "$5,000 - $7,500",
    "Let's discuss"
  ],
  
  timelines: [
    "Within 2 weeks",
    "Within 1 month",
    "1-3 months",
    "3-6 months",
    "6+ months",
    "Just exploring"
  ],
  
  leadSources: [
    "Website",
    "Instagram",
    "Referral",
    "Email",
    "Phone Call",
    "Wedding Wire",
    "Manual Entry",
    "Other"
  ],
  
  maxLengths: {
    first_name: 100,
    last_name: 100,
    email: 255,
    phone: 20,
    message: 1000
  }
};

/**
 * Validate individual fields
 */
const TallyValidators = {
  
  /**
   * Validate required string field
   */
  validateRequired(value, fieldName) {
    if (!value || typeof value !== 'string' || !value.trim()) {
      return `${fieldName} is required`;
    }
    return null;
  },
  
  /**
   * Validate email format
   */
  validateEmail(email) {
    if (!email || !email.trim()) {
      return 'Email is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address';
    }
    
    if (email.length > TALLY_VALIDATION_CONFIG.maxLengths.email) {
      return `Email must be less than ${TALLY_VALIDATION_CONFIG.maxLengths.email} characters`;
    }
    
    return null;
  },
  
  /**
   * Validate phone number (optional)
   */
  validatePhone(phone) {
    if (!phone || !phone.trim()) {
      return null; // Phone is optional
    }
    
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return 'Please enter a valid phone number';
    }
    
    if (phone.length > TALLY_VALIDATION_CONFIG.maxLengths.phone) {
      return `Phone number must be less than ${TALLY_VALIDATION_CONFIG.maxLengths.phone} characters`;
    }
    
    return null;
  },
  
  /**
   * Validate session type (optional)
   */
  validateSessionType(sessionType) {
    if (!sessionType || !sessionType.trim()) {
      return null; // Session type is optional
    }
    
    if (!TALLY_VALIDATION_CONFIG.sessionTypes.includes(sessionType)) {
      return 'Please select a valid session type';
    }
    
    return null;
  },
  
  /**
   * Validate budget range (optional)
   */
  validateBudgetRange(budgetRange) {
    if (!budgetRange || !budgetRange.trim()) {
      return null; // Budget range is optional
    }
    
    if (!TALLY_VALIDATION_CONFIG.budgetRanges.includes(budgetRange)) {
      return 'Please select a valid budget range';
    }
    
    return null;
  },
  
  /**
   * Validate timeline (optional)
   */
  validateTimeline(timeline) {
    if (!timeline || !timeline.trim()) {
      return null; // Timeline is optional
    }
    
    if (!TALLY_VALIDATION_CONFIG.timelines.includes(timeline)) {
      return 'Please select a valid timeline';
    }
    
    return null;
  },
  
  /**
   * Validate preferred session date (optional)
   */
  validateSessionDate(dateString) {
    if (!dateString || !dateString.trim()) {
      return null; // Date is optional
    }
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date';
    }
    
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return 'Session date cannot be in the past';
    }
    
    // Check if date is too far in the future (2 years)
    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
    
    if (date > twoYearsFromNow) {
      return 'Session date cannot be more than 2 years in the future';
    }
    
    return null;
  },
  
  /**
   * Validate lead source (optional)
   */
  validateLeadSource(leadSource) {
    if (!leadSource || !leadSource.trim()) {
      return null; // Lead source is optional
    }
    
    if (!TALLY_VALIDATION_CONFIG.leadSources.includes(leadSource)) {
      return 'Please select a valid lead source';
    }
    
    return null;
  },
  
  /**
   * Validate message/notes (optional)
   */
  validateMessage(message) {
    if (!message || !message.trim()) {
      return null; // Message is optional
    }
    
    if (message.length > TALLY_VALIDATION_CONFIG.maxLengths.message) {
      return `Message must be less than ${TALLY_VALIDATION_CONFIG.maxLengths.message} characters`;
    }
    
    return null;
  }
};

/**
 * Validate complete form data
 */
function validateTallyContactForm(formData) {
  const errors = {};
  
  // Validate required fields
  const firstNameError = TallyValidators.validateRequired(formData.first_name, 'First name');
  if (firstNameError) errors.first_name = firstNameError;
  
  const lastNameError = TallyValidators.validateRequired(formData.last_name, 'Last name');
  if (lastNameError) errors.last_name = lastNameError;
  
  const emailError = TallyValidators.validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  // Validate optional fields
  const phoneError = TallyValidators.validatePhone(formData.phone);
  if (phoneError) errors.phone = phoneError;
  
  const sessionTypeError = TallyValidators.validateSessionType(formData.session_type_interest);
  if (sessionTypeError) errors.session_type_interest = sessionTypeError;
  
  const budgetError = TallyValidators.validateBudgetRange(formData.budget_range);
  if (budgetError) errors.budget_range = budgetError;
  
  const timelineError = TallyValidators.validateTimeline(formData.preferred_timeline);
  if (timelineError) errors.preferred_timeline = timelineError;
  
  const dateError = TallyValidators.validateSessionDate(formData.preferred_session_date);
  if (dateError) errors.preferred_session_date = dateError;
  
  const leadSourceError = TallyValidators.validateLeadSource(formData.lead_source);
  if (leadSourceError) errors.lead_source = leadSourceError;
  
  const messageError = TallyValidators.validateMessage(formData.message);
  if (messageError) errors.message = messageError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors: errors
  };
}

/**
 * Format form data for Tally API
 */
function formatTallyFormData(formData) {
  return {
    first_name: formData.first_name?.trim() || '',
    last_name: formData.last_name?.trim() || '',
    email: formData.email?.trim() || '',
    phone: formData.phone?.trim() || null,
    session_type_interest: formData.session_type_interest?.trim() || null,
    budget_range: formData.budget_range?.trim() || null,
    preferred_timeline: formData.preferred_timeline?.trim() || null,
    preferred_time: formData.preferred_time?.trim() || null,
    preferred_session_date: formData.preferred_session_date?.trim() || null,
    lead_source: formData.lead_source?.trim() || 'Website',
    message: formData.message?.trim() || null
  };
}

/**
 * Display validation errors in the form
 */
function displayValidationErrors(errors) {
  // Clear previous errors
  const errorElements = document.querySelectorAll('.error-message');
  errorElements.forEach(el => el.remove());
  
  const fieldElements = document.querySelectorAll('.field-error');
  fieldElements.forEach(el => el.classList.remove('field-error'));
  
  // Display new errors
  Object.keys(errors).forEach(fieldName => {
    const field = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
    
    if (field) {
      // Add error class to field
      field.classList.add('field-error');
      
      // Create error message element
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = errors[fieldName];
      errorElement.style.color = '#e53e3e';
      errorElement.style.fontSize = '0.875rem';
      errorElement.style.marginTop = '0.25rem';
      
      // Insert error message after the field
      field.parentNode.insertBefore(errorElement, field.nextSibling);
    }
  });
}

/**
 * Real-time field validation
 */
function setupRealTimeValidation() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  const fields = form.querySelectorAll('input, select, textarea');
  
  fields.forEach(field => {
    field.addEventListener('blur', function() {
      const fieldName = this.name;
      const value = this.value;
      let error = null;
      
      // Validate based on field type
      switch (fieldName) {
        case 'first_name':
          error = TallyValidators.validateRequired(value, 'First name');
          break;
        case 'last_name':
          error = TallyValidators.validateRequired(value, 'Last name');
          break;
        case 'email':
          error = TallyValidators.validateEmail(value);
          break;
        case 'phone':
          error = TallyValidators.validatePhone(value);
          break;
        case 'session_type_interest':
          error = TallyValidators.validateSessionType(value);
          break;
        case 'budget_range':
          error = TallyValidators.validateBudgetRange(value);
          break;
        case 'preferred_timeline':
          error = TallyValidators.validateTimeline(value);
          break;
        case 'preferred_session_date':
          error = TallyValidators.validateSessionDate(value);
          break;
        case 'lead_source':
          error = TallyValidators.validateLeadSource(value);
          break;
        case 'message':
          error = TallyValidators.validateMessage(value);
          break;
      }
      
      // Clear previous error for this field
      const existingError = this.parentNode.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
      this.classList.remove('field-error');
      
      // Display error if present
      if (error) {
        this.classList.add('field-error');
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = error;
        errorElement.style.color = '#e53e3e';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '0.25rem';
        this.parentNode.insertBefore(errorElement, this.nextSibling);
      }
    });
  });
}

/**
 * Complete form submission handler
 */
function setupTallyFormSubmission() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    // Validate form
    const validation = validateTallyContactForm(data);
    
    if (!validation.isValid) {
      displayValidationErrors(validation.errors);
      return;
    }
    
    // Format data for API
    const tallyData = formatTallyFormData(data);
    
    // Submit to backend (which will forward to Tally)
    try {
      // Show loading state
      const submitButton = this.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
      
      // Submit to your CMS backend endpoint
      const response = await fetch('/api/contact-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tallyData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Show success message
        showSuccessMessage('Thank you for your inquiry! We\'ll be in touch soon to discuss your photography session.');
        this.reset();
      } else {
        showErrorMessage('Sorry, there was an issue submitting your inquiry. Please try again or contact us directly.');
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      showErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      // Reset button state
      const submitButton = this.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-success';
  alertDiv.style.cssText = `
    background-color: #48bb78;
    color: white;
    padding: 1rem;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
    font-weight: 500;
  `;
  alertDiv.textContent = message;
  
  const form = document.getElementById('contact-form');
  form.parentNode.insertBefore(alertDiv, form);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

/**
 * Show error message
 */
function showErrorMessage(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-error';
  alertDiv.style.cssText = `
    background-color: #e53e3e;
    color: white;
    padding: 1rem;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
    font-weight: 500;
  `;
  alertDiv.textContent = message;
  
  const form = document.getElementById('contact-form');
  form.parentNode.insertBefore(alertDiv, form);
  
  // Auto-remove after 7 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 7000);
}

/**
 * Character counter for message field
 */
function setupCharacterCounter() {
  const messageField = document.getElementById('message');
  if (!messageField) return;
  
  const maxLength = TALLY_VALIDATION_CONFIG.maxLengths.message;
  
  // Create counter element
  const counter = document.createElement('div');
  counter.className = 'character-counter';
  counter.style.cssText = `
    font-size: 0.75rem;
    color: #718096;
    text-align: right;
    margin-top: 0.25rem;
  `;
  
  messageField.parentNode.insertBefore(counter, messageField.nextSibling);
  
  // Update counter on input
  function updateCounter() {
    const remaining = maxLength - messageField.value.length;
    counter.textContent = `${remaining} characters remaining`;
    
    if (remaining < 0) {
      counter.style.color = '#e53e3e';
    } else if (remaining < 50) {
      counter.style.color = '#d69e2e';
    } else {
      counter.style.color = '#718096';
    }
  }
  
  messageField.addEventListener('input', updateCounter);
  updateCounter(); // Initial count
}

/**
 * Initialize all form enhancements
 */
function initializeTallyForm() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setupRealTimeValidation();
      setupTallyFormSubmission();
      setupCharacterCounter();
    });
  } else {
    setupRealTimeValidation();
    setupTallyFormSubmission();
    setupCharacterCounter();
  }
}

// Auto-initialize if script is loaded directly
if (typeof window !== 'undefined') {
  initializeTallyForm();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateTallyContactForm,
    formatTallyFormData,
    TallyValidators,
    TALLY_VALIDATION_CONFIG,
    setupRealTimeValidation,
    setupTallyFormSubmission,
    initializeTallyForm
  };
}