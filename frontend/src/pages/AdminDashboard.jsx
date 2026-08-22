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
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading admin console...</p>
      </div>
    );
  }

  return (
    <div className="grid-bg-effect">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0 0 8px 0' }}>Admin Console Home</h2>
        <p style={{ color: 'var(--text-light)', margin: 0 }}>
          Overview of store demands and buyer procurement tasks.
        </p>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '24px' }}>⚠️ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px', alignItems: 'start' }}>

        {/* Left Column: Create Demand & Demands List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

          <div className="card" style={{ borderLeft: '4px solid var(--primary-color)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Create Store Demand</h3>
            {formError && <div className="form-error" style={{ marginBottom: '16px', fontSize: '0.85rem' }}>⚠️ {formError}</div>}

            <form onSubmit={handleCreateDemand} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Store Name</label>
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
                <label className="form-label">Item/Crop Name</label>
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
                <label className="form-label">Required Quantity (kg)</label>
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
              <button type="submit" className="form-btn" style={{ marginTop: '12px' }} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Demand'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
              Current Demands ({demands.length})
            </h3>
            {demands.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No demands active.</div>
            ) : (
              <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto', marginTop: 0 }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ padding: '12px' }}>Store</th>
                      <th style={{ padding: '12px' }}>Item</th>
                      <th style={{ padding: '12px' }}>Qty</th>
                      <th style={{ padding: '12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demands.map(demand => (
                      <tr key={demand._id || demand.id}>
                        <td style={{ fontWeight: '700' }}>{demand.storeName}</td>
                        <td style={{ color: 'var(--text-light)' }}>{demand.itemName}</td>
                        <td>{demand.quantity} kg</td>
                        <td>
                          <span className={`badge ${demand.status === 'pending' ? 'badge-pending' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
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
        <div className="card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
            System Tasks ({tasks.length})
          </h3>
          {tasks.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No tasks created yet.</div>
          ) : (
            <div className="table-container" style={{ maxHeight: '780px', overflowY: 'auto', marginTop: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ padding: '12px' }}>Task/Store</th>
                    <th style={{ padding: '12px' }}>User</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task._id || task.id}>
                      <td>
                        <div style={{ fontWeight: '700' }}>{task.itemName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Store: {task.storeName}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem', fontWeight: '600' }}>{task.assignedUser?.name || 'Unknown'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className={`badge ${task.paymentStatus === 'paid' ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.65rem', textAlign: 'center', padding: '2px 6px' }}>
                            Pay: {task.paymentStatus}
                          </span>
                          <span className={`badge ${task.deliveryStatus === 'delivered' ? 'badge-success' : 'badge-pending'}`} style={{ fontSize: '0.65rem', textAlign: 'center', padding: '2px 6px' }}>
                            Deliv: {task.deliveryStatus}
                          </span>
                        </div>
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
