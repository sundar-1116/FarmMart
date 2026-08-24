import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demands, setDemands] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form & Edit state
  const [editingDemand, setEditingDemand] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [demandsRes, tasksRes, offersRes] = await Promise.allSettled([
        api.getDemands(),
        api.getTasks(),
        api.getOffers()
      ]);

      if (demandsRes.status === 'fulfilled' && demandsRes.value.success) {
        setDemands(demandsRes.value.data || []);
      }
      if (tasksRes.status === 'fulfilled' && tasksRes.value.success) {
        setTasks(tasksRes.value.data || []);
      }
      if (offersRes.status === 'fulfilled' && offersRes.value.success) {
        setOffers(offersRes.value.data || []);
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

  const handleStartEdit = (demand) => {
    setEditingDemand(demand);
    setStoreName(demand.storeName);
    setItemName(demand.itemName);
    setQuantity(demand.quantity);
    setFormError('');
  };

  const handleCancelEdit = () => {
    setEditingDemand(null);
    setStoreName('');
    setItemName('');
    setQuantity('');
    setFormError('');
  };

  const handleSubmitDemand = async (e) => {
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
      let res;
      if (editingDemand) {
        const demandId = editingDemand._id || editingDemand.id;
        res = await api.updateDemand(demandId, {
          storeName,
          itemName,
          quantity: numQty,
          status: editingDemand?.status || 'pending'
        });
      } else {
        res = await api.createDemand({
          storeName,
          itemName,
          quantity: numQty
        });
      }

      if (res.success) {
        setStoreName('');
        setItemName('');
        setQuantity('');
        setEditingDemand(null);
        alert(editingDemand ? 'Demand updated successfully!' : 'Store demand created successfully!');
        await loadData();
      } else {
        setFormError(res.message || 'Operation failed');
      }
    } catch (err) {
      setFormError(err.message || 'An error occurred while saving demand');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDemand = async (demand) => {
    const demandId = demand._id || demand.id;
    if (!window.confirm(`Are you sure you want to delete the demand for ${demand.itemName} (${demand.storeName})?`)) return;

    try {
      setDeletingId(demandId);
      const res = await api.deleteDemand(demandId);
      if (res.success) {
        alert('Demand deleted successfully!');
        if (editingDemand && (editingDemand._id === demandId || editingDemand.id === demandId)) {
          handleCancelEdit();
        }
        await loadData();
      } else {
        alert(res.message || 'Failed to delete demand');
      }
    } catch (err) {
      alert(err.message || 'An error occurred while deleting demand');
    } finally {
      setDeletingId(null);
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

  // Calculate live dashboard stats
  const totalDemands = demands.length;
  const pendingDemands = demands.filter(d => d.status === 'pending').length;
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(t => t.deliveryStatus === 'pending').length;
  const completedTasks = tasks.filter(t => t.deliveryStatus === 'delivered').length;

  return (
    <div className="grid-bg-effect" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0 0 8px 0' }}>Admin Console Home</h2>
        <p style={{ color: 'var(--text-light)', margin: 0 }}>
          Overview of store demands, system tasks, and procurement progress.
        </p>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '24px' }}>⚠️ {error}</div>}

      {/* Admin Statistics Row */}
      <div className="stats-grid">
        <div className="card stat-card" style={{ animation: 'fadeInUp 0.45s ease-out both', animationDelay: '0.05s' }}>
          <div className="stat-label">Total Demands</div>
          <div className="stat-value">{totalDemands}</div>
          <div className="stat-change text-info">📌 Active Demands</div>
        </div>

        <div className="card stat-card" style={{ animation: 'fadeInUp 0.45s ease-out both', animationDelay: '0.1s' }}>
          <div className="stat-label">Pending Demands</div>
          <div className="stat-value" style={{ color: 'var(--accent-color)' }}>{pendingDemands}</div>
          <div className="stat-change text-warning">⏳ Awaiting claims</div>
        </div>

        <div className="card stat-card" style={{ animation: 'fadeInUp 0.45s ease-out both', animationDelay: '0.15s' }}>
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{totalTasks}</div>
          <div className="stat-change text-info">⚙️ Active Workflows</div>
        </div>

        <div className="card stat-card" style={{ animation: 'fadeInUp 0.45s ease-out both', animationDelay: '0.2s' }}>
          <div className="stat-label">Active Tasks</div>
          <div className="stat-value" style={{ color: 'var(--accent-color)' }}>{activeTasks}</div>
          <div className="stat-change text-warning">🚚 In Transit / Procurement</div>
        </div>

        <div className="card stat-card" style={{ animation: 'fadeInUp 0.45s ease-out both', animationDelay: '0.25s' }}>
          <div className="stat-label">Completed Tasks</div>
          <div className="stat-value" style={{ color: 'var(--primary-color)' }}>{completedTasks}</div>
          <div className="stat-change text-success">✅ Delivered to Retailers</div>
        </div>
      </div>

      {/* Two-Column Demand & Controls Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* LEFT COLUMN: Actions & Demand Creation/Edit Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* User Management Quick Action */}
          <div className="card" style={{ borderLeft: '4px solid var(--accent-color)', animation: 'fadeInUp 0.4s ease-out' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-secondary)' }}>User Management</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
              Manage system users and role permissions
            </p>
            <button
              onClick={() => navigate('/admin/users')}
              className="form-btn"
              style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem', margin: 0 }}
            >
              Go to User Management &rarr;
            </button>
          </div>

          {/* Create / Edit Store Demand Form */}
          <div className="card" style={{ borderLeft: `4px solid ${editingDemand ? 'var(--accent-color)' : 'var(--primary-color)'}`, animation: 'fadeInUp 0.45s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                {editingDemand ? 'Edit Store Demand' : 'Create Store Demand'}
              </h3>
              {editingDemand && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕ Cancel Edit
                </button>
              )}
            </div>

            {formError && <div className="form-error" style={{ marginBottom: '16px', fontSize: '0.85rem' }}>⚠️ {formError}</div>}

            <form onSubmit={handleSubmitDemand} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="form-btn" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Saving...' : editingDemand ? 'Update Demand' : 'Create Demand'}
                </button>
                {editingDemand && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="form-btn"
                    style={{ flex: '0 0 auto', padding: '0 16px', backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-color)', color: 'var(--text-light)' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Current Demands & Active Offers Tables */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Current Demands Table */}
          <div className="card" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
              Current Demands ({demands.length})
            </h3>
            {demands.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '16px 0' }}>No demands active.</div>
            ) : (
              <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto', marginTop: 0 }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ padding: '12px' }}>Store</th>
                      <th style={{ padding: '12px' }}>Item</th>
                      <th style={{ padding: '12px' }}>Qty</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demands.map((demand, idx) => {
                      const demandId = demand._id || demand.id;
                      const isDeleting = deletingId === demandId;
                      const isEditingThis = editingDemand && (editingDemand._id === demandId || editingDemand.id === demandId);

                      return (
                        <tr
                          key={demandId}
                          style={{
                            animation: 'fadeInUp 0.35s ease-out both',
                            animationDelay: `${idx * 0.03}s`,
                            backgroundColor: isEditingThis ? 'rgba(0, 255, 157, 0.05)' : 'transparent'
                          }}
                        >
                          <td style={{ fontWeight: '700' }}>{demand.storeName}</td>
                          <td style={{ color: 'var(--text-light)' }}>{demand.itemName}</td>
                          <td>{demand.quantity} kg</td>
                          <td>
                            <span className={`badge ${demand.status === 'pending' ? 'badge-pending' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                              {demand.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleStartEdit(demand)}
                                className="form-btn"
                                style={{ padding: '4px 10px', fontSize: '0.7rem', width: 'auto', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', color: '#60a5fa' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDemand(demand)}
                                className="form-btn"
                                style={{ padding: '4px 10px', fontSize: '0.7rem', width: 'auto', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', color: '#f87171' }}
                                disabled={isDeleting}
                              >
                                {isDeleting ? '...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Offers Overview Card */}
          <div className="card" style={{ animation: 'fadeInUp 0.55s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                Active Offers ({offers.length})
              </h3>
              <button
                onClick={() => navigate('/demands')}
                className="form-btn"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', margin: 0 }}
              >
                Inspect Demands &rarr;
              </button>
            </div>
            {offers.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '16px 0' }}>No offers submitted yet.</div>
            ) : (
              <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto', marginTop: 0 }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ padding: '12px' }}>Demand / Crop</th>
                      <th style={{ padding: '12px' }}>Farmer</th>
                      <th style={{ padding: '12px' }}>Qty / Price</th>
                      <th style={{ padding: '12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer, idx) => (
                      <tr
                        key={offer._id || offer.id}
                        style={{
                          animation: 'fadeInUp 0.35s ease-out both',
                          animationDelay: `${idx * 0.03}s`
                        }}
                      >
                        <td>
                          <div style={{ fontWeight: '700' }}>{offer.demand?.itemName || 'Item'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{offer.demand?.storeName || 'Store'}</div>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{offer.farmer?.name || 'Farmer'}</td>
                        <td style={{ fontSize: '0.85rem' }}>
                          <div>{offer.quantity} kg @ ₹{offer.pricePerUnit}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>Total: ₹{offer.totalPrice}</div>
                        </td>
                        <td>
                          <span className={`badge badge-${offer.status}`} style={{ fontSize: '0.7rem' }}>
                            {offer.status}
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

      </div>

      {/* FULL-WIDTH BOTTOM SECTION: System Tasks Table */}
      <div className="card" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
          System Tasks ({tasks.length})
        </h3>
        {tasks.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '16px 0' }}>No tasks created yet.</div>
        ) : (
          <div className="table-container" style={{ maxHeight: '450px', overflowY: 'auto', marginTop: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ padding: '12px' }}>Task/Store</th>
                  <th style={{ padding: '12px' }}>Assigned User</th>
                  <th style={{ padding: '12px' }}>Quantity</th>
                  <th style={{ padding: '12px' }}>Farmer Info</th>
                  <th style={{ padding: '12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, idx) => (
                  <tr
                    key={task._id || task.id}
                    style={{
                      animation: 'fadeInUp 0.35s ease-out both',
                      animationDelay: `${idx * 0.03}s`
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: '700' }}>{task.itemName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Store: {task.storeName}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem', fontWeight: '600' }}>{task.assignedUser?.name || 'Unknown'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{task.quantity} kg</td>
                    <td style={{ fontSize: '0.85rem' }}>{task.farmer?.name || 'Not assigned'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className={`badge ${task.paymentStatus === 'paid' ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                          Pay: {task.paymentStatus}
                        </span>
                        <span className={`badge ${task.deliveryStatus === 'delivered' ? 'badge-success' : 'badge-pending'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
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
  );
}
