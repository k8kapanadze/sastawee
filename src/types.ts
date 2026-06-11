/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MediaType = 'image' | 'video';

export type AuthorType = 'ყველა' | 'მაკო' | 'გეწო' | 'ქეთა';

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string; // Original URL or base64 uncompressed raw data
  author: 'მაკო' | 'გეწო' | 'ქეთა';
  albumId: string | null;
  timestamp: number;
  isTemp?: boolean; // Flag for instant pre-rendering
}

export interface Album {
  id: string;
  name: string;
  timestamp?: number;
}

export type SectionType = 'gallery' | 'albums' | 'albumView';

export interface AppState {
  currentSection: SectionType;
  selectedAlbumId: string | null;
  selectedAuthorFilter: AuthorType;
  isAuthorized: boolean;
  selectMode: boolean;
  selectedMediaIds: string[];
  selectedAlbumIds: string[];
}
