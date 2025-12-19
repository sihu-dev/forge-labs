/**
 * HEPHAITOS - No-Code Strategy Builder
 * L3 (Tissues) - Builder Components Export
 */

// Types
export type {
  BlockType,
  BlockCategory,
  BlockPort,
  BlockParam,
  BlockDefinition,
  StrategyNode,
  StrategyEdge,
  Strategy,
  CanvasState,
  BlockCategoryConfig,
  Signal,
  BacktestPreview,
} from './types';

// Block Definitions
export { blockCategories, getBlockById } from './block-definitions';
export type { BlockCategoryConfig as BlockCategoryDefinition } from './types';

// Components
export { BlockPalette } from './BlockPalette';
export type { BlockPaletteProps } from './BlockPalette';

export { BuilderCanvas } from './BuilderCanvas';
export type { BuilderCanvasProps } from './BuilderCanvas';

export { SettingsPanel } from './SettingsPanel';
export type { SettingsPanelProps } from './SettingsPanel';

export { StrategyBuilder } from './StrategyBuilder';
export type { StrategyBuilderProps } from './StrategyBuilder';

// Default export: Main component
export { StrategyBuilder as default } from './StrategyBuilder';
