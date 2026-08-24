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
    
    const errMsg = errorData.error?.message || errorData.message || `Request failed with status ${response.status}`;
    const error = new Error(errMsg);
    error.status = response.status;
    throw error;
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

  createDemand: async ({ storeName, itemName, quantity }) => {
    const res = await fetch(`${API_URL}/api/demands`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ storeName, itemName, quantity }),
    });
    return handleResponse(res);
  },

  updateDemand: async (id, demandData) => {
    const res = await fetch(`${API_URL}/api/demands/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(demandData),
    });
    return handleResponse(res);
  },

  deleteDemand: async (id) => {
    const res = await fetch(`${API_URL}/api/demands/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ── Tasks ──
  getTasks: async (assignedUser = '') => {
    let query = '';
    if (assignedUser) {
      query = `?assignedUser=${assignedUser}`;
    } else {
      const sessionRaw = sessionStorage.getItem('ftm_session');
      if (sessionRaw) {
        try {
          const session = JSON.parse(sessionRaw);
          if (session && session.role !== 'admin') {
            const param = session.role === 'farmer' ? 'farmerId' : 'assignedUser';
            query = `?${param}=${session.id}`;
          }
        } catch (e) {
          console.error('Error parsing session in getTasks:', e);
        }
      }
    }
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

  markTaskProcured: async (id) => {
    const res = await fetch(`${API_URL}/api/tasks/${id}/procure`, {
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
  },

  // ── Crops ──
  getCrops: async (params = {}) => {
    const cleanParams = {};
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '' && params[key] !== 'undefined') {
          cleanParams[key] = params[key];
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`${API_URL}/api/crops${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getCropById: async (id) => {
    const res = await fetch(`${API_URL}/api/crops/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  createCrop: async (cropData) => {
    const res = await fetch(`${API_URL}/api/crops`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(cropData),
    });
    return handleResponse(res);
  },

  updateCrop: async (id, cropData) => {
    const res = await fetch(`${API_URL}/api/crops/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(cropData),
    });
    return handleResponse(res);
  },

  deleteCrop: async (id) => {
    const res = await fetch(`${API_URL}/api/crops/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // ── Offers ──
  getOffers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/api/offers${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getOfferById: async (id) => {
    const res = await fetch(`${API_URL}/api/offers/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  createOffer: async (offerData) => {
    const res = await fetch(`${API_URL}/api/offers`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(offerData),
    });
    return handleResponse(res);
  },

  updateOffer: async (id, offerData) => {
    const res = await fetch(`${API_URL}/api/offers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(offerData),
    });
    return handleResponse(res);
  },

  deleteOffer: async (id) => {
    const res = await fetch(`${API_URL}/api/offers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  acceptOffer: async (id) => {
    const res = await fetch(`${API_URL}/api/offers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status: 'accepted' }),
    });
    return handleResponse(res);
  },

  rejectOffer: async (id) => {
    const res = await fetch(`${API_URL}/api/offers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status: 'rejected' }),
    });
    return handleResponse(res);
  },

  withdrawOffer: async (id) => {
    const res = await fetch(`${API_URL}/api/offers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status: 'withdrawn' }),
    });
    return handleResponse(res);
  },

  getUsers: async () => {
    const res = await fetch(`${API_URL}/api/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateUserRole: async (id, role) => {
    const res = await fetch(`${API_URL}/api/users/${id}/role`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ role }),
    });
    return handleResponse(res);
  }
};
