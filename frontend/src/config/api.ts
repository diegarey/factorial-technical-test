/**
 * Configuración de la API
 */

// Versión actual de la API
export const API_VERSION = 'v1';

// URL base de la API
export const API_BASE_URL = 'http://localhost:8000';

// Tiempo de expiración del token en días
export const TOKEN_EXPIRATION_DAYS = 30;

// Si se debe incluir la versión en las peticiones o confiar en la redirección del backend
export const USE_VERSIONED_ENDPOINTS = true;

// Documentación de la API
export const API_DOCUMENTATION_URL = '/docs';

/**
 * Retorna la URL completa para un endpoint de la API, incluyendo la versión si está configurado
 * @param endpoint Endpoint (sin '/' inicial)
 * @returns URL completa
 */
export const getApiUrl = (endpoint: string): string => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Generar URL absoluta que incluya el dominio del backend
  return `${API_BASE_URL}/api/${API_VERSION}/${normalizedEndpoint}`;
}; 