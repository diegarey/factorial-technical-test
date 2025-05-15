import axios from 'axios';
import { getApiUrl } from '../config/api';

console.log(`Using API URL: ${getApiUrl('')}`);

const apiClient = axios.create({
  baseURL: getApiUrl(''),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // Increased timeout to 30 seconds
  withCredentials: true // Enable sending cookies
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Detailed log of all requests
    console.log('Making request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: config.url, // URL is already complete
      params: config.params,
      data: config.data,
      headers: config.headers,
      withCredentials: config.withCredentials
    });
    return config;
  },
  (error) => {
    console.error('Error in request:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Processing successful responses
    console.log('Successful response:', {
      status: response.status, 
      url: response.config.url,
      data: response.data,
      cookies: document.cookie // Cookie log for debugging
    });
    return response;
  },
  (error) => {
    // Enhanced response error handling
    if (error.response) {
      // The server responded with a status code different from 2xx
      console.error('Response error:', error.response.status, error.response.data);
      console.error('Failed URL:', error.config.url);
      console.error('Method:', error.config.method?.toUpperCase());
      console.error('Sent data:', error.config.data);
      console.error('Sent parameters:', error.config.params);
    } else if (error.request) {
      // The request was made but no response was received
      const fullUrl = error.config.url;
      console.error('No response received from server:', {
        url: fullUrl,
        method: error.config.method?.toUpperCase(),
        timeout: error.config.timeout
      });
    } else {
      // Something happened during request setup
      console.error('Error during request setup:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient; 