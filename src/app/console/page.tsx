'use client';

import { useEffect, useRef, useState } from 'react';

export default function ConsolePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3030');
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === 'log') {
        setLogs((prev) => [...prev, data.msg]);
      }
    };
    return () => ws.close();
  }, []);

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
