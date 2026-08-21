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

  const isFarmer = user?.role === 'farmer';

  const fetchTasks = async () => {
    if (isFarmer) {
      setLoading(false);
      return;
    }

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
  }, [isFarmer]);

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

  if (isFarmer) {
    return (
      <div className="tasks-container" style={{ padding: '24px' }}>
        <h2>Procurement Tasks</h2>
        <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
          ℹ️ Task management and crop procurement workflows are restricted to buyers and administrators.
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-container" style={{ padding: '24px' }}>
      <h2>Procurement Tasks</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Manage active crop procurements, pricing terms, payments, and delivery milestones.
      </p>

      {error && <div style={{ color: 'var(--error-color)', padding: '12px', marginBottom: '16px', border: '1px solid var(--error-color)', borderRadius: '6px' }}>⚠️ {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading tasks list...</div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
          No active procurement tasks found.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Store & Crop</th>
                <th style={{ padding: '12px' }}>Quantity</th>
                <th style={{ padding: '12px' }}>Farmer Details</th>
                <th style={{ padding: '12px' }}>Pricing (₹)</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const taskId = task._id || task.id;
                const isEditing = editingTaskId === taskId;

                return (
                  <tr key={taskId} style={{ borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold' }}>{task.itemName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Store: {task.storeName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Deadline: {new Date(task.deadline).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '12px' }}>{task.quantity} kg</td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                            value={editFarmerName}
                            onChange={(e) => setEditFarmerName(e.target.value)}
                            placeholder="Farmer Name"
                          />
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                            value={editFarmerCategory}
                            onChange={(e) => setEditFarmerCategory(e.target.value)}
                            placeholder="Category"
                          />
                        </div>
                      ) : (
                        <div>
                          <div>{task.farmer?.name || 'Unassigned'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{task.farmer?.category || '-'}</div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '120px' }}>
                          <label style={{ fontSize: '0.7rem' }}>Purchase Price:</label>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                            value={editPurchasePrice}
                            onChange={(e) => setEditPurchasePrice(e.target.value)}
                          />
                          <label style={{ fontSize: '0.7rem' }}>Delivery Price:</label>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                            value={editDeliveryPrice}
                            onChange={(e) => setEditDeliveryPrice(e.target.value)}
                          />
                          <label style={{ fontSize: '0.7rem' }}>Deliv. Charges:</label>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                            value={editDeliveryCharges}
                            onChange={(e) => setEditDeliveryCharges(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem' }}>
                          <div>Purchase: ₹{task.purchasePrice}</div>
                          <div>Delivery: ₹{task.deliveryPrice}</div>
                          <div>Charges: ₹{task.deliveryCharges}</div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          backgroundColor: task.paymentStatus === 'paid' ? 'rgba(56, 161, 105, 0.15)' : 'rgba(229, 62, 62, 0.15)',
                          color: task.paymentStatus === 'paid' ? '#38a169' : '#e53e3e'
                        }}>
                          Payment: {task.paymentStatus}
                        </span>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          textAlign: 'center',
                          backgroundColor: task.deliveryStatus === 'delivered' ? 'rgba(56, 161, 105, 0.15)' : 'rgba(184, 134, 11, 0.15)',
                          color: task.deliveryStatus === 'delivered' ? '#38a169' : '#b8860b'
                        }}>
                          Delivery: {task.deliveryStatus}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveTask(taskId)}
                              className="form-btn"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }}
                              disabled={actionLoading}
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="form-btn"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto', backgroundColor: '#e2e8f0', color: '#4a5568' }}
                              disabled={actionLoading}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            {user?.role === 'buyer' && (
                              <button
                                onClick={() => handleEditClick(task)}
                                className="form-btn"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto', backgroundColor: '#edf2f7', color: '#2d3748' }}
                              >
                                Edit Terms
                              </button>
                            )}
                            {user?.role === 'buyer' && task.paymentStatus === 'pending' && (
                              <button
                                onClick={() => handlePay(taskId)}
                                className="form-btn"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto', backgroundColor: '#b8860b', color: '#fff' }}
                                disabled={actionLoading}
                              >
                                Pay
                              </button>
                            )}
                            {user?.role === 'buyer' && task.deliveryStatus === 'pending' && (
                              <button
                                onClick={() => handleDeliver(taskId)}
                                className="form-btn"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto', backgroundColor: '#3182ce', color: '#fff' }}
                                disabled={actionLoading}
                              >
                                Deliver
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
      )}
    </div>
  );
}
