// Design Tokens for Application UI
// Aligned to Ethos Design System (mirrors Tailwind ethos tokens)

// DEPRECATION: Color tokens in this file are legacy; prefer Tailwind Ethos classes (e.g., bg-ethos-purple, text-ethos-navy) as the single source of truth for colors.

export const designTokens = {
  colors: {
    primary: {
      50: '#F8F4FF',
      100: '#E8D5FF',
      500: '#7409C5', // Ethos purple (brand)
      600: '#8235F4', // Ethos purple light
      700: '#7471E0', // Gradient start
      800: '#5A0794', // Ethos purple dark
      900: '#030823', // Ethos navy (deep)
    },
    secondary: {
      500: '#030823', // Ethos navy
      600: '#0D1144', // Ethos navy light
      700: '#030823', // Ethos navy deep
    },
    accent: {
      500: '#10b981', // Extracted from Figma
      600: '#059669',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280', // Extracted from Figma
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827', // Extracted from Figma
    },
    success: {
      50: '#f0fdf4',
      500: '#10b981',
      600: '#059669',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
    }
  },
  typography: {
    fontFamily: {
      sans: ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'], // Standardized to Poppins
      mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px - Extracted from Figma
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px - Extracted from Figma
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
      '7xl': '4.5rem',  // 72px - Extracted from Figma (h1)
      '8xl': '6rem',    // 96px
      '9xl': '8rem',    // 128px
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    }
  },
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px - Extracted from Figma (xs)
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px - Extracted from Figma (sm)
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px - Extracted from Figma (md)
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px - Extracted from Figma (lg)
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px - Extracted from Figma (xl)
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px - Extracted from Figma (2xl)
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem',      // 384px
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem',   // 6px - Extracted from Figma
    lg: '0.5rem',     // 8px - Extracted from Figma
    xl: '0.75rem',    // 12px - Extracted from Figma
    '2xl': '1rem',    // 16px - Extracted from Figma
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)', // Extracted from Figma
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)', // Extracted from Figma
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)', // Extracted from Figma
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)', // Extracted from Figma
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  zIndex: {
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    auto: 'auto',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modal: '1040',
    popover: '1050',
    tooltip: '1060',
  }
};

// Helper function to get design token values
export const getDesignToken = (category: keyof typeof designTokens, key: string): unknown => {
  const categoryTokens = designTokens[category] as unknown;
  if (typeof categoryTokens === 'object' && categoryTokens !== null) {
    return (categoryTokens as Record<string, unknown>)[key];
  }
  return undefined;
};

// CSS Custom Properties for use in CSS
export const cssCustomProperties = `
  :root {
    /* Colors - Ethos Design System */
    --color-primary-50: ${designTokens.colors.primary[50]};
    --color-primary-500: ${designTokens.colors.primary[500]};
    --color-primary-600: ${designTokens.colors.primary[600]};
    --color-primary-700: ${designTokens.colors.primary[700]};

    --color-secondary-500: ${designTokens.colors.secondary[500]};
    --color-secondary-600: ${designTokens.colors.secondary[600]};

    --color-accent-500: ${designTokens.colors.accent[500]};
    --color-accent-600: ${designTokens.colors.accent[600]};

    --color-gray-50: ${designTokens.colors.gray[50]};
    --color-gray-100: ${designTokens.colors.gray[100]};
    --color-gray-500: ${designTokens.colors.gray[500]};
    --color-gray-600: ${designTokens.colors.gray[600]};
    --color-gray-700: ${designTokens.colors.gray[700]};
    --color-gray-900: ${designTokens.colors.gray[900]};

    /* Typography - Extracted from Figma */
    --font-family-sans: ${designTokens.typography.fontFamily.sans.join(', ')};
    --font-size-base: ${designTokens.typography.fontSize.base};
    --font-size-lg: ${designTokens.typography.fontSize.lg};
    --font-size-xl: ${designTokens.typography.fontSize.xl};
    --font-size-2xl: ${designTokens.typography.fontSize['2xl']};
    --font-size-3xl: ${designTokens.typography.fontSize['3xl']};
    --font-size-4xl: ${designTokens.typography.fontSize['4xl']};
    --font-size-5xl: ${designTokens.typography.fontSize['5xl']};
    --font-size-6xl: ${designTokens.typography.fontSize['6xl']};
    --font-size-7xl: ${designTokens.typography.fontSize['7xl']};

    /* Spacing - Extracted from Figma */
    --spacing-1: ${designTokens.spacing[1]};
    --spacing-2: ${designTokens.spacing[2]};
    --spacing-4: ${designTokens.spacing[4]};
    --spacing-6: ${designTokens.spacing[6]};
    --spacing-8: ${designTokens.spacing[8]};
    --spacing-12: ${designTokens.spacing[12]};
    --spacing-16: ${designTokens.spacing[16]};
    --spacing-20: ${designTokens.spacing[20]};
    --spacing-24: ${designTokens.spacing[24]};
    --spacing-32: ${designTokens.spacing[32]};

    /* Border Radius - Extracted from Figma */
    --radius-sm: ${designTokens.borderRadius.sm};
    --radius-md: ${designTokens.borderRadius.md};
    --radius-lg: ${designTokens.borderRadius.lg};
    --radius-xl: ${designTokens.borderRadius.xl};
    --radius-2xl: ${designTokens.borderRadius['2xl']};

    /* Shadows - Extracted from Figma */
    --shadow-sm: ${designTokens.shadows.sm};
    --shadow-md: ${designTokens.shadows.md};
    --shadow-lg: ${designTokens.shadows.lg};
    --shadow-xl: ${designTokens.shadows.xl};
    --shadow-2xl: ${designTokens.shadows['2xl']};
  }
`;
