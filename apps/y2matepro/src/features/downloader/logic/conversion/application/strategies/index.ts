/**
 * Application Strategies - Barrel Export
 *
 * Strategy pattern implementations for conversion operations.
 * Each strategy handles a specific routing case.
 * Strategies call infrastructure directly (no adapters/ports).
 */

// Interfaces
export {
  type IConversionStrategy,
  type StrategyContext,
  type StrategyResult
} from './IConversionStrategy';

// Base class
export { BaseStrategy } from './BaseStrategy';

// Concrete strategies
export { StaticDirectStrategy } from './StaticDirectStrategy';
export { IOSRamStrategy } from './IOSRamStrategy';
export { PollingStrategy } from './PollingStrategy';
export { OtherStreamStrategy } from './OtherStreamStrategy';

// Factory
export { createStrategy, getStrategyName } from './StrategyFactory';
