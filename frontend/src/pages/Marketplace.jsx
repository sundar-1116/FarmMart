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
    <div className="grid-bg-effect">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
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

      {/* Filter controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', marginBottom: '36px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {['all', 'fruits', 'vegetables', 'flowers', 'pulses'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                width: 'auto',
                padding: '10px 28px',
                fontSize: '1.05rem',
                fontWeight: '700',
                backgroundColor: selectedCategory === cat ? 'var(--primary-color)' : '#2edd6a',
                border: '1.5px solid #020704',
                color: '#000000',
                borderRadius: 'var(--radius-full)',
                boxShadow: 'none',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="input-icon-wrapper" style={{ minWidth: '280px' }}>
          <span className="input-icon">🔍</span>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '40px' }}
            placeholder="Search crop or farmer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          No crops found matching your search.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {filteredProducts.map((product, idx) => (
            <div key={idx} className="card" style={{ display: 'flex', gap: '16px', padding: '20px' }}>
              <div style={{
                fontSize: '2.5rem',
                width: '64px',
                height: '64px',
                background: 'rgba(16, 185, 129, 0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifycontent: 'center',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                flexShrink: 0
              }}>
                <span style={{ margin: 'auto' }}>{product.ico}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: '700' }}>{product.name}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>🧑‍🌾 Farmer: <strong style={{ color: '#fff' }}>{product.farmer}</strong></div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 Origin: {product.location}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-color)' }}>{product.price}</span>
                  <span className="badge badge-pending" style={{ fontSize: '0.75rem' }}>⭐ {product.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
