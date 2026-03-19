import axios from 'axios';

const api = axios.create({
  // FIX 1: Removed '/api' from the end of the baseURL
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/',
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
  (config) => {
    // Make sure your Login.jsx is actually saving the token with this exact key!
    const token = localStorage.getItem('omicra_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('omicra_token');
        window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;