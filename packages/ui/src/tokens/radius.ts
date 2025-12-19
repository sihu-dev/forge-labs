/**
 * FORGE LABS Design Tokens - Border Radius
 * L0 (Atoms) - Supabase-inspired radius scale
 */

/**
 * Border Radius Scale
 */
export const radius = {
  none: '0',
  xs: '0.125rem',   // 2px
  sm: '0.25rem',    // 4px
  DEFAULT: '0.375rem', // 6px (Supabase default)
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  full: '9999px',
} as const;

/**
 * Component-Specific Radius
 */
export const componentRadius = {
  // Buttons
  button: radius.DEFAULT,     // 6px
  buttonPill: radius.full,

  // Inputs
  input: radius.DEFAULT,      // 6px

  // Cards
  card: radius.lg,            // 12px
  cardInner: radius.md,       // 8px

  // Modals & Dialogs
  dialog: radius.xl,          // 16px

  // Badges & Tags
  badge: radius.sm,           // 4px
  badgePill: radius.full,

  // Avatars
  avatar: radius.full,
  avatarSquare: radius.md,    // 8px

  // Tooltips & Popovers
  tooltip: radius.DEFAULT,    // 6px
  popover: radius.lg,         // 12px

  // Dropdowns
  dropdown: radius.lg,        // 12px
  dropdownItem: radius.sm,    // 4px

  // Switches & Toggles
  switch: radius.full,
  checkbox: radius.xs,        // 2px

  // Skeleton
  skeleton: radius.md,        // 8px
} as const;

export type RadiusKey = keyof typeof radius;
export type ComponentRadiusKey = keyof typeof componentRadius;
