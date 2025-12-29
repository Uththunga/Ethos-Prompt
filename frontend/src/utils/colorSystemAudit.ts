// EthosPrompt Design System Color Audit and Standardization

// Official EthosPrompt Color Palette
export const ETHOS_COLORS = {
  // Primary Colors
  purple: {
    50: '#f3e8ff',
    100: '#e9d5ff',
    200: '#d8b4fe',
    300: '#c084fc',
    400: '#a855f7',
    500: '#7409C5', // Primary purple
    600: '#6b21a8',
    700: '#581c87',
    800: '#4c1d95',
    900: '#3b0764'
  },
  navy: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0F1345' // Primary navy
  },
  // Supporting Colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280', // ethos-gray
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  // Status Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  }
} as const;

// CSS Custom Properties for consistent usage
export const CSS_VARIABLES = {
  '--ethos-purple': ETHOS_COLORS.purple[500],
  '--ethos-purple-light': ETHOS_COLORS.purple[100],
  '--ethos-purple-dark': ETHOS_COLORS.purple[700],
  '--ethos-navy': ETHOS_COLORS.navy[900],
  '--ethos-navy-light': ETHOS_COLORS.navy[100],
  '--ethos-gray': ETHOS_COLORS.gray[500],
  '--ethos-gray-light': ETHOS_COLORS.gray[100],
  '--ethos-gray-dark': ETHOS_COLORS.gray[700],
  '--ethos-success': ETHOS_COLORS.success[500],
  '--ethos-warning': ETHOS_COLORS.warning[500],
  '--ethos-error': ETHOS_COLORS.error[500]
} as const;

// Tailwind CSS class mappings
export const TAILWIND_CLASSES = {
  // Text Colors
  text: {
    primary: 'text-ethos-navy',
    secondary: 'text-ethos-gray',
    accent: 'text-ethos-purple',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    white: 'text-white'
  },
  // Background Colors
  bg: {
    primary: 'bg-ethos-purple',
    secondary: 'bg-ethos-navy',
    light: 'bg-gray-50',
    white: 'bg-white',
    success: 'bg-green-100',
    warning: 'bg-yellow-100',
    error: 'bg-red-100'
  },
  // Border Colors
  border: {
    primary: 'border-ethos-purple',
    secondary: 'border-ethos-navy',
    light: 'border-gray-200',
    gray: 'border-gray-300'
  },
  // Hover States
  hover: {
    primary: 'hover:bg-ethos-purple/90',
    secondary: 'hover:bg-ethos-navy/90',
    light: 'hover:bg-gray-100'
  }
} as const;

// Component-specific color schemes
export const COMPONENT_COLORS = {
  button: {
    primary: {
      bg: 'bg-ethos-purple',
      text: 'text-white',
      hover: 'hover:bg-ethos-purple/90',
      focus: 'focus:ring-ethos-purple'
    },
    secondary: {
      bg: 'bg-white',
      text: 'text-ethos-purple',
      border: 'border-ethos-purple',
      hover: 'hover:bg-ethos-purple hover:text-white',
      focus: 'focus:ring-ethos-purple'
    },
    navy: {
      bg: 'bg-ethos-navy',
      text: 'text-white',
      hover: 'hover:bg-ethos-navy/90',
      focus: 'focus:ring-ethos-navy'
    }
  },
  card: {
    default: {
      bg: 'bg-white',
      border: 'border-gray-200',
      shadow: 'shadow-sm',
      hover: 'hover:shadow-md'
    },
    highlighted: {
      bg: 'bg-ethos-purple/5',
      border: 'border-ethos-purple/20',
      shadow: 'shadow-sm',
      hover: 'hover:shadow-md'
    }
  },
  input: {
    default: {
      bg: 'bg-white',
      border: 'border-gray-300',
      text: 'text-ethos-navy',
      placeholder: 'placeholder-gray-500',
      focus: 'focus:ring-ethos-purple focus:border-ethos-purple'
    }
  },
  badge: {
    primary: {
      bg: 'bg-ethos-purple',
      text: 'text-white'
    },
    secondary: {
      bg: 'bg-gray-100',
      text: 'text-ethos-gray'
    },
    success: {
      bg: 'bg-green-100',
      text: 'text-green-800'
    },
    warning: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800'
    },
    error: {
      bg: 'bg-red-100',
      text: 'text-red-800'
    }
  }
} as const;

