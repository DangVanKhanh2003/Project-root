/**
 * Response Helper Utilities
 * Standalone functions for backward compatibility
 *
 * NOTE: These are deprecated - new services should extend BaseService instead
 */

export type JwtCallback = (jwt: string) => void;

export function unwrapSimpleResponse<T>(response: unknown): T {
  const data = response as any;
  return (data?.data || data) as T;
}

export function unwrapNestedResponse<T>(response: unknown): T {
  let data = response as any;

  if (data && data.success && data.data) {
    data = data.data;
  }

  if (data && data.status === 'ok' && data.data) {
    data = data.data;
  }

  return data as T;
}

export function createJwtHandler(
  callback?: JwtCallback,
  stateRef?: { current: string | null }
): (response: any) => void {
  return (response: any): void => {
    if (response?.jwt) {
      if (stateRef) {
        stateRef.current = response.jwt;
      }
      if (callback) {
        callback(response.jwt);
      }
    }
  };
}
