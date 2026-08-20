import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state from sessionStorage (shared with legacy frontend)
  useEffect(() => {
    const initAuth = () => {
      const sessionRaw = sessionStorage.getItem('ftm_session');
      if (sessionRaw) {
        try {
          const session = JSON.parse(sessionRaw);
          if (session && session.token) {
            setUser({
              id: session.id,
              name: session.name,
              email: session.email,
              role: session.role, // User role: 'buyer', 'farmer', or 'admin'
              avatar: session.avatar
            });
          }
        } catch (e) {
          console.error('Error restoring auth session:', e);
          sessionStorage.removeItem('ftm_session');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const res = await api.login(email, password, role);
      if (res.success && res.token) {
        const session = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role, // Authenticated role from database ('buyer', 'farmer', 'admin')
          avatar: res.user.avatar || '',
          token: res.token,
          loginTime: Date.now()
        };
        sessionStorage.setItem('ftm_session', JSON.stringify(session));
        setUser({
          id: session.id,
          name: session.name,
          email: session.email,
          role: session.role,
          avatar: session.avatar
        });
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: err.message || 'An error occurred during login' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('ftm_session');
    setUser(null);
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const res = await api.signup(userData);
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, message: err.message || 'Signup failed' };
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
