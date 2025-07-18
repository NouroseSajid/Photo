import React from 'react';
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

const GalleryGrid: React.FC<GalleryGridProps> = ({
  images,
  selectedImages,
  isMultiSelectMode,
  onImageSelect,
  onImageClick,
  setIsMultiSelectMode,
}) => {
  const MAX_IMAGE_HEIGHT = 300; // Define max height for images in pixels

  return (
    <div className="grid" style={{
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gridAutoRows: '10px',
      gap: '8px'
    }}>
      {images.map((img, idx) => {
        const targetWidth = 200; // The minmax width for grid columns
        const naturalHeight = img.height; // Original image height
        const naturalWidth = img.width; // Original image width

        // Calculate height based on targetWidth, then cap it at MAX_IMAGE_HEIGHT
        let displayHeight = (naturalHeight / naturalWidth) * targetWidth;
        if (displayHeight > MAX_IMAGE_HEIGHT) {
          displayHeight = MAX_IMAGE_HEIGHT;
        }

        const rowSpan = Math.ceil(displayHeight / 10) + 2; // +2 for padding/gap adjustment

        console.log(`Image: ${img.filename}, Original: ${naturalWidth}x${naturalHeight}, DisplayHeight: ${displayHeight.toFixed(2)}, RowSpan: ${rowSpan}`);

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
          clearTimeout(pressTimer as NodeJS.Timeout);
        };

        const handleClick = () => {
          if (isMultiSelectMode) {
            onImageSelect(img.filename);
          } else {
            onImageClick(idx);
          }
        };

        return (
          <div
            key={idx}
            className={`relative rounded-lg overflow-hidden transition-all duration-300 ease-in-out transform ${ // Increased duration for smoother transition
              isSelected ? 'ring-4 ring-blue-500' : 'hover:shadow-lg hover:scale-105' // Added scale effect
            }`}
            onClick={handleClick}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            style={{ gridRowEnd: `span ${rowSpan}` }}
          >
            <div className="relative w-full h-full">
              <Image
                src={img.thumbnailUrl}
                alt={img.filename}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 200px"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 transition-opacity duration-300 flex flex-col items-center justify-center text-white text-center p-2 opacity-0 hover:opacity-100">
                <p className="text-sm font-semibold break-all mb-2">{img.filename}</p>
                <div className="flex space-x-4">
                  {/* Select/Check Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent image click from opening modal
                      if (!isMultiSelectMode) setIsMultiSelectMode(true);
                      onImageSelect(img.filename);
                    }}
                    className={`bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors ${isSelected ? 'bg-blue-500' : ''}`}
                    title={isSelected ? 'Deselect Image' : 'Select Image'}
                  >
                    {isSelected ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>

                  {/* Download Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent image click from opening modal
                      window.location.href = `/api/download?files=${img.filename}`;
                    }}
                    className="bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors"
                    title="Download Image"
                  >
                    <Image src="/icons/Download.svg" alt="Download" width={24} height={24} />
                  </button>

                  {/* View Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent image click from opening modal
                      onImageClick(idx);
                    }}
                    className="bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors"
                    title="View Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
              {/* Removed redundant checkbox in multi-select mode */}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GalleryGrid;
