import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading session...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login page and keep the current location in state to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
