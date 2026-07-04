import axios from 'axios';

// Create an Axios instance with the default base URL of our backend Express API
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Request Interceptor:
// Before Axios sends a request to the backend, this function intercepts it.
// It checks if there is a 'token' stored in the browser's localStorage.
// If it finds one, it automatically adds it to the HTTP 'Authorization' header.
// This secures our request and verifies the logged-in user on the backend.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
