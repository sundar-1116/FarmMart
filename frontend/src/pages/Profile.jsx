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
    return <div className="loading-state" style={{ padding: '40px', textAlign: 'center' }}>Loading profile settings...</div>;
  }

  return (
    <div className="profile-container" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Account Settings</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Manage your profile information and account security.
      </p>

      {error && <div style={{ color: 'var(--error-color)', padding: '12px', marginBottom: '16px', border: '1px solid var(--error-color)', borderRadius: '6px' }}>⚠️ {error}</div>}
      {success && <div style={{ color: '#38a169', padding: '12px', marginBottom: '16px', border: '1px solid #38a169', borderRadius: '6px', backgroundColor: 'rgba(56, 161, 105, 0.05)' }}>✅ {success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>

        {/* Profile Info Section */}
        <div style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Profile Information
          </h3>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
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
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                pattern="[0-9]{10}"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Read-only)</label>
              <input
                type="email"
                className="form-input"
                value={email}
                disabled
                style={{ backgroundColor: 'var(--border-color)', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Role (Read-only)</label>
              <input
                type="text"
                className="form-input"
                value={role}
                disabled
                style={{ backgroundColor: 'var(--border-color)', cursor: 'not-allowed', textTransform: 'capitalize' }}
              />
            </div>

            <button type="submit" className="form-btn" disabled={profileSaving}>
              {profileSaving ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Password & Security
          </h3>
          {passwordError && <div style={{ color: 'var(--error-color)', padding: '8px', marginBottom: '12px', fontSize: '0.85rem' }}>⚠️ {passwordError}</div>}
          {passwordSuccess && <div style={{ color: '#38a169', padding: '8px', marginBottom: '12px', fontSize: '0.85rem' }}>✅ {passwordSuccess}</div>}

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
              />
            </div>

            <button type="submit" className="form-btn" style={{ backgroundColor: '#2d3748' }} disabled={passwordSaving}>
              {passwordSaving ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
