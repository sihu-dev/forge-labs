/**
 * FORGE LABS UI - Tailwind CSS Configuration (Supabase 100% Match)
 * Complete design system with all advanced features
 */

import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  darkMode: ['class', '[data-theme*="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Gray scales (12-step)
        gray: {
          100: 'hsl(0, 0%, 8.6%)',
          200: 'hsl(0, 0%, 11%)',
          300: 'hsl(0, 0%, 13.7%)',
          400: 'hsl(0, 0%, 15.7%)',
          500: 'hsl(0, 0%, 18%)',
          600: 'hsl(0, 0%, 20.4%)',
          700: 'hsl(0, 0%, 24.3%)',
          800: 'hsl(0, 0%, 31.4%)',
          900: 'hsl(0, 0%, 43.9%)',
          1000: 'hsl(0, 0%, 49.4%)',
          1100: 'hsl(0, 0%, 62.7%)',
          1200: 'hsl(0, 0%, 92.9%)',
        },
        // Brand - Supabase Green
        brand: {
          200: 'hsl(162, 100%, 2%)',
          300: 'hsl(155, 100%, 8%)',
          400: 'hsl(155.5, 100%, 9.6%)',
          500: 'hsl(155, 100%, 19.2%)',
          600: 'hsl(155, 59.5%, 70%)',
          DEFAULT: 'hsl(153, 60.2%, 52.7%)',
          link: 'hsl(155, 100%, 38.6%)',
        },
        // Foreground
        foreground: {
          DEFAULT: 'hsl(0, 0%, 98%)',
          light: 'hsl(0, 0%, 70.6%)',
          lighter: 'hsl(0, 0%, 53.7%)',
          muted: 'hsl(0, 0%, 30.2%)',
          contrast: 'hsl(0, 0%, 8.6%)',
        },
        // Background
        background: {
          DEFAULT: 'hsl(0, 0%, 7.1%)',
          200: 'hsl(0, 0%, 9%)',
          selection: 'hsl(0, 0%, 19.2%)',
          control: 'hsl(0, 0%, 14.1%)',
          muted: 'hsl(0, 0%, 14.1%)',
        },
        surface: {
          75: 'hsl(0, 0%, 9%)',
          100: 'hsl(0, 0%, 12.2%)',
          200: 'hsl(0, 0%, 12.9%)',
          300: 'hsl(0, 0%, 16.1%)',
          400: 'hsl(0, 0%, 16.1%)',
        },
        // Border
        border: {
          DEFAULT: 'hsl(0, 0%, 18%)',
          muted: 'hsl(0, 0%, 14.1%)',
          secondary: 'hsl(0, 0%, 14.1%)',
          overlay: 'hsl(0, 0%, 20%)',
          control: 'hsl(0, 0%, 22.4%)',
          alternative: 'hsl(0, 0%, 26.7%)',
          strong: 'hsl(0, 0%, 21.2%)',
          stronger: 'hsl(0, 0%, 27.1%)',
        },
        // Destructive
        destructive: {
          200: 'hsl(11, 23.4%, 9.2%)',
          300: 'hsl(7.5, 51.3%, 15.3%)',
          400: 'hsl(6.7, 60%, 20.6%)',
          500: 'hsl(7.9, 71.6%, 29%)',
          600: 'hsl(9.7, 85.2%, 62.9%)',
          DEFAULT: 'hsl(10.2, 77.9%, 53.9%)',
        },
        // Warning
        warning: {
          200: 'hsl(36.6, 100%, 8%)',
          300: 'hsl(32.3, 100%, 10.2%)',
          400: 'hsl(33.2, 100%, 14.5%)',
          500: 'hsl(34.8, 90.9%, 21.6%)',
          600: 'hsl(38.9, 100%, 42.9%)',
          DEFAULT: 'hsl(38.9, 100%, 42.9%)',
        },
        // Hi/Lo contrast
        'hi-contrast': 'hsl(var(--foreground-default))',
        'lo-contrast': 'hsl(var(--background-alternative-default))',
      },
      fontFamily: {
        sans: 'var(--font-custom, Circular, custom-font, Helvetica Neue, Helvetica, Arial, sans-serif)',
        mono: 'var(--font-source-code-pro, Source Code Pro, Office Code Pro, Menlo, monospace)',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        grid: '13px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        panel: '6px',
      },
      padding: {
        content: '21px',
      },
      boxShadow: {
        'glow-sm': '0 0 10px hsla(153, 60%, 52.7%, 0.3)',
        'glow-md': '0 0 20px hsla(153, 60%, 52.7%, 0.4)',
        'glow-lg': '0 0 30px hsla(153, 60%, 52.7%, 0.5)',
        'inner-glow': 'inset 0 0 20px hsla(153, 60%, 52.7%, 0.1)',
        'border-glow': '0 0 0 1px hsla(153, 60%, 52.7%, 0.5), 0 0 20px -5px hsla(153, 60%, 52.7%, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        // Fade animations
        fadeIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        // Overlay animations
        overlayContentShow: {
          '0%': { opacity: '0', transform: 'translate(0%, -2%) scale(1)' },
          '100%': { opacity: '1', transform: 'translate(0%, 0%) scale(1)' },
        },
        overlayContentHide: {
          '0%': { opacity: '1', transform: 'translate(0%, 0%) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(0%, -2%) scale(1)' },
        },
        // Overlay background
        fadeInOverlayBg: {
          '0%': { opacity: '0' },
          '100%': { opacity: '0.75' },
        },
        fadeOutOverlayBg: {
          '0%': { opacity: '0.75' },
          '100%': { opacity: '0' },
        },
        // Accordion/Collapsible
        slideDown: {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
        },
        slideUp: {
          '0%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'collapsible-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: '0' },
        },
        // Panel slide
        panelSlideLeftOut: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        panelSlideLeftIn: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-100%)', opacity: '0' },
        },
        panelSlideRightOut: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        panelSlideRightIn: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        // Line loading
        lineLoading: {
          '0%': { marginLeft: '-10%', width: '80px' },
          '25%': { width: '240px' },
          '50%': { marginLeft: '100%', width: '80px' },
          '75%': { width: '240px' },
          '100%': { marginLeft: '-10%', width: '80px' },
        },
        // Flash code highlight
        'flash-code': {
          '0%': { backgroundColor: 'rgba(63, 207, 142, 0.1)' },
          '100%': { backgroundColor: 'transparent' },
        },
        // Shimmer
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        // Sway
        sway: {
          '0%, 100%': { transform: 'rotate(-10deg) scale(1.5) translateY(4rem)' },
          '50%': { transform: 'rotate(10deg) scale(1.5) translateY(2rem)' },
        },
        // Pulse glow
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px hsla(153, 60%, 52.7%, 0.3)' },
          '50%': { boxShadow: '0 0 20px hsla(153, 60%, 52.7%, 0.5)' },
        },
      },
      animation: {
        // Fade
        'fade-in': 'fadeIn 300ms both',
        'fade-out': 'fadeOut 300ms both',
        // Dropdown
        'dropdown-content-show': 'overlayContentShow 100ms cubic-bezier(0.16, 1, 0.3, 1)',
        'dropdown-content-hide': 'overlayContentHide 100ms cubic-bezier(0.16, 1, 0.3, 1)',
        // Overlay
        'overlay-show': 'overlayContentShow 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'overlay-hide': 'overlayContentHide 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-overlay-bg': 'fadeInOverlayBg 300ms',
        'fade-out-overlay-bg': 'fadeOutOverlayBg 300ms',
        // Slide
        'slide-down': 'slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1)',
        'slide-up': 'slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1)',
        'accordion-down': 'accordion-down 0.15s ease-out',
        'accordion-up': 'accordion-up 0.15s ease-out',
        'collapsible-down': 'collapsible-down 0.10s ease-out',
        'collapsible-up': 'collapsible-up 0.10s ease-out',
        // Panel
        'panel-slide-left-out': 'panelSlideLeftOut 200ms cubic-bezier(0.87, 0, 0.13, 1)',
        'panel-slide-left-in': 'panelSlideLeftIn 250ms cubic-bezier(0.87, 0, 0.13, 1)',
        'panel-slide-right-out': 'panelSlideRightOut 200ms cubic-bezier(0.87, 0, 0.13, 1)',
        'panel-slide-right-in': 'panelSlideRightIn 250ms cubic-bezier(0.87, 0, 0.13, 1)',
        // Line loading
        'line-loading': 'lineLoading 1.8s infinite',
        'line-loading-slower': 'lineLoading 2.3s infinite',
        // Flash
        'flash-code': 'flash-code 1s forwards',
        'flash-code-slow': 'flash-code 2s forwards',
        // Shimmer
        shimmer: 'shimmer 2s linear infinite',
        sway: 'sway 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      transformOrigin: {
        dropdown: 'var(--radix-dropdown-menu-content-transform-origin)',
        popover: 'var(--radix-popover-menu-content-transform-origin)',
      },
      width: {
        listbox: 'var(--width-listbox)',
      },
    },
  },
  plugins: [
    // Custom plugin for utilities and variants
    plugin(function ({ addUtilities, addVariant, matchUtilities, theme }) {
      // Data attribute variants (Supabase-style)
      addVariant('data-open', '&[data-state="open"]');
      addVariant('data-closed', '&[data-state="closed"]');
      addVariant('data-open-parent', '[data-state="open"] &');
      addVariant('data-closed-parent', '[data-state="closed"] &');
      addVariant('data-show', '&[data-state="show"]');
      addVariant('data-hide', '&[data-state="hide"]');
      addVariant('data-checked', '&[data-state="checked"]');
      addVariant('data-unchecked', '&[data-state="unchecked"]');
      addVariant('aria-expanded', '&[aria-expanded="true"]');
      addVariant('not-disabled', '&:not(:disabled)');

      // Custom utilities
      addUtilities({
        // No scrollbar
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        // Glass effects
        '.glass': {
          'backdrop-filter': 'blur(12px)',
          'background-color': 'hsla(0, 0%, 7%, 0.8)',
          'border': '1px solid hsla(0, 0%, 100%, 0.1)',
        },
        '.glass-subtle': {
          'backdrop-filter': 'blur(8px)',
          'background-color': 'hsla(0, 0%, 7%, 0.7)',
          'border': '1px solid hsla(0, 0%, 100%, 0.05)',
        },
        // Mask fadeout
        '.mask-fadeout-right': {
          '-webkit-mask-image': 'linear-gradient(to right, white 98%, transparent 100%)',
          'mask-image': 'linear-gradient(to right, white 98%, transparent 100%)',
        },
        '.mask-fadeout-left': {
          '-webkit-mask-image': 'linear-gradient(to left, white 98%, transparent 100%)',
          'mask-image': 'linear-gradient(to left, white 98%, transparent 100%)',
        },
        // Text gradient
        '.text-gradient-brand': {
          'background': 'linear-gradient(90deg, hsl(153, 60%, 52.7%) 0%, hsl(155, 100%, 70%) 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        // Line loading backgrounds
        '.line-loading-bg': {
          'background': 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(255,255,255,0.65) 50%, rgba(0,0,0,0) 100%)',
        },
        '.line-loading-bg-light': {
          'background': 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(33,33,33,0.65) 50%, rgba(0,0,0,0) 100%)',
        },
        // Number input hide arrows
        'input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button': {
          '-webkit-appearance': 'none',
          'margin': '0',
        },
      });

      // Highlight utilities (inset box-shadow)
      matchUtilities(
        {
          highlight: (value) => ({ boxShadow: `inset 0 1px 0 0 ${value}` }),
        },
        { values: theme('colors'), type: 'color' }
      );

      matchUtilities(
        {
          subhighlight: (value) => ({ boxShadow: `inset 0 -1px 0 0 ${value}` }),
        },
        { values: theme('colors'), type: 'color' }
      );

      // Grid pattern background
      matchUtilities(
        {
          'bg-grid': (value) => ({
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='${encodeURIComponent(value)}'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E")`,
          }),
        },
        { values: theme('colors'), type: 'color' }
      );
    }),
  ],
};

export default config;
