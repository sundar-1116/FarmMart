import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function AdminDashboard() {
  const [demands, setDemands] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [storeName, setStoreName] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [demandsRes, tasksRes] = await Promise.all([
        api.getDemands(),
        api.getTasks()
      ]);

      if (demandsRes.success && tasksRes.success) {
        setDemands(demandsRes.data || []);
        setTasks(tasksRes.data || []);
      } else {
        setError('Failed to fetch store demands or tasks from server');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading admin console data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDemand = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!storeName || !itemName || !quantity) {
      setFormError('Please fill in all fields');
      return;
    }
    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      setFormError('Quantity must be a positive number');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createDemand({
        storeName,
        itemName,
        quantity: numQty
      });
      if (res.success) {
        setStoreName('');
        setItemName('');
        setQuantity('');
        alert('Store demand created successfully!');
        await loadData();
      } else {
        setFormError(res.message || 'Failed to create store demand');
      }
    } catch (err) {
      setFormError(err.message || 'An error occurred while creating demand');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-state" style={{ padding: '40px', textAlign: 'center' }}>Loading admin console...</div>;
  }

  return (
    <div className="admin-dashboard-container" style={{ padding: '24px' }}>
      <h2>Admin Console Home</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Overview of store demands and buyer procurement tasks.
      </p>

      {error && <div style={{ color: 'var(--error-color)', padding: '12px', marginBottom: '16px', border: '1px solid var(--error-color)', borderRadius: '6px' }}>⚠️ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

        {/* Left Column: Create Demand & Demands List */}
        <div>
          <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Create Store Demand</h3>
            {formError && <div style={{ color: 'var(--error-color)', marginBottom: '12px', fontSize: '0.85rem' }}>⚠️ {formError}</div>}
            <form onSubmit={handleCreateDemand} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Store Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Big Bazaar"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Item/Crop Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Potatoes"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Required Quantity (kg)</label>
                <input
                  type="number"
                  className="form-input"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 500"
                  min="1"
                  required
                />
              </div>
              <button type="submit" className="form-btn" style={{ marginTop: '6px' }} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Demand'}
              </button>
            </form>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Current Demands ({demands.length})</h3>
            {demands.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No demands active.</div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Store</th>
                      <th style={{ padding: '8px' }}>Item</th>
                      <th style={{ padding: '8px' }}>Qty</th>
                      <th style={{ padding: '8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demands.map(demand => (
                      <tr key={demand._id || demand.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px' }}>{demand.storeName}</td>
                        <td style={{ padding: '8px' }}>{demand.itemName}</td>
                        <td style={{ padding: '8px' }}>{demand.quantity} kg</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: demand.status === 'pending' ? '#b8860b' : '#38a169' }}>
                            {demand.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: All Tasks List */}
        <div style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 12px 0' }}>System Tasks ({tasks.length})</h3>
          {tasks.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No tasks created yet.</div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Task/Store</th>
                    <th style={{ padding: '8px' }}>User</th>
                    <th style={{ padding: '8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task._id || task.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontWeight: 'bold' }}>{task.itemName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Store: {task.storeName}</div>
                      </td>
                      <td style={{ padding: '8px', fontSize: '0.8rem' }}>{task.assignedUser?.name || 'Unknown'}</td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontSize: '0.7rem' }}>Pay: {task.paymentStatus}</div>
                        <div style={{ fontSize: '0.7rem' }}>Deliv: {task.deliveryStatus}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
