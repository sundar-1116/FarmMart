import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="placeholder-section" style={{ borderColor: 'var(--error-color)' }}>
      <div className="placeholder-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error-color)' }}>
        ADMIN PROTECTED ROUTE
      </div>
      <h2>Admin Dashboard Console</h2>
      <p style={{ color: 'var(--text-secondary)' }}>
        Welcome, Administrator <strong>{user?.name}</strong>! You have access to this dashboard because your account has the <strong>{user?.role}</strong> role.
      </p>
      <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--bg-primary)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', display: 'inline-block', textAlign: 'left' }}>
        <div><strong>Administrator:</strong> {user?.name}</div>
        <div><strong>Email:</strong> {user?.email}</div>
        <div><strong>Access Level:</strong> Full Platform Management</div>
      </div>
    </div>
  );
}
