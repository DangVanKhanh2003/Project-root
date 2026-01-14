/**
 * V1 Services
 * Service layer for API v1 endpoints
 */

// Interfaces
export type { IConversionService, JwtSaveCallback as ConversionJwtCallback } from './interfaces/conversion.interface';
export type { IDecryptService, JwtSaveCallback as DecryptJwtCallback } from './interfaces/decrypt.interface';
export type { IFeedbackService } from './interfaces/feedback.interface';
export type { IMediaService, JwtSaveCallback as MediaJwtCallback } from './interfaces/media.interface';
export type { IMultifileService, JwtSaveCallback as MultifileJwtCallback } from './interfaces/multifile.interface';
export type { IPlaylistService } from './interfaces/playlist.interface';
export type { ISearchService } from './interfaces/search.interface';

// Factory functions
export { createConversionService } from './implementations/conversion.service';
export { createDecryptService } from './implementations/decrypt.service';
export { createFeedbackService } from './implementations/feedback.service';
export { createMediaService } from './implementations/media.service';
export { createMultifileService } from './implementations/multifile.service';
export { createPlaylistService } from './implementations/playlist.service';
export { createSearchService } from './implementations/search.service';
