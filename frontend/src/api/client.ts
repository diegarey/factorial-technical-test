import axios from 'axios';

// En entorno dockerizado, necesitamos usar la URL desde el navegador, no desde el contenedor
const API_URL = 'http://localhost:8000';

console.log(`Usando API URL: ${API_URL}`);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Aumentado el timeout a 30 segundos
  withCredentials: true // Habilitamos el envío de cookies cross-origin
});

// Interceptor para solicitudes
apiClient.interceptors.request.use(
  (config) => {
    // Log detallado de todas las solicitudes
    console.log('Realizando solicitud:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: `${config.baseURL}${config.url}`,
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
      console.error('No se recibió respuesta del servidor:', {
        url: `${error.config.baseURL}${error.config.url}`,
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