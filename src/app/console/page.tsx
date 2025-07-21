'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export default function ConsolePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  // Optionally use a token from env (replace with your method of providing the token)
  const WS_AUTH_TOKEN = process.env.NEXT_PUBLIC_WS_AUTH_TOKEN || '';
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
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div className="min-h-screen bg-black text-green-300 font-mono p-4">
      <h1 className="text-xl font-bold mb-4 text-green-400">🧠 Server Console (/console)</h1>
      <div
        ref={containerRef}
        className="bg-gray-900 p-4 rounded-lg h-[75vh] overflow-y-scroll border border-green-500"
      >
        {logs.map((log, idx) => (
          <div key={idx}>{log}</div>
        ))}
      </div>
    </div>
  );
}
