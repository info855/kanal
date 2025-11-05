import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Orders API
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  track: (trackingCode) => api.get(`/orders/tracking/${trackingCode}`)
};

// Users API
export const usersAPI = {
  getById: (id) => api.get(`/users/${id}`),
  updateBalance: (id, amount) => api.put(`/users/${id}/balance`, { amount })
};

// Shipping Companies API
export const shippingAPI = {
  getAll: (params) => api.get('/shipping-companies', { params }),
  getById: (id) => api.get(`/shipping-companies/${id}`),
  create: (data) => api.post('/shipping-companies', data),
  update: (id, data) => api.put(`/shipping-companies/${id}`, data),
  delete: (id) => api.delete(`/shipping-companies/${id}`)
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`)
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getOrders: (params) => api.get('/admin/orders', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateOrderStatus: (orderId, data) => api.put(`/admin/orders/${orderId}/status`, data)
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// Media API
export const mediaAPI = {
  getAll: (params) => api.get('/media', { params }),
  upload: (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return api.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  delete: (id) => api.delete(`/media/${id}`)
};

// Wallet API
export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  createDepositRequest: (data) => api.post('/wallet/deposit-request', data),
  getDepositRequests: (params) => api.get('/wallet/deposit-requests', { params })
};

// Admin Wallet API
export const adminWalletAPI = {
  getDepositRequests: (params) => api.get('/admin/wallet/deposit-requests', { params }),
  approveDeposit: (requestId, data) => api.post(`/admin/wallet/approve-deposit/${requestId}`, data),
  rejectDeposit: (requestId, data) => api.post(`/admin/wallet/reject-deposit/${requestId}`, data),
  manualBalanceAdjustment: (data) => api.post('/admin/wallet/manual-balance', data),
  getUserTransactions: (userId, params) => api.get(`/admin/wallet/user-transactions/${userId}`, { params })
};

export default api;
