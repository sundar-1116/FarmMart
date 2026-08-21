import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isFarmer = user?.role === 'farmer';

  useEffect(() => {
    if (isFarmer) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.getTaskStats();
        if (res.success) {
          setStats(res.data);
        } else {
          setError(res.message || 'Failed to load statistics');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isFarmer]);

  if (loading) {
    return <div className="loading-state" style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard data...</div>;
  }

  if (error) {
    return (
      <div className="error-state" style={{ padding: '24px', textAlign: 'center', color: 'var(--error-color)' }}>
        <p>⚠️ {error}</p>
        <button onClick={() => window.location.reload()} className="form-btn" style={{ maxWidth: '200px', marginTop: '12px' }}>
          Retry
        </button>
      </div>
    );
  }

  if (isFarmer) {
    return (
      <div className="dashboard-container" style={{ padding: '24px' }}>
        <h2>Grower Dashboard Overview</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Welcome, <strong>{user?.name}</strong>! As a Farmer/Grower, you can browse store demands in the Demands portal and showcase crop offers in the Marketplace.
        </p>
        <div style={{ marginTop: '24px', padding: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <h3>🌾 Grower Access Capabilities</h3>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            <li>Browse real-time store demands created by administrators.</li>
            <li>Negotiate terms and supply crops directly to registered buyers.</li>
            <li>Maintain your account security details inside Profile Settings.</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ padding: '24px' }}>
      <h2>Dashboard Overview</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Welcome back, <strong>{user?.name}</strong>! Here is your procurement status.
      </p>

      {stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="stat-card" style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Total Procurements</h4>
            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalTasks}</span>
          </div>

          <div className="stat-card" style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Pending Payments</h4>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#b8860b' }}>{stats.totalPendingPayments}</span>
          </div>

          <div className="stat-card" style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Pending Deliveries</h4>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3182ce' }}>{stats.totalPendingDeliveries}</span>
          </div>

          <div className="stat-card" style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Completed Deliveries</h4>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#38a169' }}>{stats.totalCompleted}</span>
          </div>

          <div className="stat-card" style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Completion Ratio</h4>
            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.completionPercent}%</span>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No statistics available.
        </div>
      )}
    </div>
  );
}
