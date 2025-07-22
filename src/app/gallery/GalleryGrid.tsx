import React, { useEffect } from 'react';
// Skeleton placeholder for images
const ImageSkeleton = () => (
  <div
    className="rounded-xl bg-gray-200 animate-pulse"
    style={{ gridRowEnd: 'span 25', minHeight: '200px', maxHeight: '320px' }}
  />
);

import Image from 'next/image';
import { GalleryImage } from '@/pages/api/images';

interface GalleryGridProps {
  images: GalleryImage[];
  selectedImages: string[];
  isMultiSelectMode: boolean;
  onImageSelect: (filename: string) => void;
  onImageClick: (idx: number) => void;
  setIsMultiSelectMode: (v: boolean) => void;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({
  images,
  selectedImages,
  isMultiSelectMode,
  onImageSelect,
  onImageClick,
  setIsMultiSelectMode,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {}, 600); // Simulate loading
    return () => clearTimeout(timer);
  }, [images]);

  

  // Spinner/placeholder logic can be added here if needed

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 grid-container-with-scrollbar">
      {images.length === 0 && Array.from({ length: 12 }).map((_, i) => <ImageSkeleton key={i} />)}
      {images.map((img, idx) => {
        const isSelected = selectedImages.includes(img.filename);
        let pressTimer: NodeJS.Timeout | null = null;

        const handlePressStart = () => {
          pressTimer = setTimeout(() => {
            if (!isMultiSelectMode) {
              setIsMultiSelectMode(true);
              onImageSelect(img.filename);
            }
          }, 500);
        };

        const handlePressEnd = () => {
          if (pressTimer) {
            clearTimeout(pressTimer);
          }
        };

        const handleClick = () => {
          if (isMultiSelectMode) {
            onImageSelect(img.filename);
            if (navigator.vibrate) navigator.vibrate(20); // light buzz
          } else {
            onImageClick(idx);
          }
        };

        return (
          <div
            key={`${img.filename}-${idx}`}
            className={`group relative rounded-xl overflow-hidden transition-all duration-300 ease-out transform cursor-pointer ${
              isSelected
                ? 'ring-4 ring-blue-500 ring-opacity-80 shadow-2xl scale-[1.02]'
                : 'hover:shadow-xl hover:scale-[1.01] hover:ring-2 hover:ring-gray-300'
            }`}
            onClick={handleClick}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            style={{
              minHeight: '280px',
            }}
          >
            {/* Image */}
            <Image
              src={img.thumbnailUrl}
              alt={img.filename}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
              priority={idx < 12}
              // ...removed blur placeholder...
            />

            {/* Semi-transparent overlay with folder date */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />

            {/* New image badge */}
            {img.isNew && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md">
                New
              </div>
            )}

            {/* Selection checkmark */}
            {isSelected && (
              <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-2 shadow-lg animate-pulse">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}