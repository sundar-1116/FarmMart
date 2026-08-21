import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer'); // Default to buyer
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || (role === 'admin' ? '/admin' : '/dashboard');

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
    <div className="form-card">
      <h2 className="form-title">Login</h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px' }}>
        Authenticating against real FarmMart backend
      </p>
      
      {error && <div className="form-error" style={{ textAlign: 'center', marginBottom: '12px' }}>⚠️ {error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="e.g. user1@user.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter password"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Role</label>
          <select 
            className="form-input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="buyer">Buyer</option>
            <option value="farmer">Farmer</option>
            <option value="admin">Administrator</option>
          </select>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            * Note: Role is validated exactly against the database role.
          </p>
        </div>

        <button type="submit" className="form-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Sign In'}
        </button>
      </form>

      <div className="form-footer">
        Don't have an account? <a href="/signup" className="form-link">Sign up</a>
      </div>
    </div>
  );
}
