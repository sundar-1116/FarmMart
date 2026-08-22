import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const fileInputRef = useRef(null);

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
  const [photo, setPhoto] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Avatar upload/preview state
  const [photoPreview, setPhotoPreview] = useState(null);
  const [avatarSaving, setAvatarSaving] = useState(false);

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
        setPhoto(res.user.photo || '');
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

  // Profile Photo Edit Triggers
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size (e.g. max 1.5mb limit since it's base64 encoded into payload)
    if (file.size > 1.5 * 1024 * 1024) {
      alert('Selected image is too large. Please select an image under 1.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelPreview = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveAvatar = async () => {
    if (!photoPreview) return;
    try {
      setAvatarSaving(true);
      setError('');
      setSuccess('');
      const res = await api.updateProfile({ photo: photoPreview });
      if (res.success) {
        setPhoto(photoPreview);
        setPhotoPreview(null);
        setSuccess('Profile picture updated successfully!');
        await refreshProfile();
      } else {
        setError(res.message || 'Failed to save profile picture.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating profile picture.');
    } finally {
      setAvatarSaving(false);
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

  // Fallback defaults
  const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3d2c"/><circle cx="50" cy="40" r="20" fill="%2360a5fa"/><path d="M20 85c0-15 15-25 30-25s30 10 30 25z" fill="%232563eb"/></svg>`;
  const activeAvatar = photoPreview || photo || user?.avatar || defaultAvatar;

  return (
    <div className="grid-bg-effect" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0 0 8px 0' }}>Account Settings</h2>
        <p style={{ color: 'var(--text-light)', margin: 0 }}>
          Manage your profile details, picture, and password security.
        </p>
      </div>

      {error && <div className="form-error" style={{ animation: 'fadeInUp 0.4s ease-out' }}>⚠️ {error}</div>}
      {success && <div style={{ color: 'var(--primary-color)', padding: '12px 20px', border: '1px solid var(--primary-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16, 185, 129, 0.05)', fontSize: '0.9rem', animation: 'fadeInUp 0.4s ease-out' }}>✅ {success}</div>}

      {/* Header Profile Photo card */}
      <div className="card profile-header-card" style={{ animation: 'fadeInUp 0.45s ease-out' }}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleFileChange}
        />

        <div className="profile-avatar-wrapper" onClick={handleAvatarClick}>
          <img
            src={activeAvatar}
            alt="Profile Avatar"
            className="profile-avatar-image"
          />
          <div className="profile-avatar-ring"></div>
          <div className="profile-avatar-overlay">
            <span>📷</span>
            <span style={{ marginTop: '4px' }}>Change Photo</span>
          </div>
        </div>

        {photoPreview && (
          <div className="profile-preview-actions">
            <button
              onClick={handleSaveAvatar}
              className="form-btn"
              style={{ padding: '8px 16px', fontSize: '0.75rem', width: 'auto' }}
              disabled={avatarSaving}
            >
              {avatarSaving ? 'Saving...' : 'Save Picture'}
            </button>
            <button
              onClick={handleCancelPreview}
              className="form-btn"
              style={{ padding: '8px 16px', fontSize: '0.75rem', width: 'auto', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              disabled={avatarSaving}
            >
              Cancel
            </button>
          </div>
        )}

        <div style={{ marginTop: '12px' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>{name || user?.name}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 8px 0' }}>{email || user?.email}</p>
          <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
            {role || user?.role}
          </span>
        </div>
      </div>

      {/* Two Column Forms */}
      <div className="profile-grid-cols">
        {/* Personal Details form */}
        <div className="card" style={{ borderTop: '4px solid var(--primary-color)', animation: 'fadeInUp 0.5s ease-out' }}>
          <h3 style={{ margin: '0 0 24px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
            Personal Information
          </h3>

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            <button type="submit" className="form-btn" style={{ marginTop: '12px' }} disabled={profileSaving}>
              {profileSaving ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

        {/* Security Password form */}
        <div className="card" style={{ borderTop: '4px solid var(--accent-color)', animation: 'fadeInUp 0.55s ease-out' }}>
          <h3 style={{ margin: '0 0 24px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-color)' }}>
            Password & Security
          </h3>

          {passwordError && <div className="form-error" style={{ marginBottom: '16px' }}>⚠️ {passwordError}</div>}
          {passwordSuccess && <div style={{ color: 'var(--accent-color)', padding: '10px 16px', marginBottom: '16px', border: '1px solid var(--accent-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(251, 191, 36, 0.05)', fontSize: '0.85rem' }}>✅ {passwordSuccess}</div>}

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            <button type="submit" className="form-btn" style={{ background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))', color: 'var(--bg-primary)', marginTop: '12px' }} disabled={passwordSaving}>
              {passwordSaving ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
