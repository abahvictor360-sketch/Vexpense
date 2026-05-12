import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from '../api';
import type { ActivityEvent } from '../types';

interface SocketCtx {
  connected: boolean;
  activities: ActivityEvent[];
  paused: boolean;
  setPaused: (v: boolean) => void;
  clear: () => void;
}

const Ctx = createContext<SocketCtx | undefined>(undefined);
const MAX_ACTIVITIES = 50;

export function SocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('activity', (event: ActivityEvent) => {
      if (pausedRef.current) return;
      setActivities((prev) => [event, ...prev].slice(0, MAX_ACTIVITIES));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  function clear() {
    setActivities([]);
  }

  return (
    <Ctx.Provider value={{ connected, activities, paused, setPaused, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSocket(): SocketCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
}
