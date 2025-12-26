/**
 * StrategyFactory - Factory for creating conversion strategies
 *
 * Phase 3A Integration: Uses strategies from @downloader/core with adapters.
 * Strategies receive injected dependencies via adapters.
 */

import type { IConversionStrategy } from '@downloader/core/conversion';
import {
  StaticDirectStrategy,
  IOSRamStrategy,
  PollingStrategy,
  OtherStreamStrategy,
  RouteType,
  type StrategyContext
} from '@downloader/core/conversion';
import { CoreStateAdapter, CorePollingAdapter } from '../../../../../../adapters';

// Create singleton adapters (shared across all strategies)
const stateAdapter = new CoreStateAdapter();
const pollingAdapter = new CorePollingAdapter();

/**
 * Create strategy based on routing decision
 *
 * Uses strategies from @downloader/core with DI adapters.
 */
export function createStrategy(context: StrategyContext): IConversionStrategy {
  const { routeType } = context.routing;

  switch (routeType) {
    case RouteType.STATIC_DIRECT:
      return new StaticDirectStrategy(context, stateAdapter);

    case RouteType.IOS_RAM:
      return new IOSRamStrategy(context, stateAdapter);

    case RouteType.IOS_POLLING:
    case RouteType.WINDOWS_MP4_POLLING:
      return new PollingStrategy(context, stateAdapter, pollingAdapter);

    case RouteType.OTHER_STREAM:
      return new OtherStreamStrategy(context, stateAdapter);

    default:
      // Fallback to static direct
      return new StaticDirectStrategy(context, stateAdapter);
  }
}

/**
 * Get strategy name for a route type (for logging)
 */
export function getStrategyName(routeType: RouteType): string {
  const names: Record<RouteType, string> = {
    [RouteType.STATIC_DIRECT]: 'StaticDirectStrategy',
    [RouteType.IOS_RAM]: 'IOSRamStrategy',
    [RouteType.IOS_POLLING]: 'PollingStrategy',
    [RouteType.WINDOWS_MP4_POLLING]: 'PollingStrategy',
    [RouteType.OTHER_STREAM]: 'OtherStreamStrategy'
  };
  return names[routeType] || 'UnknownStrategy';
}
