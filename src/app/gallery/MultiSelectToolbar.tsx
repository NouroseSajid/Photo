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
    <div className="flex justify-center mb-4 space-x-4">
      {!isMultiSelectMode ? (
        <button
          onClick={onStartMultiSelect}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          Select Images
        </button>
      ) : (
        <>
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={onDownload}
            disabled={selectedImagesCount === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            Download Selected ({selectedImagesCount})
          </button>
          {session && (
            <button
              onClick={onDelete}
              disabled={selectedImagesCount === 0}
              className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              Delete Selected ({selectedImagesCount})
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default MultiSelectToolbar;
