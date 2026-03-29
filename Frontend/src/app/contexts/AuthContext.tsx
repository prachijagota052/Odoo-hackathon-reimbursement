import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, country: string, baseCurrency: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in real app, this would call an API
    const mockUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = mockUsers.find((u: User) => u.email === email);
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
    } else {
      throw new Error('Invalid credentials');
    }
  };

const signup = async (name: string, email: string, password: string, country: string, baseCurrency: string) => {
  const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');

  const adminExists = existingUsers.some(
    (u: any) => u.role === "admin"
  );

  if (adminExists) {
    alert("Admin already exists. Please login.");
    return;
  }
  // Mock signup
  const newUser: User = {
    id: Date.now().toString(),
    name,
    email,
    role: 'admin', 
    country, 
    baseCurrency,
  };

  existingUsers.push(newUser);
  localStorage.setItem('users', JSON.stringify(existingUsers));

  setUser(newUser);
  localStorage.setItem('user', JSON.stringify(newUser));
};

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
