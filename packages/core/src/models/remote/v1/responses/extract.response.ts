/**
 * API v1 Extract Response Models
 * Raw response data structures (inside the wrapper)
 */

import { MediaFileType } from '../../constants';

/**
 * Extract response data
 * Can be either YouTube or Direct platform data
 */
export type ExtractResponseData = YouTubeExtractData | DirectExtractData;

/**
 * YouTube extract data (2-step conversion required)
 */
export interface YouTubeExtractData {
  vid: string;
  title: string;
  author: string;
  thumbnail: string;
  vduration: string;
  convert_links: {
    video: YouTubeConvertFormat[];
    audio: YouTubeConvertFormat[];
  };
}

export interface YouTubeConvertFormat {
  key: string; // Conversion key for /convert endpoint
  quality: string;
  format?: string;
  size?: string;
  q_text?: string | null;
}

/**
 * Direct platform extract data (TikTok, Facebook, Instagram, Twitter)
 */
export interface DirectExtractData {
  title: string;
  author: {
    username?: string;
    name?: string;
  };
  thumbnail: string;
  duration: string | null;
  extractor: string; // Platform name
  links: {
    video: DirectFormat[] | Record<string, DirectFormat>;
    audio: DirectFormat[] | Record<string, DirectFormat>;
  };
  gallery?: GalleryData;
}

export interface DirectFormat {
  url: string; // Direct download URL (may be encrypted)
  quality: string;
  format?: string;
  size?: string;
  q_text?: string | null;
}

/**
 * Gallery data (Instagram carousels)
 */
export interface GalleryData {
  items: GalleryItem[];
}

export interface GalleryItem {
  id: string;
  ftype: MediaFileType; // 'Image' | 'Video'
  thumb: string;
  label?: string;
  resources: {
    fsize: string; // Resolution e.g., "1080x1920"
    src: string; // Resource URL
    q_text?: string | null;
  }[];
}
