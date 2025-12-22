/**
 * StrategyFactory - Factory for creating conversion strategies
 *
 * Selects and instantiates the correct strategy based on routing decision.
 * Simple factory - no dependencies injection, strategies call infrastructure directly.
 */

import type { IConversionStrategy, StrategyContext } from './IConversionStrategy';
import { StaticDirectStrategy } from './StaticDirectStrategy';
import { IOSRamStrategy } from './IOSRamStrategy';
import { PollingStrategy } from './PollingStrategy';
import { OtherStreamStrategy } from './OtherStreamStrategy';
import { RouteType } from '../../types';

/**
 * Create strategy based on routing decision
 */
export function createStrategy(context: StrategyContext): IConversionStrategy {
  const { routeType } = context.routing;

  switch (routeType) {
    case RouteType.STATIC_DIRECT:
      return new StaticDirectStrategy(context);

    case RouteType.IOS_RAM:
      return new IOSRamStrategy(context);

    case RouteType.IOS_POLLING:
    case RouteType.WINDOWS_MP4_POLLING:
      return new PollingStrategy(context);

    case RouteType.OTHER_STREAM:
      return new OtherStreamStrategy(context);

    default:
      // Fallback to static direct
      return new StaticDirectStrategy(context);
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
