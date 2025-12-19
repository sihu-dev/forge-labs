/**
 * HEPHAITOS - No-Code Strategy Builder Types
 * L0 (Atoms) - Type definitions
 */

// Block Types
export type BlockType = 'indicator' | 'condition' | 'logic' | 'action' | 'risk';

export type BlockCategory =
  | 'indicators'
  | 'conditions'
  | 'logic'
  | 'actions'
  | 'risk';

// Block Input/Output
export interface BlockPort {
  id: string;
  name: string;
  type: 'number' | 'boolean' | 'string';
  label?: string;
}

// Block Parameter
export interface BlockParam {
  name: string;
  label: string;
  type: 'number' | 'select' | 'text' | 'boolean';
  default: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
}

// Block Definition
export interface BlockDefinition {
  id: string;
  type: BlockType;
  category: BlockCategory;
  label: string;
  icon: string;
  color: string;
  inputs: BlockPort[];
  outputs: BlockPort[];
  params: BlockParam[];
  description?: string;
}

// Node Instance (placed on canvas)
export interface StrategyNode {
  id: string;
  blockId: string;
  position: { x: number; y: number };
  params: Record<string, unknown>;
  status: 'idle' | 'running' | 'success' | 'error';
  currentValue?: number | boolean;
  error?: string;
}

// Edge (connection between nodes)
export interface StrategyEdge {
  id: string;
  source: { nodeId: string; portId: string };
  target: { nodeId: string; portId: string };
}

// Strategy
export interface Strategy {
  id: string;
  name: string;
  description?: string;
  assetType: 'domestic_stock' | 'foreign_stock' | 'crypto';
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';
  positionSize: number;
  nodes: StrategyNode[];
  edges: StrategyEdge[];
  createdAt: string;
  updatedAt: string;
}

// Canvas State
export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  selectedNodeId: string | null;
  isConnecting: boolean;
  connectingFrom: { nodeId: string; portId: string } | null;
}

// Block Category Config
export interface BlockCategoryConfig {
  id: BlockCategory;
  label: string;
  icon: string;
  color: string;
  blocks: BlockDefinition[];
}

// Signal
export interface Signal {
  timestamp: string;
  type: 'buy' | 'sell' | 'hold';
  price: number;
  reason?: string;
}

// Backtest Result Preview
export interface BacktestPreview {
  totalReturn: number;
  winRate: number;
  trades: number;
  lastSignal?: Signal;
}
