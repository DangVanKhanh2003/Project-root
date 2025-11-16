/**
 * Conversion Service Interface (V1)
 */

import type { TaskDto } from '../../../models/dto/conversion.dto';
import type { ConvertRequest, CheckTaskRequest } from '../../../models/remote/v1/requests/convert.request';
import type { ProtectionPayload } from '../../types/protection.types';

/**
 * JWT save callback type
 */
export type JwtSaveCallback = (jwt: string) => void;

/**
 * Conversion service interface
 */
export interface IConversionService {
  convert(params: ConvertRequest, protectionPayload?: ProtectionPayload): Promise<TaskDto>;
  checkTask(params: CheckTaskRequest): Promise<TaskDto>;
}
