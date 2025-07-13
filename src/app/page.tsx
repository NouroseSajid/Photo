'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { GalleryImage } from '@/pages/api/images';
import ImageSwiperModal from './ImageSwiperModal';
import GalleryGrid from './GalleryGrid';
import MultiSelectToolbar from './MultiSelectToolbar';
import RefreshBanner from './RefreshBanner';

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);

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
      alert('Please select images to download.');
    }
  };

  // WebSocket connection (unchanged from your original)
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }

      const ws = new WebSocket(`ws://${window.location.hostname}:3030`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected!');
        if (reconnectInterval.current) {
          clearInterval(reconnectInterval.current);
          reconnectInterval.current = null;
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting...');
        if (!reconnectInterval.current) {
          reconnectInterval.current = setInterval(connectWebSocket, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === 'refresh') {
            setShowRefreshBanner(true);
            setTimeout(() => setShowRefreshBanner(false), 2000);
            fetchImages();
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectInterval.current) {
        clearInterval(reconnectInterval.current);
        reconnectInterval.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchImages]);

  // Close dialog on Escape or Back button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        setSelectedImageIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle browser back button for closing the dialog
  useEffect(() => {
    if (selectedImageIndex !== null) {
      // When dialog opens, push a new state to history
      history.pushState({ dialogOpen: true }, '', window.location.href);
    }

    const handlePopState = (event: PopStateEvent) => {
      // If dialog is open and popstate occurs, close dialog
      if (selectedImageIndex !== null) {
        setSelectedImageIndex(null);
        // Prevent default back navigation if dialog was open
        if (event.state && event.state.dialogOpen) {
          // If the state was pushed by us, we don't need to do anything else
          // as setting selectedImageIndex(null) already handles it.
        } else {
          // If the state was not pushed by us, it means user navigated back from outside
          // We need to push a new state to prevent going back further than expected
          history.pushState({ dialogOpen: true }, '', window.location.href);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Clean up history if dialog was open when component unmounts
      if (selectedImageIndex !== null) {
        history.back(); // Go back one step to remove our pushed state
      }
    };
  }, [selectedImageIndex]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col" style={{ height: '100vh' }}>
      <RefreshBanner show={showRefreshBanner} />

      <h1 className="text-3xl font-bold text-center mb-6 text-black">📸 Gallery</h1>

      <MultiSelectToolbar
        isMultiSelectMode={isMultiSelectMode}
        selectedImagesCount={selectedImages.length}
        onStartMultiSelect={() => setIsMultiSelectMode(true)}
        onCancel={() => {
          setIsMultiSelectMode(false);
          setSelectedImages([]);
        }}
        onDownload={handleDownloadSelected}
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
    </div>
  );
}