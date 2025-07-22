import React, { useState, useEffect } from 'react';

interface RenameFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (oldName: string, newName: string) => void;
  oldFolderName: string | null;
}

const RenameFolderModal: React.FC<RenameFolderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  oldFolderName,
}) => {
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (isOpen && oldFolderName) {
      setNewFolderName(oldFolderName);
    }
  }, [isOpen, oldFolderName]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (oldFolderName && newFolderName) {
      onConfirm(oldFolderName, newFolderName);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Rename Folder</h2>
        <p className="mb-4">Renaming: <span className="font-bold">{oldFolderName}</span></p>
        <input
          type="text"
          className="border p-2 w-full mb-4 rounded"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="New folder name"
        />
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
            disabled={!newFolderName || newFolderName === oldFolderName}
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameFolderModal;
