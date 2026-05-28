import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';

export interface SocketContextType {
  isConnected: boolean;
  socketId: string | undefined;
  connect: (serverUrl: string) => Promise<void>;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  sendMessage: (type: string, data: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { token, initializing } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socketId, setSocketId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!token || initializing) {
      socketService.disconnect();
      setIsConnected(false);
      setSocketId(undefined);
      return;
    }

    let cancelled = false;
    const serverUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5005';

    socketService
      .connect(serverUrl, { token })
      .then(() => {
        if (cancelled) return;
        setIsConnected(true);
        setSocketId(socketService.getSocketId());
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Socket connect failed:', err);
        }
        setIsConnected(false);
        setSocketId(undefined);
      });

    return () => {
      cancelled = true;
      socketService.disconnect();
      setIsConnected(false);
      setSocketId(undefined);
    };
  }, [token, initializing]);

  useEffect(() => {
    if (!token || initializing) return;

    const updateConnectionStatus = () => {
      setIsConnected(socketService.getConnectionStatus());
      setSocketId(socketService.getSocketId());
    };

    updateConnectionStatus();
    const statusInterval = setInterval(updateConnectionStatus, 1000);

    return () => {
      clearInterval(statusInterval);
    };
  }, [token, initializing]);

  const connect = async (serverUrl: string): Promise<void> => {
    if (!token) {
      throw new Error('Not authenticated');
    }
    await socketService.connect(serverUrl, { token });
    setIsConnected(true);
    setSocketId(socketService.getSocketId());
  };

  const disconnect = (): void => {
    socketService.disconnect();
    setIsConnected(false);
    setSocketId(undefined);
  };

  const emit = (event: string, data: any): void => {
    socketService.emit(event as any, data);
  };

  const on = (event: string, callback: (...args: any[]) => void): void => {
    socketService.on(event as any, callback);
  };

  const off = (event: string, callback?: (...args: any[]) => void): void => {
    socketService.off(event as any, callback);
  };

  const sendMessage = (type: string, data: any): void => {
    socketService.sendMessage(type, data);
  };

  const contextValue: SocketContextType = {
    isConnected,
    socketId,
    connect,
    disconnect,
    emit,
    on,
    off,
    sendMessage
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
