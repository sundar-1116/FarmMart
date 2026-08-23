import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
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
        <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="nav-brand-container">
          <div className="brand-logo">🌾</div>
          <span className="brand-name">Farm<span className="brand-accent">Mart</span></span>
        </Link>
        <div className="nav-links">
          {user?.role === 'admin' ? (
            <>
              <NavLink to="/admin" className="nav-link">Console Home</NavLink>
              <NavLink to="/admin/users" className="nav-link">User Management</NavLink>
            </>
          ) : (
            <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
          )}
          {user?.role !== 'admin' && (
            <NavLink to="/marketplace" className="nav-link">Marketplace</NavLink>
          )}
          <NavLink to="/demands" className="nav-link">Demands</NavLink>
          <NavLink to="/tasks" className="nav-link">Tasks</NavLink>
          <NavLink to="/profile" className="nav-link">Profile</NavLink>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--primary-color)', backgroundColor: 'var(--bg-secondary)', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '1.2rem' }}>👤</span>
            )}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: '600', display: 'flex', flexDirection: 'column' }}>
              {user?.name}
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', textTransform: 'uppercase', marginTop: '2px' }}>{user?.role}</span>
            </span>
          </div>

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
