import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home-hero grid-bg-effect" style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 20px 20px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

        {/* Centered Announcement Pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid #d97706', padding: '6px 16px', borderRadius: '9999px', color: '#fbbf24', fontSize: '0.8rem', fontWeight: '600', backgroundColor: 'rgba(217, 119, 6, 0.05)', boxShadow: '0 0 10px rgba(217, 119, 6, 0.1)', marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span style={{ color: '#fbbf24' }}>• 🇮🇳</span> India's Premier Farm-to-Market Platform
        </div>

        {/* Hero Title */}
        <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3.75rem)', fontWeight: '850', color: '#fff', lineHeight: '1.15', letterSpacing: '-1.5px', marginBottom: '24px', textAlign: 'center' }}>
          From <span style={{ color: '#10b981' }}>Farm Fields</span> <br />
          to Your Favourite <span style={{ color: '#10b981', background: 'linear-gradient(135deg, #10b981 40%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Stores</span>
        </h1>

        {/* Description */}
        <p style={{ fontSize: '1.1rem', color: '#a7f3d0', opacity: 0.8, maxWidth: '640px', margin: '0 auto 40px', lineHeight: '1.6', textAlign: 'center' }}>
          Connecting fresh produce from fruit, vegetable, flower & pulse growers to JioMart, D-Mart, Amazon Fresh & more - direct from farm to shelf.
        </p>

        {/* Action helper */}
        <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '32px', textAlign: 'center' }}>
          Choose your role to get started
        </div>

        {/* Role Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', maxWidth: '820px', margin: '0 auto 40px', width: '100%' }}>

          {/* Admin Card */}
          <div style={{ borderRadius: '20px', backgroundColor: 'rgba(12, 22, 17, 0.7)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '36px', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid #d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(217, 119, 6, 0.05)', boxShadow: '0 0 10px rgba(217, 119, 6, 0.2)', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.8rem' }}>🛡️</span>
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '700', margin: '0 0 12px 0', color: '#fbbf24' }}>Admin</h3>
            <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: '1.5', marginBottom: '28px', minHeight: '44px' }}>
              Manage stores, farmers, users & reports from one central dashboard.
            </p>
            <Link to="/login?role=admin" style={{ display: 'inline-block', background: 'transparent', border: '1px solid #fbbf24', color: '#fbbf24', borderRadius: '9999px', padding: '10px 24px', fontWeight: '600', textDecoration: 'none', transition: '0.2s', width: 'auto' }}>
              Enter as Admin &rarr;
            </Link>
          </div>

          {/* User Card */}
          <div style={{ borderRadius: '20px', backgroundColor: 'rgba(12, 22, 17, 0.7)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '36px', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.05)', boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.8rem' }}>💻</span>
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '700', margin: '0 0 12px 0', color: '#10b981' }}>User</h3>
            <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: '1.5', marginBottom: '28px', minHeight: '44px' }}>
              Browse stores, explore farmers & get instant help from AI assistant.
            </p>
            <Link to="/login?role=buyer" style={{ display: 'inline-block', background: 'transparent', border: '1px solid #10b981', color: '#10b981', borderRadius: '9999px', padding: '10px 24px', fontWeight: '600', textDecoration: 'none', transition: '0.2s', width: 'auto' }}>
              Enter as User &rarr;
            </Link>
          </div>

        </div>

      </div>

      {/* Stats Bar */}
      <div className="home-stats-container">
        <div className="home-stats-wrapper">
          <div className="home-stats-block">
            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', display: 'block' }}>500+</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Farmers</span>
          </div>
          <div className="home-stats-block" style={{ borderLeft: '1px solid rgba(16, 185, 129, 0.15)', paddingLeft: '40px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', display: 'block' }}>8</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Retail Partners</span>
          </div>
          <div className="home-stats-block" style={{ borderLeft: '1px solid rgba(16, 185, 129, 0.15)', paddingLeft: '40px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', display: 'block' }}>50K+</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Orders Delivered</span>
          </div>
          <div className="home-stats-block" style={{ borderLeft: '1px solid rgba(16, 185, 129, 0.15)', paddingLeft: '40px' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', display: 'block' }}>4</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Crop Categories</span>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          &copy; 2024 FarmMart
        </div>
      </div>
    </div>
  );
}
