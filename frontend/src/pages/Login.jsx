import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer'); // Default role
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Set initial role from query parameter if present
  useEffect(() => {
    const urlRole = searchParams.get('role');
    if (urlRole && ['buyer', 'farmer', 'admin'].includes(urlRole)) {
      setRole(urlRole);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password, role);
    setLoading(false);

    if (result.success) {
      const userRole = result.user?.role || role;
      const targetPath = userRole === 'admin' ? '/admin' : '/dashboard';
      navigate(targetPath, { replace: true });
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
        <div className="auth-panel-form-wrapper">
          <Link to="/" className="back-home-btn">
            &larr; Back to Home
          </Link>

          <h2 className="form-title" style={{ textAlign: 'left', fontSize: '2.25rem', marginBottom: '4px', fontWeight: '800' }}>
            Welcome Back
          </h2>
          <p style={{ color: 'var(--primary-color)', opacity: 0.8, fontSize: '0.95rem', margin: '0 0 28px 0' }}>
            Sign in to your account to continue
          </p>

          <div className="form-tabs">
            <div className="form-tab active">Login</div>
            <Link to="/signup" className="form-tab">Sign Up</Link>
          </div>

          {error && <div className="form-error"><span>⚠️</span> {error}</div>}

          <form onSubmit={handleSubmit} style={{ marginTop: '12px' }}>
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
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <a href="/index-legacy.html" className="form-link" style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>
                  Forgot Password?
                </a>
              </div>
              <div className="input-icon-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Account Role</label>
              <select
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ paddingLeft: '16px' }}
              >
                <option value="buyer">Buyer / Retailer</option>
                <option value="farmer">Farmer / Grower</option>
                <option value="admin">Platform Administrator</option>
              </select>
            </div>

            <button type="submit" className="form-btn" style={{ marginTop: '28px' }} disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="form-footer" style={{ textAlign: 'center', marginTop: '32px' }}>
            Don't have an account? <Link to="/signup" className="form-link" style={{ color: 'var(--primary-color)' }}>Sign up free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
