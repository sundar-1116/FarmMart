import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="app-container public-layout">
      <div className="legacy-banner">
        India's Premier Farm-to-Market Platform. 
        <a href="/index-legacy.html" className="legacy-link">
          Go to Legacy Website
        </a>
      </div>
      <header className="navbar">
        <Link to="/" className="nav-brand">FarmMart 2.0</Link>
        <div className="nav-links">
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/signup" className="nav-link">Signup</Link>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
