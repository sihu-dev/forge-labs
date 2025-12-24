/**
 * @forge/utils - CRM Conflict Resolver (L1 - Molecules)
 *
 * Resolves conflicts when syncing data between CRM platforms
 * Implements multiple resolution strategies
 */

import type { CRMTypes } from '@forge/types';

type ConflictResolutionStrategy = CRMTypes.ConflictResolutionStrategy;
type CRMPlatform = CRMTypes.CRMPlatform;

// ============================================
// Main Resolver
// ============================================

export interface ConflictContext {
  local: Record<string, unknown>;
  remote: Record<string, unknown>;
  strategy: ConflictResolutionStrategy;
  sourcePriority?: CRMPlatform[];
  localSource?: CRMPlatform;
  remoteSource?: CRMPlatform;
}

export interface ResolvedConflict {
  merged: Record<string, unknown>;
  conflictingFields: string[];
  resolution: 'auto' | 'manual_required';
  appliedStrategy: ConflictResolutionStrategy;
}

/**
 * Resolve conflict between local and remote entities
 */
export function resolveConflict(
  context: ConflictContext
): ResolvedConflict {
  const conflictingFields = detectConflictingFields(
    context.local,
    context.remote
  );

  if (conflictingFields.length === 0) {
    return {
      merged: { ...context.local, ...context.remote },
      conflictingFields: [],
      resolution: 'auto',
      appliedStrategy: context.strategy,
    };
  }

  switch (context.strategy) {
    case 'timestamp_based':
      return resolveByTimestamp(context, conflictingFields);

    case 'source_priority':
      return resolveBySourcePriority(context, conflictingFields);

    case 'field_merge':
      return resolveByFieldMerge(context, conflictingFields);

    case 'manual_review':
      return requireManualReview(context, conflictingFields);

    default:
      return resolveByTimestamp(context, conflictingFields);
  }
}

// ============================================
// Strategy Implementations
// ============================================

/**
 * Timestamp-based resolution (newest wins)
 */
function resolveByTimestamp(
  context: ConflictContext,
  conflictingFields: string[]
): ResolvedConflict {
  const localTimestamp = getTimestamp(context.local);
  const remoteTimestamp = getTimestamp(context.remote);

  const merged = { ...context.local };

  if (remoteTimestamp > localTimestamp) {
    // Remote is newer, apply all remote changes
    for (const field of conflictingFields) {
      merged[field] = context.remote[field];
    }
  }
  // else: local is newer or equal, keep local values

  return {
    merged,
    conflictingFields,
    resolution: 'auto',
    appliedStrategy: 'timestamp_based',
  };
}

/**
 * Source priority resolution (trusted source wins)
 */
function resolveBySourcePriority(
  context: ConflictContext,
  conflictingFields: string[]
): ResolvedConflict {
  if (
    !context.sourcePriority ||
    !context.localSource ||
    !context.remoteSource
  ) {
    // Fallback to timestamp if priority not configured
    return resolveByTimestamp(context, conflictingFields);
  }

  const localPriority = context.sourcePriority.indexOf(context.localSource);
  const remotePriority = context.sourcePriority.indexOf(context.remoteSource);

  const merged = { ...context.local };

  if (remotePriority < localPriority) {
    // Remote has higher priority (lower index)
    for (const field of conflictingFields) {
      merged[field] = context.remote[field];
    }
  }
  // else: local has higher priority, keep local values

  return {
    merged,
    conflictingFields,
    resolution: 'auto',
    appliedStrategy: 'source_priority',
  };
}

/**
 * Field-level merge resolution (smart merge)
 */
function resolveByFieldMerge(
  context: ConflictContext,
  conflictingFields: string[]
): ResolvedConflict {
  const merged = { ...context.local };

  for (const field of conflictingFields) {
    const localValue = context.local[field];
    const remoteValue = context.remote[field];

    // Apply field-specific merge logic
    merged[field] = mergeFieldValue(field, localValue, remoteValue);
  }

  return {
    merged,
    conflictingFields,
    resolution: 'auto',
    appliedStrategy: 'field_merge',
  };
}

/**
 * Require manual review
 */
function requireManualReview(
  context: ConflictContext,
  conflictingFields: string[]
): ResolvedConflict {
  return {
    merged: context.local, // Keep local until resolved
    conflictingFields,
    resolution: 'manual_required',
    appliedStrategy: 'manual_review',
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Detect fields that have conflicting values
 */
export function detectConflictingFields(
  local: Record<string, unknown>,
  remote: Record<string, unknown>
): string[] {
  const conflicts: string[] = [];

  const allFields = new Set([...Object.keys(local), ...Object.keys(remote)]);

  for (const field of allFields) {
    // Skip metadata fields
    if (METADATA_FIELDS.includes(field)) continue;

    const localValue = local[field];
    const remoteValue = remote[field];

    // Both exist and are different
    if (
      localValue !== undefined &&
      remoteValue !== undefined &&
      !areValuesEqual(localValue, remoteValue)
    ) {
      conflicts.push(field);
    }
  }

  return conflicts;
}

/**
 * Get timestamp from entity
 */
function getTimestamp(entity: Record<string, unknown>): Date {
  const updatedAt = entity.updated_at as string | undefined;
  return updatedAt ? new Date(updatedAt) : new Date(0);
}

/**
 * Check if two values are equal (deep comparison for objects)
 */
function areValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;

  if (typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  return false;
}

/**
 * Merge field value using field-specific logic
 */
function mergeFieldValue(
  field: string,
  local: unknown,
  remote: unknown
): unknown {
  // Email: prefer non-empty, newer value
  if (field === 'email') {
    return remote || local;
  }

  // Phone: prefer non-empty, newer value
  if (field === 'phone') {
    return remote || local;
  }

  // Name fields: prefer non-empty
  if (field === 'first_name' || field === 'last_name' || field === 'name') {
    return remote || local;
  }

  // Numeric fields: prefer higher value (lead score, employee count)
  if (
    field === 'lead_score' ||
    field === 'employee_count' ||
    field === 'annual_revenue'
  ) {
    if (typeof local === 'number' && typeof remote === 'number') {
      return Math.max(local, remote);
    }
    return remote || local;
  }

  // Notes/Description: append both
  if (field === 'description' || field === 'notes' || field === 'body') {
    if (typeof local === 'string' && typeof remote === 'string') {
      if (local === remote) return local;
      return `${local}\n\n---\n\n${remote}`;
    }
    return remote || local;
  }

  // Arrays: merge unique values
  if (Array.isArray(local) && Array.isArray(remote)) {
    return [...new Set([...local, ...remote])];
  }

  // Objects: deep merge
  if (
    typeof local === 'object' &&
    local !== null &&
    typeof remote === 'object' &&
    remote !== null
  ) {
    return { ...local, ...remote };
  }

  // Default: remote wins
  return remote !== undefined && remote !== null ? remote : local;
}

/**
 * Calculate field-level diff for audit trail
 */
export function calculateFieldDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, { before: unknown; after: unknown }> {
  const diff: Record<string, { before: unknown; after: unknown }> = {};

  const allFields = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const field of allFields) {
    if (METADATA_FIELDS.includes(field)) continue;

    const beforeValue = before[field];
    const afterValue = after[field];

    if (!areValuesEqual(beforeValue, afterValue)) {
      diff[field] = { before: beforeValue, after: afterValue };
    }
  }

  return diff;
}

/**
 * Metadata fields to skip in conflict detection
 */
const METADATA_FIELDS = [
  'id',
  'tenant_id',
  'created_at',
  'updated_at',
  'sync_status',
  'last_synced_at',
  'external_ids',
];

// ============================================
// Checksum Utilities
// ============================================

/**
 * Calculate entity checksum for drift detection
 */
export function calculateEntityChecksum(
  entity: Record<string, unknown>
): string {
  // Create deterministic JSON string (sorted keys)
  const normalized = normalizeForChecksum(entity);
  const jsonString = JSON.stringify(normalized, Object.keys(normalized).sort());

  // Simple hash function (for production, use crypto.createHash)
  return simpleHash(jsonString);
}

/**
 * Normalize entity for checksum calculation
 */
function normalizeForChecksum(
  entity: Record<string, unknown>
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(entity)) {
    // Skip metadata fields
    if (METADATA_FIELDS.includes(key)) continue;

    // Skip null/undefined
    if (value === null || value === undefined) continue;

    normalized[key] = value;
  }

  return normalized;
}

/**
 * Simple hash function (non-cryptographic)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Compare checksums to detect drift
 */
export function hasDataDrift(
  localChecksum: string,
  remoteChecksum: string
): boolean {
  return localChecksum !== remoteChecksum;
}
