import React, { useState } from 'react';

const STATIC_HARVEST_PRODUCTS = [
  { name: 'Mangoes (Alphonso)', category: 'fruits', price: '₹120/kg', farmer: 'Lakshmi Devi', rating: 4.8, status: 'Available', ico: '🥭', location: 'Guntur, AP' },
  { name: 'Pomegranates (Red)', category: 'fruits', price: '₹150/kg', farmer: 'Savitri Bai', rating: 4.6, status: 'Available', ico: '🍎', location: 'Kurnool, AP' },
  { name: 'Sweet Lime (Mosambi)', category: 'fruits', price: '₹80/kg', farmer: 'Savitri Bai', rating: 4.6, status: 'Available', ico: '🍋', location: 'Kurnool, AP' },
  { name: 'Bananas (Yelakki)', category: 'fruits', price: '₹50/dozen', farmer: 'Lakshmi Devi', rating: 4.8, status: 'Available', ico: '🍌', location: 'Guntur, AP' },

  { name: 'Tomatoes (Organic)', category: 'vegetables', price: '₹30/kg', farmer: 'Raju Kumar', rating: 4.9, status: 'Available', ico: '🍅', location: 'Warangal, TS' },
  { name: 'Red Chillies (Guntur)', category: 'vegetables', price: '₹140/kg', farmer: 'Srinivas Reddy', rating: 4.5, status: 'Available', ico: '🌶️', location: 'Khammam, TS' },
  { name: 'Onions', category: 'vegetables', price: '₹28/kg', farmer: 'Raju Kumar', rating: 4.9, status: 'Available', ico: '🧅', location: 'Warangal, TS' },
  { name: 'Cucumbers', category: 'vegetables', price: '₹22/kg', farmer: 'Meena Kumari', rating: 4.6, status: 'Available', ico: '🥒', location: 'Nalgonda, TS' },

  { name: 'Red Roses', category: 'flowers', price: '₹180/bundle', farmer: 'Padmavathi', rating: 4.9, status: 'Available', ico: '🌹', location: 'Nellore, AP' },
  { name: 'Jasmine (Mogra)', category: 'flowers', price: '₹220/kg', farmer: 'Padmavathi', rating: 4.9, status: 'Available', ico: '🌸', location: 'Nellore, AP' },
  { name: 'Marigolds (Yellow)', category: 'flowers', price: '₹90/kg', farmer: 'Annapurna Devi', rating: 4.7, status: 'Available', ico: '🌼', location: 'Tirupati, AP' },

  { name: 'Basmati Rice', category: 'pulses', price: '₹95/kg', farmer: 'Venkat Rao', rating: 4.7, status: 'Available', ico: '🌾', location: 'Karimnagar, TS' },
  { name: 'Toor Dal (Premium)', category: 'pulses', price: '₹130/kg', farmer: 'Anitha Kumari', rating: 4.4, status: 'Available', ico: '🥣', location: 'Visakhapatnam, AP' },
  { name: 'Moong Dal', category: 'pulses', price: '₹115/kg', farmer: 'Anitha Kumari', rating: 4.4, status: 'Available', ico: '🥣', location: 'Visakhapatnam, AP' }
];

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = STATIC_HARVEST_PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.farmer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid-bg-effect" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', animation: 'fadeInUp 0.4s ease-out' }}>
        <div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0 0 8px 0' }}>Crops Marketplace</h2>
          <p style={{ color: 'var(--text-light)', margin: 0 }}>
            Browse fresh crop inventory available for procurement directly from registered local growers.
          </p>
        </div>
        <span className="badge badge-info" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          📌 Static Crops Catalog
        </span>
      </div>

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
            placeholder="Search crop or farmer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Crop Cards list */}
      {filteredProducts.length === 0 ? (
        <div className="empty-state" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 255, 157, 0.04)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <span style={{ fontSize: '1.75rem' }}>🌾</span>
          </div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700' }}>No crops found</h4>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>No crops found matching your search parameters.</p>
        </div>
      ) : (
        <div className="marketplace-grid">
          {filteredProducts.map((product, idx) => (
            <div
              key={idx}
              className="card marketplace-card"
              style={{
                animation: 'fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
                animationDelay: `${idx * 0.04}s`
              }}
            >
              <div className="marketplace-crop-icon-wrapper">
                <span>{product.ico}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>{product.name}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>🧑‍🌾 Farmer: <strong style={{ color: '#fff' }}>{product.farmer}</strong></div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 Origin: {product.location}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid rgba(0, 255, 136, 0.08)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-color)' }}>{product.price}</span>
                  <span className="marketplace-rating-badge">
                    <span>⭐</span>
                    <span>{product.rating}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
