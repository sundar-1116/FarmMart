import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Profile() {
  const { refreshProfile } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      setError('');
      const res = await api.getProfile();
      if (res.success && res.user) {
        setName(res.user.name || '');
        setEmail(res.user.email || '');
        setRole(res.user.role || '');
        setPhone(res.user.phone || '');
        setGender(res.user.gender || 'Male');
        setAge(res.user.age || '');
      } else {
        setError(res.message || 'Failed to load profile settings');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading profile settings');
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    const numAge = parseInt(age);
    if (isNaN(numAge) || numAge < 18 || numAge > 100) {
      setError('Age must be between 18 and 100');
      return;
    }

    try {
      setProfileSaving(true);
      const res = await api.updateProfile({
        name,
        phone,
        gender,
        age: numAge
      });

      if (res.success) {
        setSuccess('Profile updated successfully!');
        await refreshProfile();
      } else {
        setError(res.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while saving profile changes');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    try {
      setPasswordSaving(true);
      const res = await api.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordError(res.message || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError(err.message || 'An error occurred while updating your password');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading profile settings...</p>
      </div>
    );
  }

  return (
    <div className="grid-bg-effect" style={{ padding: '12px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0 0 8px 0' }}>Account Settings</h2>
        <p style={{ color: 'var(--text-light)', margin: 0 }}>
          Manage your profile information and account security.
        </p>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>}
      {success && <div style={{ color: 'var(--primary-color)', padding: '12px 20px', marginBottom: '20px', border: '1px solid var(--primary-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.05)', fontSize: '0.9rem' }}>✅ {success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', alignItems: 'start' }}>

        {/* Profile Info Section */}
        <div className="card" style={{ borderTop: '4px solid var(--primary-color)' }}>
          <h3 style={{ margin: '0 0 24px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
            Profile Information
          </h3>
          <form onSubmit={handleUpdateProfile}>
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
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label">Age</label>
                <input
                  type="number"
                  className="form-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="18"
                  max="100"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">📞</span>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Read-only)</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  disabled
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Account Role (Read-only)</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">🔑</span>
                <input
                  type="text"
                  className="form-input"
                  value={role}
                  disabled
                  style={{ textTransform: 'capitalize' }}
                />
              </div>
            </div>

            <button type="submit" className="form-btn" style={{ marginTop: '24px' }} disabled={profileSaving}>
              {profileSaving ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="card" style={{ borderTop: '4px solid var(--accent-color)' }}>
          <h3 style={{ margin: '0 0 24px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-color)' }}>
            Password & Security
          </h3>
          {passwordError && <div className="form-error" style={{ marginBottom: '16px' }}>⚠️ {passwordError}</div>}
          {passwordSuccess && <div style={{ color: 'var(--accent-color)', padding: '10px 16px', marginBottom: '16px', border: '1px solid var(--accent-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(251, 191, 36, 0.05)', fontSize: '0.85rem' }}>✅ {passwordSuccess}</div>}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                />
              </div>
            </div>

            <button type="submit" className="form-btn" style={{ background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))', color: 'var(--bg-primary)', marginTop: '24px' }} disabled={passwordSaving}>
              {passwordSaving ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
