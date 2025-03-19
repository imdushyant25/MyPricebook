// src/services/api.ts
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

// Export axios instance for custom configurations
export default axios;

// Add request interceptor for authentication if needed later
// axios.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling logic can go here
    return Promise.reject(error);
  }
);