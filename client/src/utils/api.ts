import axios from 'axios';

// Get base URL and ensure it has /api suffix (but not double /api/api)
let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
// Remove trailing slash if present
baseUrl = baseUrl.replace(/\/$/, '');
// Remove /api if it already exists to avoid double /api/api
baseUrl = baseUrl.replace(/\/api$/, '');
// Now append /api
const API_BASE_URL = `${baseUrl}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only logout for authentication errors, not for transfer PIN errors
      const errorMessage = error.response?.data?.message || '';
      if (errorMessage.includes('Invalid transfer PIN') || errorMessage.includes('Transfer PIN')) {
        // Don't logout for transfer PIN errors
        return Promise.reject(error);
      }
      
      // Handle unauthorized access (token expired, invalid token, etc.)
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


