/**
 * FORGE LABS UI
 * Supabase-inspired UI Component Library + Catalyst UI Kit
 *
 * 나노팩터 계층 구조:
 * - L0 (Atoms): Design Tokens
 * - L1 (Molecules): Utility Functions
 * - L2 (Cells): Atom Components
 * - L3 (Tissues): Fragment Components
 * - Catalyst: Tailwind Plus UI Components (Headless UI + Tailwind v4)
 */

// L0: Design Tokens
export * from './tokens';

// L1: Utilities
export * from './lib';

// L2: Atom Components
export * from './atoms';

// L3: Fragment Components
export * from './fragments';

// Catalyst UI Kit (Tailwind Plus) - exported as namespace to avoid conflicts
export * as Catalyst from './catalyst';

// Version
export const UI_VERSION = '1.0.0';
