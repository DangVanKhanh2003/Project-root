/**
 * Decrypt Service Interface (V1)
 * Decodes encrypted URLs from media extraction
 */

export interface DecryptRequest {
  encrypted_url: string;
}

export interface DecryptListRequest {
  encrypted_urls: string[];
}

export interface IDecryptService {
  decodeUrl(params: DecryptRequest): Promise<any>;
  decodeList(params: DecryptListRequest): Promise<any>;
}
