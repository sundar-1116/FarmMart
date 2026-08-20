import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="placeholder-section">
      <div className="placeholder-badge">PROTECTED ROUTE</div>
      <h2>Profile Settings</h2>
      <p style={{ color: 'var(--text-secondary)' }}>
        View and update profile information for <strong>{user?.name || 'User'}</strong>.
      </p>
      <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'inline-block', textAlign: 'left' }}>
        <div><strong>Full Name:</strong> {user?.name}</div>
        <div><strong>Email Address:</strong> {user?.email}</div>
        <div><strong>Account Role:</strong> {user?.role}</div>
      </div>
    </div>
  );
}
