import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Demands() {
  const { user } = useAuth();
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin form state
  const [storeName, setStoreName] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [claimingIds, setClaimingIds] = useState(new Set());

  const fetchDemands = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getDemands();
      if (res.success) {
        setDemands(res.data || []);
      } else {
        setError(res.message || 'Failed to load demands');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching demands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemands();
  }, []);

  const handleClaim = async (demand) => {
    const demandId = demand._id || demand.id;
    if (claimingIds.has(demandId)) return;

    try {
      setClaimingIds(prev => {
        const next = new Set(prev);
        next.add(demandId);
        return next;
      });
      setError('');
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const taskData = {
        assignedUser: user.id,
        type: 'procurement',
        storeName: demand.storeName,
        itemName: demand.itemName,
        quantity: demand.quantity,
        farmer: { name: '', category: '' },
        purchasePrice: 0,
        deliveryPrice: 0,
        deliveryCharges: 0,
        deadline,
        demandId
      };

      const res = await api.createTask(taskData);
      if (res.success) {
        alert(`Successfully claimed demand for ${demand.itemName}!`);
        await fetchDemands();
      } else {
        setError(res.message || 'Failed to claim demand');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while claiming the demand');
    } finally {
      setClaimingIds(prev => {
        const next = new Set(prev);
        next.delete(demandId);
        return next;
      });
    }
  };

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
        await fetchDemands();
      } else {
        setFormError(res.message || 'Failed to create demand');
      }
    } catch (err) {
      setFormError(err.message || 'An error occurred while creating demand');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="demands-container" style={{ padding: '24px' }}>
      <h2>Store Demands</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        View and claim active store crop demands from the platform.
      </p>

      {/* Admin Create Demand Form */}
      {user?.role === 'admin' && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <h3>Create Store Demand</h3>
          {formError && <div style={{ color: 'var(--error-color)', marginBottom: '12px' }}>⚠️ {formError}</div>}
          <form onSubmit={handleCreateDemand} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Store Name</label>
              <input
                type="text"
                className="form-input"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Big Bazaar"
                required
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Item Name</label>
              <input
                type="text"
                className="form-input"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Tomatoes"
                required
              />
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Quantity (kg)</label>
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
            <button type="submit" className="form-btn" style={{ height: '38px', width: 'auto', padding: '0 20px' }} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Demand'}
            </button>
          </form>
        </div>
      )}

      {error && <div style={{ color: 'var(--error-color)', padding: '12px', marginBottom: '16px', border: '1px solid var(--error-color)', borderRadius: '6px' }}>⚠️ {error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading demands list...</div>
      ) : demands.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
          No active store demands found.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Store</th>
                <th style={{ padding: '12px' }}>Crop/Item</th>
                <th style={{ padding: '12px' }}>Required Qty</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {demands.map((demand) => (
                <tr key={demand._id || demand.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px' }}>{demand.storeName}</td>
                  <td style={{ padding: '12px' }}>{demand.itemName}</td>
                  <td style={{ padding: '12px' }}>{demand.quantity} kg</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      textTransform: 'capitalize',
                      backgroundColor: demand.status === 'pending' ? 'rgba(184, 134, 11, 0.15)' : 'rgba(56, 161, 105, 0.15)',
                      color: demand.status === 'pending' ? '#b8860b' : '#38a169'
                    }}>
                      {demand.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {user?.role === 'buyer' && demand.status === 'pending' ? (
                      <button
                        onClick={() => handleClaim(demand)}
                        className="form-btn"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}
                        disabled={claimingIds.has(demand._id || demand.id)}
                      >
                        {claimingIds.has(demand._id || demand.id) ? 'Claiming...' : 'Claim Demand'}
                      </button>
                    ) : user?.role === 'buyer' ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Claimed</span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
