import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const getCropEmoji = (name, category) => {
  const n = name.toLowerCase();
  if (n.includes('mango')) return '🥭';
  if (n.includes('pomegranate') || n.includes('apple')) return '🍎';
  if (n.includes('lime') || n.includes('lemon')) return '🍋';
  if (n.includes('banana')) return '🍌';
  if (n.includes('tomato')) return '🍅';
  if (n.includes('chilli') || n.includes('pepper')) return '🌶️';
  if (n.includes('onion')) return '🧅';
  if (n.includes('cucumber')) return '🥒';
  if (n.includes('rose')) return '🌹';
  if (n.includes('jasmine')) return '🌸';
  if (n.includes('marigold') || n.includes('sunflower')) return '🌼';
  if (n.includes('rice') || n.includes('wheat') || n.includes('grain')) return '🌾';
  if (n.includes('dal') || n.includes('pulse') || n.includes('moong') || n.includes('toor')) return '🥣';

  if (category === 'fruits') return '🍎';
  if (category === 'vegetables') return '🥦';
  if (category === 'flowers') return '🌻';
  if (category === 'pulses') return '🌾';
  return '🍃';
};

export default function Marketplace() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' or 'inventory' (farmer only)
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filters (for browse mode)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Form State (for inventory CRUD)
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('fruits');
  const [formQuantity, setFormQuantity] = useState('');
  const [formAvailableQuantity, setFormAvailableQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('kg');
  const [formPrice, setFormPrice] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState('available');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchCrops = async () => {
    try {
      setLoading(true);
      setError('');
      const params = activeTab === 'inventory' ? { farmer: user?.id } : {};
      const res = await api.getCrops(params);
      if (res.success) {
        setCrops(res.data || []);
      } else {
        setError(res.message || 'Failed to load crops');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching crops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, [activeTab]);

  const handleEditClick = (crop) => {
    setEditingId(crop._id || crop.id);
    setFormName(crop.name);
    setFormCategory(crop.category);
    setFormQuantity(crop.quantity.toString());
    setFormAvailableQuantity(crop.availableQuantity.toString());
    setFormUnit(crop.unit);
    setFormPrice(crop.price.toString());
    setFormLocation(crop.location);
    setFormStatus(crop.status);
    setFormError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormName('');
    setFormCategory('fruits');
    setFormQuantity('');
    setFormAvailableQuantity('');
    setFormUnit('kg');
    setFormPrice('');
    setFormLocation('');
    setFormStatus('available');
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formName || !formCategory || !formQuantity || !formUnit || !formPrice || !formLocation) {
      setFormError('Please fill in all required fields');
      return;
    }

    const qty = parseFloat(formQuantity);
    const availQty = formAvailableQuantity !== '' ? parseFloat(formAvailableQuantity) : qty;
    const price = parseFloat(formPrice);

    if (isNaN(qty) || qty < 0) {
      setFormError('Quantity cannot be negative');
      return;
    }
    if (isNaN(availQty) || availQty < 0) {
      setFormError('Available quantity cannot be negative');
      return;
    }
    if (availQty > qty) {
      setFormError('Available quantity cannot exceed total quantity');
      return;
    }
    if (isNaN(price) || price < 0) {
      setFormError('Price cannot be negative');
      return;
    }

    try {
      setSubmitting(true);
      const cropData = {
        name: formName,
        category: formCategory,
        quantity: qty,
        availableQuantity: availQty,
        unit: formUnit,
        price,
        location: formLocation,
        status: formStatus
      };

      let res;
      if (editingId) {
        res = await api.updateCrop(editingId, cropData);
      } else {
        res = await api.createCrop(cropData);
      }

      if (res.success) {
        alert(editingId ? 'Crop updated successfully!' : 'Crop listed successfully!');
        handleCancelEdit();
        fetchCrops();
      } else {
        setFormError(res.message || 'Failed to save crop');
      }
    } catch (err) {
      setFormError(err.message || 'An error occurred while saving the crop');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cropId) => {
    if (!window.confirm('Are you sure you want to delete this crop?')) return;
    try {
      const res = await api.deleteCrop(cropId);
      if (res.success) {
        alert('Crop deleted successfully!');
        fetchCrops();
      } else {
        alert(res.message || 'Failed to delete crop');
      }
    } catch (err) {
      alert(err.message || 'An error occurred while deleting the crop');
    }
  };

  // Filter crops locally in Browse view
  const filteredProducts = crops.filter(crop => {
    const isAvailable = crop.status === 'available' && crop.availableQuantity > 0;
    if (!isAvailable) return false;

    const matchesSearch = crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (crop.farmer?.name && crop.farmer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (crop.location && crop.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || crop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid-bg-effect" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', animation: 'fadeInUp 0.4s ease-out' }}>
        <div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0 0 8px 0' }}>Crops Marketplace</h2>
          <p style={{ color: 'var(--text-light)', margin: 0 }}>
            {activeTab === 'browse'
              ? 'Browse fresh crop inventory available for procurement directly from registered local growers.'
              : 'Manage your listed crops, update quantities, set prices, and list new items.'}
          </p>
        </div>
        {user?.role === 'farmer' && (
          <div className="marketplace-tabs-container">
            <button
              onClick={() => { setActiveTab('browse'); handleCancelEdit(); }}
              className={`marketplace-tab ${activeTab === 'browse' ? 'active' : ''}`}
              style={{
                backgroundColor: activeTab === 'browse' ? 'var(--primary-color)' : 'transparent',
                color: activeTab === 'browse' ? '#000' : 'var(--text-light)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)'
              }}
            >
              Browse Marketplace
            </button>
            <button
              onClick={() => { setActiveTab('inventory'); handleCancelEdit(); }}
              className={`marketplace-tab ${activeTab === 'inventory' ? 'active' : ''}`}
              style={{
                backgroundColor: activeTab === 'inventory' ? 'var(--primary-color)' : 'transparent',
                color: activeTab === 'inventory' ? '#000' : 'var(--text-light)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)'
              }}
            >
              My Inventory
            </button>
          </div>
        )}
      </div>

      {activeTab === 'browse' ? (
        <>
          {/* Filter Row */}
          <div className="demands-filters-container" style={{ animation: 'fadeInUp 0.45s ease-out' }}>
            <div className="marketplace-tabs-container">
              {['all', 'fruits', 'vegetables', 'flowers', 'pulses'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`marketplace-tab ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            <div className="demands-search-wrapper" style={{ minWidth: '280px', flex: '1 1 300px' }}>
              <span className="demands-search-icon">🔍</span>
              <input
                type="text"
                className="demands-search-input"
                placeholder="Search crop, farmer or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Loading, Error, Empty, and Grid */}
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading crops catalog...</p>
            </div>
          ) : error ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
              <p style={{ color: 'var(--error-color)', fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 16px 0' }}>⚠️ Error Loading Crops</p>
              <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>{error}</p>
              <button onClick={fetchCrops} className="form-btn" style={{ maxWidth: '200px', margin: '0 auto' }}>
                Retry
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 255, 157, 0.04)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <span style={{ fontSize: '1.75rem' }}>🌾</span>
              </div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700' }}>No crops available</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>There are no crops listed in the marketplace matching your criteria.</p>
            </div>
          ) : (
            <div className="marketplace-grid">
              {filteredProducts.map((crop, idx) => {
                const cropId = crop._id || crop.id;
                const emoji = getCropEmoji(crop.name, crop.category);
                return (
                  <div
                    key={cropId}
                    className="card marketplace-card"
                    style={{
                      animation: 'fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
                      animationDelay: `${idx * 0.04}s`
                    }}
                  >
                    <div className="marketplace-crop-icon-wrapper">
                      <span>{emoji}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{crop.name}</h4>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', minWidth: 0 }}>
                          {crop.farmer?.photo ? (
                            <img
                              src={crop.farmer.photo}
                              alt={crop.farmer.name}
                              style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '6px', border: '1px solid var(--primary-color)', objectFit: 'cover', flexShrink: 0 }}
                            />
                          ) : (
                            <span style={{ marginRight: '6px', flexShrink: 0 }}>🧑‍🌾</span>
                          )}
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Farmer: <strong style={{ color: '#fff' }}>{crop.farmer?.name || 'Unknown'}</strong></span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📍 Origin: {crop.location}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📦 Available: {crop.availableQuantity} {crop.unit}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid rgba(0, 255, 136, 0.08)', paddingTop: '12px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-color)' }}>₹{crop.price}/{crop.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Farmer Inventory Form */}
          <div className="card" style={{ borderLeft: '4px solid var(--primary-color)', animation: 'fadeInUp 0.4s ease-out', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 20px 0', color: 'var(--text-secondary)' }}>
              {editingId ? '✏️ Edit Crop Inventory' : '🌾 List New Crop'}
            </h3>
            {formError && <div className="form-error" style={{ marginBottom: '16px' }}>⚠️ {formError}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div>
                <label className="form-label">Crop Name</label>
                <input type="text" className="form-input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Alphonso Mangoes" required />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select className="form-input" value={formCategory} onChange={e => setFormCategory(e.target.value)}>
                  <option value="fruits">Fruits</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="flowers">Flowers</option>
                  <option value="pulses">Pulses</option>
                </select>
              </div>
              <div>
                <label className="form-label">Total Quantity</label>
                <input type="number" className="form-input" value={formQuantity} onChange={e => setFormQuantity(e.target.value)} placeholder="e.g. 100" min="0" required />
              </div>
              <div>
                <label className="form-label">Available Quantity</label>
                <input type="number" className="form-input" value={formAvailableQuantity} onChange={e => setFormAvailableQuantity(e.target.value)} placeholder="e.g. 100" min="0" />
              </div>
              <div>
                <label className="form-label">Unit</label>
                <input type="text" className="form-input" value={formUnit} onChange={e => setFormUnit(e.target.value)} placeholder="e.g. kg" required />
              </div>
              <div>
                <label className="form-label">Price per Unit (₹)</label>
                <input type="number" className="form-input" value={formPrice} onChange={e => setFormPrice(e.target.value)} placeholder="e.g. 120" min="0" required />
              </div>
              <div>
                <label className="form-label">Location / Origin</label>
                <input type="text" className="form-input" value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="e.g. Guntur, AP" required />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-input" value={formStatus} onChange={e => setFormStatus(e.target.value)}>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', gridColumn: '1 / -1', justifyContent: 'flex-end', marginTop: '8px' }}>
                {editingId && (
                  <button type="button" className="logout-btn" onClick={handleCancelEdit} style={{ height: '46px', margin: 0 }}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="form-btn" style={{ height: '46px', width: 'auto', padding: '0 32px' }} disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Update Crop' : 'List Crop'}
                </button>
              </div>
            </form>
          </div>

          {/* Loading, Error, Empty, and Grid */}
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading your inventory...</p>
            </div>
          ) : error ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
              <p style={{ color: 'var(--error-color)', fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 16px 0' }}>⚠️ Error Loading Inventory</p>
              <p style={{ color: 'var(--text-light)', marginBottom: '24px' }}>{error}</p>
              <button onClick={fetchCrops} className="form-btn" style={{ maxWidth: '200px', margin: '0 auto' }}>
                Retry
              </button>
            </div>
          ) : crops.length === 0 ? (
            <div className="empty-state" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 255, 157, 0.04)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <span style={{ fontSize: '1.75rem' }}>🌾</span>
              </div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700' }}>No crops listed</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>List your first crop above to start selling in the marketplace!</p>
            </div>
          ) : (
            <div className="marketplace-grid">
              {crops.map((crop, idx) => {
                const cropId = crop._id || crop.id;
                const emoji = getCropEmoji(crop.name, crop.category);
                const isAvailable = crop.status === 'available' && crop.availableQuantity > 0;
                return (
                  <div
                    key={cropId}
                    className="card marketplace-card"
                    style={{
                      animation: 'fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
                      animationDelay: `${idx * 0.04}s`,
                      opacity: isAvailable ? 1 : 0.75
                    }}
                  >
                    <div className="marketplace-crop-icon-wrapper">
                      <span>{emoji}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{crop.name}</h4>
                          <span className={`badge ${isAvailable ? 'badge-success' : 'badge-pending'}`} style={{ fontSize: '0.7rem', flexShrink: 0 }}>
                            {crop.status === 'available' ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📦 Quantity: {crop.availableQuantity} / {crop.quantity} {crop.unit}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📍 Origin: {crop.location}</div>
                      </div>
                      <div style={{ marginTop: '16px', borderTop: '1px solid rgba(0, 255, 136, 0.08)', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-color)' }}>₹{crop.price}/{crop.unit}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEditClick(crop)}
                            className="form-btn"
                            style={{ flex: 1, padding: '6px 12px', fontSize: '0.75rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid var(--border-accent)', color: 'var(--accent-color)' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(cropId)}
                            className="logout-btn"
                            style={{ flex: 1, padding: '6px 12px', fontSize: '0.75rem', border: '1px solid var(--error-color)', color: 'var(--error-color)', margin: 0 }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
