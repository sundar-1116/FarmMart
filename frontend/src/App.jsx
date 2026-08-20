import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AuthenticatedLayout from './layouts/AuthenticatedLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import Demands from './pages/Demands';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* User Protected Routes (Farmers, Buyers, and Legacy Users) */}
          <Route
            element={
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route 
              path="/marketplace" 
              element={
                <RoleRoute allowedRoles={['buyer', 'farmer']}>
                  <Marketplace />
                </RoleRoute>
              } 
            />
            <Route path="/demands" element={<Demands />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Fallback Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
