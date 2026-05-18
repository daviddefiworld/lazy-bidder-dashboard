import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socketId, setSocketId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const serverUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
    socketService
      .connect(serverUrl)
      .then(() => {
        setIsConnected(true);
        setSocketId(socketService.getSocketId());
      })
      .catch((err) => console.error('Socket connect failed:', err));

    return () => {
      socketService.disconnect();
      setIsConnected(false);
      setSocketId(undefined);
    };
  }, []);

  useEffect(() => {
    const updateConnectionStatus = () => {
      setIsConnected(socketService.getConnectionStatus());
      setSocketId(socketService.getSocketId());
    };

    updateConnectionStatus();
    const statusInterval = setInterval(updateConnectionStatus, 1000);

    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  const connect = async (serverUrl: string): Promise<void> => {
    await socketService.connect(serverUrl);
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
