const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = (headers = {}) => {
  const sessionRaw = sessionStorage.getItem('ftm_session');
  if (sessionRaw) {
    try {
      const session = JSON.parse(sessionRaw);
      if (session && session.token) {
        return {
          ...headers,
          'Authorization': `Bearer ${session.token}`
        };
      }
    } catch (e) {
      console.error('Error parsing session token:', e);
    }
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'An unknown error occurred' };
    }
    
    if (response.status === 401) {
      // Clear session on authentication failure
      sessionStorage.removeItem('ftm_session');
    }
    
    throw new Error(errorData.error?.message || errorData.message || `Request failed with status ${response.status}`);
  }
  return response.json();
};

export const api = {
  // ── Authentication ──
  login: async (email, password, role) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    return handleResponse(res);
  },

  signup: async (userData) => {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  getProfile: async () => {
    const res = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'GET', // Or PUT for updates
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateProfile: async (profileData) => {
    const res = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await fetch(`${API_URL}/api/auth/password`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(res);
  },

  forgotPassword: async (email) => {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  resetPassword: async (email, code, newPassword) => {
    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    return handleResponse(res);
  },

  // ── Demands ──
  getDemands: async () => {
    const res = await fetch(`${API_URL}/api/demands`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  createDemand: async (storeName, itemName, quantity) => {
    const res = await fetch(`${API_URL}/api/demands`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ storeName, itemName, quantity }),
    });
    return handleResponse(res);
  },

  updateDemand: async (id, status) => {
    const res = await fetch(`${API_URL}/api/demands/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  // ── Tasks ──
  getTasks: async (assignedUser = '') => {
    let queryUser = assignedUser;
    const sessionRaw = sessionStorage.getItem('ftm_session');
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw);
        if (session && session.role !== 'admin') {
          queryUser = session.id;
        }
      } catch (e) {
        console.error('Error parsing session in getTasks:', e);
      }
    }
    const query = queryUser ? `?assignedUser=${queryUser}` : '';
    const res = await fetch(`${API_URL}/api/tasks${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  createTask: async (taskData) => {
    const res = await fetch(`${API_URL}/api/tasks`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  updateTask: async (id, taskData) => {
    const res = await fetch(`${API_URL}/api/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  markTaskPaid: async (id) => {
    const res = await fetch(`${API_URL}/api/tasks/${id}/payment`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  markTaskDelivered: async (id) => {
    const res = await fetch(`${API_URL}/api/tasks/${id}/delivery`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getTaskStats: async (assignedUser = '') => {
    let queryUser = assignedUser;
    const sessionRaw = sessionStorage.getItem('ftm_session');
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw);
        if (session && session.role !== 'admin') {
          queryUser = session.id;
        }
      } catch (e) {
        console.error('Error parsing session in getTaskStats:', e);
      }
    }
    const query = queryUser ? `?assignedUser=${queryUser}` : '';
    const res = await fetch(`${API_URL}/api/tasks/stats${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  }
};
