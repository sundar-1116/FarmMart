import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state from sessionStorage (shared with legacy frontend)
  useEffect(() => {
    const initAuth = async () => {
      const sessionRaw = sessionStorage.getItem('ftm_session');
      if (!sessionRaw) {
        setLoading(false);
        return;
      }

      let session;
      try {
        session = JSON.parse(sessionRaw);
        if (!session || !session.token) {
          throw new Error('Invalid session structure');
        }
      } catch (e) {
        console.error('Error parsing session on startup:', e);
        sessionStorage.removeItem('ftm_session');
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.getProfile();
        if (res.success && res.user) {
          const updatedUser = {
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            role: res.user.role,
            avatar: res.user.photo || ''
          };
          setUser(updatedUser);

          const updatedSession = {
            ...session,
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            role: res.user.role,
            avatar: res.user.photo || ''
          };
          sessionStorage.setItem('ftm_session', JSON.stringify(updatedSession));
        }
      } catch (err) {
        console.error('Startup session validation failed:', err);
        if (err.status === 401) {
          sessionStorage.removeItem('ftm_session');
          setUser(null);
        } else {
          // err.status === 403, 500, or network/connection error: preserve session
          setUser({
            id: session.id,
            name: session.name,
            email: session.email,
            role: session.role,
            avatar: session.avatar
          });
        }
      } finally {
        setLoading(false);
      }
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
          avatar: res.user.photo || '',
          token: res.token,
          loginTime: Date.now()
        };
        sessionStorage.setItem('ftm_session', JSON.stringify(session));
        const authenticatedUser = {
          id: session.id,
          name: session.name,
          email: session.email,
          role: session.role,
          avatar: session.avatar
        };
        setUser(authenticatedUser);
        return { success: true, user: authenticatedUser };
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
      if (res.success && res.token) {
        const session = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          avatar: res.user.photo || '',
          token: res.token,
          loginTime: Date.now()
        };
        sessionStorage.setItem('ftm_session', JSON.stringify(session));
        const authenticatedUser = {
          id: session.id,
          name: session.name,
          email: session.email,
          role: session.role,
          avatar: session.avatar
        };
        setUser(authenticatedUser);
        return { success: true, user: authenticatedUser };
      }
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, message: err.message || 'Signup failed' };
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.getProfile();
      if (res.success && res.user) {
        const updatedUser = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          avatar: res.user.photo || ''
        };
        setUser(updatedUser);

        const sessionRaw = sessionStorage.getItem('ftm_session');
        if (sessionRaw) {
          const session = JSON.parse(sessionRaw);
          const updatedSession = {
            ...session,
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            role: res.user.role,
            avatar: res.user.photo || ''
          };
          sessionStorage.setItem('ftm_session', JSON.stringify(updatedSession));
        }
        return { success: true };
      }
      return { success: false, message: 'Failed to refresh profile' };
    } catch (err) {
      if (err.status === 401) {
        sessionStorage.removeItem('ftm_session');
        setUser(null);
      }
      return { success: false, message: err.message || 'Failed to refresh profile' };
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, signup, refreshProfile }}>
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
