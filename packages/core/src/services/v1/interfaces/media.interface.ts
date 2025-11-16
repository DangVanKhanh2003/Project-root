/**
 * Media Service Interface (V1)
 */

import type { MediaDto } from '../../../models/dto/media.dto';
import type { ExtractRequest, ExtractNonEncodePostRequest } from '../../../models/remote/v1/requests/extract.request';
import type { ProtectionPayload } from '../../types/protection.types';

/**
 * JWT save callback type
 */
export type JwtSaveCallback = (jwt: string) => void;

/**
 * Media service interface
 */
export interface IMediaService {
  extractMedia(params: ExtractRequest, protectionPayload?: ProtectionPayload): Promise<MediaDto>;
  extractMediaDirect(params: ExtractNonEncodePostRequest, protectionPayload?: ProtectionPayload): Promise<MediaDto>;
}
