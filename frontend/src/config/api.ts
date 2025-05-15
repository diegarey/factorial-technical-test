/**
 * API Configuration
 */

// Current API version
export const API_VERSION = 'v1';

// API base URL
export const API_BASE_URL = 'http://localhost:8000';

// Token expiration time in days
export const TOKEN_EXPIRATION_DAYS = 30;

// Whether to include the version in requests or rely on backend redirection
export const USE_VERSIONED_ENDPOINTS = true;

// API Documentation
export const API_DOCUMENTATION_URL = '/docs';

/**
 * Returns the complete URL for an API endpoint, including the version if configured
 * @param endpoint Endpoint (without initial '/')
 * @returns Complete URL
 */
export const getApiUrl = (endpoint: string): string => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Generate absolute URL that includes the backend domain
  return `${API_BASE_URL}/api/${API_VERSION}/${normalizedEndpoint}`;
}; 