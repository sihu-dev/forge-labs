/**
 * @forge-labs/vibe-engine
 * ADE Vision Suite Core Engine
 */

// Core
export { VisionPipeline } from './core/vision-pipeline';
export type {
  PipelineInput,
  PipelineStage,
  PipelineEvent,
  PipelineOptions,
  PipelineResult,
} from './core/vision-pipeline';

// Matchers
export { CatalystMapper, catalystMapper, CATALYST_COMPONENTS } from './matchers/catalyst-mapper';
export type { CatalystComponentInfo } from './matchers/catalyst-mapper';

export { IconMatcher, iconMatcher, ICON_DATABASE } from './matchers/icon-matcher';
export type { IconInfo, IconCategory } from './matchers/icon-matcher';

// Extractors
export { TokenExtractor, tokenExtractor } from './extractors/token-extractor';

// Generators
export { ReactGenerator, reactGenerator } from './generators/react-generator';

// Re-export types
export type * from '@forge-labs/vibe-types';
