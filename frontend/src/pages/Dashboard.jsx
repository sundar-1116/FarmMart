import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isFarmer = user?.role === 'farmer';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch Stats and Tasks in parallel
        const [statsRes, tasksRes, demandsRes] = await Promise.all([
          api.getTaskStats(),
          api.getTasks(),
          api.getDemands()
        ]);

        if (statsRes.success) {
          setStats(statsRes.data);
        } else {
          setError(statsRes.message || 'Failed to load statistics');
        }

        if (tasksRes.success) {
          setTasks(tasksRes.data || []);
        }

        if (demandsRes.success) {
          setDemands(demandsRes.data || []);
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isFarmer]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '40px auto', animation: 'fadeInUp 0.45s ease-out' }}>
        <p style={{ color: 'var(--error-color)', fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 16px 0' }}>⚠️ Error Loading Dashboard</p>
        <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="form-btn" style={{ maxWidth: '200px', margin: '0 auto' }}>
          Retry
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // Farmer Specific Calculations
  // ────────────────────────────────────────────────────────
  const farmerTasks = tasks; // already filtered by req.user.id in backend
  const farmerPendingDemands = demands.filter(d => d.status === 'pending');

  // Interleave tasks and pending demands to build Recent Activity
  const farmerActivities = [];
  farmerTasks.forEach(task => {
    if (task.deliveryStatus === 'delivered') {
      farmerActivities.push({
        type: 'delivery',
        icon: '✅',
        title: 'Delivery completed',
        desc: `Delivered ${task.quantity}kg of ${task.itemName} to ${task.storeName}`,
        time: '1d ago'
      });
    } else {
      farmerActivities.push({
        type: 'assignment',
        icon: '👤',
        title: 'Demand assigned',
        desc: `Assigned new demand for ${task.itemName}`,
        time: '2h ago'
      });
    }
  });
  farmerPendingDemands.slice(0, 2).forEach(demand => {
    farmerActivities.push({
      type: 'demand',
      icon: '📄',
      title: 'New demand available',
      desc: `New demand posted by ${demand.storeName} for ${demand.itemName}`,
      time: '2d ago'
    });
  });
  const recentFarmerActivities = farmerActivities.slice(0, 3);

  const farmerUpcomingDeliveries = farmerTasks
    .filter(t => t.deliveryStatus === 'pending')
    .slice(0, 3);

  const farmerTotalSupplied = farmerTasks
    .filter(t => t.deliveryStatus === 'delivered')
    .reduce((sum, t) => sum + (t.quantity || 0), 0);

  const farmerTotalEarnings = farmerTasks
    .filter(t => t.deliveryStatus === 'delivered')
    .reduce((sum, t) => sum + (t.purchasePrice || 0) * (t.quantity || 0), 0);

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const farmerThisMonthDeliveries = farmerTasks.filter(task => {
    const d = new Date(task.deadline);
    return task.deliveryStatus === 'delivered' && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const farmerActiveCropsCount = new Set(farmerTasks.map(t => t.itemName.toLowerCase())).size;

  // ────────────────────────────────────────────────────────
  // Buyer Specific Calculations
  // ────────────────────────────────────────────────────────
  const buyerActivities = tasks.map(task => {
    if (task.deliveryStatus === 'delivered') {
      return {
        icon: '✅',
        title: 'Delivery completed',
        desc: `Received ${task.quantity}kg of ${task.itemName} at ${task.storeName}`,
        time: '1d ago'
      };
    } else {
      return {
        icon: '📋',
        title: 'Task created',
        desc: `Procured ${task.quantity}kg of ${task.itemName} for ${task.storeName}`,
        time: '2h ago'
      };
    }
  }).slice(0, 3);

  const buyerUpcomingDeliveries = tasks
    .filter(t => t.deliveryStatus === 'pending' || t.deliveryStatus !== 'delivered')
    .slice(0, 3);

  const buyerTotalOrders = tasks.length;
  const buyerTotalSpent = tasks.reduce((sum, task) => sum + (task.purchasePrice || 0) * (task.quantity || 0), 0);

  const buyerThisMonthOrders = tasks.filter(task => {
    const d = new Date(task.deadline);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const buyerActiveCropsCount = new Set(tasks.map(t => t.itemName.toLowerCase())).size;

  // Render Farmer/Grower Dashboard
  if (isFarmer) {
    return (
      <div className="grid-bg-effect" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Title Block */}
        <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0 0 8px 0' }}>Grower Dashboard Overview</h2>
          <p style={{ color: 'var(--text-light)', margin: 0 }}>
            Welcome back, <strong style={{ color: 'var(--primary-color)' }}>{user?.name}</strong>! Below are your grower access capabilities.
          </p>
        </div>

        {/* 6 Stats / Capabilities Row */}
        {stats && (
          <div className="stats-grid farmer-stats-grid">
            {/* Capability card */}
            <div className="card farmer-capabilities-card" style={{ borderLeft: '4px solid var(--primary-color)', animationDelay: '0.02s' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 12px 0', color: 'var(--text-secondary)' }}>🌾 Grower Access Capabilities</h3>
              <ul style={{ paddingLeft: '16px', color: 'var(--text-light)', fontSize: '0.82rem', lineHeight: '1.7', margin: 0 }}>
                <li>Browse store demands.</li>
                <li>Negotiate & supply crops directly.</li>
                <li>Maintain account details.</li>
              </ul>
            </div>

            <div className="stat-card" style={{ animationDelay: '0.05s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="stat-label">Total Demands</span>
                <span style={{ fontSize: '1.25rem' }}>📋</span>
              </div>
              <span className="stat-value">{demands.length}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>All time demands</span>
            </div>

            <div className="stat-card" style={{ animationDelay: '0.1s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="stat-label" style={{ color: 'var(--accent-color)' }}>My Assigned Demands</span>
                <span style={{ fontSize: '1.25rem' }}>📑</span>
              </div>
              <span className="stat-value" style={{ color: 'var(--accent-color)' }}>{stats.totalTasks}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Demands assigned</span>
            </div>

            <div className="stat-card" style={{ animationDelay: '0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="stat-label" style={{ color: 'var(--info-color)' }}>Pending Deliveries</span>
                <span style={{ fontSize: '1.25rem' }}>🚚</span>
              </div>
              <span className="stat-value" style={{ color: 'var(--info-color)' }}>{stats.totalPendingDeliveries}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Deliveries in transit</span>
            </div>

            <div className="stat-card" style={{ animationDelay: '0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="stat-label" style={{ color: 'var(--success-color)' }}>Completed Deliveries</span>
                <span style={{ fontSize: '1.25rem' }}>✅</span>
              </div>
              <span className="stat-value" style={{ color: 'var(--success-color)' }}>{stats.totalCompleted}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Successfully delivered</span>
            </div>

            <div className="stat-card" style={{ animationDelay: '0.25s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="stat-label">Completion Ratio</span>
                <span style={{ fontSize: '1.25rem' }}>📈</span>
              </div>
              <span className="stat-value">{stats.completionPercent}%</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Overall completion</span>
            </div>
          </div>
        )}

        {/* Middle Row */}
        <div className="dashboard-middle-row">
          {/* Recent Activity */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', animationDelay: '0.3s', minHeight: '340px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⏱️</span> Recent Activity
              </h3>
              {farmerTasks.length > 0 && (
                <Link to="/tasks" className="form-link" style={{ fontSize: '0.8rem' }}>View all</Link>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {recentFarmerActivities.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 255, 157, 0.04)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '1.75rem' }}>📋</span>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700' }}>No recent activity</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '220px' }}>Your recent activity will appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentFarmerActivities.map((act, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem' }}>{act.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{act.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{act.desc}</div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center' }}>{act.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deliveries */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', animationDelay: '0.35s', minHeight: '340px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🚚</span> Upcoming Deliveries
              </h3>
              {farmerUpcomingDeliveries.length > 0 && (
                <Link to="/tasks" className="form-link" style={{ fontSize: '0.8rem' }}>View all</Link>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {farmerUpcomingDeliveries.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 255, 157, 0.04)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '1.75rem' }}>🚚</span>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700' }}>No upcoming deliveries</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '220px' }}>You have no deliveries scheduled at the moment.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {farmerUpcomingDeliveries.map((del, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem' }}>⏱️</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{del.storeName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{del.itemName} • {del.quantity}kg</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: '700' }}>Pending</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(del.deadline).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', animationDelay: '0.4s', minHeight: '340px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚡</span> Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center', flex: 1 }}>
              <Link to="/demands" className="quick-action-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="quick-action-icon">📋</span>
                  <div>
                    <div className="quick-action-title">Browse Demands</div>
                    <div className="quick-action-subtitle">View all available store demands</div>
                  </div>
                </div>
                <span className="quick-action-arrow">→</span>
              </Link>

              <Link to="/tasks" className="quick-action-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="quick-action-icon">⚙️</span>
                  <div>
                    <div className="quick-action-title">My Tasks</div>
                    <div className="quick-action-subtitle">Manage your assigned tasks</div>
                  </div>
                </div>
                <span className="quick-action-arrow">→</span>
              </Link>

              <Link to="/tasks" className="quick-action-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="quick-action-icon">🚚</span>
                  <div>
                    <div className="quick-action-title">Delivery History</div>
                    <div className="quick-action-subtitle">View your delivery records</div>
                  </div>
                </div>
                <span className="quick-action-arrow">→</span>
              </Link>

              <Link to="/profile" className="quick-action-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="quick-action-icon">👤</span>
                  <div>
                    <div className="quick-action-title">Profile Settings</div>
                    <div className="quick-action-subtitle">Update your account details</div>
                  </div>
                </div>
                <span className="quick-action-arrow">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Grower Summary (bottom) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', animationDelay: '0.45s' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📈</span> Grower Summary
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Overview of your performance</p>
          </div>

          <div className="summary-grid">
            <div className="summary-col">
              <div className="summary-circle-icon green">🛒</div>
              <div>
                <div className="summary-label-large">{farmerTotalSupplied}</div>
                <div className="summary-label-title">Total Supplied</div>
                <div className="summary-label-desc">All time supplied</div>
              </div>
            </div>

            <div className="summary-col">
              <div className="summary-circle-icon yellow">₹</div>
              <div>
                <div className="summary-label-large">₹{farmerTotalEarnings.toLocaleString()}</div>
                <div className="summary-label-title">Total Earnings</div>
                <div className="summary-label-desc">All time earnings</div>
              </div>
            </div>

            <div className="summary-col">
              <div className="summary-circle-icon blue">📅</div>
              <div>
                <div className="summary-label-large">{farmerThisMonthDeliveries}</div>
                <div className="summary-label-title">This Month</div>
                <div className="summary-label-desc">Deliveries made</div>
              </div>
            </div>

            <div className="summary-col">
              <div className="summary-circle-icon green">🍃</div>
              <div>
                <div className="summary-label-large">{farmerActiveCropsCount}</div>
                <div className="summary-label-title">Active Crops</div>
                <div className="summary-label-desc">Different crops supplied</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Buyer Dashboard
  return (
    <div className="grid-bg-effect" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title Block */}
      <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0 0 8px 0' }}>Dashboard Overview</h2>
        <p style={{ color: 'var(--text-light)', margin: 0 }}>
          Welcome back, <strong style={{ color: 'var(--primary-color)' }}>{user?.name}</strong>! Here is your procurement status.
        </p>
      </div>

      {/* 5 Stats Row */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card" style={{ animationDelay: '0.05s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="stat-label">Total Procurements</span>
              <span style={{ fontSize: '1.25rem' }}>📋</span>
            </div>
            <span className="stat-value">{stats.totalTasks}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>All time procurements</span>
          </div>

          <div className="stat-card" style={{ animationDelay: '0.1s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="stat-label" style={{ color: 'var(--accent-color)' }}>Pending Payments</span>
              <span style={{ fontSize: '1.25rem' }}>⏳</span>
            </div>
            <span className="stat-value" style={{ color: 'var(--accent-color)' }}>{stats.totalPendingPayments}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Payments awaiting clearance</span>
          </div>

          <div className="stat-card" style={{ animationDelay: '0.15s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="stat-label" style={{ color: 'var(--info-color)' }}>Pending Deliveries</span>
              <span style={{ fontSize: '1.25rem' }}>🚚</span>
            </div>
            <span className="stat-value" style={{ color: 'var(--info-color)' }}>{stats.totalPendingDeliveries}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Deliveries in transit</span>
          </div>

          <div className="stat-card" style={{ animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="stat-label" style={{ color: 'var(--success-color)' }}>Completed Deliveries</span>
              <span style={{ fontSize: '1.25rem' }}>✅</span>
            </div>
            <span className="stat-value" style={{ color: 'var(--success-color)' }}>{stats.totalCompleted}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Successfully delivered</span>
          </div>

          <div className="stat-card" style={{ animationDelay: '0.25s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="stat-label">Completion Ratio</span>
              <span style={{ fontSize: '1.25rem' }}>📈</span>
            </div>
            <span className="stat-value">{stats.completionPercent}%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>Overall completion</span>
          </div>
        </div>
      )}

      {/* Middle Row */}
      <div className="dashboard-middle-row">
        {/* Recent Activity */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', animationDelay: '0.3s', minHeight: '340px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⏱️</span> Recent Activity
            </h3>
            {tasks.length > 0 && (
              <Link to="/tasks" className="form-link" style={{ fontSize: '0.8rem' }}>View all</Link>
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {buyerActivities.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 255, 157, 0.04)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '1.75rem' }}>📋</span>
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700' }}>No recent activity</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '220px' }}>Your recent activity will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {buyerActivities.map((act, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.25rem' }}>{act.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{act.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{act.desc}</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'center' }}>{act.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deliveries */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', animationDelay: '0.35s', minHeight: '340px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚚</span> Upcoming Deliveries
            </h3>
            {buyerUpcomingDeliveries.length > 0 && (
              <Link to="/tasks" className="form-link" style={{ fontSize: '0.8rem' }}>View all</Link>
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {buyerUpcomingDeliveries.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 255, 157, 0.04)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '1.75rem' }}>🚚</span>
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700' }}>No upcoming deliveries</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '220px' }}>You have no deliveries scheduled at the moment.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {buyerUpcomingDeliveries.map((del, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.25rem' }}>⏱️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{del.storeName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{del.itemName} • {del.quantity}kg</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: '700' }}>Pending</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(del.deadline).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', animationDelay: '0.4s', minHeight: '340px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center', flex: 1 }}>
            <Link to="/marketplace" className="quick-action-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="quick-action-icon">🏪</span>
                <div>
                  <div className="quick-action-title">Browse Marketplace</div>
                  <div className="quick-action-subtitle">Explore available crops</div>
                </div>
              </div>
              <span className="quick-action-arrow">→</span>
            </Link>

            <Link to="/demands" className="quick-action-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="quick-action-icon">📋</span>
                <div>
                  <div className="quick-action-title">My Demands</div>
                  <div className="quick-action-subtitle">View your created demands</div>
                </div>
              </div>
              <span className="quick-action-arrow">→</span>
            </Link>

            <Link to="/tasks" className="quick-action-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="quick-action-icon">⚙️</span>
                <div>
                  <div className="quick-action-title">My Tasks</div>
                  <div className="quick-action-subtitle">Check your assigned tasks</div>
                </div>
              </div>
              <span className="quick-action-arrow">→</span>
            </Link>

            <Link to="/profile" className="quick-action-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="quick-action-icon">👤</span>
                <div>
                  <div className="quick-action-title">Profile Settings</div>
                  <div className="quick-action-subtitle">Manage security & details</div>
                </div>
              </div>
              <span className="quick-action-arrow">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Procurement Summary (bottom) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', animationDelay: '0.45s' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📈</span> Procurement Summary
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Overview of your procurement performance</p>
        </div>

        <div className="summary-grid">
          <div className="summary-col">
            <div className="summary-circle-icon green">🛒</div>
            <div>
              <div className="summary-label-large">{buyerTotalOrders}</div>
              <div className="summary-label-title">Total Orders</div>
              <div className="summary-label-desc">All time orders</div>
            </div>
          </div>

          <div className="summary-col">
            <div className="summary-circle-icon yellow">₹</div>
            <div>
              <div className="summary-label-large">₹{buyerTotalSpent.toLocaleString()}</div>
              <div className="summary-label-title">Total Spent</div>
              <div className="summary-label-desc">Total amount spent</div>
            </div>
          </div>

          <div className="summary-col">
            <div className="summary-circle-icon blue">📅</div>
            <div>
              <div className="summary-label-large">{buyerThisMonthOrders}</div>
              <div className="summary-label-title">This Month</div>
              <div className="summary-label-desc">Orders this month</div>
            </div>
          </div>

          <div className="summary-col">
            <div className="summary-circle-icon green">🍃</div>
            <div>
              <div className="summary-label-large">{buyerActiveCropsCount}</div>
              <div className="summary-label-title">Active Crops</div>
              <div className="summary-label-desc">Different crops procured</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
