/**
 * Production Monitoring Configuration
 * Defines monitoring thresholds, alerts, and performance targets
 */

export interface MonitoringConfig {
  performance: {
    apiResponseTime: {
      warning: number;
      critical: number;
    };
    bundleSize: {
      warning: number;
      critical: number;
    };
    errorRate: {
      warning: number;
      critical: number;
    };
    coreWebVitals: {
      lcp: { good: number; poor: number };
      fid: { good: number; poor: number };
      cls: { good: number; poor: number };
    };
  };
  alerts: {
    enabled: boolean;
    channels: string[];
    thresholds: {
      errorSpike: number;
      performanceDegradation: number;
      uptimeThreshold: number;
    };
  };
  sampling: {
    errorSampling: number;
    performanceSampling: number;
    userActionSampling: number;
  };
}

// Production monitoring configuration
export const PRODUCTION_MONITORING_CONFIG: MonitoringConfig = {
  performance: {
    apiResponseTime: {
      warning: 200,  // 200ms
      critical: 500  // 500ms
    },
    bundleSize: {
      warning: 500 * 1024,    // 500KB
      critical: 1024 * 1024   // 1MB
    },
    errorRate: {
      warning: 0.01,  // 1%
      critical: 0.05  // 5%
    },
    coreWebVitals: {
      lcp: { good: 2500, poor: 4000 },  // Largest Contentful Paint (ms)
      fid: { good: 100, poor: 300 },    // First Input Delay (ms)
      cls: { good: 0.1, poor: 0.25 }    // Cumulative Layout Shift
    }
  },
  alerts: {
    enabled: true,
    channels: ['email', 'slack', 'firebase'],
    thresholds: {
      errorSpike: 10,        // 10 errors in 5 minutes
      performanceDegradation: 0.2,  // 20% performance drop
      uptimeThreshold: 0.999  // 99.9% uptime
    }
  },
  sampling: {
    errorSampling: 1.0,      // 100% error sampling
    performanceSampling: 0.1, // 10% performance sampling
    userActionSampling: 0.05  // 5% user action sampling
  }
};

// Staging monitoring configuration (more verbose)
export const STAGING_MONITORING_CONFIG: MonitoringConfig = {
  performance: {
    apiResponseTime: {
      warning: 300,
      critical: 1000
    },
    bundleSize: {
      warning: 1024 * 1024,   // 1MB
      critical: 2048 * 1024   // 2MB
    },
    errorRate: {
      warning: 0.05,  // 5%
      critical: 0.1   // 10%
    },
    coreWebVitals: {
      lcp: { good: 3000, poor: 5000 },
      fid: { good: 200, poor: 500 },
      cls: { good: 0.15, poor: 0.3 }
    }
  },
  alerts: {
    enabled: true,
    channels: ['console', 'firebase'],
    thresholds: {
      errorSpike: 5,
      performanceDegradation: 0.3,
      uptimeThreshold: 0.95
    }
  },
  sampling: {
    errorSampling: 1.0,
    performanceSampling: 0.5,
    userActionSampling: 0.2
  }
};

// Development monitoring configuration (minimal)
export const DEVELOPMENT_MONITORING_CONFIG: MonitoringConfig = {
  performance: {
    apiResponseTime: {
      warning: 1000,
      critical: 5000
    },
    bundleSize: {
      warning: 5 * 1024 * 1024,   // 5MB
      critical: 10 * 1024 * 1024  // 10MB
    },
    errorRate: {
      warning: 0.1,   // 10%
      critical: 0.5   // 50%
    },
    coreWebVitals: {
      lcp: { good: 5000, poor: 10000 },
      fid: { good: 500, poor: 1000 },
      cls: { good: 0.3, poor: 0.5 }
    }
  },
  alerts: {
    enabled: false,
    channels: ['console'],
    thresholds: {
      errorSpike: 20,
      performanceDegradation: 0.5,
      uptimeThreshold: 0.8
    }
  },
  sampling: {
    errorSampling: 1.0,
    performanceSampling: 1.0,
    userActionSampling: 1.0
  }
};

