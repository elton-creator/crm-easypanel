import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUsers } from '@/lib/mockData';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'client';
  company?: string;
  status: 'active' | 'inactive';
  token?: string;
  subscriptionValue?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getUpdatedUsers = (): User[] => {
  try {
    const storedUsers = localStorage.getItem('crm_mock_users');
    if (storedUsers) {
      return JSON.parse(storedUsers);
    }
    
    localStorage.setItem('crm_mock_users', JSON.stringify(mockUsers));
    return mockUsers;
  } catch (error) {
    console.error('Error loading users:', error);
    return mockUsers;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('crm_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        const currentUsers = getUpdatedUsers();
        const userExists = currentUsers.find(u => u.id === parsedUser.id);
        
        if (userExists && userExists.status === 'active') {
          setUser(userExists);
          localStorage.setItem('crm_user', JSON.stringify(userExists));
        } else {
          localStorage.removeItem('crm_user');
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('crm_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const currentUsers = getUpdatedUsers();
      const foundUser = currentUsers.find(u => u.email === email);

      if (!foundUser) {
        return { success: false, error: 'Credenciais inválidas' };
      }

      if (foundUser.password !== password) {
        return { success: false, error: 'Credenciais inválidas' };
      }

      if (foundUser.role === 'client' && foundUser.status !== 'active') {
        return { success: false, error: 'Acesso bloqueado. Entre em contato com o administrador.' };
      }

      setUser(foundUser);
      localStorage.setItem('crm_user', JSON.stringify(foundUser));

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro ao fazer login' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crm_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};