
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export interface GalleryImage {
  filename: string;
  mediumUrl: string;
  modified: number | string;
}

interface ImageSwiperModalProps {
  open: boolean;
  images: GalleryImage[];
  selectedImageIndex: number | null;
  selectedImages: string[];
  isMultiSelectMode: boolean;
  onClose: () => void;
  onSelect: (filename: string) => void;
  setIsMultiSelectMode: (v: boolean) => void;
  handleDownloadSelected: () => void;
}



interface ImageSwiperModalProps {
  open: boolean;
  images: GalleryImage[];
  selectedImageIndex: number | null;
  selectedImages: string[];
  isMultiSelectMode: boolean;
  onClose: () => void;
  onSelect: (filename: string) => void;
  setIsMultiSelectMode: (v: boolean) => void;
  handleDownloadSelected: () => void;
}

const ImageSwiperModal: React.FC<ImageSwiperModalProps> = ({
  open,
  images,
  selectedImageIndex,
  selectedImages,
  isMultiSelectMode,
  onClose,
  onSelect,
  setIsMultiSelectMode,
  handleDownloadSelected,
}) => {
  const [swiperIndex, setSwiperIndex] = useState(selectedImageIndex || 0);

  useEffect(() => {
    if (selectedImageIndex !== null) setSwiperIndex(selectedImageIndex);
  }, [selectedImageIndex]);

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      {/* Overlay: click to close */}
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <Dialog.Panel className="relative bg-transparent rounded-lg shadow-xl p-0 max-w-screen-xl max-h-[95vh] mx-auto my-auto w-full">
          {/* Top controls row overlay */}
          <div className="absolute top-0 left-0 w-full flex items-center justify-between px-4 py-2 z-50" style={{height:'56px', background:'linear-gradient(to bottom,rgba(0,0,0,0.5),rgba(0,0,0,0))'}}>
            {/* Select circle */}
            <div
              className={`bg-white/80 hover:bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-2xl cursor-pointer border-2 ${selectedImages.includes(images[swiperIndex]?.filename) ? 'border-blue-500' : 'border-gray-300'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!isMultiSelectMode) setIsMultiSelectMode(true);
                onSelect(images[swiperIndex]?.filename);
              }}
              title={selectedImages.includes(images[swiperIndex]?.filename) ? 'Deselect' : 'Select'}
            >
              {selectedImages.includes(images[swiperIndex]?.filename) ? '✓' : ''}
            </div>
            {/* Download icon button */}
            <button
              onClick={() => {
                if (selectedImages.length > 0) handleDownloadSelected();
              }}
              disabled={selectedImages.length === 0}
              className="bg-white/80 hover:bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-xl border-2 border-gray-300 disabled:bg-gray-200 disabled:text-gray-400"
              style={{marginLeft:'8px'}}
              title="Download Selected"
            >
              <Image src="/icon/download.svg" alt="Download" width={24} height={24} />
            </button>
            {/* X Close Button */}
            <button
              className="bg-white/80 hover:bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-2xl border-2 border-gray-300 ml-2"
              onClick={onClose}
              aria-label="Close"
              tabIndex={0}
            >
              ×
            </button>
          </div>
          {/* Swiper area, 90vh */}
          <div className="flex items-center justify-center w-full" style={{height:'90vh'}}>
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              initialSlide={selectedImageIndex || 0}
              onSlideChange={(swiper) => setSwiperIndex(swiper.activeIndex)}
              passiveListeners={false}
              className="w-full h-full"
            >
              {images.map((img, idx) => {
                const isSelected = selectedImages.includes(img.filename);
                return (
                  <SwiperSlide
                    key={idx}
                    className="flex items-center justify-center h-full"
                    style={{ touchAction: 'pan-y' }}
                  >
                    <div className="relative flex flex-col items-center justify-center h-full w-full">
                      {/* Selected circle in center if selected (optional) */}
                      {isSelected && (
                        <div className="absolute top-1/2 left-1/2 z-40 bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg text-lg font-bold border-4 border-white" style={{transform:'translate(-50%,-50%)'}}>
                          Selected
                        </div>
                      )}
                      <div className="flex items-center justify-center flex-grow w-full h-full">
                        <Image
                          src={img.mediumUrl}
                          alt={img.filename}
                          width={1600}
                          height={1000}
                          className="w-auto h-auto max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 bg-black/50 text-white p-4 w-full">
                        <strong>{img.filename}</strong><br />
                        {new Date(typeof img.modified === 'string' ? Date.parse(img.modified) : img.modified).toLocaleString()}
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ImageSwiperModal;
