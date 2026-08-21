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
    <div className="marketplace-container" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
        <h2>Crops Marketplace</h2>
        <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#edf2f7', color: '#4a5568', fontWeight: '500' }}>
          📌 Static Crops Catalog
        </span>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Browse fresh crop inventory available for procurement directly from registered local growers.
      </p>

      {/* Filter controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'fruits', 'vegetables', 'flowers', 'pulses'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="form-btn"
              style={{
                width: 'auto',
                padding: '6px 12px',
                fontSize: '0.85rem',
                backgroundColor: selectedCategory === cat ? 'var(--primary-color)' : '#edf2f7',
                color: selectedCategory === cat ? '#fff' : '#2d3748'
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '300px', padding: '6px 12px' }}
          placeholder="Search crop or farmer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
          No crops found matching your criteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredProducts.map((product, idx) => (
            <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', backgroundColor: 'var(--bg-primary)', display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '2.5rem', alignSelf: 'center' }}>{product.ico}</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem' }}>{product.name}</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>🧑‍🌾 Farmer: {product.farmer}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>📍 Origin: {product.location}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{product.price}</span>
                  <span style={{ fontSize: '0.8rem', color: '#b8860b' }}>⭐ {product.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
