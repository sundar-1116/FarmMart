import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div className="placeholder-section">
      <div className="placeholder-badge">PROTECTED ROUTE</div>
      <h2>User Dashboard Placeholder</h2>
      <p style={{ color: 'var(--text-secondary)' }}>
        Welcome, <strong>{user?.name || 'User'}</strong>! This page is protected and accessible to authenticated accounts.
      </p>
      <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'inline-block', textAlign: 'left' }}>
        <div><strong>User ID:</strong> {user?.id}</div>
        <div><strong>Email:</strong> {user?.email}</div>
        <div><strong>Role:</strong> {user?.role}</div>
      </div>
    </div>
  );
}
