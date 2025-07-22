import React, { useState } from 'react';

interface MoveImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetFolder: string) => void;
  folders: string[];
  selectedImagesCount: number;
}

const MoveImagesModal: React.FC<MoveImagesModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  folders,
  selectedImagesCount,
}) => {
  const [selectedTargetFolder, setSelectedTargetFolder] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedTargetFolder) {
      onConfirm(selectedTargetFolder);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Move Images</h2>
        <p className="mb-4">Move {selectedImagesCount} selected image(s) to folder:</p>
        <select
          className="border p-2 w-full mb-4 rounded"
          value={selectedTargetFolder}
          onChange={(e) => setSelectedTargetFolder(e.target.value)}
        >
          <option value="">Select a folder</option>
          {folders.map((folder) => (
            <option key={folder} value={folder}>
              {folder}
            </option>
          ))}
        </select>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={!selectedTargetFolder}
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveImagesModal;
