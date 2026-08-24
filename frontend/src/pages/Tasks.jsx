import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing state
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editFarmerName, setEditFarmerName] = useState('');
  const [editFarmerCategory, setEditFarmerCategory] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState('');
  const [editDeliveryPrice, setEditDeliveryPrice] = useState('');
  const [editDeliveryCharges, setEditDeliveryCharges] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getTasks();
      if (res.success) {
        setTasks(res.data || []);
      } else {
        setError(res.message || 'Failed to load tasks');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleEditClick = (task) => {
    setEditingTaskId(task._id || task.id);
    setEditFarmerName(task.farmer?.name || '');
    setEditFarmerCategory(task.farmer?.category || '');
    setEditPurchasePrice(task.purchasePrice || 0);
    setEditDeliveryPrice(task.deliveryPrice || 0);
    setEditDeliveryCharges(task.deliveryCharges || 0);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  const handleSaveTask = async (taskId) => {
    try {
      setActionLoading(true);
      setError('');
      const updatedData = {
        farmer: {
          name: editFarmerName,
          category: editFarmerCategory
        },
        purchasePrice: parseFloat(editPurchasePrice) || 0,
        deliveryPrice: parseFloat(editDeliveryPrice) || 0,
        deliveryCharges: parseFloat(editDeliveryCharges) || 0
      };

      const res = await api.updateTask(taskId, updatedData);
      if (res.success) {
        setEditingTaskId(null);
        alert('Task updated successfully!');
        await fetchTasks();
      } else {
        setError(res.message || 'Failed to update task');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating task');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async (taskId) => {
    try {
      setActionLoading(true);
      setError('');
      const res = await api.markTaskPaid(taskId);
      if (res.success) {
        alert('Payment completed successfully!');
        await fetchTasks();
      } else {
        setError(res.message || 'Failed to process payment');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during payment processing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async (taskId) => {
    try {
      setActionLoading(true);
      setError('');
      const res = await api.markTaskDelivered(taskId);
      if (res.success) {
        alert('Delivery confirmed successfully!');
        await fetchTasks();
      } else {
        setError(res.message || 'Failed to process delivery');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during delivery confirmation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcure = async (taskId) => {
    try {
      setActionLoading(true);
      setError('');
      const res = await api.markTaskProcured(taskId);
      if (res.success) {
        alert('Crop marked as procured successfully!');
        await fetchTasks();
      } else {
        setError(res.message || 'Failed to mark task as procured');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating procurement status');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter tasks locally
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.storeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Pending' && task.deliveryStatus === 'pending') ||
      (statusFilter === 'Completed' && task.deliveryStatus === 'delivered');

    const matchesPayment = paymentFilter === 'All' ||
      (paymentFilter === 'Pending' && task.paymentStatus === 'pending') ||
      (paymentFilter === 'Paid' && task.paymentStatus === 'paid');

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="grid-bg-effect" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0 0 8px 0' }}>Procurement Tasks</h2>
        <p style={{ color: 'var(--text-light)', margin: 0 }}>
          Manage crop pricing terms, clear payments, and confirm delivery milestones.
        </p>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>}

      {/* Filter Row */}
      <div className="tasks-filters-container" style={{ animation: 'fadeInUp 0.45s ease-out' }}>
        <div className="demands-search-wrapper" style={{ flex: '1 1 240px' }}>
          <span className="demands-search-icon">🔍</span>
          <input
            type="text"
            className="demands-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crop or store name..."
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Delivery Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Delivery:</span>
            <div className="demands-status-tabs">
              {['All', 'Pending', 'Completed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`demands-status-tab ${statusFilter === tab ? 'active' : ''}`}
                  style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Payment:</span>
            <div className="demands-status-tabs">
              {['All', 'Pending', 'Paid'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPaymentFilter(tab)}
                  className={`demands-status-tab ${paymentFilter === tab ? 'active' : ''}`}
                  style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading tasks list...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state" style={{ animation: 'fadeInUp 0.55s ease-out' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 255, 157, 0.04)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <span style={{ fontSize: '1.75rem' }}>⚙️</span>
          </div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700' }}>No procurement tasks found</h4>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your assigned task records will appear here.</p>
        </div>
      ) : (
        <>
          {/* DESKTOP VIEW TABLE */}
          <div className="table-container desktop-only" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Store & Crop</th>
                  <th style={{ width: '12%' }}>Quantity</th>
                  <th style={{ width: '20%' }}>Farmer Details</th>
                  <th style={{ width: '20%' }}>Pricing (₹)</th>
                  <th style={{ width: '13%' }}>Status</th>
                  <th style={{ width: '13%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task, idx) => {
                  const taskId = task._id || task.id;
                  const isEditing = editingTaskId === taskId;
                  const isPaid = task.paymentStatus === 'paid';
                  const isDelivered = task.deliveryStatus === 'delivered';
                  const isLocked = isPaid || isDelivered;

                  return (
                    <tr
                      key={taskId}
                      style={{
                        animation: 'fadeInUp 0.4s ease-out both',
                        animationDelay: `${idx * 0.04}s`
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{task.itemName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Store: {task.storeName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '2px' }}>Deadline: {new Date(task.deadline).toLocaleDateString()}</div>
                      </td>
                      <td style={{ fontWeight: '600' }}>{task.quantity} kg</td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input
                              type="text"
                              className="form-input"
                              style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                              value={editFarmerName}
                              onChange={(e) => setEditFarmerName(e.target.value)}
                              placeholder="Farmer Name"
                            />
                            <input
                              type="text"
                              className="form-input"
                              style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                              value={editFarmerCategory}
                              onChange={(e) => setEditFarmerCategory(e.target.value)}
                              placeholder="Category"
                            />
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: '600' }}>
                              {user?.role === 'farmer' ? `Buyer: ${task.assignedUser?.name || 'Assigned Buyer'}` : (task.farmer?.name || 'Unassigned')}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {user?.role === 'farmer' ? `Farmer: ${task.farmer?.name || 'Self'} (${task.farmer?.category || '-'})` : (task.farmer?.category || '-')}
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '140px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '60px' }}>Purch:</span>
                              <input
                                type="number"
                                className="form-input"
                                style={{ padding: '4px 8px', fontSize: '0.8rem', flex: 1 }}
                                value={editPurchasePrice}
                                onChange={(e) => setEditPurchasePrice(e.target.value)}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '60px' }}>Deliv:</span>
                              <input
                                type="number"
                                className="form-input"
                                style={{ padding: '4px 8px', fontSize: '0.8rem', flex: 1 }}
                                value={editDeliveryPrice}
                                onChange={(e) => setEditDeliveryPrice(e.target.value)}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '60px' }}>Chgs:</span>
                              <input
                                type="number"
                                className="form-input"
                                style={{ padding: '4px 8px', fontSize: '0.8rem', flex: 1 }}
                                value={editDeliveryCharges}
                                onChange={(e) => setEditDeliveryCharges(e.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                            <div>Purchase: <span style={{ fontWeight: '600', color: 'var(--text-light)' }}>₹{task.purchasePrice}</span></div>
                            <div>Delivery: <span style={{ fontWeight: '600', color: 'var(--text-light)' }}>₹{task.deliveryPrice}</span></div>
                            <div>Charges: <span style={{ fontWeight: '600', color: 'var(--text-light)' }}>₹{task.deliveryCharges}</span></div>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span className={`badge ${task.procurementStatus === 'procured' ? 'badge-success' : 'badge-pending'}`} style={{ textAlign: 'center' }}>
                            Procure: {task.procurementStatus || 'pending'}
                          </span>
                          <span className={`badge ${isPaid ? 'badge-success' : 'badge-error'}`} style={{ textAlign: 'center' }}>
                            Pay: {task.paymentStatus}
                          </span>
                          <span className={`badge ${isDelivered ? 'badge-success' : 'badge-pending'}`} style={{ textAlign: 'center' }}>
                            Deliv: {task.deliveryStatus}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {user?.role === 'farmer' ? (
                            <>
                              {task.procurementStatus === 'procured' ? (
                                <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: '700', textAlign: 'center', padding: '4px 0' }}>
                                  ✅ Procured
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleProcure(taskId)}
                                  className="form-btn"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', width: '100%', backgroundColor: '#00ff9d', borderColor: '#00ff9d', color: '#000', fontWeight: 'bold' }}
                                  disabled={actionLoading}
                                >
                                  Mark as Procured
                                </button>
                              )}
                            </>
                          ) : isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveTask(taskId)}
                                className="form-btn"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', width: '100%', color: '#000', fontWeight: 'bold' }}
                                disabled={actionLoading}
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="form-btn"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-light)' }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {isLocked ? (
                                <span className="task-locked-badge">
                                  🔒 Locked
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleEditClick(task)}
                                  className="form-btn"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'var(--border-color)', color: 'var(--text-light)' }}
                                >
                                  Edit Terms
                                </button>
                              )}

                              {!isPaid && (
                                <button
                                  onClick={() => handlePay(taskId)}
                                  className="form-btn"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', width: '100%', backgroundColor: '#fbbf24', borderColor: '#fbbf24', color: '#000', fontWeight: 'bold' }}
                                  disabled={actionLoading}
                                >
                                  Clear Payment
                                </button>
                              )}

                              {isPaid && !isDelivered && (
                                <button
                                  onClick={() => handleDeliver(taskId)}
                                  className="form-btn"
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '0.75rem',
                                    width: '100%',
                                    backgroundColor: (task.farmerId && task.procurementStatus !== 'procured') ? 'rgba(255,255,255,0.1)' : '#00ff9d',
                                    borderColor: (task.farmerId && task.procurementStatus !== 'procured') ? 'rgba(255,255,255,0.2)' : '#00ff9d',
                                    color: (task.farmerId && task.procurementStatus !== 'procured') ? 'var(--text-muted)' : '#000',
                                    fontWeight: 'bold',
                                    cursor: (task.farmerId && task.procurementStatus !== 'procured') ? 'not-allowed' : 'pointer'
                                  }}
                                  disabled={actionLoading || (task.farmerId && task.procurementStatus !== 'procured')}
                                  title={(task.farmerId && task.procurementStatus !== 'procured') ? 'Awaiting farmer procurement confirmation' : ''}
                                >
                                  Confirm Delivery
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW GRID */}
          <div className="mobile-only tasks-mobile-list" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
            {filteredTasks.map((task, idx) => {
              const taskId = task._id || task.id;
              const isEditing = editingTaskId === taskId;
              const isPaid = task.paymentStatus === 'paid';
              const isDelivered = task.deliveryStatus === 'delivered';
              const isLocked = isPaid || isDelivered;

              return (
                <div
                  key={taskId}
                  className="card task-mobile-card"
                  style={{
                    animation: 'fadeInUp 0.45s ease-out both',
                    animationDelay: `${idx * 0.05}s`
                  }}
                >
                  <div className="task-mobile-header">
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>{task.itemName}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>🏪 {task.storeName}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span className={`badge ${task.procurementStatus === 'procured' ? 'badge-success' : 'badge-pending'}`} style={{ fontSize: '0.65rem' }}>
                        Procure: {task.procurementStatus || 'pending'}
                      </span>
                      <span className={`badge ${isPaid ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.65rem' }}>
                        Pay: {task.paymentStatus}
                      </span>
                      <span className={`badge ${isDelivered ? 'badge-success' : 'badge-pending'}`} style={{ fontSize: '0.65rem' }}>
                        Deliv: {task.deliveryStatus}
                      </span>
                    </div>
                  </div>

                  <div className="task-mobile-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Quantity:</span>
                      <span style={{ fontWeight: '600' }}>{task.quantity} kg</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Deadline:</span>
                      <span style={{ color: 'var(--accent-color)', fontWeight: '600' }}>{new Date(task.deadline).toLocaleDateString()}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Farmer:</span>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '60%' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            value={editFarmerName}
                            onChange={(e) => setEditFarmerName(e.target.value)}
                            placeholder="Name"
                          />
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            value={editFarmerCategory}
                            onChange={(e) => setEditFarmerCategory(e.target.value)}
                            placeholder="Category"
                          />
                        </div>
                      ) : (
                        <span style={{ fontWeight: '600' }}>{task.farmer?.name || 'Unassigned'} ({task.farmer?.category || '-'})</span>
                      )}
                    </div>

                    <div className="task-mobile-prices">
                      <div style={{ fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', borderBottom: '1px solid rgba(0,255,157,0.08)', paddingBottom: '4px', marginBottom: '6px' }}>Pricing Terms (₹)</div>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Purchase:</span>
                            <input
                              type="number"
                              className="form-input"
                              style={{ padding: '2px 6px', fontSize: '0.75rem', width: '80px' }}
                              value={editPurchasePrice}
                              onChange={(e) => setEditPurchasePrice(e.target.value)}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delivery:</span>
                            <input
                              type="number"
                              className="form-input"
                              style={{ padding: '2px 6px', fontSize: '0.75rem', width: '80px' }}
                              value={editDeliveryPrice}
                              onChange={(e) => setEditDeliveryPrice(e.target.value)}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Charges:</span>
                            <input
                              type="number"
                              className="form-input"
                              style={{ padding: '2px 6px', fontSize: '0.75rem', width: '80px' }}
                              value={editDeliveryCharges}
                              onChange={(e) => setEditDeliveryCharges(e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Purchase:</span>
                            <span>₹{task.purchasePrice}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Delivery:</span>
                            <span>₹{task.deliveryPrice}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Charges:</span>
                            <span>₹{task.deliveryCharges}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="task-mobile-footer">
                    {user?.role === 'farmer' ? (
                      <div>
                        {task.procurementStatus === 'procured' ? (
                          <div style={{ textAlign: 'center', padding: '6px', background: 'rgba(0,255,157,0.1)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: '700' }}>
                            ✅ Procured
                          </div>
                        ) : (
                          <button
                            onClick={() => handleProcure(taskId)}
                            className="form-btn"
                            style={{ padding: '8px', fontSize: '0.8rem', width: '100%', backgroundColor: '#00ff9d', borderColor: '#00ff9d', color: '#000', fontWeight: 'bold' }}
                            disabled={actionLoading}
                          >
                            Mark as Procured
                          </button>
                        )}
                      </div>
                    ) : isEditing ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleSaveTask(taskId)}
                          className="form-btn"
                          style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                          disabled={actionLoading}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="form-btn"
                          style={{ flex: 1, padding: '8px', fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {isLocked ? (
                          <div style={{ textAlign: 'center', padding: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            🔒 Terms Locked
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(task)}
                            className="form-btn"
                            style={{ padding: '8px', fontSize: '0.8rem', width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'var(--border-color)' }}
                          >
                            Edit Terms
                          </button>
                        )}

                        {!isPaid && (
                          <button
                            onClick={() => handlePay(taskId)}
                            className="form-btn"
                            style={{ padding: '8px', fontSize: '0.8rem', width: '100%', backgroundColor: 'rgba(251,191,36,0.08)', borderColor: 'var(--border-accent)', color: 'var(--accent-color)' }}
                            disabled={actionLoading}
                          >
                            Clear Payment
                          </button>
                        )}

                        {isPaid && !isDelivered && (
                          <button
                            onClick={() => handleDeliver(taskId)}
                            className="form-btn"
                            style={{
                              padding: '8px',
                              fontSize: '0.8rem',
                              width: '100%',
                              backgroundColor: (task.farmerId && task.procurementStatus !== 'procured') ? 'rgba(255,255,255,0.05)' : 'rgba(0,255,157,0.08)',
                              borderColor: (task.farmerId && task.procurementStatus !== 'procured') ? 'rgba(255,255,255,0.1)' : 'var(--border-color)',
                              color: (task.farmerId && task.procurementStatus !== 'procured') ? 'var(--text-muted)' : 'var(--primary-color)',
                              cursor: (task.farmerId && task.procurementStatus !== 'procured') ? 'not-allowed' : 'pointer'
                            }}
                            disabled={actionLoading || (task.farmerId && task.procurementStatus !== 'procured')}
                            title={(task.farmerId && task.procurementStatus !== 'procured') ? 'Awaiting farmer procurement confirmation' : ''}
                          >
                            Confirm Delivery
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