// Color audit functions
export const auditColorUsage = () => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for hardcoded colors in the DOM
  const elements = document.querySelectorAll('*');
  const hardcodedColors = new Set<string>();

  elements.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor;
    const color = computedStyle.color;
    const borderColor = computedStyle.borderColor;

    // Check for non-standard colors
    if (backgroundColor && !isStandardColor(backgroundColor)) {
      hardcodedColors.add(backgroundColor);
    }
    if (color && !isStandardColor(color)) {
      hardcodedColors.add(color);
    }
    if (borderColor && !isStandardColor(borderColor)) {
      hardcodedColors.add(borderColor);
    }
  });

  if (hardcodedColors.size > 0) {
    issues.push(`Found ${hardcodedColors.size} non-standard colors in use`);
    recommendations.push('Replace hardcoded colors with design system colors');
  }

  return { issues, recommendations, hardcodedColors: Array.from(hardcodedColors) };
};

// Check if a color is part of the standard palette
const isStandardColor = (color: string): boolean => {
  const standardColors = [
    'rgb(116, 9, 197)', // ethos-purple
    'rgb(15, 19, 69)',  // ethos-navy
    'rgb(107, 114, 128)', // ethos-gray
    'rgb(255, 255, 255)', // white
    'rgb(0, 0, 0)',     // black
    'rgba(0, 0, 0, 0)', // transparent
    'transparent'
  ];

  return standardColors.includes(color) || 
         color.includes('rgb(249, 250, 251)') || // gray-50
         color.includes('rgb(243, 244, 246)') || // gray-100
         color.includes('rgb(229, 231, 235)');   // gray-200
};

// Generate CSS custom properties
export const generateCSSVariables = (): string => {
  return Object.entries(CSS_VARIABLES)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
};

// Utility function to get consistent colors
export const getColor = (category: keyof typeof TAILWIND_CLASSES, variant: string): string => {
  const categoryColors = TAILWIND_CLASSES[category] as Record<string, string>;
  return categoryColors[variant] || '';
};

// Color contrast checker
export const checkColorContrast = (foreground: string, background: string): {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
} => {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd use a proper color contrast library
  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);
  
  const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                (Math.min(fgLuminance, bgLuminance) + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7
  };
};

// Simplified luminance calculation
const getLuminance = (color: string): number => {
  // This is a simplified version - in production, use a proper color library
  if (color === '#7409C5') return 0.1; // ethos-purple
  if (color === '#0F1345') return 0.05; // ethos-navy
  if (color === '#6b7280') return 0.3;  // ethos-gray
  if (color === '#ffffff') return 1;    // white
  if (color === '#000000') return 0;    // black
  return 0.5; // default
};

// Export standardized color utilities
export const colorUtils = {
  getColor,
  auditColorUsage,
  checkColorContrast,
  generateCSSVariables,
  ETHOS_COLORS,
  TAILWIND_CLASSES,
  COMPONENT_COLORS
};

// React hook for color system
export const useColorSystem = () => {
  const applyColorSystem = () => {
    // Apply CSS custom properties to root
    const root = document.documentElement;
    Object.entries(CSS_VARIABLES).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  };

  const auditColors = () => {
    return auditColorUsage();
  };

  return {
    applyColorSystem,
    auditColors,
    colors: ETHOS_COLORS,
    classes: TAILWIND_CLASSES,
    components: COMPONENT_COLORS
  };
};
