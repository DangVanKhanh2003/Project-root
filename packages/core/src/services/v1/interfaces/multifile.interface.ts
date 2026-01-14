/**
 * Multifile Service Interface (V1)
 */

import type {
  MultifileStartResponse,
  MultifileStatusResponse,
} from '../../../models/remote/v1/responses/multifile.response';
import type {
  MultifileNonEncodeStartRequest,
  MultifileStatusRequest,
} from '../../../models/remote/v1/requests/multifile.request';
import type { ProtectionPayload } from '../../types/protection.types';

/**
 * JWT save callback type
 */
export type JwtSaveCallback = (jwt: string) => void;

/**
 * Multifile service interface
 */
export interface IMultifileService {
  startMultifileSession(params: MultifileNonEncodeStartRequest, protectionPayload?: ProtectionPayload): Promise<MultifileStartResponse>;
  getMultifileStatus(params: MultifileStatusRequest): Promise<MultifileStatusResponse>;
}
