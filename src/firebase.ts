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
  orderBy
} from 'firebase/firestore';
import { MediaItem, Album } from './types';

const APP_ID = 'sastawee';
const MEDIA_PATH = `artifacts/${APP_ID}/public/data/media`;
const ALBUMS_PATH = `artifacts/${APP_ID}/public/data/albums`;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseEnabled = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.trim().length > 0 &&
  firebaseConfig.projectId
);

let db: any = null;

if (isFirebaseEnabled) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization failed, falling back to localStorage:', err);
  }
}

const DEFAULT_ALBUMS: Album[] = [
  { id: 'album-1', name: 'საზაფხულო კოლექცია', timestamp: Date.now() - 10000000 },
  { id: 'album-2', name: 'პორტრეტების სერია', timestamp: Date.now() - 5000000 },
  { id: 'album-3', name: 'არქიტექტურა & ხაზები', timestamp: Date.now() - 2000000 }
];

const DEFAULT_MEDIA: MediaItem[] = [
  { id: 'media-1', type: 'image', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', author: 'მაკო', albumId: 'album-2', timestamp: Date.now() - 9000000 },
  { id: 'media-2', type: 'image', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', author: 'გეწო', albumId: 'album-3', timestamp: Date.now() - 8000000 },
  { id: 'media-3', type: 'image', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', author: 'ქეთა', albumId: null, timestamp: Date.now() - 7000000 },
  { id: 'media-4', type: 'image', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', author: 'მაკო', albumId: 'album-1', timestamp: Date.now() - 6000000 },
  { id: 'media-5', type: 'image', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', author: 'გეწო', albumId: null, timestamp: Date.now() - 5000000 },
  { id: 'media-6', type: 'image', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80', author: 'ქეთა', albumId: 'album-1', timestamp: Date.now() - 4000000 },
  { id: 'media-7', type: 'image', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', author: 'მაკო', albumId: null, timestamp: Date.now() - 3000000 },
  { id: 'media-8', type: 'image', url: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=80', author: 'გეწო', albumId: 'album-2', timestamp: Date.now() - 2000000 }
];

export async function loadMedia(): Promise<MediaItem[]> {
  if (isFirebaseEnabled && db) {
    try {
      const q = query(collection(db, MEDIA_PATH), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const items: MediaItem[] = [];
      snapshot.forEach((doc) => items.push(doc.data() as MediaItem));
      if (items.length === 0) {
        for (const item of DEFAULT_MEDIA) { await saveMediaItem(item); items.push(item); }
      }
      return items;
    } catch (err) { console.error('Firestore loadMedia error:', err); throw err; }
  } else {
    const stored = localStorage.getItem('sastawe_media');
    if (!stored) { localStorage.setItem('sastawe_media', JSON.stringify(DEFAULT_MEDIA)); return DEFAULT_MEDIA; }
    return JSON.parse(stored);
  }
}

export async function saveMediaItem(item: MediaItem): Promise<void> {
  if (isFirebaseEnabled && db) {
    await setDoc(doc(db, MEDIA_PATH, item.id), item);
  } else {
    const items = await loadMedia();
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx > -1) items[idx] = item; else items.unshift(item);
    localStorage.setItem('sastawe_media', JSON.stringify(items));
  }
}

export async function deleteMediaItem(id: string): Promise<void> {
  if (isFirebaseEnabled && db) {
    await deleteDoc(doc(db, MEDIA_PATH, id));
  } else {
    const items = await loadMedia();
    localStorage.setItem('sastawe_media', JSON.stringify(items.filter((i) => i.id !== id)));
  }
}

export async function loadAlbums(): Promise<Album[]> {
  if (isFirebaseEnabled && db) {
    try {
      const snapshot = await getDocs(query(collection(db, ALBUMS_PATH)));
      const items: Album[] = [];
      snapshot.forEach((doc) => items.push(doc.data() as Album));
      if (items.length === 0) {
        for (const album of DEFAULT_ALBUMS) { await saveAlbum(album); items.push(album); }
      }
      return items;
    } catch (err) { console.error('Firestore loadAlbums error:', err); throw err; }
  } else {
    const stored = localStorage.getItem('sastawe_albums');
    if (!stored) { localStorage.setItem('sastawe_albums', JSON.stringify(DEFAULT_ALBUMS)); return DEFAULT_ALBUMS; }
    return JSON.parse(stored);
  }
}

export async function saveAlbum(album: Album): Promise<void> {
  if (isFirebaseEnabled && db) {
    await setDoc(doc(db, ALBUMS_PATH, album.id), album);
  } else {
    const albums = await loadAlbums();
    const idx = albums.findIndex((a) => a.id === album.id);
    if (idx > -1) albums[idx] = album; else albums.push(album);
    localStorage.setItem('sastawe_albums', JSON.stringify(albums));
  }
}

export async function deleteAlbum(albumId: string): Promise<void> {
  if (isFirebaseEnabled && db) {
    const mediaList = await loadMedia();
    const batch = writeBatch(db);
    mediaList.filter((m) => m.albumId === albumId).forEach((child) => batch.delete(doc(db, MEDIA_PATH, child.id)));
    batch.delete(doc(db, ALBUMS_PATH, albumId));
    await batch.commit();
  } else {
    const albums = await loadAlbums();
    localStorage.setItem('sastawe_albums', JSON.stringify(albums.filter((a) => a.id !== albumId)));
    const mediaList = await loadMedia();
    localStorage.setItem('sastawe_media', JSON.stringify(mediaList.filter((m) => m.albumId !== albumId)));
  }
}
