export type MediaType = 'image' | 'video';

export type AuthorType = 'ყველა' | 'მაკო' | 'გეწო' | 'ქეთა';

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  author: 'მაკო' | 'გეწო' | 'ქეთა';
  albumId: string | null;
  timestamp: number;
  isTemp?: boolean;
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
