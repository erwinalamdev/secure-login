import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';


const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth_token');
      Cookies.remove('user_data');

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw handleAPIError(error);
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw handleAPIError(error);
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout');
      Cookies.remove('auth_token');
      Cookies.remove('user_data');
      return { message: 'Logged out successfully' };
    } catch (error) {
      Cookies.remove('auth_token');
      Cookies.remove('user_data');
      throw handleAPIError(error);
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      throw handleAPIError(error);
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      return response.data;
    } catch (error) {
      throw handleAPIError(error);
    }
  },
};

export const userAPI = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      throw handleAPIError(error);
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/user/profile', profileData);
      return response.data;
    } catch (error) {
      throw handleAPIError(error);
    }
  },

  // Delete user account
  deleteAccount: async () => {
    try {
      const response = await api.delete('/user/profile');
      Cookies.remove('auth_token');
      Cookies.remove('user_data');
      return response.data;
    } catch (error) {
      throw handleAPIError(error);
    }
  },

  // Get login history
  getLoginHistory: async () => {
    try {
      const response = await api.get('/user/login-history');
      return response.data;
    } catch (error) {
      throw handleAPIError(error);
    }
  },

  // Get user statistics
  getStats: async () => {
    try {
      const response = await api.get('/user/stats');
      return response.data;
    } catch (error) {
      throw handleAPIError(error);
    }
  },
};

// Error handling utility
function handleAPIError(error) {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          type: 'validation',
          message: data.message || 'Invalid input data',
          details: data.details || [],
        };
      case 401:
        return {
          type: 'auth',
          message: data.message || 'Authentication failed',
        };
      case 403:
        return {
          type: 'forbidden',
          message: data.message || 'Access denied',
        };
      case 404:
        return {
          type: 'not_found',
          message: data.message || 'Resource not found',
        };
      case 409:
        return {
          type: 'conflict',
          message: data.message || 'Resource already exists',
        };
      case 422:
        return {
          type: 'locked',
          message: data.message || 'Account is locked',
        };
      case 429:
        return {
          type: 'rate_limit',
          message: data.message || 'Too many requests',
          retryAfter: data.retryAfter,
        };
      case 500:
        return {
          type: 'server',
          message: 'Internal server error. Please try again later.',
        };
      default:
        return {
          type: 'unknown',
          message: data.message || 'An unexpected error occurred',
        };
    }
  } else if (error.request) {
    return {
      type: 'network',
      message: 'Network error. Please check your connection.',
    };
  } else {
    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred',
    };
  }
}

export const tokenUtils = {
  setToken: (token, userData) => {
    Cookies.set('auth_token', token, { 
      expires: 1,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    if (userData) {
      Cookies.set('user_data', JSON.stringify(userData), {
        expires: 1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    }
  },

  getToken: () => {
    return Cookies.get('auth_token');
  },

  getUserData: () => {
    const userData = Cookies.get('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  removeToken: () => {
    Cookies.remove('auth_token');
    Cookies.remove('user_data');
  },

  isAuthenticated: () => {
    return !!Cookies.get('auth_token');
  },
};

export default api; 