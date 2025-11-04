import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      // Optionally verify token with backend
      authAPI.getMe()
        .then(response => {
          if (response.data.user) {
            const userData = {
              ...response.data.user,
              id: response.data.user._id
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        })
        .catch(() => {
          // Token invalid, clear storage
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.data.success) {
        const userData = {
          ...response.data.user,
          id: response.data.user._id
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', response.data.token);
        return { success: true, user: userData };
      }
      return { success: false, error: 'Giriş başarısız' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Giriş başarısız' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.data.success) {
        const user = {
          ...response.data.user,
          id: response.data.user._id
        };
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', response.data.token);
        return { success: true, user };
      }
      return { success: false, error: 'Kayıt başarısız' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Kayıt başarısız' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateBalance = async (amount) => {
    if (user) {
      try {
        const response = await usersAPI.updateBalance(user.id, amount);
        if (response.data.success) {
          const updatedUser = { ...user, balance: response.data.balance };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Balance update failed:', error);
      }
    }
  };

  const updateUser = (updatedData) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateBalance,
    updateUser,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
