import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container admin-layout">
      <header className="navbar" style={{ borderBottomColor: 'var(--error-color)' }}>
        <Link to="/admin" className="nav-brand" style={{ color: 'var(--error-color)' }}>
          🛡️ FarmMart 2.0 (Admin Console)
        </Link>
        <div className="nav-links">
          <Link to="/admin" className="nav-link">Console Home</Link>
          {user && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
              🔑 {user.name} ({user.role})
            </span>
          )}
          <button onClick={handleLogout} className="logout-btn" style={{ borderColor: 'var(--error-color)', color: 'var(--error-color)' }}>
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
