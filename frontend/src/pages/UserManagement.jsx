import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [actionUserId, setActionUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getUsers();
      if (res.success) {
        setUsers(res.data || []);
        
        // Setup initial role selectors state
        const initialRoles = {};
        res.data.forEach(u => {
          initialRoles[u._id || u.id] = u.role;
        });
        setSelectedRoles(initialRoles);
      } else {
        setError(res.message || 'Failed to fetch user list');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = (userId, newRole) => {
    setSelectedRoles(prev => ({ ...prev, [userId]: newRole }));
  };

  const handleUpdateRole = async (targetUser) => {
    const targetUserId = targetUser._id || targetUser.id;
    const newRole = selectedRoles[targetUserId] || targetUser.role;

    if (newRole === targetUser.role) {
      alert('Selected role matches the current role.');
      return;
    }

    const confirmChange = window.confirm(`Change ${targetUser.name}'s role from ${targetUser.role} to ${newRole}?`);
    if (!confirmChange) return;

    try {
      setActionUserId(targetUserId);
      const res = await api.updateUserRole(targetUserId, newRole);
      if (res.success) {
        alert(`Successfully updated role for ${targetUser.name} to ${newRole}!`);
        // Refresh users list
        const updatedUsersRes = await api.getUsers();
        if (updatedUsersRes.success) {
          setUsers(updatedUsersRes.data || []);
          const updatedRoles = {};
          updatedUsersRes.data.forEach(u => {
            updatedRoles[u._id || u.id] = u.role;
          });
          setSelectedRoles(updatedRoles);
        }
      } else {
        alert(res.message || 'Failed to update user role');
      }
    } catch (err) {
      alert(err.message || 'An error occurred while updating user role');
    } finally {
      setActionUserId(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="grid-bg-effect" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title */}
      <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0 0 8px 0' }}>User Management</h2>
        <p style={{ color: 'var(--text-light)', margin: 0 }}>
          Manage FarmMart users, roles, and access permissions.
        </p>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '24px' }}>⚠️ {error}</div>}

      {/* Search Input bar */}
      <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', animation: 'fadeInUp 0.45s ease-out' }}>
        <span style={{ fontSize: '1.2rem' }}>🔍</span>
        <input
          type="text"
          className="form-input"
          style={{ margin: 0, height: '40px' }}
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* User Management Section */}
      <div className="card" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        {filteredUsers.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '16px 0', textAlign: 'center' }}>
            No users match your search query.
          </div>
        ) : (
          <div className="table-container" style={{ marginTop: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ padding: '12px' }}>User</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Current Role</th>
                  <th style={{ padding: '12px' }}>New Role</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((targetUser, idx) => {
                  const targetUserId = targetUser._id || targetUser.id;
                  const isSelf = targetUserId === user?.id;
                  const currentSelectedRole = selectedRoles[targetUserId] || targetUser.role;

                  return (
                    <tr
                      key={targetUserId}
                      style={{
                        animation: 'fadeInUp 0.35s ease-out both',
                        animationDelay: `${idx * 0.03}s`
                      }}
                    >
                      <td style={{ fontWeight: '700' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {targetUser.photo ? (
                            <img src={targetUser.photo} alt={targetUser.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                          ) : (
                            <span>👤</span>
                          )}
                          <span>{targetUser.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-light)' }}>{targetUser.email}</td>
                      <td>
                        <span className={`badge ${targetUser.role === 'admin' ? 'badge-success' : targetUser.role === 'farmer' ? 'badge-info' : 'badge-pending'}`} style={{ fontSize: '0.7rem' }}>
                          {targetUser.role}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-input"
                          style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto', background: 'var(--input-bg)', color: 'var(--text-light)', height: '32px' }}
                          value={currentSelectedRole}
                          onChange={(e) => handleRoleChange(targetUserId, e.target.value)}
                          disabled={isSelf}
                        >
                          <option value="buyer">Buyer</option>
                          <option value="farmer">Farmer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isSelf ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            You cannot change your own role.
                          </span>
                        ) : (
                          <button
                            onClick={() => handleUpdateRole(targetUser)}
                            className="form-btn"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', margin: 0 }}
                            disabled={actionUserId === targetUserId || currentSelectedRole === targetUser.role}
                          >
                            {actionUserId === targetUserId ? 'Updating...' : 'Update Role'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
