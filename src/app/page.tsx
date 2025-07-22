'use client';

import { useEffect, useState, useCallback } from 'react';
// Simple pull-to-refresh wrapper for mobile
import React, { useRef } from 'react';

function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void>, children: React.ReactNode }) {
  const startY = useRef<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current !== null) {
      const distance = e.touches[0].clientY - startY.current;
      if (distance > 80 && !isRefreshing) {
        setIsRefreshing(true);
        onRefresh().finally(() => {
          setIsRefreshing(false);
        });
        startY.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    startY.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ width: '100%' }}
    >
      {isRefreshing && (
        <div className="w-full text-center py-2 text-blue-500 font-semibold animate-pulse">🔄 Reloading…</div>
      )}
      {children}
    </div>
  );
}
import Footer from '@/app/components/Footer';
import { GalleryImage } from '@/pages/api/images';
import ImageSwiperModal from './gallery/ImageSwiperModal';
import { GalleryGrid } from './gallery/GalleryGrid';
import MultiSelectToolbar from './gallery/MultiSelectToolbar';
import RefreshBanner from './gallery/RefreshBanner';
import ConfirmationModal from './components/ConfirmationModal'; // Re-using the modal
import RenameFolderModal from './components/RenameFolderModal';
import MoveImagesModal from './components/MoveImagesModal';
import toast, { Toaster } from 'react-hot-toast';

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<Array<{ filename: string; folder: string; }>>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showRefreshBanner] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<string | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [galleryGridKey, setGalleryGridKey] = useState(0);

  const fetchImages = useCallback(async (newPage = 0, folder = selectedFolder) => {
    const res = await fetch(`/api/images?page=${newPage}&folder=${folder || ''}`)
    const data = await res.json();
    const newImages = data.images || []; // Ensure newImages is an array
    setImages(prev => newPage === 0 ? newImages : [...prev, ...newImages]);
    setHasMore(newImages.length > 0);
  }, [selectedFolder]);

  const fetchFolders = async () => {
    const res = await fetch('/api/folders');
    const data = await res.json();
    console.log('Fetched folders:', data.folders);
    setFolders(data.folders);
  };

  useEffect(() => {
    fetchFolders();
    fetchImages(0);
  }, [fetchImages]);

  const handleLoadMore = () => {
    const newPage = page + 1;
    setPage(newPage);
    fetchImages(newPage);
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFolder(e.target.value);
    setPage(0);
    fetchImages(0, e.target.value);
  };

  const handleImageSelect = (image: { filename: string; folder: string; }) => {
    setSelectedImages((prevSelected) =>
      prevSelected.some(s => s.filename === image.filename && s.folder === image.folder)
        ? prevSelected.filter((s) => !(s.filename === image.filename && s.folder === image.folder))
        : [...prevSelected, image]
    );
  };

  const handleDownloadSelected = () => {
    if (selectedImages.length === 0) return toast.error('No images selected');
    toast.loading('Building ZIP…', { id: 'zip' });
    const filesToDownload = selectedImages.map(img => `${img.folder}/${img.filename}`);
    console.log('Downloading multiple images:', filesToDownload);
    window.location.href = `/api/download?files=${filesToDownload.join(',')}`;
    setTimeout(() => toast.dismiss('zip'), 2000);
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.length === 0) {
      toast.error('Please select images to delete.');
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const res = await fetch('/api/deleteImage', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageNames: selectedImages.map(img => ({ filename: img.filename, folder: img.folder })) }),
    });

    if (res.ok) {
      fetchImages(0);
      setSelectedImages([]);
      setIsMultiSelectMode(false);
      toast.success('Images deleted successfully');
    } else {
      toast.error('Failed to delete images');
    }
    setIsDeleteModalOpen(false);
  };

  const handleRenameFolder = async (oldName: string, newName: string) => {
    if (!oldName || !newName) return;
    toast.loading('Renaming folder…', { id: 'rename' });
    try {
      const res = await fetch('/api/renameFolder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldFolderName: oldName, newFolderName: newName }),
      });

      if (res.ok) {
        toast.success('Folder renamed successfully!', { id: 'rename' });
        fetchFolders(); // Refresh folders list
        fetchImages(0, newName); // Refresh images in the new folder
        setSelectedFolder(newName); // Update selected folder
      } else {
        const errorData = await res.json();
        toast.error(`Failed to rename folder: ${errorData.error || 'Unknown error'}`, { id: 'rename' });
      }
    } catch (error) {
      toast.error(`An error occurred: ${error instanceof Error ? error.message : String(error)}`, { id: 'rename' });
    }
    setIsRenameModalOpen(false);
    setFolderToRename(null);
  };

  const handleOpenRenameModal = () => {
    if (selectedFolder) {
      setFolderToRename(selectedFolder);
      setIsRenameModalOpen(true);
    } else {
      toast.error('Please select a folder to rename.');
    }
  };

  const handleMoveImages = async (targetFolder: string) => {
    if (selectedImages.length === 0) {
      toast.error('Please select images to move.');
      return;
    }
    toast.loading(`Moving ${selectedImages.length} image(s) to ${targetFolder}…`, { id: 'move' });
    try {
      const res = await fetch('/api/moveImages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageNames: selectedImages, targetFolder }),
      });

      if (res.ok) {
        toast.success('Images moved successfully!', { id: 'move' });
        fetchImages(0, selectedFolder); // Refresh current folder
        setSelectedImages([]);
        setIsMultiSelectMode(false);
        setGalleryGridKey(prevKey => prevKey + 1); // Increment key to force re-render
      } else {
        const errorData = await res.json();
        toast.error(`Failed to move images: ${errorData.error || 'Unknown error'}`, { id: 'move' });
      }
    } catch (error) {
      toast.error(`An error occurred: ${error instanceof Error ? error.message : String(error)}`, { id: 'move' });
    }
    setIsMoveModalOpen(false);
  };

  const handleOpenMoveModal = () => {
    if (selectedImages.length === 0) {
      toast.error('Please select images to move.');
      return;
    }
    setIsMoveModalOpen(true);
  };

  // Keyboard shortcuts for multi-select and deselect
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsMultiSelectMode(true);
        setSelectedImages(images.map(i => ({ filename: i.filename, folder: i.folder })));
      }
      if (e.key === 'Escape') {
        setIsMultiSelectMode(false);
        setSelectedImages([]);
        setSelectedImageIndex(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images]);

  // Handle browser back button for closing the dialog
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.dialogOpen) {
        setSelectedImageIndex(null);
      }
    };

    if (selectedImageIndex !== null) {
      // When dialog opens, push a new state to history
      history.pushState({ dialogOpen: true }, '', window.location.href);
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedImageIndex]);

  return (
    <div className="min-h-screen bg-white p-4 flex flex-col">
      <Toaster />
      <RefreshBanner show={showRefreshBanner} />

      {!isMultiSelectMode && (
        <div className="sm:hidden w-full text-center text-gray-500 text-sm mb-4">
          Long press an image for multi-select
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <MultiSelectToolbar
          isMultiSelectMode={isMultiSelectMode}
          selectedImagesCount={selectedImages.length}
          onStartMultiSelect={() => setIsMultiSelectMode(true)}
          onCancel={() => {
            setIsMultiSelectMode(false);
            setSelectedImages([]);
          }}
          onDownload={handleDownloadSelected}
          onDelete={handleDeleteSelected}
          onRenameFolder={handleOpenRenameModal}
          onMoveImages={handleOpenMoveModal}
        />
        <div className="flex items-center pr-4 ml-auto">
          <select onChange={handleFolderChange} value={selectedFolder || ''} className="border border-gray-300 rounded-md p-2 text-gray-900 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500 min-w-max">
            <option value="">All Folders</option>
            {folders.length === 0 && (
              <option disabled>No folders found</option>
            )}
            {folders.map(folder => (
              <option key={folder} value={folder}>{folder}</option>
            ))}
          </select>
          {selectedFolder && <span className="ml-4 text-lg font-semibold text-gray-900">{selectedFolder}</span>}
        </div>
      </div>

      <PullToRefresh onRefresh={() => fetchImages(0)}>
        {images.length === 0 && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 text-center py-4 bg-gray-100 rounded-lg text-gray-700 text-2xl font-semibold z-50">
            No images yet.
          </div>
        )}
        <GalleryGrid
          key={galleryGridKey}
          images={images}
          selectedImages={selectedImages}
          isMultiSelectMode={isMultiSelectMode}
          onImageSelect={handleImageSelect}
          onImageClick={setSelectedImageIndex}
          setIsMultiSelectMode={setIsMultiSelectMode}
        />
      </PullToRefresh>

      {hasMore && (
        <button onClick={handleLoadMore} className="bg-blue-500 text-white p-2 rounded mt-4">
          Load More
        </button>
      )}

      <ImageSwiperModal
        open={selectedImageIndex !== null}
        images={images}
        selectedImageIndex={selectedImageIndex}
        selectedImages={selectedImages}
        isMultiSelectMode={isMultiSelectMode}
        onClose={() => setSelectedImageIndex(null)}
        onSelect={handleImageSelect}
        setIsMultiSelectMode={setIsMultiSelectMode}
        handleDownloadSelected={handleDownloadSelected}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        message={`Are you sure you want to delete ${selectedImages.length} image(s)?`}
      />

      <RenameFolderModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onConfirm={handleRenameFolder}
        oldFolderName={folderToRename}
      />

      <MoveImagesModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        onConfirm={handleMoveImages}
        folders={folders}
        selectedImagesCount={selectedImages.length}
      />

      {/* FOOTER ONLY ON THIS PAGE */}
      <Footer />
    </div>
  );
}