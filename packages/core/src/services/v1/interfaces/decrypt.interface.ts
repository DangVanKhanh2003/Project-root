/**
 * Decrypt Service Interface (V1)
 */

import type { DecodeDto } from '../../../models/dto/decrypt.dto';
import type { DecryptListResponse } from '../../../models/remote/v1/responses/decrypt.response';
import type { DecryptRequest, DecryptListRequest } from '../../../models/remote/v1/requests/decrypt.request';
import type { ProtectionPayload } from '../../types/protection.types';

/**
 * JWT save callback type
 */
export type JwtSaveCallback = (jwt: string) => void;

/**
 * Decrypt service interface
 */
export interface IDecryptService {
  decodeUrl(params: DecryptRequest, protectionPayload?: ProtectionPayload): Promise<DecodeDto>;
  decodeList(params: DecryptListRequest, protectionPayload?: ProtectionPayload): Promise<DecryptListResponse>;
}
