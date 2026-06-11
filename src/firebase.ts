/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  writeBatch,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { MediaItem, Album } from './types';
import firebaseConfig from '../firebase-applet-config.json';

const APP_ID = 'aca827d1-0ec1-4bd2-a5c8-c03863f408a8';
const MEDIA_PATH = `artifacts/${APP_ID}/public/data/media`;
const ALBUMS_PATH = `artifacts/${APP_ID}/public/data/albums`;

// Check if firebase is properly configured in the applet config
export const isFirebaseEnabled = !!(
  firebaseConfig &&
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.trim().length > 0 &&
  firebaseConfig.projectId
);

let db: any = null;

if (isFirebaseEnabled) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log("Firebase initialized successfully with config.");
  } catch (err) {
    console.warn("Failed to initialize real Firebase, falling back to Local Mode:", err);
  }
} else {
  console.log("No Firebase configuration present. Running in High-Performance Local Mode (localStorage).");
}

// Ensure first-time pre-populating mock data in localStorage
const DEFAULT_ALBUMS: Album[] = [
  { id: 'album-1', name: 'საზაფხულო კოლექცია', timestamp: Date.now() - 10000000 },
  { id: 'album-2', name: 'პორტრეტების სერია', timestamp: Date.now() - 5000000 },
  { id: 'album-3', name: 'არქიტექტურა & ხაზები', timestamp: Date.now() - 2000000 }
];

const DEFAULT_MEDIA: MediaItem[] = [
  {
    id: 'media-1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    author: 'მაკო',
    albumId: 'album-2',
    timestamp: Date.now() - 9000000
  },
  {
    id: 'media-2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    author: 'გეწო',
    albumId: 'album-3',
    timestamp: Date.now() - 8000000
  },
  {
    id: 'media-3',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    author: 'ქეთა',
    albumId: null,
    timestamp: Date.now() - 7000000
  },
  {
    id: 'media-4',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    author: 'მაკო',
    albumId: 'album-1',
    timestamp: Date.now() - 6000000
  },
  {
    id: 'media-5',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    author: 'გეწო',
    albumId: null,
    timestamp: Date.now() - 5000000
  },
  {
    id: 'media-6',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80',
    author: 'ქეთა',
    albumId: 'album-1',
    timestamp: Date.now() - 4000000
  },
  {
    id: 'media-7',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    author: 'მაკო',
    albumId: null,
    timestamp: Date.now() - 3000000
  },
  {
    id: 'media-8',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=80',
    author: 'გეწო',
    albumId: 'album-2',
    timestamp: Date.now() - 2000000
  }
];

// Error handling in strict JSON format as specified in the Firebase Security Rules skill
export function handleFirestoreError(error: any, operationType: string, path: string | null): never {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'anonymous-sandbox-group',
      email: null,
      emailVerified: false,
      isAnonymous: true,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Hardened Error:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// Media Operations
export async function loadMedia(): Promise<MediaItem[]> {
  if (isFirebaseEnabled && db) {
    try {
      const q = query(collection(db, MEDIA_PATH), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const items: MediaItem[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as MediaItem);
      });
      // If Firestore database is fully empty, seed it initially
      if (items.length === 0) {
        for (const item of DEFAULT_MEDIA) {
          await saveMediaItem(item);
          items.push(item);
        }
      }
      return items;
    } catch (err) {
      handleFirestoreError(err, 'get', MEDIA_PATH);
    }
  } else {
    // LocalStorage Fallback code
    const stored = localStorage.getItem('sastawe_media');
    if (!stored) {
      localStorage.setItem('sastawe_media', JSON.stringify(DEFAULT_MEDIA));
      return DEFAULT_MEDIA;
    }
    return JSON.parse(stored);
  }
}

export async function saveMediaItem(item: MediaItem): Promise<void> {
  if (isFirebaseEnabled && db) {
    try {
      const docRef = doc(db, MEDIA_PATH, item.id);
      await setDoc(docRef, item);
    } catch (err) {
      handleFirestoreError(err, 'write', `${MEDIA_PATH}/${item.id}`);
    }
  } else {
    // LocalStorage fallback
    const items = await loadMedia();
    const existingIdx = items.findIndex((i) => i.id === item.id);
    if (existingIdx > -1) {
      items[existingIdx] = item;
    } else {
      items.unshift(item);
    }
    localStorage.setItem('sastawe_media', JSON.stringify(items));
  }
}

export async function deleteMediaItem(id: string): Promise<void> {
  if (isFirebaseEnabled && db) {
    try {
      const docRef = doc(db, MEDIA_PATH, id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, 'delete', `${MEDIA_PATH}/${id}`);
    }
  } else {
    // LocalStorage fallback
    const items = await loadMedia();
    const updated = items.filter((i) => i.id !== id);
    localStorage.setItem('sastawe_media', JSON.stringify(updated));
  }
}