// Get monitoring config based on environment
export function getMonitoringConfig(): MonitoringConfig {
  const environment = process.env.NODE_ENV || 'development';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  if (environment === 'production' || hostname.includes('rag-prompt-library.web.app')) {
    return PRODUCTION_MONITORING_CONFIG;
  } else if (environment === 'staging' || hostname.includes('staging')) {
    return STAGING_MONITORING_CONFIG;
  } else {
    return DEVELOPMENT_MONITORING_CONFIG;
  }
}

// Performance targets for validation
export const PERFORMANCE_TARGETS = {
  // Bundle size targets
  bundleSize: {
    initial: 500 * 1024,      // 500KB initial bundle
    total: 2 * 1024 * 1024,   // 2MB total assets
    gzipped: 200 * 1024       // 200KB gzipped
  },

  // API performance targets
  api: {
    averageResponseTime: 100,  // 100ms average
    p95ResponseTime: 200,      // 200ms P95
    p99ResponseTime: 500,      // 500ms P99
    successRate: 99.9,         // 99.9% success rate
    errorRate: 0.1             // 0.1% error rate
  },

  // Core Web Vitals targets
  webVitals: {
    lcp: 2500,    // Largest Contentful Paint < 2.5s
    fid: 100,     // First Input Delay < 100ms
    cls: 0.1,     // Cumulative Layout Shift < 0.1
    fcp: 1800,    // First Contentful Paint < 1.8s
    ttfb: 600     // Time to First Byte < 600ms
  },

  // User experience targets
  userExperience: {
    pageLoadTime: 3000,       // Page load < 3s
    timeToInteractive: 5000,  // TTI < 5s
    bounceRate: 0.3,          // Bounce rate < 30%
    sessionDuration: 300      // Session > 5 minutes
  },

  // System reliability targets
  reliability: {
    uptime: 99.9,             // 99.9% uptime
    mttr: 300,                // Mean Time to Recovery < 5 minutes
    mtbf: 86400,              // Mean Time Between Failures > 24 hours
    availability: 99.95       // 99.95% availability
  }
};

// Alert severity levels
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Alert types
export enum AlertType {
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  ERROR_SPIKE = 'error_spike',
  API_FAILURE = 'api_failure',
  BUNDLE_SIZE_EXCEEDED = 'bundle_size_exceeded',
  CORE_WEB_VITALS_POOR = 'core_web_vitals_poor',
  UPTIME_THRESHOLD = 'uptime_threshold',
  SECURITY_INCIDENT = 'security_incident'
}

// Alert configuration
export interface AlertConfig {
  type: AlertType;
  severity: AlertSeverity;
  threshold: number;
  duration: number;  // Duration in seconds before triggering
  cooldown: number;  // Cooldown period in seconds
  enabled: boolean;
}

// Production alert configurations
export const PRODUCTION_ALERTS: AlertConfig[] = [
  {
    type: AlertType.PERFORMANCE_DEGRADATION,
    severity: AlertSeverity.WARNING,
    threshold: 0.2,  // 20% degradation
    duration: 300,   // 5 minutes
    cooldown: 900,   // 15 minutes
    enabled: true
  },
  {
    type: AlertType.ERROR_SPIKE,
    severity: AlertSeverity.ERROR,
    threshold: 10,   // 10 errors
    duration: 300,   // 5 minutes
    cooldown: 600,   // 10 minutes
    enabled: true
  },
  {
    type: AlertType.API_FAILURE,
    severity: AlertSeverity.CRITICAL,
    threshold: 0.05, // 5% failure rate
    duration: 60,    // 1 minute
    cooldown: 300,   // 5 minutes
    enabled: true
  },
  {
    type: AlertType.CORE_WEB_VITALS_POOR,
    severity: AlertSeverity.WARNING,
    threshold: 0.25, // 25% of users experiencing poor vitals
    duration: 600,   // 10 minutes
    cooldown: 1800,  // 30 minutes
    enabled: true
  }
];

// Export current monitoring configuration
export const currentMonitoringConfig = getMonitoringConfig();
