import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [role, setRole] = useState('buyer');
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState('');

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    const result = await signup({
      name,
      email,
      password,
      phone,
      gender,
      age: parseInt(age) || 25,
      role,
      photo: photo // user uploaded photo or empty string for default
    });

    setLoading(false);

    if (result.success) {
      setSuccess('Registration successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      {/* Left side: Showcase */}
      <div className="auth-showcase">
        <div className="showcase-glow-1"></div>
        <div className="showcase-glow-2"></div>

        <div className="showcase-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <div className="showcase-logo" style={{ margin: 0 }}>🌾</div>
            <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
              Farm<span style={{ color: '#fbbf24' }}>Mart</span>
            </span>
          </div>
          <p className="showcase-subtitle">India's Premier Farm-to-Market Platform</p>
        </div>

        <div className="showcase-features">
          <div className="compact-feature-card">
            <div className="compact-feature-icon">🍎</div>
            <div className="compact-feature-details">
              <h4 className="compact-feature-title">4 Crop Categories</h4>
              <p className="compact-feature-desc">Fruits, Vegetables, Flowers & Pulses</p>
            </div>
          </div>

          <div className="compact-feature-card">
            <div className="compact-feature-icon">🏪</div>
            <div className="compact-feature-details">
              <h4 className="compact-feature-title">8 Retail Partners</h4>
              <p className="compact-feature-desc">JioMart, D-Mart, Amazon Fresh & more</p>
            </div>
          </div>

          <div className="compact-feature-card">
            <div className="compact-feature-icon">🤖</div>
            <div className="compact-feature-details">
              <h4 className="compact-feature-title">AI Assistant</h4>
              <p className="compact-feature-desc">Instant answers, escalates to admin if needed</p>
            </div>
          </div>

          <div className="compact-feature-card">
            <div className="compact-feature-icon">📊</div>
            <div className="compact-feature-details">
              <h4 className="compact-feature-title">Live Reports</h4>
              <p className="compact-feature-desc">Real-time sales & activity analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Form Panel */}
      <div className="auth-panel">
        <div className="auth-panel-form-wrapper" style={{ margin: '40px 0' }}>
          <Link to="/" className="back-home-btn">
            &larr; Back to Home
          </Link>

          <h2 className="form-title" style={{ textAlign: 'left', fontSize: '2.25rem', marginBottom: '4px', fontWeight: '800' }}>
            Create Account
          </h2>
          <p style={{ color: 'var(--primary-color)', opacity: 0.8, fontSize: '0.95rem', margin: '0 0 28px 0' }}>
            Create your FarmMart account
          </p>

          <div className="form-tabs">
            <Link to="/login" className="form-tab">Login</Link>
            <div className="form-tab active">Sign Up</div>
          </div>

          {error && <div className="form-error"><span>⚠️</span> {error}</div>}
          {success && <div style={{ color: 'var(--primary-color)', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--primary-color)', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '12px' }}>✅ {success}</div>}

          <form onSubmit={handleSubmit} style={{ marginTop: '12px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter full name"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min 8 characters"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (10 digits)</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">📞</span>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  pattern="[0-9]{10}"
                  placeholder="e.g. 9876543201"
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Gender</label>
                <select
                  className="form-input"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{ paddingLeft: '16px' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="form-label">Age (18-100)</label>
                <input
                  type="number"
                  className="form-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  min="18"
                  max="100"
                  placeholder="e.g. 28"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">I want to register as a:</label>
              <select
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ paddingLeft: '16px' }}
              >
                <option value="buyer">Buyer / Retailer</option>
                <option value="farmer">Farmer / Grower</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Profile Photo (Optional)</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">🖼️</span>
                <input
                  type="file"
                  className="form-input"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ padding: '6px 12px 6px 40px' }}
                />
              </div>
            </div>

            <button type="submit" className="form-btn" style={{ marginTop: '28px' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <div className="form-footer" style={{ textAlign: 'center', marginTop: '32px' }}>
            Already have an account? <Link to="/login" className="form-link" style={{ color: 'var(--primary-color)' }}>Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
