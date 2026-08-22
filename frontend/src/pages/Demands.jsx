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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

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

  // Filter demands locally
  const filteredDemands = demands.filter(d => {
    const matchesSearch = d.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="grid-bg-effect" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Titleblock */}
      <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0 0 8px 0' }}>Store Demands</h2>
        <p style={{ color: 'var(--text-light)', margin: 0 }}>
          Browse current crop requirements from retail partners.
        </p>
      </div>

      {/* Admin Create Demand Form */}
      {user?.role === 'admin' && (
        <div className="card" style={{ borderLeft: '4px solid var(--primary-color)', animation: 'fadeInUp 0.45s ease-out' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 20px 0', color: 'var(--text-secondary)' }}>Create Store Demand</h3>
          {formError && <div className="form-error" style={{ marginBottom: '16px' }}>⚠️ {formError}</div>}
          <form onSubmit={handleCreateDemand} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 200px' }}>
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
            <div style={{ flex: '2 1 200px' }}>
              <label className="form-label">Item Name</label>
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
              <label className="form-label">Quantity (kg)</label>
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
            <button type="submit" className="form-btn" style={{ height: '46px', width: 'auto', padding: '0 24px', flex: '0 0 auto' }} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Demand'}
            </button>
          </form>
        </div>
      )}

      {/* Search & Filter row */}
      <div className="demands-filters-container" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <div className="demands-search-wrapper">
          <span className="demands-search-icon">🔍</span>
          <input
            type="text"
            className="demands-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crop or retail store..."
          />
        </div>

        <div className="demands-status-tabs">
          {['All', 'Pending', 'Assigned', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`demands-status-tab ${statusFilter === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>}

      {/* Main Content List */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading demands list...</p>
        </div>
      ) : filteredDemands.length === 0 ? (
        <div className="empty-state" style={{ animation: 'fadeInUp 0.55s ease-out' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 255, 157, 0.04)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <span style={{ fontSize: '1.75rem' }}>📦</span>
          </div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700' }}>No active demands</h4>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>New store demands will appear here.</p>
        </div>
      ) : (
        <div className="demands-grid">
          {filteredDemands.map((demand, idx) => {
            const demandId = demand._id || demand.id;
            const isPending = demand.status === 'pending';
            const isClaiming = claimingIds.has(demandId);

            // Dynamically assign badges matching dashboard colors
            let badgeClass = 'badge-pending';
            if (demand.status === 'assigned') badgeClass = 'badge-info';
            if (demand.status === 'completed') badgeClass = 'badge-success';

            // Emojis mapping for different categories of crops
            let cropEmoji = '🌾';
            const nameLower = demand.itemName.toLowerCase();
            if (nameLower.includes('tomato')) cropEmoji = '🍅';
            else if (nameLower.includes('potato')) cropEmoji = '🥔';
            else if (nameLower.includes('onion')) cropEmoji = '🧅';
            else if (nameLower.includes('apple')) cropEmoji = '🍎';
            else if (nameLower.includes('flower') || nameLower.includes('rose')) cropEmoji = '🌹';

            return (
              <div
                key={demandId}
                className="card demand-card"
                style={{
                  animation: 'fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
                  animationDelay: `${idx * 0.05}s`
                }}
              >
                {/* Header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <h3 className="demand-store-title">{demand.storeName}</h3>
                    <span className={`badge ${badgeClass}`} style={{ flexShrink: 0 }}>
                      {demand.status}
                    </span>
                  </div>
                  <div className="demand-crop-name">
                    <span>{cropEmoji}</span>
                    <span>{demand.itemName}</span>
                  </div>
                </div>

                {/* Body Metrics */}
                <div>
                  <div className="demand-qty-value">{demand.quantity.toLocaleString()} kg</div>
                  <div className="demand-qty-label">Required Quantity</div>
                </div>

                {/* Footer Action */}
                <div style={{ marginTop: '20px', borderTop: '1px solid rgba(0,255,157,0.08)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  {user?.role === 'buyer' && isPending ? (
                    <button
                      onClick={() => handleClaim(demand)}
                      className="form-btn"
                      style={{ padding: '8px 20px', fontSize: '0.8rem', width: 'auto' }}
                      disabled={isClaiming}
                    >
                      {isClaiming ? 'Claiming...' : 'Claim'}
                    </button>
                  ) : user?.role === 'buyer' ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Claimed</span>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