// Album Operations
export async function loadAlbums(): Promise<Album[]> {
  if (isFirebaseEnabled && db) {
    try {
      const q = query(collection(db, ALBUMS_PATH));
      const snapshot = await getDocs(q);
      const items: Album[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Album);
      });
      // If empty and firebase is on, seed defaults
      if (items.length === 0) {
        for (const album of DEFAULT_ALBUMS) {
          await saveAlbum(album);
          items.push(album);
        }
      }
      return items;
    } catch (err) {
      handleFirestoreError(err, 'get', ALBUMS_PATH);
    }
  } else {
    // LocalStorage Fallback
    const stored = localStorage.getItem('sastawe_albums');
    if (!stored) {
      localStorage.setItem('sastawe_albums', JSON.stringify(DEFAULT_ALBUMS));
      return DEFAULT_ALBUMS;
    }
    return JSON.parse(stored);
  }
}

export async function saveAlbum(album: Album): Promise<void> {
  if (isFirebaseEnabled && db) {
    try {
      const docRef = doc(db, ALBUMS_PATH, album.id);
      await setDoc(docRef, album);
    } catch (err) {
      handleFirestoreError(err, 'write', `${ALBUMS_PATH}/${album.id}`);
    }
  } else {
    // LocalStorage fallback
    const albums = await loadAlbums();
    const existingIdx = albums.findIndex((a) => a.id === album.id);
    if (existingIdx > -1) {
      albums[existingIdx] = album;
    } else {
      albums.push(album);
    }
    localStorage.setItem('sastawe_albums', JSON.stringify(albums));
  }
}

/**
 * Deletes an album and performs Cascade Delete of all children photos as required by Rule 4.2:
 * "RULE: When an album is deleted, all photos and videos mapped to that album (m.albumId === albumToDeleteId)
 * must be permanently destroyed (deleted from Firestore and Firebase Storage)."
 */
export async function deleteAlbum(albumId: string): Promise<void> {
  if (isFirebaseEnabled && db) {
    try {
      // 1. Permanent destroy of mapped child photos in Firestore
      const mediaList = await loadMedia();
      const mappedChildren = mediaList.filter((m) => m.albumId === albumId);
      
      const batch = writeBatch(db);
      
      // Add each child photo deletion to batch
      mappedChildren.forEach((child) => {
        const childRef = doc(db, MEDIA_PATH, child.id);
        batch.delete(childRef);
      });
      
      // Add album deletion to batch
      const albumRef = doc(db, ALBUMS_PATH, albumId);
      batch.delete(albumRef);
      
      // Commit cascade delete
      await batch.commit();
      
    } catch (err) {
      handleFirestoreError(err, 'delete', `${ALBUMS_PATH}/${albumId}`);
    }
  } else {
    // LocalStorage fallback
    const albums = await loadAlbums();
    const updatedAlbums = albums.filter((a) => a.id !== albumId);
    localStorage.setItem('sastawe_albums', JSON.stringify(updatedAlbums));
    
    // Cascade delete of child photos
    const mediaList = await loadMedia();
    const updatedMedia = mediaList.filter((m) => m.albumId !== albumId);
    localStorage.setItem('sastawe_media', JSON.stringify(updatedMedia));
  }
}

export function subscribeMedia(onUpdate: (items: MediaItem[]) => void, onError: (err: any) => void): () => void {
  if (isFirebaseEnabled && db) {
    const q = query(collection(db, MEDIA_PATH), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const items: MediaItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as MediaItem);
      });
      // If Firestore database is fully empty, seed it initially
      if (items.length === 0) {
        // Seed default media items asynchronously (don't block snapshot callback processing)
        Promise.all(DEFAULT_MEDIA.map(item => saveMediaItem(item))).catch(err => {
          console.error("Failed to seed default media:", err);
        });
      } else {
        onUpdate(items);
      }
    }, (err) => {
      try {
        handleFirestoreError(err, 'list', MEDIA_PATH);
      } catch (e) {
        onError(e);
      }
    });
  } else {
    const stored = localStorage.getItem('sastawe_media');
    let items: MediaItem[] = [];
    if (!stored) {
      localStorage.setItem('sastawe_media', JSON.stringify(DEFAULT_MEDIA));
      items = DEFAULT_MEDIA;
    } else {
      items = JSON.parse(stored);
    }
    onUpdate(items);
    return () => {};
  }
}

export function subscribeAlbums(onUpdate: (items: Album[]) => void, onError: (err: any) => void): () => void {
  if (isFirebaseEnabled && db) {
    const q = query(collection(db, ALBUMS_PATH));
    return onSnapshot(q, (snapshot) => {
      const items: Album[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Album);
      });
      // If empty and firebase is on, seed defaults
      if (items.length === 0) {
        // Seed default albums asynchronously
        Promise.all(DEFAULT_ALBUMS.map(album => saveAlbum(album))).catch(err => {
          console.error("Failed to seed default albums:", err);
        });
      } else {
        onUpdate(items);
      }
    }, (err) => {
      try {
        handleFirestoreError(err, 'list', ALBUMS_PATH);
      } catch (e) {
        onError(e);
      }
    });
  } else {
    const stored = localStorage.getItem('sastawe_albums');
    let items: Album[] = [];
    if (!stored) {
      localStorage.setItem('sastawe_albums', JSON.stringify(DEFAULT_ALBUMS));
      items = DEFAULT_ALBUMS;
    } else {
      items = JSON.parse(stored);
    }
    onUpdate(items);
    return () => {};
  }
}
