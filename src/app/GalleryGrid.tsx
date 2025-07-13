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
  return (
    <div className="grid" style={{
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gridAutoRows: '10px',
      gap: '8px'
    }}>
      {images.map((img, idx) => {
        const aspectRatio = img.width / img.height;
        const rowSpan = Math.ceil((200 / aspectRatio) / 10) + 2;
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
            className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
              isSelected ? 'ring-4 ring-blue-500' : 'hover:shadow-lg'
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
              {isMultiSelectMode && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                    checked={isSelected}
                    readOnly
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GalleryGrid;
