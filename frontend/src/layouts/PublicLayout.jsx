import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="app-container public-layout">
      <header className="navbar">
        <Link to="/" className="nav-brand-container">
          <div className="brand-logo">🌾</div>
          <span className="brand-name">Farm<span className="brand-accent">Mart</span></span>
        </Link>
        <div className="nav-links">
          <NavLink to="/" className="nav-link">Home</NavLink>
          <a href="#about" className="nav-link" onClick={(e) => e.preventDefault()}>About</a>
          <a href="#stores" className="nav-link" onClick={(e) => e.preventDefault()}>Stores</a>
          <a href="#farmers" className="nav-link" onClick={(e) => e.preventDefault()}>Farmers</a>
          <Link to="/login" className="logout-btn" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', color: 'var(--bg-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Get Started &rarr;
          </Link>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
