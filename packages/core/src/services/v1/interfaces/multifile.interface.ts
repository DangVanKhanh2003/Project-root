/**
 * Multifile Download Service Interface (V1)
 * Manages multifile download sessions
 */

export interface StartMultifileRequest {
  urls: string[];
}

export interface IMultifileService {
  startMultifileSession(params: StartMultifileRequest): Promise<any>;
}
