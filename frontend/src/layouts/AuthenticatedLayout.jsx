import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthenticatedLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container authenticated-layout">
      <header className="navbar">
        <Link to="/dashboard" className="nav-brand">FarmMart 2.0 (User Portal)</Link>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/marketplace" className="nav-link">Marketplace</Link>
          <Link to="/demands" className="nav-link">Demands</Link>
          <Link to="/tasks" className="nav-link">Tasks</Link>
          <Link to="/profile" className="nav-link">Profile</Link>
          {user && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
              👤 {user.name} ({user.role})
            </span>
          )}
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
