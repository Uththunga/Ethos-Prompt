/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  // darkMode removed - using light mode only
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  prefix: '', // Add zen-home prefix setting
  safelist: [
    // CRITICAL: Only include classes that are:
    // 1. Generated dynamically at runtime (e.g., from database/API)
    // 2. Constructed with template literals that Tailwind can't detect
    // 3. Used in external libraries not scanned by content paths

    // Dynamic grid columns (if generated programmatically)
    // Remove if all uses are static in JSX
    {
      pattern: /grid-cols-(1|2|3|4)/,
      variants: ['sm', 'md', 'lg', 'xl'],
    },

    // Chat message classes (if color is dynamic)
    'chat-message-user-text',
    'chat-message-assistant-text',

    // Note: All other classes removed as they should be auto-detected by Tailwind
    // in the content scan. If build shows missing classes, re-add specific ones.
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    screens: {
      xs: '375px',
      ...defaultTheme.screens,
      '3xl': '1920px',
    },
    extend: {
      // Clean color system - zen-home style with CSS variables
      colors: {
        // shadcn/ui color system (CSS variables) - PRIMARY SYSTEM
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: '#ffffff',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },

        // zen-home ethos brand colors - DIRECT VALUES for utility classes
        ethos: {
          purple: '#7409C5',
          'purple-light': '#8235F4',
          'purple-gradient-start': '#7471E0',
          'purple-gradient-end': '#EA73D4',
          navy: '#030823',
          'navy-light': '#0D1144',
          gray: '#484848',
          'gray-light': '#717493',
          'gray-lighter': '#9E9898',
          light: '#F3F3F3',
          offwhite: '#E8E8E8',
          // Additional colors from arbitrary values
          'almost-white': '#FEFEFE',
          'very-light': '#FBF9F9',
          'light-gray': '#E9EBEB',
          text: '#313131',
          // Gradient colors as individual entries
          'gradient-purple-start': '#7A71DF',
          'gradient-purple-mid': '#6D6AED',
          'gradient-purple-end': '#7900E3',
          'gradient-dark': '#442785',
          // Prompt guide accent colors
          'accent-orange': '#E16D00',
          'accent-green': '#399703',
          'accent-teal': '#008A9D',
          'accent-pink': '#D50072',
        },

        // zen-home ethos color classes for utility usage (text-*, bg-*, border-*)
        'ethos-purple': '#7409C5',
        'ethos-purple-light': '#8235F4',
        'ethos-purple-gradient-start': '#7471E0',
        'ethos-purple-gradient-end': '#EA73D4',
        'ethos-navy': '#030823',
        'ethos-navy-light': '#0D1144',
        'ethos-gray': '#484848',
        'ethos-gray-light': '#717493',
        'ethos-gray-lighter': '#9E9898',
        'ethos-light': '#F3F3F3',
        'ethos-offwhite': '#E8E8E8',
        'ethos-almost-white': '#FEFEFE',
        'ethos-very-light': '#FBF9F9',
        'ethos-light-gray': '#E9EBEB',
        'ethos-text': '#313131',
        'ethos-gradient-purple-start': '#7A71DF',
        'ethos-gradient-purple-mid': '#6D6AED',
        'ethos-gradient-purple-end': '#7900E3',
        'ethos-gradient-dark': '#442785',
        'ethos-accent-orange': '#E16D00',
        'ethos-accent-green': '#399703',
        'ethos-accent-teal': '#008A9D',
        'ethos-accent-pink': '#D50072',

        // Keep some RAG colors for compatibility
        gradient: {
          start: '#7471E0',
          end: '#EA73D4',
        },
        text: {
          primary: '#0D1144',
          secondary: '#717493',
          tertiary: '#4B5563',
        },
      },

      // Modern font families - Poppins only (standardized)
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'sans-serif'],
        poppins: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'sans-serif'],
      },

      // Enhanced Typography Scale - Inspired by Augment Code
      fontSize: {
        // Display sizes for hero sections and large headings
        'display-2xl': [
          'clamp(2.5rem, 5vw, 4.5rem)',
          { lineHeight: '1.05', letterSpacing: '-0.045em', fontWeight: '500' },
        ],
        'display-xl': [
          'clamp(2rem, 4vw, 3.75rem)',
          { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '500' },
        ],
        'display-lg': [
          'clamp(1.75rem, 3.5vw, 3rem)',
          { lineHeight: '1.1', letterSpacing: '-0.035em', fontWeight: '500' },
        ],
        'display-md': [
          'clamp(1.5rem, 3vw, 2.25rem)',
          { lineHeight: '1.2', letterSpacing: '-0.03em', fontWeight: '500' },
        ],
        'display-sm': [
          'clamp(1.25rem, 2.5vw, 1.875rem)',
          { lineHeight: '1.3', letterSpacing: '-0.025em', fontWeight: '500' },
        ],
        'display-xs': [
          'clamp(1.125rem, 2vw, 1.5rem)',
          { lineHeight: '1.4', letterSpacing: '-0.02em', fontWeight: '500' },
        ],

        // Semantic heading sizes (responsive)
        h1: [
          'clamp(1.5rem, 4vw, 2.25rem)',
          { lineHeight: '1.2', letterSpacing: '-0.03em', fontWeight: '600' },
        ],
        h2: [
          'clamp(1.25rem, 3vw, 1.875rem)',
          { lineHeight: '1.3', letterSpacing: '-0.025em', fontWeight: '600' },
        ],
        h3: [
          'clamp(1.125rem, 2.5vw, 1.5rem)',
          { lineHeight: '1.4', letterSpacing: '-0.02em', fontWeight: '600' },
        ],
        h4: [
          'clamp(1rem, 2vw, 1.25rem)',
          { lineHeight: '1.5', letterSpacing: '-0.015em', fontWeight: '500' },
        ],
        h5: ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.01em', fontWeight: '500' }],
        h6: ['1rem', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '500' }],

        // Body text sizes (optimized for readability)
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.01em', fontWeight: '400' }],
        body: ['1rem', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em', fontWeight: '400' }],

        // Interactive element sizes
        'button-lg': [
          '1.125rem',
          { lineHeight: '1.5', letterSpacing: '-0.01em', fontWeight: '500' },
        ],
        button: ['1rem', { lineHeight: '1.5', letterSpacing: '-0.01em', fontWeight: '500' }],
        'button-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '500' }],

        // Standard text sizes (maintained for compatibility)
        xs: ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        sm: ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        base: ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
        lg: ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.015em' }],
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.025em' }],
        '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.03em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.035em' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.04em' }],
        '7xl': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.045em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
        '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
      },

      // Add zen-home line heights
      lineHeight: {
        tight: '1.1',
        snug: '1.2',
        relaxed: '1.4',
        loose: '1.6',
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      // Enhanced Spacing System - 8px base unit
      spacing: {
        // Fractional spacing (sub-8px)
        0.5: '0.125rem', // 2px
        1.5: '0.375rem', // 6px
        2.5: '0.625rem', // 10px
        3.5: '0.875rem', // 14px

        // Standard 8px-based spacing
        4.5: '1.125rem', // 18px
        5.5: '1.375rem', // 22px
        6.5: '1.625rem', // 26px
        7.5: '1.875rem', // 30px

        // Extended spacing scale
        13: '3.25rem', // 52px
        15: '3.75rem', // 60px
        17: '4.25rem', // 68px
        18: '4.5rem', // 72px
        19: '4.75rem', // 76px
        21: '5.25rem', // 84px
        22: '5.5rem', // 88px
        26: '6.5rem', // 104px
        30: '7.5rem', // 120px
        34: '8.5rem', // 136px
        38: '9.5rem', // 152px

        // Layout-specific spacing
        sidebar: '280px', // Sidebar width
        'sidebar-collapsed': '64px', // Collapsed sidebar width
        header: '64px', // Header height
      },

      // MERGED: Border radius from both projects
      borderRadius: {
        lg: 'var(--radius)', // zen-home CSS variable
        md: 'calc(var(--radius) - 2px)', // zen-home CSS variable
        sm: 'calc(var(--radius) - 4px)', // zen-home CSS variable
        '4xl': '2rem', // RAG
        '5xl': '2.5rem', // RAG
      },

      // Box Shadow - Enhanced Button Shadow System
      boxShadow: {
        card: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.025)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

        // Enhanced Button Shadow System - Organized by variant and state
        // Base button shadows
        button: '0 4px 6px -1px rgba(116, 9, 197, 0.2), 0 2px 4px -1px rgba(116, 9, 197, 0.06)',
        'button-hover':
          '0 10px 15px -3px rgba(116, 9, 197, 0.3), 0 4px 6px -2px rgba(116, 9, 197, 0.1)',

        // Size-specific shadows
        'button-sm':
          '0 2px 4px -1px rgba(116, 9, 197, 0.15), 0 1px 2px -1px rgba(116, 9, 197, 0.05)',
        'button-lg':
          '0 6px 12px -2px rgba(116, 9, 197, 0.25), 0 3px 6px -2px rgba(116, 9, 197, 0.08)',

        // Variant-specific shadows
        'button-cta':
          '0 12px 24px -4px rgba(116, 9, 197, 0.4), 0 6px 12px -4px rgba(116, 9, 197, 0.15)',
        'button-cta-hover':
          '0 20px 40px -8px rgba(116, 9, 197, 0.5), 0 10px 20px -6px rgba(116, 9, 197, 0.2)',
        'button-outline':
          '0 2px 8px -2px rgba(116, 9, 197, 0.1), 0 1px 4px -1px rgba(116, 9, 197, 0.05)',
        'button-outline-hover':
          '0 4px 12px -2px rgba(116, 9, 197, 0.2), 0 2px 6px -1px rgba(116, 9, 197, 0.1)',
        'button-secondary':
          '0 2px 4px -1px rgba(107, 114, 128, 0.15), 0 1px 2px -1px rgba(107, 114, 128, 0.05)',
        'button-secondary-hover':
          '0 4px 8px -2px rgba(107, 114, 128, 0.2), 0 2px 4px -1px rgba(107, 114, 128, 0.08)',
        'button-destructive':
          '0 4px 8px -2px rgba(239, 68, 68, 0.3), 0 2px 4px -1px rgba(239, 68, 68, 0.1)',
        'button-destructive-hover':
          '0 6px 12px -2px rgba(239, 68, 68, 0.4), 0 3px 6px -2px rgba(239, 68, 68, 0.15)',
        'button-ghost':
          '0 2px 4px -1px rgba(116, 9, 197, 0.08), 0 1px 2px -1px rgba(116, 9, 197, 0.03)',
        'button-ghost-hover':
          '0 4px 8px -2px rgba(116, 9, 197, 0.1), 0 2px 4px -1px rgba(116, 9, 197, 0.05)',

        // Focus shadows for accessibility
        'button-focus':
          '0 0 0 2px hsl(var(--background)), 0 0 0 4px #7409C5, 0 4px 8px rgba(116, 9, 197, 0.2)',
        'button-focus-destructive':
          '0 0 0 2px hsl(var(--background)), 0 0 0 4px #ef4444, 0 4px 8px rgba(239, 68, 68, 0.2)',
        'button-focus-secondary':
          '0 0 0 2px hsl(var(--background)), 0 0 0 4px #6b7280, 0 4px 8px rgba(107, 114, 128, 0.2)',
      },

      // Gradients
      backgroundImage: {
        'primary-gradient': 'linear-gradient(90deg, #7471E0 0%, #EA73D4 100%)',
        'text-gradient': 'linear-gradient(90deg, #0D1144 0%, #717493 100%)',
        'card-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)',
      },

      // MERGED: Animations from both projects + Enhanced Button Animations
      animation: {
        // Keep existing RAG animations
        shimmer: 'shimmer 2s linear infinite',
        wave: 'wave 1.5s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        // Add zen-home animations
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // Enhanced Button Animations
        'button-pulse': 'button-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'button-bounce': 'button-bounce 1s ease-in-out',
        'button-glow': 'button-glow 2s ease-in-out infinite alternate',
      },

      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        wave: {
          '0%, 60%, 100%': { transform: 'initial' },
          '30%': { transform: 'translateY(-15px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeInUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeInDown: {
          '0%': { transform: 'translateY(-30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // Add zen-home keyframes
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Enhanced Button Keyframes
        'button-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'button-bounce': {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '40%, 43%': { transform: 'translate3d(0, -8px, 0)' },
          '70%': { transform: 'translate3d(0, -4px, 0)' },
          '90%': { transform: 'translate3d(0, -2px, 0)' },
        },
        'button-glow': {
          '0%': { boxShadow: '0 0 5px rgba(116, 9, 197, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(116, 9, 197, 0.4)' },
        },
      },

      // Enhanced Transition Properties - Optimized for Button Performance
      transitionProperty: {
        transform: 'transform',
        opacity: 'opacity',
        colors: 'background-color, border-color, color, fill, stroke',
        shadow: 'box-shadow',
        // Button-specific transition properties for optimal performance
        button: 'transform, box-shadow, filter, background-color, border-color',
        'button-fast': 'transform, background-color, border-color',
        'button-shadow': 'box-shadow, filter',
        'button-all': 'all',
      },

      // Enhanced Transition Timing - Button-specific easing functions
      transitionTimingFunction: {
        'button-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'button-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'button-smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'button-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'button-out-back': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },

      // Enhanced Transition Duration - Responsive timing
      transitionDuration: {
        50: '50ms',
        100: '100ms',
        150: '150ms',
        250: '250ms',
        350: '350ms',
        // Button-specific durations
        'button-fast': '150ms',
        'button-normal': '200ms',
        'button-slow': '300ms',
        'button-mobile': '150ms',
        'button-desktop': '200ms',
      },

      // Filter Utilities for Button Effects - Organized by effect type
      filter: {
        // Brightness effects
        'brightness-102': 'brightness(1.02)',
        'brightness-105': 'brightness(1.05)',
        'brightness-110': 'brightness(1.10)',
        'brightness-115': 'brightness(1.15)',
        'brightness-95': 'brightness(0.95)',
        'brightness-90': 'brightness(0.90)',
        'brightness-85': 'brightness(0.85)',

        // Saturation effects
        'saturate-105': 'saturate(1.05)',
        'saturate-110': 'saturate(1.10)',
        'saturate-115': 'saturate(1.15)',
        'saturate-120': 'saturate(1.20)',
        'saturate-75': 'saturate(0.75)',
        'saturate-50': 'saturate(0.50)',

        // Combined effects for button states
        'button-hover': 'brightness(1.10) saturate(1.10)',
        'button-active': 'brightness(0.95) saturate(1.05)',
        'button-disabled': 'brightness(0.75) saturate(0.50)',
      },

      // Button-specific backdrop blur utilities
      backdropBlur: {
        button: '4px',
        'button-sm': '2px',
        'button-lg': '6px',
      },

      // Button Design Token System - Centralized configuration
      button: {
        // Base button configuration
        base: {
          borderRadius: 'calc(var(--radius) - 2px)',
          fontWeight: '500',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          letterSpacing: '-0.01em',
        },

        // Size tokens
        sizes: {
          sm: {
            height: '2.25rem', // 36px
            paddingX: '0.75rem', // 12px
            paddingY: '0.5rem', // 8px
            fontSize: '0.875rem', // 14px
          },
          default: {
            height: '2.75rem', // 44px
            paddingX: '1rem', // 16px
            paddingY: '0.625rem', // 10px
            fontSize: '0.875rem', // 14px
          },
          lg: {
            height: '3.25rem', // 52px
            paddingX: '2rem', // 32px
            paddingY: '0.75rem', // 12px
            fontSize: '1rem', // 16px
          },
          icon: {
            height: '2.75rem', // 44px
            width: '2.75rem', // 44px
            padding: '0.625rem', // 10px
          },
        },

        // Animation tokens
        animations: {
          duration: {
            fast: '150ms',
            normal: '200ms',
            slow: '300ms',
          },
          easing: {
            default: 'cubic-bezier(0.4, 0, 0.2, 1)',
            bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          },
          transforms: {
            lift: 'translateY(-0.125rem)', // -2px
            liftLarge: 'translateY(-0.25rem)', // -4px
            scale: 'scale(1.02)',
            scaleActive: 'scale(0.98)',
          },
        },

        // Color tokens (references to existing ethos colors)
        colors: {
          primary: '#7409C5',
          primaryLight: '#8235F4',
          secondary: '#6b7280',
          destructive: '#ef4444',
          success: '#10b981',
          warning: '#f59e0b',
        },
      },

      // Z-index
      zIndex: {
        1: '1',
        2: '2',
        3: '3',
        4: '4',
        5: '5',
        max: '9999',
      },
    },
  },

  // Variants
  variants: {
    extend: {
      opacity: ['disabled'],
      scale: ['group-hover'],
      translate: ['group-hover'],
      backgroundColor: ['active', 'group-hover'],
      textColor: ['active', 'group-hover'],
      borderColor: ['active', 'group-hover'],
      boxShadow: ['active', 'group-hover'],
    },
  },

  // Core Plugins
  corePlugins: {
    container: false, // Disable default container
    // Disable unused features for better performance
    backdropOpacity: false,
    backdropSaturate: false,
    backdropSepia: false,
  },

  // Plugins
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio'),
    require('tailwindcss-animate'), // Add zen-home plugin
  ],
};
