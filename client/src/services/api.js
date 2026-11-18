import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'koramarket_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && localStorage.getItem(TOKEN_STORAGE_KEY)) {
      const requestUrl = error.config?.url || '';
      if (!requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/register')) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        window.dispatchEvent(new Event('koramarket:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
