import React from 'react';

export default function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div className="placeholder-badge">M2.1 REACT FOUNDATION</div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Welcome to FarmMart 2.0</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 24px', lineHeight: '1.6' }}>
        This React application represents the new core foundation for India's Premier Farm-to-Market Platform. 
        It is connected directly to the real FarmMart backend API.
      </p>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <a href="/login" className="form-link" style={{ border: '1px solid var(--primary-color)', padding: '10px 20px', borderRadius: '8px' }}>
          Log In
        </a>
        <a href="/signup" className="form-link" style={{ border: '1px solid var(--primary-color)', padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: 'var(--bg-primary)' }}>
          Sign Up
        </a>
      </div>
    </div>
  );
}
