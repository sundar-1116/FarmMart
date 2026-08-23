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

  // M6 Offer/Negotiation States
  const [offers, setOffers] = useState([]);
  const [farmerCrops, setFarmerCrops] = useState([]);
  const [selectedDemandForOffer, setSelectedDemandForOffer] = useState(null);
  const [selectedDemandOffers, setSelectedDemandOffers] = useState(null); // for buyer view
  const [viewHistoryOffer, setViewHistoryOffer] = useState(null); // for timeline view

  // Offer Form States (Farmer Initial Offer)
  const [offerCropId, setOfferCropId] = useState('');
  const [offerQty, setOfferQty] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMsg, setOfferMsg] = useState('');
  const [offerError, setOfferError] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  // Counter Form States
  const [counteringOffer, setCounteringOffer] = useState(null);
  const [counterQty, setCounterQty] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMsg, setCounterMsg] = useState('');
  const [counterError, setCounterError] = useState('');
  const [counterSubmitting, setCounterSubmitting] = useState(false);

  const fetchDemands = async () => {
    try {
      const res = await api.getDemands();
      if (res.success) {
        setDemands(res.data || []);
      } else {
        setError(res.message || 'Failed to load demands');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching demands');
    }
  };

  const fetchOffers = async () => {
    try {
      const res = await api.getOffers();
      if (res.success) {
        setOffers(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
    }
  };

  const fetchFarmerCrops = async () => {
    try {
      if (user?.role === 'farmer') {
        const res = await api.getCrops({ farmer: user.id });
        if (res.success) {
          setFarmerCrops(res.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching farmer crops:', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setError('');
    await Promise.all([fetchDemands(), fetchOffers(), fetchFarmerCrops()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [user]);

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
        await loadAll();
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
        await loadAll();
      } else {
        setFormError(res.message || 'Failed to create demand');
      }
    } catch (err) {
      setFormError(err.message || 'An error occurred while creating demand');
    } finally {
      setSubmitting(false);
    }
  };

  // Farmer Submit Initial Offer
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    setOfferError('');
    if (!offerQty || !offerPrice) {
      setOfferError('Quantity and price per unit are required');
      return;
    }
    const qty = parseFloat(offerQty);
    const price = parseFloat(offerPrice);
    if (isNaN(qty) || qty <= 0) {
      setOfferError('Quantity must be positive');
      return;
    }
    if (isNaN(price) || price < 0) {
      setOfferError('Price per unit must be non-negative');
      return;
    }

    // Local validation
    if (offerCropId) {
      const crop = farmerCrops.find(c => c._id === offerCropId || c.id === offerCropId);
      if (crop && qty > crop.availableQuantity) {
        setOfferError(`Quantity exceeds available crop quantity of ${crop.availableQuantity} ${crop.unit}`);
        return;
      }
    }

    try {
      setOfferSubmitting(true);
      const res = await api.createOffer({
        demand: selectedDemandForOffer._id,
        crop: offerCropId || null,
        quantity: qty,
        pricePerUnit: price,
        message: offerMsg
      });
      if (res.success) {
        alert('Offer submitted successfully!');
        setSelectedDemandForOffer(null);
        setOfferCropId('');
        setOfferQty('');
        setOfferPrice('');
        setOfferMsg('');
        await loadAll();
      } else {
        setOfferError(res.message || 'Failed to submit offer');
      }
    } catch (err) {
      setOfferError(err.message || 'An error occurred');
    } finally {
      setOfferSubmitting(false);
    }
  };

  // Submit Counter Offer
  const handleCreateCounter = async (e) => {
    e.preventDefault();
    setCounterError('');
    if (!counterQty || !counterPrice) {
      setCounterError('Quantity and price per unit are required');
      return;
    }
    const qty = parseFloat(counterQty);
    const price = parseFloat(counterPrice);
    if (isNaN(qty) || qty <= 0) {
      setCounterError('Quantity must be positive');
      return;
    }
    if (isNaN(price) || price < 0) {
      setCounterError('Price per unit must be non-negative');
      return;
    }

    // Local validation for farmer
    if (user?.role === 'farmer' && counteringOffer.crop) {
      const cropId = counteringOffer.crop._id || counteringOffer.crop;
      const crop = farmerCrops.find(c => c._id === cropId || c.id === cropId);
      if (crop && qty > crop.availableQuantity) {
        setCounterError(`Quantity exceeds available crop quantity of ${crop.availableQuantity} ${crop.unit}`);
        return;
      }
    }

    try {
      setCounterSubmitting(true);
      const res = await api.createOffer({
        demand: counteringOffer.demand?._id || counteringOffer.demand,
        parentOffer: counteringOffer._id,
        quantity: qty,
        pricePerUnit: price,
        message: counterMsg
      });
      if (res.success) {
        alert('Counter-offer submitted successfully!');
        setCounteringOffer(null);
        setCounterQty('');
        setCounterPrice('');
        setCounterMsg('');
        setSelectedDemandOffers(null);
        await loadAll();
      } else {
        setCounterError(res.message || 'Failed to submit counter-offer');
      }
    } catch (err) {
      setCounterError(err.message || 'An error occurred');
    } finally {
      setCounterSubmitting(false);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to accept this offer? This will bind the agreement and create/update the procurement task.')) return;
    try {
      const res = await api.acceptOffer(offerId);
      if (res.success) {
        alert('Offer accepted! Task updated/created.');
        setSelectedDemandOffers(null);
        await loadAll();
      } else {
        alert(res.message || 'Failed to accept offer');
      }
    } catch (err) {
      alert(err.message || 'An error occurred');
    }
  };

  const handleRejectOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to reject this offer?')) return;
    try {
      const res = await api.rejectOffer(offerId);
      if (res.success) {
        alert('Offer rejected.');
        setSelectedDemandOffers(null);
        await loadAll();
      } else {
        alert(res.message || 'Failed to reject offer');
      }
    } catch (err) {
      alert(err.message || 'An error occurred');
    }
  };

  const handleWithdrawOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to withdraw this offer?')) return;
    try {
      const res = await api.withdrawOffer(offerId);
      if (res.success) {
        alert('Offer withdrawn.');
        await loadAll();
      } else {
        alert(res.message || 'Failed to withdraw offer');
      }
    } catch (err) {
      alert(err.message || 'An error occurred');
    }
  };

  // Trace negotiation history chain
  const renderHistoryTimeline = (startOffer) => {
    const history = [];
    let current = startOffer;
    while (current) {
      history.unshift(current);
      if (current.parentOffer) {
        const parentId = current.parentOffer._id || current.parentOffer;
        current = offers.find(o => o._id === parentId);
      } else {
        current = null;
      }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        {history.map((step, sIdx) => {
          const isSenderFarmer = step.createdBy?.role === 'farmer' || (step.createdBy && step.createdBy.role === 'farmer');
          const senderName = step.createdBy?.name || (isSenderFarmer ? 'Farmer' : 'Buyer');
          return (
            <div key={step._id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
              {sIdx < history.length - 1 && (
                <div style={{ position: 'absolute', left: '16px', top: '32px', bottom: '-24px', width: '2px', backgroundColor: 'rgba(0,255,157,0.2)' }}></div>
              )}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isSenderFarmer ? 'rgba(0, 255, 157, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                border: `1px solid ${isSenderFarmer ? 'var(--primary-color)' : '#3b82f6'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                color: isSenderFarmer ? 'var(--primary-color)' : '#60a5fa',
                flexShrink: 0
              }}>
                {isSenderFarmer ? 'F' : 'B'}
              </div>
              <div className="card" style={{ flex: 1, padding: '10px 14px', margin: 0, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-light)' }}>{senderName}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(step.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '6px', fontWeight: '600' }}>
                  {step.quantity} kg @ ₹{step.pricePerUnit}/kg (Total: ₹{step.totalPrice})
                </div>
                {step.message && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                    "{step.message}"
                  </div>
                )}
                <div style={{ marginTop: '6px' }}>
                  <span className={`badge badge-${step.status}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                    {step.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Filter demands locally
  const filteredDemands = demands.filter(d => {
    const matchesSearch = d.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Modal styling helper
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px'
  };

  const modalContentStyle = {
    background: 'rgba(18, 30, 24, 0.95)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px',
    boxShadow: '0 8px 32px 0 rgba(0, 255, 157, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  };

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

            let badgeClass = 'badge-pending';
            if (demand.status === 'assigned') badgeClass = 'badge-info';
            if (demand.status === 'completed') badgeClass = 'badge-success';

            let cropEmoji = '🌾';
            const nameLower = demand.itemName.toLowerCase();
            if (nameLower.includes('tomato')) cropEmoji = '🍅';
            else if (nameLower.includes('potato')) cropEmoji = '🥔';
            else if (nameLower.includes('onion')) cropEmoji = '🧅';
            else if (nameLower.includes('apple')) cropEmoji = '🍎';
            else if (nameLower.includes('flower') || nameLower.includes('rose')) cropEmoji = '🌹';

            // M6 computations
            const demandOffers = offers.filter(o => (o.demand?._id || o.demand) === demandId);
            const activeOffersCount = demandOffers.filter(o => o.status === 'pending').length;

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

                  {/* Offers Summary (M6) */}
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                      <span>Offers:</span>
                      <span style={{ fontWeight: '700', color: activeOffersCount > 0 ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                        {demandOffers.length} ({activeOffersCount} pending)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ marginTop: '20px', borderTop: '1px solid rgba(0,255,157,0.08)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  {/* Buyer Claims */}
                  {user?.role === 'buyer' && (
                    <>
                      {isPending ? (
                        <button
                          onClick={() => handleClaim(demand)}
                          className="form-btn"
                          style={{ padding: '8px 16px', fontSize: '0.8rem', width: 'auto' }}
                          disabled={isClaiming}
                        >
                          {isClaiming ? 'Claiming...' : 'Claim'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Claimed</span>
                      )}

                      {demandOffers.length > 0 && (
                        <button
                          onClick={() => setSelectedDemandOffers(demand)}
                          className="form-btn"
                          style={{ padding: '8px 16px', fontSize: '0.8rem', width: 'auto', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', color: '#60a5fa' }}
                        >
                          View Offers
                        </button>
                      )}
                    </>
                  )}

                  {/* Farmer Bidding */}
                  {user?.role === 'farmer' && (
                    <>
                      {(() => {
                        const farmerDemandOffers = demandOffers.filter(o => (o.farmer?._id || o.farmer) === user.id);
                        const latestOffer = farmerDemandOffers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                        const isEligibleForOffers = (demand.status === 'pending' || demand.status === 'assigned') && !demandOffers.some(o => o.status === 'accepted');

                        if (!latestOffer) {
                          return (
                            isEligibleForOffers && (
                              <button
                                onClick={() => setSelectedDemandForOffer(demand)}
                                className="form-btn"
                                style={{ padding: '8px 16px', fontSize: '0.8rem', width: 'auto' }}
                              >
                                Make Offer
                              </button>
                            )
                          );
                        }

                        if (latestOffer.status === 'pending') {
                          const createdByMe = (latestOffer.createdBy?._id || latestOffer.createdBy) === user.id;
                          return (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.75rem', color: createdByMe ? 'var(--accent-color)' : 'var(--primary-color)' }}>
                                {createdByMe ? '⏳ Waiting for Buyer' : '🚨 Counter Received'}
                              </span>
                              {createdByMe ? (
                                <button
                                  onClick={() => handleWithdrawOffer(latestOffer._id)}
                                  className="form-btn"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'var(--badge-error-color)', color: 'var(--badge-error-color)' }}
                                >
                                  Withdraw
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setCounteringOffer(latestOffer);
                                    setCounterQty(latestOffer.quantity);
                                    setCounterPrice(latestOffer.pricePerUnit);
                                  }}
                                  className="form-btn"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto' }}
                                >
                                  Respond
                                </button>
                              )}
                            </div>
                          );
                        }

                        if (latestOffer.status === 'countered') {
                          return <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏳ Proposing counter...</span>;
                        }

                        if (latestOffer.status === 'accepted') {
                          return <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>✓ Offer Accepted</span>;
                        }

                        if (latestOffer.status === 'rejected') {
                          return <span style={{ fontSize: '0.8rem', color: 'red' }}>✕ Offer Rejected</span>;
                        }

                        if (latestOffer.status === 'withdrawn') {
                          return (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Withdrawn</span>
                              {isEligibleForOffers && (
                                <button
                                  onClick={() => setSelectedDemandForOffer(demand)}
                                  className="form-btn"
                                  style={{ padding: '8px 16px', fontSize: '0.8rem', width: 'auto' }}
                                >
                                  New Offer
                                </button>
                              )}
                            </div>
                          );
                        }

                        return null;
                      })()}
                    </>
                  )}

                  {!user && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sign in to bid</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FARMER SUBMIT OFFER MODAL */}
      {selectedDemandForOffer && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>Submit Offer — {selectedDemandForOffer.itemName}</h3>
              <button
                onClick={() => { setSelectedDemandForOffer(null); setOfferError(''); }}
                style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Demand from <strong>{selectedDemandForOffer.storeName}</strong> for <strong>{selectedDemandForOffer.quantity} kg</strong>.
            </p>

            {offerError && <div className="form-error">⚠️ {offerError}</div>}

            <form onSubmit={handleCreateOffer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Select Crop Inventory Item (Optional)</label>
                <select
                  className="form-input"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-light)' }}
                  value={offerCropId}
                  onChange={(e) => {
                    setOfferCropId(e.target.value);
                    const crop = farmerCrops.find(c => c._id === e.target.value || c.id === e.target.value);
                    if (crop) {
                      setOfferQty(crop.availableQuantity);
                      setOfferPrice(crop.price);
                    }
                  }}
                >
                  <option value="">-- No specific crop item --</option>
                  {farmerCrops.map(crop => (
                    <option key={crop._id} value={crop._id}>
                      {crop.name} (Avail: {crop.availableQuantity} {crop.unit} @ ₹{crop.price}/kg)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Quantity (kg)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={offerQty}
                    onChange={(e) => setOfferQty(e.target.value)}
                    placeholder="e.g. 100"
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Price per unit (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="e.g. 35"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Message / Note</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                  value={offerMsg}
                  onChange={(e) => setOfferMsg(e.target.value)}
                  placeholder="Introduce crop quality, logistics terms, etc."
                />
              </div>

              <button type="submit" className="form-btn" style={{ width: '100%', marginTop: '8px' }} disabled={offerSubmitting}>
                {offerSubmitting ? 'Submitting...' : 'Send Offer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BUYER VIEW OFFERS MODAL */}
      {selectedDemandOffers && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>Offers — {selectedDemandOffers.storeName} ({selectedDemandOffers.itemName})</h3>
              <button
                onClick={() => setSelectedDemandOffers(null)}
                style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              {(() => {
                const list = offers.filter(o => (o.demand?._id || o.demand) === selectedDemandOffers._id);
                // Get only latest offer of each farmer's chain
                const farmerChainLatest = {};
                list.forEach(o => {
                  if (!farmerChainLatest[o.farmer?._id] || new Date(o.createdAt) > new Date(farmerChainLatest[o.farmer?._id].createdAt)) {
                    farmerChainLatest[o.farmer?._id] = o;
                  }
                });

                const latestOffers = Object.values(farmerChainLatest);

                if (latestOffers.length === 0) {
                  return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No offers submitted yet.</p>;
                }

                return latestOffers.map(offer => {
                  const isPending = offer.status === 'pending';
                  const createdByFarmer = offer.createdBy?.role === 'farmer';

                  return (
                    <div key={offer._id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {offer.farmer?.photo ? (
                            <img src={offer.farmer.photo} alt={offer.farmer.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                          ) : (
                            <span style={{ fontSize: '1.5rem' }}>👨‍🌾</span>
                          )}
                          <div>
                            <strong style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>{offer.farmer?.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Farmer</div>
                          </div>
                        </div>
                        <span className={`badge badge-${offer.status}`}>{offer.status}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Quantity</div>
                          <strong style={{ color: 'var(--text-light)' }}>{offer.quantity} kg</strong>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Price/Unit</div>
                          <strong style={{ color: 'var(--text-light)' }}>₹{offer.pricePerUnit}</strong>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Total Cost</div>
                          <strong style={{ color: 'var(--primary-color)' }}>₹{offer.totalPrice}</strong>
                        </div>
                      </div>

                      {offer.crop && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          🌾 Crop Item: <strong>{offer.crop.name}</strong> ({offer.crop.location})
                        </div>
                      )}

                      {offer.message && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px' }}>
                          "{offer.message}"
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                        <button
                          onClick={() => setViewHistoryOffer(offer)}
                          className="form-btn"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-color)', color: 'var(--text-light)' }}
                        >
                          View History
                        </button>

                        {isPending && createdByFarmer && (
                          <>
                            <button
                              onClick={() => handleAcceptOffer(offer._id)}
                              className="form-btn"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', backgroundColor: 'rgba(0, 255, 157, 0.1)', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectOffer(offer._id)}
                              className="form-btn"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', color: '#f87171' }}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setCounteringOffer(offer);
                                setCounterQty(offer.quantity);
                                setCounterPrice(offer.pricePerUnit);
                              }}
                              className="form-btn"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'var(--border-accent)', color: 'var(--accent-color)' }}
                            >
                              Counter
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* COUNTER OFFER FORM MODAL */}
      {counteringOffer && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>Propose Counter-Offer</h3>
              <button
                onClick={() => { setCounteringOffer(null); setCounterError(''); }}
                style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Countering offer from <strong>{counteringOffer.createdBy?.name || 'opposing party'}</strong> (Original: {counteringOffer.quantity} kg @ ₹{counteringOffer.pricePerUnit}/kg).
            </p>

            {counterError && <div className="form-error">⚠️ {counterError}</div>}

            <form onSubmit={handleCreateCounter} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Counter Quantity (kg)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={counterQty}
                    onChange={(e) => setCounterQty(e.target.value)}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Counter Price (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Message / Reason</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                  value={counterMsg}
                  onChange={(e) => setCounterMsg(e.target.value)}
                  placeholder="Explain your proposal..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                {user?.role === 'farmer' && counteringOffer.createdBy?.role === 'buyer' && (
                  <button
                    type="button"
                    onClick={() => handleAcceptOffer(counteringOffer._id)}
                    className="form-btn"
                    style={{ flex: 1, backgroundColor: 'rgba(0, 255, 157, 0.1)', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                  >
                    Accept Counter
                  </button>
                )}
                <button type="submit" className="form-btn" style={{ flex: 1 }} disabled={counterSubmitting}>
                  {counterSubmitting ? 'Submitting...' : 'Send Counter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW HISTORY TIMELINE MODAL */}
      {viewHistoryOffer && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>Negotiation Timeline</h3>
              <button
                onClick={() => setViewHistoryOffer(null)}
                style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ overflowY: 'auto', paddingRight: '4px' }}>
              {renderHistoryTimeline(viewHistoryOffer)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
