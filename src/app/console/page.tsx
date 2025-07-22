'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export default function ConsolePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  // Optionally use a token from env (replace with your method of providing the token)
  const WS_AUTH_TOKEN = process.env.NEXT_PUBLIC_WS_AUTH_TOKEN || '';

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/folders');
      const data = await res.json();
      setFolders(data.folders);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  }, []);

  const handleRename = async (oldName: string) => {
    const newName = prompt(`Enter new name for ${oldName}:`);
    if (newName && newName.trim() !== '') {
      try {
        const res = await fetch('/api/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ oldName, newName }),
        });
        if (res.ok) {
          fetchFolders();
        } else {
          const data = await res.json();
          alert(`Error: ${data.error}`);
        }
      } catch (error) {
        console.error('Error renaming folder:', error);
        alert('An unexpected error occurred.');
      }
    }
  };

  const connectWebSocket = useCallback(() => {
    let wsUrl = `ws://${window.location.hostname}:3030`;
    if (WS_AUTH_TOKEN) {
      wsUrl += `?token=${encodeURIComponent(WS_AUTH_TOKEN)}`;
    }
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => console.log('WebSocket connected!');
    ws.onclose = () => {
      console.log('WebSocket disconnected. Reconnecting...');
      setTimeout(connectWebSocket, 3000);
    };
    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        console.log('Received WS message:', data);
        if (data.type === 'log') {
          setLogs((prev) => [...prev, data.msg]);
        } else if (data.type === 'error' && data.message) {
          setLogs((prev) => [...prev, `⚠️ Server error: ${data.message}`]);
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };
  }, [WS_AUTH_TOKEN]);

  useEffect(() => {
    connectWebSocket();
    fetchFolders();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket, fetchFolders]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div className="min-h-screen bg-black text-green-300 font-mono p-4">
      <h1 className="text-xl font-bold mb-4 text-green-400">🧠 Server Console (/console)</h1>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-bold mb-2 text-green-400">Folders</h2>
          <div className="bg-gray-900 p-4 rounded-lg h-[75vh] overflow-y-scroll border border-green-500">
            {folders.map((folder) => (
              <div key={folder} className="flex justify-between items-center mb-2">
                <span>{folder}</span>
                <button
                  onClick={() => handleRename(folder)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                >
                  Rename
                </button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold mb-2 text-green-400">Logs</h2>
          <div
            ref={containerRef}
            className="bg-gray-900 p-4 rounded-lg h-[75vh] overflow-y-scroll border border-green-500"
          >
            {logs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
