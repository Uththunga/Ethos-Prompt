/**
 * Security Utilities
 * Comprehensive security functions for the RAG Prompt Library frontend
 */

// Input Sanitization and Validation
export class SecurityUtils {

  // XSS Prevention
  static sanitizeHtml(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  static escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Input Validation
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Character variety checks
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Common password check
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
      score = 0;
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (score >= 5) strength = 'strong';
    else if (score >= 3) strength = 'medium';

    return {
      isValid: errors.length === 0,
      errors,
      strength
    };
  }

  static validatePromptContent(content: string): {
    isValid: boolean;
    errors: string[];
    sanitized: string;
  } {
    const errors: string[] = [];
    let sanitized = content;

    // Length validation
    if (content.length > 10000) {
      errors.push('Prompt content cannot exceed 10,000 characters');
    }

    // Check for potentially malicious patterns
    const maliciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ];

    maliciousPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        errors.push('Content contains potentially unsafe elements');
      }
    });

    // Sanitize content
    sanitized = this.escapeHtml(content);

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    };
  }

  // File Upload Security
  static validateFileUpload(file: File): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size cannot exceed 10MB');
    }

    // File type validation
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
      'application/json',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not supported. Allowed types: PDF, TXT, DOCX, MD, JSON, CSV');
    }

    // File name validation
    const fileName = file.name;
    if (fileName.length > 255) {
      errors.push('File name is too long');
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|com)$/i,
      /\.(js|vbs|jar|app)$/i,
      /\.(php|asp|jsp|cgi)$/i
    ];

    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(fileName)) {
        errors.push('File type is not allowed for security reasons');
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // CSRF Protection
  static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static validateCSRFToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) return false;
    if (token.length !== expectedToken.length) return false;

    // Constant-time comparison to prevent timing attacks
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
    }
    return result === 0;
  }

  // Content Security Policy
  static getCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.ragpromptlibrary.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }

  // Rate Limiting (Client-side tracking)
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      this.rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count++;
    return true;
  }

  // Secure Random Generation
  static generateSecureId(length: number = 16): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // URL Validation
  static validateURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Only allow HTTP and HTTPS protocols
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // API Key Validation
  static validateAPIKey(apiKey: string): boolean {
    // API key should be 32-64 characters, alphanumeric with some special chars
    const apiKeyRegex = /^[A-Za-z0-9_-]{32,64}$/;
    return apiKeyRegex.test(apiKey);
  }

  // Session Security
  static isSessionValid(sessionData: {
    expiresAt?: number | string | Date;
    userId?: string;
    lastActivity?: number | string | Date;
  }): boolean {
    if (!sessionData || !sessionData.expiresAt || !sessionData.userId) {
      return false;
    }

    const now = Date.now();
    return now < sessionData.expiresAt;
  }

  static generateSessionToken(): string {
    return this.generateSecureId(32);
  }

  // Data Encryption (for local storage)
  static async encryptData(data: string, key: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const keyBuffer = encoder.encode(key);

    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Import the key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  }

  static async decryptData(encryptedData: string, key: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const keyBuffer = encoder.encode(key);

      // Decode from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // Import the key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encrypted
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch {
      throw new Error('Failed to decrypt data');
    }
  }

  // Security Headers Validation
  static validateSecurityHeaders(response: Response): {
    isSecure: boolean;
    missingHeaders: string[];
  } {
    const requiredHeaders = [
      'strict-transport-security',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'content-security-policy'
    ];

    const missingHeaders: string[] = [];

    requiredHeaders.forEach(header => {
      if (!response.headers.get(header)) {
        missingHeaders.push(header);
      }
    });

    return {
      isSecure: missingHeaders.length === 0,
      missingHeaders
    };
  }

  // Audit Logging
  static logSecurityEvent(event: {
    type: 'authentication' | 'authorization' | 'data_access' | 'security_violation';
    action: string;
    userId?: string;
    details?: Record<string, unknown>;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): void {
    const logEntry = {
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: sessionStorage.getItem('sessionId')
    };

    // In a real application, this would send to a secure logging service
    console.log('Security Event:', logEntry);

    // For critical events, also store locally for immediate attention
    if (event.severity === 'critical') {
      const criticalEvents = JSON.parse(localStorage.getItem('criticalSecurityEvents') || '[]');
      criticalEvents.push(logEntry);
      localStorage.setItem('criticalSecurityEvents', JSON.stringify(criticalEvents));
    }
  }
}

export default SecurityUtils;
