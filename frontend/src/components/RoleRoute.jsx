import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 1. Exact role match (e.g. user.role === 'admin' on an admin route)
  const isMatch = allowedRoles.includes(user.role);

  // 2. Legacy fallback mapping:
  // If the target role check expects 'buyer' or 'farmer', allow legacy 'user' role
  const isLegacyUserMatch = 
    user.role === 'user' && 
    (allowedRoles.includes('buyer') || allowedRoles.includes('farmer'));

  if (!isMatch && !isLegacyUserMatch) {
    // If user is 'admin', redirect to admin dashboard, else normal user dashboard
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}
