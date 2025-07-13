'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { GalleryImage } from '@/pages/api/images';
import { Dialog } from '@headlessui/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper/modules';

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);
  const limit = 12;

  const fetchImages = useCallback(async () => {
    const res = await fetch(`/api/images?page=${page}&limit=${limit}`);
    const data = await res.json();
    setImages(data.images);
    setTotal(data.total);
  }, [page, limit]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      if (wsRef.current) {
        // Clean up existing connection
        wsRef.current.onclose = null;
        wsRef.current.close();
      }

      const ws = new WebSocket(`ws://${window.location.hostname}:3030`);
      wsRef.current = ws;


      ws.onopen = () => {
        console.log('WebSocket connected!');
        if (reconnectInterval.current) {
          clearInterval(reconnectInterval.current);
          reconnectInterval.current = null;
        }
      };


      ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting...');
        // Attempt reconnect every 3 seconds
        if (!reconnectInterval.current) {
          reconnectInterval.current = setInterval(connectWebSocket, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close(); // Will trigger onclose
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === 'refresh') {
            setShowRefreshBanner(true);
            setTimeout(() => setShowRefreshBanner(false), 2000);
            fetchImages();
          }
          if (data.type === 'log') setLogs((prevLogs) => [...prevLogs, data.msg]);
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectInterval.current) {
        clearInterval(reconnectInterval.current);
        reconnectInterval.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchImages]);

  const totalPages = Math.ceil(total / limit);

  const handleImageSelect = (filename: string) => {
    setSelectedImages((prevSelected) =>
      prevSelected.includes(filename)
        ? prevSelected.filter((name) => name !== filename)
        : [...prevSelected, filename]
    );
  };

  const handleDownloadSelected = () => {
    if (selectedImages.length > 0) {
      const filenames = selectedImages.join(',');
      window.location.href = `/api/download?files=${filenames}`;
    } else {
      alert('Please select images to download.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {showRefreshBanner && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center py-2 z-50 font-bold shadow-lg animate-pulse">
          🔄 Refresh broadcast received!
        </div>
      )}

      <div className="flex justify-center mb-2">
        <button
          onClick={() => {
            if (wsRef.current && wsRef.current.readyState === 1) {
              const message = JSON.stringify({ type: 'log', msg: 'hi from gallery page' });
              wsRef.current.send(message);
            }
          }}
          className="px-4 py-2 bg-gray-800 text-white rounded shadow hover:bg-gray-700"
        >
          Say Hi (console)
        </button>
      </div>
      <h1 className="text-3xl font-bold text-center mb-6">📸 Gallery</h1>

      <div className="flex justify-center mb-4">
        <button
          onClick={handleDownloadSelected}
          disabled={selectedImages.length === 0}
          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          Download Selected ({selectedImages.length})
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="rounded-xl overflow-hidden shadow relative cursor-pointer hover:shadow-lg transition"
            onClick={() => setSelectedImageIndex(idx)}
          >
            <input
              type="checkbox"
              className="absolute top-2 left-2 z-10"
              checked={selectedImages.includes(img.filename)}
              onChange={(e) => {
                e.stopPropagation();
                handleImageSelect(img.filename);
              }}
            />
            <Image
              src={img.thumbnailUrl}
              alt={img.filename}
              width={400}
              height={300}
              className="w-full h-40 object-cover"
            />
          </div>
        ))}
      </div>

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

      <Dialog open={selectedImageIndex !== null} onClose={() => setSelectedImageIndex(null)} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <Dialog.Panel className="w-full h-full flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              initialSlide={selectedImageIndex || 0}
              className="w-full h-full"
            >
              {images.map((img, idx) => (
                <SwiperSlide key={idx} className="flex items-center justify-center h-full">
                  <div className="relative flex flex-col items-center justify-center h-full w-full">
                    <div className="flex items-center justify-center h-full w-full">
                      <Image
                        src={img.mediumUrl}
                        alt={img.filename}
                        width={1200}
                        height={800}
                        className="w-auto h-auto max-w-full max-h-[80vh] object-contain"
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 bg-black/50 text-white p-4 w-full">
                      <strong>{img.filename}</strong><br />
                      {new Date(img.modified).toLocaleString()}
                    </div>
                    <a
                      href={`/api/download?files=${img.filename}`}
                      download
                      className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition"
                    >
                      Download
                    </a>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </Dialog.Panel>
      </Dialog>

      <div className="mt-6 p-4 bg-gray-100 rounded-lg max-h-60 overflow-y-auto text-xs font-mono">
        <h3 className="font-bold mb-2">Logs:</h3>
        {logs.map((log, index) => (
          <p key={index}>{log}</p>
        ))}
      </div>
    </div>
  );
}
