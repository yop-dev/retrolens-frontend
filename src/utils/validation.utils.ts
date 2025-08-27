import { VALIDATION_CONFIG } from '@/constants';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Email validation
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (!VALIDATION_CONFIG.EMAIL.PATTERN.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Password validation
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  const config = VALIDATION_CONFIG.PASSWORD;
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < config.MIN_LENGTH) {
    errors.push(`Password must be at least ${config.MIN_LENGTH} characters`);
  }
  
  if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (config.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (config.REQUIRE_SPECIAL_CHAR && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Username validation
 */
export const validateUsername = (username: string): ValidationResult => {
  const errors: string[] = [];
  const config = VALIDATION_CONFIG.USERNAME;
  
  if (!username) {
    errors.push('Username is required');
    return { isValid: false, errors };
  }
  
  if (username.length < config.MIN_LENGTH) {
    errors.push(`Username must be at least ${config.MIN_LENGTH} characters`);
  }
  
  if (username.length > config.MAX_LENGTH) {
    errors.push(`Username must be no more than ${config.MAX_LENGTH} characters`);
  }
  
  if (!config.PATTERN.test(username)) {
    errors.push('Username can only contain letters, numbers, hyphens, and underscores');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Bio validation
 */
export const validateBio = (bio: string): ValidationResult => {
  const errors: string[] = [];
  const config = VALIDATION_CONFIG.BIO;
  
  if (bio && bio.length > config.MAX_LENGTH) {
    errors.push(`Bio must be no more than ${config.MAX_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Discussion title validation
 */
export const validateDiscussionTitle = (title: string): ValidationResult => {
  const errors: string[] = [];
  const config = VALIDATION_CONFIG.DISCUSSION;
  
  if (!title) {
    errors.push('Title is required');
    return { isValid: false, errors };
  }
  
  if (title.length < config.TITLE_MIN_LENGTH) {
    errors.push(`Title must be at least ${config.TITLE_MIN_LENGTH} characters`);
  }
  
  if (title.length > config.TITLE_MAX_LENGTH) {
    errors.push(`Title must be no more than ${config.TITLE_MAX_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Discussion body validation
 */
export const validateDiscussionBody = (body: string): ValidationResult => {
  const errors: string[] = [];
  const config = VALIDATION_CONFIG.DISCUSSION;
  
  if (!body) {
    errors.push('Body is required');
    return { isValid: false, errors };
  }
  
  if (body.length < config.BODY_MIN_LENGTH) {
    errors.push(`Body must be at least ${config.BODY_MIN_LENGTH} characters`);
  }
  
  if (body.length > config.BODY_MAX_LENGTH) {
    errors.push(`Body must be no more than ${config.BODY_MAX_LENGTH} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * URL validation
 */
export const validateUrl = (url: string): ValidationResult => {
  const errors: string[] = [];
  
  if (url) {
    try {
      new URL(url);
    } catch {
      errors.push('Please enter a valid URL');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Required field validation
 */
export const validateRequired = (value: string | undefined | null, fieldName: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!value || value.trim() === '') {
    errors.push(`${fieldName} is required`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generic validation function that combines multiple validators
 */
export const validateField = (
  value: string,
  validators: Array<(value: string) => ValidationResult>
): ValidationResult => {
  const allErrors: string[] = [];
  let isValid = true;
  
  for (const validator of validators) {
    const result = validator(value);
    if (!result.isValid) {
      isValid = false;
      allErrors.push(...result.errors);
    }
  }
  
  return {
    isValid,
    errors: allErrors
  };
};
