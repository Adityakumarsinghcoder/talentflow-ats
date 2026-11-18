import axios from 'axios';
import { store } from '../store/store.js';
import { updateAccessToken, clearCredentials } from '../store/authSlice.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getBackendBaseURL = () => {
  const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiURL.replace(/\/api$/, '');
};

// Request Interceptor: Attach token if exists
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Refresh token on 401 Token Expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is unauthorized, expired token, and not already retried
    if (
      error.response?.status === 401 && 
      (error.response?.data?.code === 'TOKEN_EXPIRED' || error.response?.data?.message === 'Token expired') && 
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = store.getState().auth.refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Request a new access token
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;

        // Save new access token to store
        store.dispatch(updateAccessToken({ accessToken }));

        // Re-run original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token exchange failed, logging out...', refreshError);
        store.dispatch(clearCredentials());
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
