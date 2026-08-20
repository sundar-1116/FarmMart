import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      photo: '' // backend will generate default SVG
    });

    setLoading(false);

    if (result.success) {
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="form-card">
      <h2 className="form-title">Create Account</h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px' }}>
        Registering with real FarmMart backend API
      </p>

      {error && <div className="form-error" style={{ textAlign: 'center', marginBottom: '12px' }}>⚠️ {error}</div>}
      {success && <div style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '12px' }}>{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter full name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="email@example.com"
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
            placeholder="Min 8 characters"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number (10 digits)</label>
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

        <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label">Gender</label>
            <select
              className="form-input"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
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
          >
            <option value="buyer">Buyer / Retailer</option>
            <option value="farmer">Farmer / Grower</option>
          </select>
        </div>

        <button type="submit" className="form-btn" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <div className="form-footer">
        Already have an account? <a href="/login" className="form-link">Login</a>
      </div>
    </div>
  );
}
