import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, SignupCredentials } from '../types/auth';
import { useSocket } from './SocketContext';
import { apiService } from '../services/apiService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { connect, disconnect, authenticateUser } = useSocket();

  useEffect(() => {
    // Check for existing session on mount
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      
      // Update API service token
      if (userData.token) {
        apiService.updateToken(userData.token);
        connectSocket(userData.token);
      }
    }
    setIsLoading(false);
  }, []);

  const connectSocket = async (token: string) => {
    try {
      const serverUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
      await connect(serverUrl, token);
      
      // Authenticate user with socket
      if (user) {
        authenticateUser(user.id, user.email);
      }
    } catch (error) {
      console.error('Failed to connect to socket:', error);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const serverUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${serverUrl}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      const userData: User = {
        id: data.data.user.id,
        email: data.data.user.email,
        name: data.data.user.name,
        token: data.data.token
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update API service token
      if (userData.token) {
        apiService.updateToken(userData.token);
      }
      
      // Connect to socket after successful login
      if (userData.token) {
        await connectSocket(userData.token);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    setIsLoading(true);
    try {
      const serverUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${serverUrl}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Signup failed');
      }

      const userData: User = {
        id: data.data.user.id,
        email: data.data.user.email,
        name: data.data.user.name,
        token: data.data.token
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update API service token
      if (userData.token) {
        apiService.updateToken(userData.token);
      }
      
      // Connect to socket after successful signup
      if (userData.token) {
        await connectSocket(userData.token);
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw new Error(error instanceof Error ? error.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Disconnect socket before logout
    disconnect();
    // Clear API service token
    apiService.clearToken();
    setUser(null);
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
