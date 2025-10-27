import { io, Socket } from 'socket.io-client';

export interface SocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface SocketEvents {
  'frontend:connect': (data: { userId: string; email: string }) => void;
  'frontend:connected': (data: { message: string; socketId: string; userId: string }) => void;
  'frontend:message': (data: SocketMessage) => void;
  'backend:response': (data: { message: string; originalData?: any; userId?: string; extensionId?: string }) => void;
  'backend:error': (data: { message: string; error: string }) => void;
  'extension:status': (data: { isConnected: boolean; currentUrl?: string; lastSeen?: number; extensionId?: string }) => void;
  'extension:status_list': (data: { extensions: Array<{ extensionId: string; isActive: boolean; lastSeen: Date; version?: string; userAgent?: string; isOnline?: boolean; currentUrl?: string }> }) => void;
  'extension:activation_update': (data: { extensionId: string; isActive: boolean; timestamp: number }) => void;
  'extension:online_status': (data: { extensionId: string; isOnline: boolean; timestamp: number }) => void;
  'extension:heartbeat': (data: { extensionId: string; isOnline: boolean; lastSeen: number }) => void;
  'extension:url_update': (data: { url: string; timestamp: number }) => void;
  'extension:url_change': (data: { extensionId: string; url: string; previousUrl?: string; title?: string; tabId?: number; timestamp: number; type: string }) => void;
  'user:authenticate': (data: { userId: string; email: string }) => void;
  'user:authenticated': (data: { message: string; userId: string; email: string }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor() {
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.emit = this.emit.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
  }

  connect(serverUrl: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true
        });

        this.socket.on('connect', () => {
          console.log('Socket connected:', this.socket?.id);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Emit frontend connection event
          this.emit('frontend:connect', {
            userId: this.getUserIdFromToken(token),
            email: this.getEmailFromToken(token)
          });
          
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          this.isConnected = false;
          this.handleReconnect();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.socket.on('frontend:connected', (data) => {
          console.log('Frontend connection confirmed:', data);
        });

        this.socket.on('backend:response', (data) => {
          console.log('Backend response:', data);
        });

        this.socket.on('extension:status', (data) => {
          console.log('Extension status update:', data);
        });

        this.socket.on('extension:url_update', (data) => {
          console.log('Extension URL update:', data);
        });

        this.socket.on('extension:url_change', (data) => {
          console.log('Extension URL change:', data);
        });

      } catch (error) {
        console.error('Failed to create socket connection:', error);
        reject(error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.socket && !this.isConnected) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  emit<K extends keyof SocketEvents>(event: K, data: Parameters<SocketEvents[K]>[0]): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Send a typed message through frontend:message channel
  sendMessage(type: string, data: any): void {
    if (this.socket && this.isConnected) {
      const message: SocketMessage = {
        type,
        data,
        timestamp: Date.now()
      };
      this.socket.emit('frontend:message', message);
    } else {
      console.warn('Socket not connected, cannot send message:', { type, data });
    }
  }

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    if (this.socket) {
      this.socket.on(event as string, callback as (...args: any[]) => void);
    }
  }

  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void {
    if (this.socket) {
      this.socket.off(event as string, callback as (...args: any[]) => void);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  private getUserIdFromToken(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.sub || '';
    } catch (error) {
      console.error('Error parsing token for userId:', error);
      return '';
    }
  }

  private getEmailFromToken(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.email || '';
    } catch (error) {
      console.error('Error parsing token for email:', error);
      return '';
    }
  }

  // Request extension status from backend
  requestExtensionStatus(): void {
    this.sendMessage('request_extension_status', {});
  }

  // Authenticate user
  authenticateUser(userId: string, email: string): void {
    this.emit('user:authenticate', { userId, email });
  }

  // Activate extension
  activateExtension(extensionId: string): void {
    this.sendMessage('activate_extension', { extensionId });
  }

  // Deactivate extension
  deactivateExtension(extensionId: string): void {
    this.sendMessage('deactivate_extension', { extensionId });
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
