import React from 'react';
import { useSession } from 'next-auth/react';

interface MultiSelectToolbarProps {
  isMultiSelectMode: boolean;
  selectedImagesCount: number;
  onStartMultiSelect: () => void;
  onCancel: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

const MultiSelectToolbar: React.FC<MultiSelectToolbarProps> = ({
  isMultiSelectMode,
  selectedImagesCount,
  onStartMultiSelect,
  onCancel,
  onDownload,
  onDelete,
}) => {
  const { data: session } = useSession();

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm rounded-2xl" style={{ minHeight: '72px' }}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {!isMultiSelectMode ? (
            <div className="flex items-center gap-4 border border-transparent py-2 min-h-[56px]">
              <button
                onClick={onStartMultiSelect}
                className="hidden sm:block group flex items-center gap-2 px-8 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 whitespace-nowrap flex-shrink-0"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Select Images
                </span>
              </button>
            </div>
          ) : (
            <div className={`flex flex-wrap items-center justify-center gap-4 py-2 min-h-[56px] transition-opacity duration-300 ease-in-out ${isMultiSelectMode ? 'opacity-100' : 'opacity-0'}`}>
              {/* Selection counter */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg border border-blue-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">
                  {selectedImagesCount} {selectedImagesCount === 1 ? 'image' : 'images'} selected
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  aria-label="Cancel selection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden sm:inline">Cancel</span>
                </button>

                <button
                  onClick={onDownload}
                  disabled={selectedImagesCount === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
                  aria-label={`Download ${selectedImagesCount} selected images`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download</span>
                  {selectedImagesCount > 0 && (
                    <span className="bg-green-800 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {selectedImagesCount}
                    </span>
                  )}
                </button>

                {session && (
                  <button
                    onClick={onDelete}
                    disabled={selectedImagesCount === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
                    aria-label={`Delete ${selectedImagesCount} selected images`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                    {selectedImagesCount > 0 && (
                      <span className="bg-red-800 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        {selectedImagesCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiSelectToolbar;