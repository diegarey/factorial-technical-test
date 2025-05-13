import axios from 'axios';
import { getApiUrl } from '../config/api';

console.log(`Usando API URL: ${getApiUrl('')}`);

const apiClient = axios.create({
  baseURL: getApiUrl(''),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // Aumentado el timeout a 30 segundos
  withCredentials: true // Habilitar el envío de cookies
});

// Interceptor para solicitudes
apiClient.interceptors.request.use(
  (config) => {
    // Log detallado de todas las solicitudes
    console.log('Realizando solicitud:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: config.url, // La URL ya es completa
      params: config.params,
      data: config.data,
      headers: config.headers,
      withCredentials: config.withCredentials
    });
    return config;
  },
  (error) => {
    console.error('Error en la solicitud:', error);
    return Promise.reject(error);
  }
);

// Interceptor para respuestas
apiClient.interceptors.response.use(
  (response) => {
    // Procesamiento de respuestas exitosas
    console.log('Respuesta exitosa:', {
      status: response.status, 
      url: response.config.url,
      data: response.data,
      cookies: document.cookie // Log de cookies para depuración
    });
    return response;
  },
  (error) => {
    // Manejo de errores de respuesta mejorado
    if (error.response) {
      // El servidor respondió con un código de estado diferente de 2xx
      console.error('Error de respuesta:', error.response.status, error.response.data);
      console.error('URL que falló:', error.config.url);
      console.error('Método:', error.config.method?.toUpperCase());
      console.error('Datos enviados:', error.config.data);
      console.error('Parámetros enviados:', error.config.params);
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió respuesta
      const fullUrl = error.config.url;
      console.error('No se recibió respuesta del servidor:', {
        url: fullUrl,
        method: error.config.method?.toUpperCase(),
        timeout: error.config.timeout
      });
    } else {
      // Algo ocurrió durante la configuración de la solicitud
      console.error('Error durante la configuración de la solicitud:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient; 