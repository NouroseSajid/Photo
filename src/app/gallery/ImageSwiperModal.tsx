'use client';
// UI constants
const DOWNLOAD_ICON = '/icons/Download.svg';

import { GalleryImage } from '@/pages/api/images';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Placeholder icon components
const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const EmptySquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
  </svg>
);
const XIcon: React.FC<React.HTMLAttributes<HTMLSpanElement>> = (props) => <span {...props}>×</span>;

interface ImageSwiperModalProps {
  open: boolean;
  images: GalleryImage[];
  selectedImageIndex: number | null;
  selectedImages: Array<{ filename: string; folder: string; }>;
  isMultiSelectMode: boolean;
  onClose: () => void;
  onSelect: (image: GalleryImage) => void;
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
  const [activeIndex, setActiveIndex] = useState(selectedImageIndex || 0);

  useEffect(() => {
    if (selectedImageIndex !== null) {
      setActiveIndex(selectedImageIndex);
    }
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
        <Dialog.Panel className="relative bg-white/80 rounded-lg shadow-xl p-0 max-w-screen-xl max-h-[95vh] mx-auto my-auto w-full">
          {/* Top controls row overlay */}
          <div className="absolute top-0 left-0 w-full flex items-center justify-between px-4 py-2 z-50 bg-gradient-to-b from-black/60 to-transparent h-14">
            <div className="flex items-center gap-2">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 ${
                  selectedImages.some(s => s.filename === images[activeIndex]?.filename && s.folder === images[activeIndex]?.folder)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white/90 text-gray-800 hover:bg-white'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isMultiSelectMode) setIsMultiSelectMode(true);
                  onSelect(images[activeIndex]);
                }}
                title={selectedImages.some(s => s.filename === images[activeIndex]?.filename && s.folder === images[activeIndex]?.folder) ? 'Deselect' : 'Select'}
                aria-label={selectedImages.some(s => s.filename === images[activeIndex]?.filename && s.folder === images[activeIndex]?.folder) ? 'Deselect Image' : 'Select Image'}
              >
                {selectedImages.some(s => s.filename === images[activeIndex]?.filename && s.folder === images[activeIndex]?.folder) ? (
                  <>
                    <CheckIcon className="w-5 h-5" />
                    <span>Selected</span>
                  </>
                ) : (
                  <>
                    <EmptySquareIcon className="w-5 h-5" />
                    <span>Select</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isMultiSelectMode ? (
                <button
                  onClick={handleDownloadSelected}
                  disabled={selectedImages.length === 0}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                    selectedImages.length > 0
                      ? 'bg-green-600 text-white shadow-md hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  title="Download Selected"
                  aria-label="Download Selected Images"
                >
                  <Image src={DOWNLOAD_ICON} alt="Download" width={20} height={20} />
                  <span>Download</span>
                  {selectedImages.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white">
                      {selectedImages.length}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    const imageToDownload = images[activeIndex];
                    if (imageToDownload) {
                      console.log('Downloading single image:', imageToDownload.folder, imageToDownload.filename);
                      window.location.href = `/api/download?files=${imageToDownload.folder}/${imageToDownload.filename}`;
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 hover:scale-105"
                  title="Download This Image"
                  aria-label="Download Image"
                >
                  <Image src={DOWNLOAD_ICON} alt="Download" width={20} height={20} />
                  <span>Download</span>
                </button>
              )}

              <button
                className="flex items-center justify-center p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all duration-200 hover:scale-105"
                onClick={onClose}
                aria-label="Close"
                tabIndex={0}
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Swiper area */}
          <div className="flex items-center justify-center w-full" style={{ height: 'calc(95vh - 56px)' }}>
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true, dynamicBullets: true, dynamicMainBullets: 7 }}
              initialSlide={selectedImageIndex || 0}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              passiveListeners={false}
              className="w-full h-full"
            >
              {images.map((img, idx) => {
                // Removed unused isSelected variable
                return (
                  <SwiperSlide
                    key={idx}
                    className="flex items-center justify-center h-full"
                    style={{ touchAction: 'pan-y', position: 'relative' }}
                  >
                    <div className="relative flex flex-col items-center justify-center h-full w-full">
                      {/* Image and selection overlay */}
                      <div className="flex items-center justify-center flex-grow w-full h-full relative">
                        <Image
                          src={img.mediumUrl}
                          alt={img.filename}
                          width={1600}
                          height={1000}
                          className="w-auto h-auto max-w-full max-h-full object-contain"
                          priority={idx === activeIndex}
                          // ...existing code...
                        />
                        {/* Selection checkmark overlay */}

                      </div>

                      {/* Image info at bottom */}
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