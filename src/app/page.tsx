'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { GalleryImage } from '@/pages/api/images';
import ImageSwiperModal from './gallery/ImageSwiperModal';
import GalleryGrid from './gallery/GalleryGrid';
import MultiSelectToolbar from './gallery/MultiSelectToolbar';
import RefreshBanner from './gallery/RefreshBanner';
import ConfirmationModal from './components/ConfirmationModal'; // Re-using the modal
import toast, { Toaster } from 'react-hot-toast';

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchImages = useCallback(async () => {
    const res = await fetch(`/api/images`);
    const data = await res.json();
    setImages(data.images);
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleImageSelect = (filename: string) => {
    setSelectedImages((prevSelected) =>
      prevSelected.includes(filename)
        ? prevSelected.filter((name) => name !== filename)
        : [...prevSelected, filename]
    );
  };

  const handleDownloadSelected = () => {
    if (selectedImages.length > 0) {
      const filenames = selectedImages.join(',');
      window.location.href = `/api/download?files=${filenames}`;
    } else {
      toast.error('Please select images to download.');
    }
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
      body: JSON.stringify({ imageNames: selectedImages }),
    });

    if (res.ok) {
      fetchImages();
      setSelectedImages([]);
      setIsMultiSelectMode(false);
      toast.success('Images deleted successfully');
    } else {
      toast.error('Failed to delete images');
    }
    setIsDeleteModalOpen(false);
  };

  // Close dialog on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col" style={{ height: '100vh' }}>
      <Toaster />
      <RefreshBanner show={showRefreshBanner} />

      <h1 className="text-3xl font-bold text-center mb-6 text-black">Gentsefeest 2025</h1>

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
      />

      <GalleryGrid
        images={images}
        selectedImages={selectedImages}
        isMultiSelectMode={isMultiSelectMode}
        onImageSelect={handleImageSelect}
        onImageClick={setSelectedImageIndex}
        setIsMultiSelectMode={setIsMultiSelectMode}
      />

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
    </div>
  );
}