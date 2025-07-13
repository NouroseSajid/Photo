'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { GalleryImage } from '@/pages/api/images';
import { Dialog } from '@headlessui/react';

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const limit = 12;

  const fetchImages = async () => {
    const res = await fetch(`/api/images?page=${page}&limit=${limit}`);
    const data = await res.json();
    setImages(data.images);
    setTotal(data.total);
  };

  // WebSocket for real-time refresh and logs
  useEffect(() => {
    fetchImages();
    const ws = new WebSocket('ws://localhost:3030');
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === 'refresh') fetchImages();
      if (data.type === 'log') setLogs((prevLogs) => [...prevLogs, data.msg]);
    };
    return () => ws.close();
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">📸 Gallery</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="rounded-xl overflow-hidden shadow cursor-pointer hover:shadow-lg transition"
            onClick={() => setSelectedImage(img)}
          >
            <Image
              src={img.thumbnailUrl}
              alt={img.filename}
              width={400}
              height={300}
              className="w-full h-40 object-cover"
            />
            <div className="p-2 text-xs text-gray-700">{img.filename}</div>
            <div className="px-2 pb-2 text-[10px] text-gray-500">
              {new Date(img.modified).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Buttons */}
      <div className="mt-6 flex justify-center gap-4 text-sm">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
        >
          ⬅ Previous
        </button>
        <span className="text-gray-700 mt-1">Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
        >
          Next ➡
        </button>
      </div>

      {/* Modal */}
      <Dialog open={!!selectedImage} onClose={() => setSelectedImage(null)} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        {selectedImage && (
          <Dialog.Panel className="max-w-4xl rounded-lg overflow-hidden bg-white">
            <Image
              src={selectedImage.fullUrl}
              alt="Full"
              width={1200}
              height={800}
              className="w-full object-contain max-h-[80vh]"
            />
            <div className="p-4 text-sm">
              <strong>{selectedImage.filename}</strong><br />
              {new Date(selectedImage.modified).toLocaleString()}
            </div>
          </Dialog.Panel>
        )}
      </Dialog>

      {/* Log Display */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg max-h-60 overflow-y-auto text-xs font-mono">
        <h3 className="font-bold mb-2">Logs:</h3>
        {logs.map((log, index) => (
          <p key={index}>{log}</p>
        ))}
      </div>
    </div>
  );
}
