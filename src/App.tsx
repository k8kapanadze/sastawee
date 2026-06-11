/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Lock, 
  Folder, 
  FolderPlus, 
  Plus, 
  Trash2, 
  Download, 
  Move, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2,
  Check, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  LogOut,
  Sliders,
  Grid,
  Minus
} from 'lucide-react';

import { 
  MediaItem, 
  Album, 
  AuthorType, 
  SectionType, 
  AppState 
} from './types';

import { 
  loadMedia, 
  saveMediaItem, 
  deleteMediaItem, 
  loadAlbums, 
  saveAlbum, 
  deleteAlbum, 
  isFirebaseEnabled,
  subscribeMedia,
  subscribeAlbums
} from './firebase';

export default function App() {
  // App state
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    return sessionStorage.getItem('sastawe_authorized') === 'true';
  });
  const [password, setPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<boolean>(false);

  const [currentSection, setCurrentSection] = useState<SectionType>('gallery');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedAuthorFilter, setSelectedAuthorFilter] = useState<AuthorType>('ყველა');
  
  // Data State
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selection & Action Panel
  const [selectMode, setSelectMode] = useState<boolean>(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([]);

  // Modals & Panels UI
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState<boolean>(false);
  const [newAlbumModalOpen, setNewAlbumModalOpen] = useState<boolean>(false);
  const [newAlbumName, setNewAlbumName] = useState<string>('');
  const [moveModalOpen, setMoveModalOpen] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);

  // Viewer modes
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeMediaList, setActiveMediaList] = useState<MediaItem[]>([]);
  
  // zoom, pinch-to-zoom & gesture swipe states
  const [zoomScale, setZoomScale] = useState<number>(1);
  const touchStartRef = useRef<{ dist: number; scale: number }>({ dist: 0, scale: 1 });

  // Grid density and Lightbox rendering states
  const [gridCols, setGridCols] = useState<number>(3);
  const [lightboxAspectFill, setLightboxAspectFill] = useState<boolean>(false);
  const [showLightboxUI, setShowLightboxUI] = useState<boolean>(true);
  const gridTouchStartRef = useRef<{ dist: number; cols: number }>({ dist: 0, cols: 3 });

  const getAuthorInitial = (authorName: string): string => {
    if (!authorName) return '';
    const clean = authorName.trim();
    if (clean === 'მაკო') return 'მ';
    if (clean === 'გეწო') return 'გ';
    if (clean === 'ქეთა') return 'ქ';
    return clean ? clean[0] : '';
  };

  useEffect(() => {
    setZoomScale(1);
    setShowLightboxUI(true);
    setLightboxAspectFill(false);
  }, [lightboxIndex]);
  
  // Cinematic Slideshow states
  const [slideshowOpen, setSlideshowOpen] = useState<boolean>(false);
  const [slideshowIndex, setSlideshowIndex] = useState<number>(0);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(true);

  // New Media Form state in upload drawer
  const [uploadAuthor, setUploadAuthor] = useState<'მაკო' | 'გეწო' | 'ქეთა'>('მაკო');
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image');
  const [uploadUrl, setUploadUrl] = useState<string>('');
  const [uploadTargetAlbumId, setUploadTargetAlbumId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initially with real-time updates
  useEffect(() => {
    let mediaLoaded = false;
    let albumsLoaded = false;

    const unsubscribeMedia = subscribeMedia(
      (loadedMedia) => {
        setMedia(loadedMedia);
        mediaLoaded = true;
        if (mediaLoaded && albumsLoaded) {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error subscribing to media:", err);
        setLoading(false);
      }
    );

    const unsubscribeAlbums = subscribeAlbums(
      (loadedAlbums) => {
        setAlbums(loadedAlbums);
        albumsLoaded = true;
        if (mediaLoaded && albumsLoaded) {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error subscribing to albums:", err);
        setLoading(false);
      }
    );

    // Fallback if loading is stuck
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => {
      unsubscribeMedia();
      unsubscribeAlbums();
      clearTimeout(timer);
    };
  }, []);

  // Sync to database and state helper
  const handleAddNewMedia = async (newMediaParam: Omit<MediaItem, 'id' | 'timestamp'>) => {
    const newItem: MediaItem = {
      ...newMediaParam,
      id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    // Instant Pre-Rendering: Append immediately to local state for zero-lag feeling!
    setMedia(prev => [newItem, ...prev]);

    try {
      await saveMediaItem(newItem);
    } catch (err) {
      console.error("Failed to commit upload sequence:", err);
    }
  };

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = password.trim().toLowerCase();
    if (cleanPass === 'gijurad' || cleanPass === 'გიჟურად') {
      setIsAuthorized(true);
      sessionStorage.setItem('sastawe_authorized', 'true');
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setTimeout(() => {
        setPasswordError(false);
      }, 1000);
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem('sastawe_authorized');
  };

  // Filtering helpers
  const getFilteredMedia = () => {
    let filtered = media;

    // Filter by Section
    if (currentSection === 'gallery') {
      // Only unassigned items
      filtered = filtered.filter(m => m.albumId === null);
    } else if (currentSection === 'albumView' && selectedAlbumId) {
      filtered = filtered.filter(m => m.albumId === selectedAlbumId);
    }

    // Filter by Author Pill Selection
    if (selectedAuthorFilter !== 'ყველა') {
      filtered = filtered.filter(m => m.author === selectedAuthorFilter);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  };

  // Toggle selection for media
  const toggleSelectMedia = (id: string) => {
    setSelectedMediaIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(mediaId => mediaId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Toggle selection for Album folder card (in selectMode, inside Albums view)
  const toggleSelectAlbum = (id: string) => {
    setSelectedAlbumIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(albumId => albumId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Check if any folder album covers are selected
  const hasSelectedAlbums = selectedAlbumIds.length > 0;

  // Dynamic Actions Panel Logic (Section 5.1):
  // "If ANY album (folder) is selected during Select Mode, the Actions Panel MUST hide the 'გადატანა' (Move) and 'შენახვა' (Download/Save) buttons instantly. Only the 'წაშლა' (Delete) button remains visible. If only photos/videos are selected, all three actions (Move, Download, Delete) must be visible."
  const showMoveAction = !hasSelectedAlbums && selectedMediaIds.length > 0;
  const showDownloadAction = !hasSelectedAlbums && selectedMediaIds.length > 0;
  const showDeleteAction = selectedMediaIds.length > 0 || selectedAlbumIds.length > 0;

  // Perform bulk move
  const executeBulkMove = async (albumIdOrNull: string | null) => {
    const updatedMedia = media.map(m => {
      if (selectedMediaIds.includes(m.id)) {
        return { ...m, albumId: albumIdOrNull };
      }
      return m;
    });
    setMedia(updatedMedia);
    setMoveModalOpen(false);
    setSelectMode(false);
    setSelectedMediaIds([]);

    // Persist changes
    for (const id of selectedMediaIds) {
      const match = media.find(m => m.id === id);
      if (match) {
        await saveMediaItem({ ...match, albumId: albumIdOrNull });
      }
    }
  };

  // Powerful helper to handle downloading / saving to gallery especially on iPhone/iOS
  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      // 1. Try to fetch as Blob for a cleaner download experience (direct download instead of opening new tab on iOS)
      const response = await fetch(url);
      const blob = await response.blob();
      
      // On iOS (iPhone/iPad/Safari), we can use the Web Share API.
      // If we share a File object, iOS displays the native Share Sheet with "Save Image" 
      // which puts the photo directly and automatically in the native iPhone Photos Gallery.
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS && navigator.share && navigator.canShare) {
        const file = new File([blob], `${filename}.jpg`, { type: blob.type || 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: filename,
          });
          return;
        }
      }

      // Standard desktop/fallback Blob download (cleaner, avoids opening in new tab)
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.warn('Blob fetch failed (possible CORS restrictions), falling back to standard link trigger:', error);
      
      // If CORS or check fails, fall back to standard link download / or URL sharing on iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS && navigator.share) {
        try {
          await navigator.share({
            title: filename,
            url: url
          });
          return;
        } catch (shareErr) {
          console.warn('Share URL failed too:', shareErr);
        }
      }

      // Final fallback
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Perform Bulk/Single download
  const executeBulkDownload = async () => {
    for (const id of selectedMediaIds) {
      const item = media.find(m => m.id === id);
      if (item) {
        await handleDownloadImage(item.url, `sastawe-${item.id}`);
      }
    }
    setSelectMode(false);
    setSelectedMediaIds([]);
  };

  // Perform Bulk delete (Section 4.2 cascade delete inside firebase.ts)
  const executeBulkDelete = async () => {
    // 1. Delete selected media units
    const remainingMedia = media.filter(m => !selectedMediaIds.includes(m.id));
    
    // 2. Delete selected active albums (which also triggers automatic cascade deletion of child items)
    let finalMedia = remainingMedia;
    selectedAlbumIds.forEach(albId => {
      finalMedia = finalMedia.filter(m => m.albumId !== albId);
    });

    setMedia(finalMedia);
    setAlbums(prev => prev.filter(al => !selectedAlbumIds.includes(al.id)));
    
    setDeleteConfirmOpen(false);
    setSelectMode(false);
    
    // Cloud serialization in background
    for (const id of selectedMediaIds) {
      await deleteMediaItem(id);
    }
    for (const albId of selectedAlbumIds) {
      await deleteAlbum(albId);
    }

    setSelectedMediaIds([]);
    setSelectedAlbumIds([]);
  };

  // File Input Change handler (Base64 data retrieval)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Instant base64 preview pre-rendered instantly (Rule 2.2)
          handleAddNewMedia({
            type: file.type.startsWith('video/') ? 'video' : 'image',
            url: reader.result,
            author: uploadAuthor,
            albumId: uploadTargetAlbumId ? uploadTargetAlbumId : null
          });
        }
      };
      reader.readAsDataURL(file);
    });

    setUploadDrawerOpen(false);
  };

  // Creative Album Controller Handlers
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;

    const newAlbum: Album = {
      id: `album-${Date.now()}`,
      name: newAlbumName.trim(),
      timestamp: Date.now()
    };

    setAlbums(prev => [...prev, newAlbum]);
    setNewAlbumName('');
    setNewAlbumModalOpen(false);

    try {
      await saveAlbum(newAlbum);
    } catch (err) {
      console.error("Error creating album folder:", err);
    }
  };

  // Drag and Drop Zone handler in Upload Drawer
  const [dragActive, setDragActive] = useState<boolean>(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      Array.from(e.dataTransfer.files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            handleAddNewMedia({
              type: file.type.startsWith('video/') ? 'video' : 'image',
              url: reader.result,
              author: uploadAuthor,
              albumId: uploadTargetAlbumId ? uploadTargetAlbumId : null
            });
          }
        };
        reader.readAsDataURL(file);
      });
      setUploadDrawerOpen(false);
    }
  };

  // Keyboard navigation for Lightbox & Slideshow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAuthorized) return;
      if (lightboxIndex !== null) {
        if (e.key === 'ArrowRight') handleNextLightbox();
        if (e.key === 'ArrowLeft') handlePrevLightbox();
        if (e.key === 'Escape') setLightboxIndex(null);
      } else if (slideshowOpen) {
        if (e.key === 'ArrowRight') handleNextSlideshow();
        if (e.key === 'ArrowLeft') handlePrevSlideshow();
        if (e.key === 'Escape') setSlideshowOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, slideshowOpen, activeMediaList, slideshowIndex]);

  // Autoplay handler for Cinematic Slideshow
  useEffect(() => {
    let timer: any;
    if (slideshowOpen && isAutoplay) {
      timer = setInterval(() => {
        handleNextSlideshow();
      }, 2800);
    }
    return () => clearInterval(timer);
  }, [slideshowOpen, isAutoplay, slideshowIndex, activeMediaList]);

  // Lightbox navigational controls
  const handleOpenLightbox = (index: number, list: MediaItem[]) => {
    setActiveMediaList(list);
    setLightboxIndex(index);
  };

  const handleNextLightbox = () => {
    if (lightboxIndex === null || activeMediaList.length === 0) return;
    setLightboxIndex((lightboxIndex + 1) % activeMediaList.length);
  };

  const handlePrevLightbox = () => {
    if (lightboxIndex === null || activeMediaList.length === 0) return;
    setLightboxIndex((lightboxIndex - 1 + activeMediaList.length) % activeMediaList.length);
  };

  // Cinematic Slideshow controls
  const handleOpenSlideshow = (list: MediaItem[]) => {
    if (list.length === 0) return;
    setActiveMediaList(list);
    setSlideshowIndex(0);
    setIsAutoplay(true);
    setSlideshowOpen(true);
  };

  const handleNextSlideshow = () => {
    if (activeMediaList.length === 0) return;
    setSlideshowIndex(prev => (prev + 1) % activeMediaList.length);
  };

  const handlePrevSlideshow = () => {
    if (activeMediaList.length === 0) return;
    setSlideshowIndex(prev => (prev - 1 + activeMediaList.length) % activeMediaList.length);
  };

  // Split content for exactly 2 Masonry Columns
  const currentFilteredList = getFilteredMedia();
  const col1 = currentFilteredList.filter((_, idx) => idx % 2 === 0);
  const col2 = currentFilteredList.filter((_, idx) => idx % 2 === 1);

  // Check if everything on display is currently selected
  const isAllSelected = (() => {
    if (currentSection === 'albums') {
      return albums.length > 0 && albums.every(album => selectedAlbumIds.includes(album.id));
    } else {
      return currentFilteredList.length > 0 && currentFilteredList.every(item => selectedMediaIds.includes(item.id));
    }
  })();

  const handleToggleSelectAll = () => {
    if (currentSection === 'albums') {
      if (isAllSelected) {
        // Deselect all albums currently displayed
        const albumIdsToRemove = albums.map(a => a.id);
        setSelectedAlbumIds(prev => prev.filter(id => !albumIdsToRemove.includes(id)));
      } else {
        // Select all albums (union with existing)
        const allAlbumIds = albums.map(a => a.id);
        setSelectedAlbumIds(prev => Array.from(new Set([...prev, ...allAlbumIds])));
      }
    } else {
      if (isAllSelected) {
        // Deselect all media items of the current filtered list
        const mediaIdsToRemove = currentFilteredList.map(m => m.id);
        setSelectedMediaIds(prev => prev.filter(id => !mediaIdsToRemove.includes(id)));
      } else {
        // Select all media items of the current filtered list (union with existing)
        const allMediaIds = currentFilteredList.map(m => m.id);
        setSelectedMediaIds(prev => Array.from(new Set([...prev, ...allMediaIds])));
      }
    }
  };

  return (
    <div id="app_root" className="min-h-screen w-full overflow-x-hidden bg-black text-white selection:bg-neutral-800 selection:text-white flex flex-col font-sans transition-colors duration-500">
      
      {/* SECTION 3.1: LOGIN GATE (ავტორიზაცია) OVERLAY */}
      <AnimatePresence>
        {!isAuthorized && (
          <motion.div 
            id="login_gate" 
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Elegant visual branding card with sharp typography */}
            <div className="w-full max-w-sm text-center space-y-12">
              <div className="space-y-4">
                <motion.h1 
                  className="font-sans font-medium tracking-widest text-4xl uppercase text-white/90"
                  initial={{ y: -15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  სასტაwe
                </motion.h1>
                <div className="h-px w-24 bg-white/20 mx-auto" />
                <p className="text-neutral-500 text-xs font-sans tracking-widest uppercase">
                  Private Memory
                </p>
              </div>

              {/* Login Form with required design parameters */}
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <input 
                    id="password_input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full text-center py-4 bg-[#121212] border ${passwordError ? 'border-red-500/50' : 'border-neutral-900 focus:border-white/20'} font-mono text-lg text-white placeholder-neutral-700 focus:outline-none rounded-full transition-all duration-300`}
                  />
                  {passwordError && (
                    <motion.p 
                      className="text-red-500 text-xs mt-3 font-mono"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      არასწორი პაროლი / INCORRECT PASSPHRASE
                    </motion.p>
                  )}
                </div>

                <button 
                  id="login_submit"
                  type="submit"
                  className="w-full py-4 bg-white text-black font-sans font-medium tracking-wider rounded-full hover:bg-neutral-200 transition-colors duration-300"
                >
                  შესვლა
                </button>
              </form>
            </div>
            {/* Invisible baseline copyright indicator without noise clutter */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER THE MAIN APP STREAM IF AUTHORIZED */}
      {isAuthorized && (
        <>
          {/* TOP BAR / NAVIGATION COORIDINATE HEADER */}
          <header id="app_header" className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-neutral-900/60 transition-all duration-300">
            <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
              
              {/* BRAND / RESET FILTERS BAR */}
              <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer" onClick={() => {
                setCurrentSection('gallery');
                setSelectedAlbumId(null);
                setSelectedAuthorFilter('ყველა');
                setSelectMode(false);
              }}>
                <span className="font-sans font-medium tracking-widest text-base sm:text-lg uppercase text-white/90">
                  სასტაwe
                </span>
              </div>

              {/* ACTION LINKS / SELECT BUTTON */}
              <div className="flex items-center space-x-1.5 sm:space-x-3 font-medium">
                {(currentSection === 'gallery' || currentSection === 'albumView') && currentFilteredList.length > 0 && (
                  <div className="flex items-center bg-neutral-900 px-1 py-1 rounded-md border border-neutral-800/60 select-none">
                    <button 
                      onClick={() => setGridCols(prev => Math.min(6, prev + 1))}
                      className="p-1 hover:text-white text-neutral-400 active:scale-95 disabled:opacity-20 transition-all"
                      disabled={gridCols >= 6} 
                      title="სურათების დაპატარავება"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-neutral-400 w-4 text-center select-none">
                      {gridCols}
                    </span>
                    <button 
                      onClick={() => setGridCols(prev => Math.max(2, prev - 1))}
                      className="p-1 hover:text-white text-neutral-400 active:scale-95 disabled:opacity-20 transition-all"
                      disabled={gridCols <= 2}
                      title="სურათების გადიდება"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                )}

                {currentFilteredList.length > 0 && !selectMode && (
                  <button 
                    id="slideshow_launcher"
                    onClick={() => handleOpenSlideshow(currentFilteredList)}
                    className="flex items-center space-x-1 sm:space-x-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 bg-neutral-900 hover:bg-neutral-850 text-[11px] sm:text-xs uppercase tracking-wider text-neutral-300 transition-all rounded-md"
                  >
                    <Play size={11} className="text-white bg-white/10 p-0.5 rounded" />
                    <span className="hidden sm:inline">სლაიდშოუ</span>
                  </button>
                )}

                <button 
                   id="select_mode_toggle"
                  onClick={() => {
                    setSelectMode(!selectMode);
                    setSelectedMediaIds([]);
                    setSelectedAlbumIds([]);
                  }}
                  className={`px-2 py-1.5 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs uppercase tracking-wider transition-all rounded-md flex items-center space-x-1 sm:space-x-1.5 ${
                    selectMode 
                      ? 'bg-white text-black hover:bg-white/90' 
                      : 'bg-neutral-900 hover:bg-neutral-850 text-neutral-300'
                  }`}
                >
                  <Sliders size={11} />
                  <span className="hidden sm:inline">{selectMode ? 'მონიშნულია' : 'მონიშვნა'}</span>
                </button>

                {selectMode && (
                  <button 
                    id="select_all_toggle"
                    onClick={handleToggleSelectAll}
                    className={`px-2 py-1.5 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs uppercase tracking-wider transition-all rounded-md flex items-center space-x-1 sm:space-x-1.5 ${
                      isAllSelected 
                        ? 'bg-[#1a1a1a] border border-white/20 text-white hover:bg-neutral-800' 
                        : 'bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-850'
                    }`}
                  >
                    <Check size={11} />
                    <span className="hidden xs:inline">
                      {isAllSelected ? 'მოხსნა' : 'ყველა'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* MAIN CONTAINER LAYOUT */}
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 pb-28">
            
            {/* AUTHOR SELECTION PILLS (VISIBLE ON FEED TAB) */}
            {currentSection === 'gallery' && (
              <div className="mb-8 overflow-x-auto whitespace-nowrap flex items-center space-x-2 py-1 scrollbar-none">
                {(['ყველა', 'მაკო', 'გეწო', 'ქეთა'] as AuthorType[]).map((authorName) => (
                  <button
                    key={authorName}
                    onClick={() => setSelectedAuthorFilter(authorName)}
                    className={`px-5 py-2.5 text-xs font-sans font-medium uppercase tracking-wider transition-all duration-300 rounded-full border ${
                      selectedAuthorFilter === authorName
                        ? 'bg-white text-black border-white'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-900 hover:text-white'
                    }`}
                  >
                    {authorName}
                  </button>
                ))}
              </div>
            )}

            {/* ALMOST BACK TO MAIN STREAM NAV HEADER */}
            {currentSection === 'albumView' && (
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => {
                      setCurrentSection('albums');
                      setSelectedAlbumId(null);
                    }}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700/50 text-neutral-400 hover:text-white rounded-full transition-all duration-350"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div>
                    <h2 className="text-xl font-sans font-medium tracking-wide">
                      {albums.find(a => a.id === selectedAlbumId)?.name || 'ალბომი'}
                    </h2>
                    <p className="text-xs text-neutral-500 font-mono mt-0.5">
                      {currentFilteredList.length} ელემენტი
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN VIEW SECTION CONTROLLER */}
            <AnimatePresence mode="wait">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                </div>
              ) : currentSection === 'gallery' || currentSection === 'albumView' ? (
                
                /* SECTION 2.3: FLUID DENSITY FEED WITH IDEAL SQUARE CROPPING */
                <motion.div 
                  key="masonry_feed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  {currentFilteredList.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-neutral-900 py-16 space-y-3">
                      <ImageIcon className="mx-auto text-neutral-700" size={32} />
                      <p className="text-neutral-500 text-sm font-sans">
                        ამ კატეგორიაში მედია ჯერ არ არის ატვირთული
                      </p>
                    </div>
                  ) : (
                    <div 
                      className="grid gap-1 select-none" 
                      style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
                      onTouchStart={(e) => {
                        if (e.touches.length === 2) {
                           const t1 = e.touches[0];
                           const t2 = e.touches[1];
                           const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                           gridTouchStartRef.current = { dist, cols: gridCols };
                        }
                      }}
                      onTouchMove={(e) => {
                        if (e.touches.length === 2 && gridTouchStartRef.current.dist > 0) {
                          // Prevent scroll only when gesturing
                          e.preventDefault();
                          const t1 = e.touches[0];
                          const t2 = e.touches[1];
                          const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                          const ratio = dist / gridTouchStartRef.current.dist;
                          
                          // Fingers moving apart -> zooming in -> less columns count (larger)
                          if (ratio > 1.25 && gridTouchStartRef.current.cols > 2) {
                            const newCols = Math.max(2, gridTouchStartRef.current.cols - 1);
                            setGridCols(newCols);
                            gridTouchStartRef.current.dist = dist;
                            gridTouchStartRef.current.cols = newCols;
                          }
                          // Fingers close together -> zooming out -> more columns count (smaller)
                          else if (ratio < 0.75 && gridTouchStartRef.current.cols < 6) {
                            const newCols = Math.min(6, gridTouchStartRef.current.cols + 1);
                            setGridCols(newCols);
                            gridTouchStartRef.current.dist = dist;
                            gridTouchStartRef.current.cols = newCols;
                          }
                        }
                      }}
                      onTouchEnd={() => {
                        gridTouchStartRef.current.dist = 0;
                      }}
                    >
                      {currentFilteredList.map((item, index) => {
                        const isSelected = selectedMediaIds.includes(item.id);

                        return (
                          <div 
                            key={item.id}
                            id={`card-${item.id}`}
                            onClick={() => {
                              if (selectMode) {
                                toggleSelectMedia(item.id);
                              } else {
                                handleOpenLightbox(index, currentFilteredList);
                              }
                            }}
                            className="aspect-square w-full overflow-hidden relative cursor-pointer bg-neutral-950 rounded-none group select-none"
                          >
                            {/* Selection overlay indicator */}
                            {selectMode && (
                              <div className="absolute top-2 left-2 z-10 w-5 h-5 flex items-center justify-center rounded-full border border-white/20 bg-black/60 backdrop-blur-md">
                                {isSelected && <Check size={12} className="text-white" />}
                              </div>
                            )}

                            {/* Media element with force hardware accelerated render layers */}
                            {item.type === 'video' ? (
                              <div className="w-full h-full relative" style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}>
                                <video 
                                  src={item.url} 
                                  className="w-full h-full object-cover"
                                  muted 
                                  loop 
                                  playsInline
                                  onMouseEnter={(e) => e.currentTarget.play()}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.pause();
                                    e.currentTarget.currentTime = 0;
                                  }}
                                />
                                <div className="absolute bottom-2 right-2 bg-black/60 p-1 backdrop-blur-md rounded-md">
                                  <VideoIcon size={12} className="text-neutral-400" />
                                </div>
                              </div>
                            ) : (
                              <img 
                                src={item.url} 
                                alt={`Media item by ${item.author}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                style={{ 
                                  willChange: 'transform, opacity', 
                                  transform: 'translateZ(0)' 
                                }}
                              />
                            )}

                            {/* Author initial badge inside grid cards */}
                            <div className="absolute bottom-2 left-2 z-10 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-sans font-bold tracking-normal shadow-md select-none border border-white/10">
                              {getAuthorInitial(item.author)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ) : (

                /* SECTION 3.3: ALBUMS CATALOG TAB */
                <motion.div 
                  key="albums_tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Create controller button */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-sans font-medium tracking-wide">ალბომები</h2>
                    
                    <button 
                      id="create_album_trigger"
                      onClick={() => setNewAlbumModalOpen(true)}
                      className="flex items-center space-x-2 bg-white text-black text-xs font-medium tracking-wider px-4 py-2 hover:bg-neutral-200 transition-colors rounded-full"
                    >
                      <FolderPlus size={14} />
                      <span>ახალი ალბომი</span>
                    </button>
                  </div>

                  {albums.length === 0 ? (
                    <div className="text-center py-20 border border-neutral-900 rounded-[2rem] bg-[#121212]">
                      <Folder className="mx-auto text-neutral-700" size={32} />
                      <p className="text-neutral-500 text-sm mt-3 font-sans">ცარიელია. შექმენით პირველი ალბომი</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {albums.map((album) => {
                        const isSelected = selectedAlbumIds.includes(album.id);
                        
                        // Get first image in album to use as thumbnail
                        const albumDocs = media.filter(m => m.albumId === album.id);
                        const albumCoverUrl = albumDocs.length > 0 ? albumDocs[0].url : '';

                        return (
                          <div 
                            key={album.id}
                            id={`album-${album.id}`}
                            className={`rounded-[2rem] border relative overflow-hidden h-44 cursor-pointer group transition-all duration-300 select-none ${
                              isSelected ? 'border-white' : 'border-neutral-900 bg-neutral-900/60'
                            }`}
                            onClick={() => {
                              if (selectMode) {
                                toggleSelectAlbum(album.id);
                              } else {
                                setSelectedAlbumId(album.id);
                                setCurrentSection('albumView');
                              }
                            }}
                          >
                            {/* Selected state indicator for albums */}
                            {selectMode && (
                              <div className="absolute top-4 left-4 z-10 w-5 h-5 flex items-center justify-center rounded-full border border-white/20 bg-black/60 backdrop-blur-md">
                                {isSelected && <Check size={12} className="text-white" />}
                              </div>
                            )}

                            {/* Cover image backdrop */}
                            {albumCoverUrl ? (
                              <img 
                                src={albumCoverUrl} 
                                alt={album.name}
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-neutral-950 flex items-center justify-center">
                                <Folder className="text-neutral-800" size={40} />
                              </div>
                            )}

                            {/* Content cover text */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 flex flex-col justify-end">
                              <h3 className="font-sans font-medium text-lg leading-snug tracking-wide group-hover:text-white text-neutral-100">
                                {album.name}
                              </h3>
                              <p className="text-xs text-neutral-400 font-mono mt-1">
                                {albumDocs.length} მედია ფაილი
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </main>

          {/* DYNAMIC ACTIONS PANEL / SELECT MODE BAR (Section 5) */}
          <AnimatePresence>
            {selectMode && (selectedMediaIds.length > 0 || selectedAlbumIds.length > 0) && (
              <motion.div 
                id="actions_panel"
                className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
              >
                <div 
                  className="bg-[#121212] border border-neutral-900 rounded-full px-6 py-4 flex items-center justify-between shadow-2xl"
                  style={{ background: 'rgba(18, 18, 18, 0.85)', backdropFilter: 'blur(20px)' }}
                >
                  <p className="text-xs text-neutral-400 font-mono uppercase tracking-wide">
                    მონიშნულია: {selectedMediaIds.length + selectedAlbumIds.length}ფ.
                  </p>
                  
                  <div className="flex items-center space-x-3">
                    {/* Hide Move button if any album folder is selected */}
                    {showMoveAction && (
                      <button 
                        id="action_move"
                        onClick={() => setMoveModalOpen(true)}
                        className="p-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-full border border-neutral-800 transition-colors"
                        title="ალბომში გადატანა"
                      >
                        <Move size={15} />
                      </button>
                    )}

                    {/* Hide Download button if any album folder is selected */}
                    {showDownloadAction && (
                      <button 
                        id="action_download"
                        onClick={executeBulkDownload}
                        className="p-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-full border border-neutral-800 transition-colors"
                        title="შენახვა / ჩამოტვირთვა"
                      >
                        <Download size={15} />
                      </button>
                    )}

                    {showDeleteAction && (
                      <button 
                        id="action_delete"
                        onClick={() => setDeleteConfirmOpen(true)}
                        className="p-2.5 bg-red-650 hover:bg-red-600 text-white rounded-full border border-red-500/10 transition-colors bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        title="წაშლა"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FLOATING BOTTOM DOCK WITH NAVIGATION PILLS */}
          <nav id="bottom_navigation" className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-[#121212]/80 border border-neutral-900 backdrop-blur-2xl rounded-full px-3 py-2 flex items-center justify-between space-x-1.5 shadow-2xl select-none">
            <button
              onClick={() => {
                setCurrentSection('gallery');
                setSelectMode(false);
              }}
              className={`px-5 py-2 text-xs font-sans font-medium tracking-wider uppercase rounded-full transition-all duration-300 ${
                currentSection === 'gallery'
                  ? 'bg-white text-black bg-opacity-100'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              გალერეა
            </button>

            <button
              onClick={() => {
                setCurrentSection('albums');
                setSelectMode(false);
              }}
              className={`px-5 py-2 text-xs font-sans font-medium tracking-wider uppercase rounded-full transition-all duration-300 ${
                currentSection === 'albums' || currentSection === 'albumView'
                  ? 'bg-white text-black bg-opacity-100'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              ალბომები
            </button>

            {/* Quick Upload action circle badge */}
            <button
              id="upload_trigger"
              onClick={() => setUploadDrawerOpen(true)}
              className="w-9 h-9 flex items-center justify-center bg-white text-black active:bg-neutral-200 transition-colors rounded-full"
              title="ატვირთვა"
            >
              <Plus size={16} />
            </button>

            {/* Logout/Exit action circle badge */}
            <button
              id="action_logout_bottom"
              onClick={handleLogout}
              title="გამოსვლა"
              className="w-9 h-9 flex items-center justify-center bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-850 rounded-full transition-colors"
            >
              <LogOut size={14} />
            </button>
          </nav>

          {/* SECTION 1.2: UPLOAD DRAWER OVERLAY PANEL (uploadDrawer) */}
          <AnimatePresence>
            {uploadDrawerOpen && (
              <div className="fixed inset-0 z-50 flex items-end">
                <motion.div 
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setUploadDrawerOpen(false)}
                />
                
                <motion.div 
                  id="uploadDrawer"
                  className="w-full max-w-lg bg-[#121212] border-t border-neutral-900 rounded-t-[2.5rem] p-6 pb-12 z-10 shadow-2xl relative select-none"
                  style={{ background: 'rgba(18, 18, 18, 0.95)', backdropFilter: 'blur(30px)' }}
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                >
                  <button 
                    onClick={() => setUploadDrawerOpen(false)}
                    className="absolute top-5 right-5 p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition-all"
                  >
                    <X size={15} />
                  </button>

                  <h3 className="font-sans font-medium tracking-wide text-lg mt-1 mb-6 text-neutral-100">
                    მედიის ატვირთვა
                  </h3>

                  {/* Drag and Drop Zone + Manual Upload Trigger */}
                  <div 
                    id="drop_zone"
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[2rem] p-8 text-center cursor-pointer transition-all ${
                      dragActive 
                        ? 'border-white bg-white/5' 
                        : 'border-neutral-850 hover:border-neutral-800 bg-[#0c0c0c]'
                    }`}
                  >
                    <ImageIcon className="mx-auto text-neutral-600 mb-3" size={28} />
                    <p className="text-xs text-neutral-400 font-sans leading-normal">
                      გადმოათრიეთ ფაილი აქ ველიდან ან დააწკაპუნეთ ასატვირთად
                    </p>
                    <p className="text-[10px] text-neutral-600 font-mono mt-2 uppercase">
                      მხარდაჭერილია JPEG, PNG, MP4
                    </p>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      multiple 
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </div>

                  {/* Metadata selectors for uploads */}
                  <div className="mt-6 space-y-5">
                    
                    {/* Choose Author BADGE */}
                    <div className="space-y-2">
                      <span className="text-[11px] text-neutral-500 font-mono uppercase tracking-wider block">ავტორი</span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['მაკო', 'გეწო', 'ქეთა'] as const).map((aName) => (
                          <button
                            key={aName}
                            type="button"
                            onClick={() => setUploadAuthor(aName)}
                            className={`py-2 px-3 text-xs font-sans font-medium rounded-full border transition-all ${
                              uploadAuthor === aName
                                ? 'bg-white text-black border-white'
                                : 'bg-[#121212] text-neutral-400 border-neutral-900'
                            }`}
                          >
                            {aName}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pre-select Target Album folder */}
                    <div className="space-y-2">
                      <span className="text-[11px] text-neutral-500 font-mono uppercase tracking-wider block">გადამისამართება ალბომში</span>
                      <select
                        value={uploadTargetAlbumId}
                        onChange={(e) => setUploadTargetAlbumId(e.target.value)}
                        className="w-full bg-[#1c1c1e] border border-neutral-900 text-xs font-sans py-3.5 px-4 focus:outline-none focus:border-white/20 rounded-xl"
                      >
                        <option value="">გალერეის სექცია (გალერეა)</option>
                        {albums.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Manual web URL input for flexibility */}
                    <div className="space-y-2 pt-2 border-t border-neutral-900/50">
                      <span className="text-[11px] text-neutral-500 font-mono uppercase tracking-wider block">ან ატვირთეთ ვებ მედია ბმულით</span>
                      <div className="flex space-x-2">
                        <input 
                          type="text"
                          value={uploadUrl}
                          onChange={(e) => setUploadUrl(e.target.value)}
                          placeholder="კონკრეტული სურათის ან ვიდეოს URL ბმული..."
                          className="flex-1 bg-[#1c1c1e] border border-neutral-900 text-xs font-sans py-3 px-4 focus:outline-none focus:border-white/10 rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!uploadUrl.trim()) return;
                            handleAddNewMedia({
                              type: uploadUrl.includes('.mp4') || uploadUrl.includes('video') ? 'video' : 'image',
                              url: uploadUrl.trim(),
                              author: uploadAuthor,
                              albumId: uploadTargetAlbumId ? uploadTargetAlbumId : null
                            });
                            setUploadUrl('');
                            setUploadDrawerOpen(false);
                          }}
                          className="px-5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-neutral-200"
                        >
                          დამატება
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* NEW ALBUM GENERATION MODAL DIALOG */}
          <AnimatePresence>
            {newAlbumModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setNewAlbumModalOpen(false)}
                />
                
                <motion.div 
                  className="w-full max-w-sm bg-[#121212] border border-neutral-900 p-6 z-10 shadow-2xl relative rounded-[2rem] select-none"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                >
                  <h3 className="font-sans font-medium tracking-wide text-lg mb-4 text-neutral-100">ახალი ალბომი</h3>
                  
                  <form onSubmit={handleCreateAlbum} className="space-y-4">
                    <input 
                      type="text"
                      required
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      placeholder="შენ დაუკარ"
                      className="w-full bg-[#1c1c1e] border border-neutral-900 text-sm font-sans py-3.5 px-4 focus:outline-none focus:border-neutral-700/60 rounded-xl"
                    />

                    <div className="flex space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setNewAlbumModalOpen(false)}
                        className="flex-1 py-3 text-xs font-medium bg-neutral-900 hover:bg-neutral-850 rounded-full text-neutral-400 hover:text-white"
                      >
                        გაუქმება
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 text-xs font-medium bg-white text-black hover:bg-neutral-200 rounded-full"
                      >
                        შექმნა
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* BULK TRANSFER DYNAMIC CHANGER DIALOG */}
          <AnimatePresence>
            {moveModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMoveModalOpen(false)}
                />
                
                <motion.div 
                  className="w-full max-w-sm bg-[#121212] border border-neutral-900 p-6 z-10 shadow-2xl relative rounded-[2rem] select-none"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                >
                  <h3 className="font-sans font-medium tracking-wide text-md mb-4 text-neutral-200">ალბომში გადატანა</h3>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    <button
                      onClick={() => executeBulkMove(null)}
                      className="w-full py-3 px-4 text-xs font-sans font-medium text-left bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-900 hover:border-neutral-800 flex items-center space-x-2"
                    >
                      <Folder className="text-neutral-500" size={14} />
                      <span>უმისამართოდ მოხსნა (მთავარი გალერეა)</span>
                    </button>
                    
                    {albums.map(a => (
                      <button
                        key={a.id}
                        onClick={() => executeBulkMove(a.id)}
                        className="w-full py-3 px-4 text-xs font-sans font-medium text-left bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-900 hover:border-neutral-800 flex items-center space-x-2"
                      >
                        <Folder className="text-yellow-600/60" size={14} />
                        <span>{a.name}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setMoveModalOpen(false)}
                    className="w-full mt-4 py-3 text-xs bg-[#0c0c0c] hover:bg-neutral-900 text-neutral-400 rounded-full font-medium"
                  >
                    გაუქმება
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* BULK DELETE HARDENED CUSTOM MODAL CONFIRMATION */}
          <AnimatePresence>
            {deleteConfirmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setDeleteConfirmOpen(false)}
                />
                
                <motion.div 
                  className="w-full max-w-sm bg-[#121212] border border-neutral-900 p-6 z-10 shadow-2xl relative rounded-[2rem] select-none text-center space-y-4"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                >
                  <div className="w-12 h-12 bg-red-500/10 text-red-500 mx-auto rounded-full flex items-center justify-center">
                    <Trash2 size={20} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-sans font-medium tracking-wide text-md text-neutral-100">
                      ნამდვილად გსურთ წაშლა?
                    </h3>
                    <p className="text-xs text-neutral-400 leading-normal font-sans">
                      ეს მოქმედება სამუდამოა და ვერ აღდგება. ალბომის წაშლის შემთხვევაში, მის შემადგენლობაში მყოფი ყველა ფოტო სამუდამოდ განადგურდება.
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => setDeleteConfirmOpen(false)}
                      className="flex-1 py-3 text-xs font-medium bg-neutral-900 hover:bg-neutral-850 rounded-full text-neutral-400 hover:text-white"
                    >
                      გაუქმება
                    </button>
                    <button
                      onClick={executeBulkDelete}
                      className="flex-1 py-3 text-xs font-medium bg-red-600 text-white hover:bg-red-500 rounded-full shadow-lg shadow-red-650/10"
                    >
                      წაშლა
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* SECTION 1.2: FULLSCREEN LIGHTBOX PORTAL VIEW */}
          <AnimatePresence>
            {lightboxIndex !== null && activeMediaList.length > 0 && (
              <motion.div 
                id="lightbox_portal"
                className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
                style={{
                  paddingTop: "env(safe-area-inset-top, 1rem)",
                  paddingBottom: "env(safe-area-inset-bottom, 1rem)",
                  paddingLeft: "env(safe-area-inset-left, 0px)",
                  paddingRight: "env(safe-area-inset-right, 0px)",
                }}
              >
                {/* Header coordinates (fades out dynamically) */}
                <header className={`px-6 py-4 flex items-center justify-between text-white/50 z-40 select-none transition-all duration-300 ease-in-out ${
                  showLightboxUI ? "opacity-100 transform translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
                }`}>
                  <div className="flex flex-col animate-none">
                    <span className="text-xs font-sans font-semibold tracking-wide text-neutral-200">
                      Private Memory
                    </span>
                    <span className="text-[10px] font-mono uppercase text-neutral-500">
                      ავტორი: {activeMediaList[lightboxIndex].author}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Size Selector Mode */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxAspectFill(!lightboxAspectFill);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded-full transition-all text-[11px] font-sans font-medium uppercase tracking-wider border border-white/5"
                      title={lightboxAspectFill ? "ორიგინალური Fit" : "მთელ ეკრანზე Fill"}
                    >
                      {lightboxAspectFill ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                      <span>{lightboxAspectFill ? "Fit" : "Fill"}</span>
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const activeItem = activeMediaList[lightboxIndex];
                        handleDownloadImage(activeItem.url, `sastawe-${activeItem.id}`);
                      }}
                      className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition-colors"
                      title="სურათის შენახვა"
                    >
                      <Download size={14} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(null);
                      }}
                      className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </header>

                {/* Main image with spring animation */}
                <div 
                  className="flex-1 flex items-center justify-center p-2 sm:p-4 relative select-none w-full h-full"
                  onClick={() => setShowLightboxUI(!showLightboxUI)}
                >
                  {/* Invisible left tap-to-navigate zone */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevLightbox();
                    }}
                    className="absolute left-0 top-0 bottom-0 w-20 sm:w-28 z-30 cursor-pointer focus:outline-none hover:bg-white/[0.012] active:bg-white/[0.025] transition-colors"
                    aria-label="Previous Image"
                  />

                  <div className={`w-full h-full max-w-5xl md:max-h-[85vh] flex items-center justify-center relative bg-black select-none overflow-hidden transition-all duration-300 ${
                    lightboxAspectFill ? "max-h-full" : "max-h-[82vh] rounded-3xl border border-neutral-900/40 shadow-2xl"
                  }`}>
                    {activeMediaList[lightboxIndex].type === 'video' ? (
                      <motion.div
                        key={`lightbox-video-${lightboxIndex}`}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.4}
                        onDragEnd={(event, info) => {
                          const swipeThreshold = 50;
                          if (info.offset.x < -swipeThreshold) {
                            handleNextLightbox();
                          } else if (info.offset.x > swipeThreshold) {
                            handlePrevLightbox();
                          }
                        }}
                        transition={{ type: "spring", stiffness: 220, damping: 26 }}
                        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                      >
                        <video 
                          src={activeMediaList[lightboxIndex].url}
                          controls
                          autoPlay
                          className={`rounded-none transition-all duration-300 ${
                            lightboxAspectFill 
                              ? "w-full h-full object-cover" 
                              : "max-w-full max-h-full object-contain rounded-2xl"
                          }`}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`lightbox-img-${lightboxIndex}`}
                        drag={zoomScale === 1 ? "x" : true}
                        dragConstraints={zoomScale === 1 ? { left: 0, right: 0 } : undefined}
                        dragElastic={zoomScale === 1 ? 0.4 : 0.05}
                        onDragEnd={(event, info) => {
                          if (zoomScale > 1) return;
                          const swipeThreshold = 50;
                          if (info.offset.x < -swipeThreshold) {
                            handleNextLightbox();
                          } else if (info.offset.x > swipeThreshold) {
                            handlePrevLightbox();
                          }
                        }}
                        style={{ 
                          scale: zoomScale,
                          touchAction: 'none'
                        }}
                        onTouchStart={(e) => {
                          if (e.touches.length === 2) {
                            const t1 = e.touches[0];
                            const t2 = e.touches[1];
                            const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                            touchStartRef.current = { dist, scale: zoomScale };
                          }
                        }}
                        onTouchMove={(e) => {
                          if (e.touches.length === 2 && touchStartRef.current.dist > 0) {
                            e.preventDefault();
                            const t1 = e.touches[0];
                            const t2 = e.touches[1];
                            const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                            const factor = dist / touchStartRef.current.dist;
                            const newScale = Math.max(1, Math.min(touchStartRef.current.scale * factor, 4));
                            setZoomScale(newScale);
                          }
                        }}
                        onTouchEnd={() => {
                          touchStartRef.current.dist = 0;
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setZoomScale(prev => prev > 1 ? 1 : 2.5);
                        }}
                        transition={{ type: "spring", stiffness: 220, damping: 26 }}
                        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                      >
                        <motion.img 
                          initial={{ scale: 0.95, opacity: 0.8 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 220, damping: 26 }}
                          src={activeMediaList[lightboxIndex].url} 
                          alt="Gallery display" 
                          referrerPolicy="no-referrer"
                          className={`select-none pointer-events-none transition-all duration-300 ${
                            lightboxAspectFill 
                              ? "w-full h-full object-cover" 
                              : "max-w-full max-h-full object-contain rounded-2xl select-none"
                          }`}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Invisible right tap-to-navigate zone */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextLightbox();
                    }}
                    className="absolute right-0 top-0 bottom-0 w-20 sm:w-28 z-30 cursor-pointer focus:outline-none hover:bg-white/[0.012] active:bg-white/[0.025] transition-colors"
                    aria-label="Next Image"
                  />
                </div>

                {/* Footer specs / progress details */}
                <footer className={`py-6 px-6 text-center text-xs font-mono text-neutral-500 tracking-wider z-40 uppercase transition-all duration-300 ease-in-out ${
                  showLightboxUI ? "opacity-100 transform translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                }`}>
                  {lightboxIndex + 1} / {activeMediaList.length}
                </footer>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SECTION 1.2: CINEMATIC SLIDESHOW PLAYER */}
          <AnimatePresence>
            {slideshowOpen && activeMediaList.length > 0 && (
              <motion.div 
                id="slideshow_portal"
                className="fixed inset-0 z-50 bg-[#060606] flex flex-col justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Header specs */}
                <header className="px-6 py-4 flex items-center justify-between z-10 select-none">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-red-600/25 border border-red-500/25 px-2 py-0.5 rounded text-red-400 font-mono anim-pulse uppercase">
                      CINEMATIC SLIDESHOW ACTIVE
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setIsAutoplay(!isAutoplay)}
                      className={`p-2 font-mono text-[10px] tracking-wider uppercase flex items-center space-x-1 px-3.5 py-1.5 rounding border transition-all ${
                        isAutoplay 
                          ? 'bg-neutral-100 text-black border-white' 
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {isAutoplay ? <Pause size={10} /> : <Play size={10} />}
                      <span>{isAutoplay ? 'ავტო-პაუზა' : 'ავტო-სტარტი'}</span>
                    </button>
                    <button 
                      onClick={() => setSlideshowOpen(false)}
                      className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-full transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </header>

                {/* Active image / media block with MANDATORY rounded-none (Sharp Style) */}
                <div className="flex-1 flex items-center justify-center p-4 relative select-none">
                  
                  {/* Invisible left tap-to-navigate zone */}
                  <button 
                    onClick={handlePrevSlideshow}
                    className="absolute left-0 top-0 bottom-0 w-24 sm:w-32 z-35 cursor-pointer focus:outline-none hover:bg-white/[0.015] active:bg-white/[0.035] transition-colors"
                    aria-label="Previous Slide"
                  />

                  <div className="max-w-4xl max-h-[75vh] w-full h-full flex items-center justify-center bg-transparent relative rounded-none overflow-hidden">
                    <AnimatePresence mode="popLayout">
                      <motion.div
                        key={slideshowIndex}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.4}
                        onDragEnd={(event, info) => {
                          const swipeThreshold = 50;
                          if (info.offset.x < -swipeThreshold) {
                            handleNextSlideshow();
                          } else if (info.offset.x > swipeThreshold) {
                            handlePrevSlideshow();
                          }
                        }}
                        className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4 }}
                      >
                        {activeMediaList[slideshowIndex].type === 'video' ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <video 
                              src={activeMediaList[slideshowIndex].url}
                              controls
                              autoPlay
                              className="max-w-full max-h-[75vh] rounded-none object-contain shadow-2xl"
                            />
                            {/* Minimalist author watermark */}
                            <div className="absolute bottom-4 left-4 z-20 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-sans font-bold shadow-lg select-none border border-white/10">
                              {getAuthorInitial(activeMediaList[slideshowIndex].author)}
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <img 
                              src={activeMediaList[slideshowIndex].url} 
                              alt="Cinematic frame" 
                              referrerPolicy="no-referrer"
                              className="max-w-full max-h-[75vh] rounded-none object-contain shadow-2xl pointer-events-none"
                            />
                            {/* Minimalist author watermark */}
                            <div className="absolute bottom-4 left-4 z-20 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-sans font-bold shadow-lg select-none border border-white/10">
                              {getAuthorInitial(activeMediaList[slideshowIndex].author)}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Invisible right tap-to-navigate zone */}
                  <button 
                    onClick={handleNextSlideshow}
                    className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 z-35 cursor-pointer focus:outline-none hover:bg-white/[0.015] active:bg-white/[0.035] transition-colors"
                    aria-label="Next Slide"
                  />
                </div>

                {/* Author initial badge inside Slideshow Footer */}
                <footer className="py-6 px-6 flex items-center justify-between text-xs font-mono text-neutral-550 border-t border-neutral-950/60 bg-black/50 select-none">
                  <div className="text-neutral-400 font-sans">
                    კომპოზიცია: {activeMediaList[slideshowIndex].author}
                  </div>
                  <div className="text-neutral-500 uppercase tracking-widest text-[10px]">
                    {slideshowIndex + 1} / {activeMediaList.length}
                  </div>
                </footer>
              </motion.div>
            )}
          </AnimatePresence>

        </>
      )}

    </div>
  );
}
