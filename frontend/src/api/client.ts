import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log(`Usando API URL: ${API_URL}`);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000
});

// Interceptor para solicitudes
apiClient.interceptors.request.use(
  (config) => {
    // Puedes agregar lógica aquí si es necesario (tokens, etc.)
    console.log('Realizando solicitud:', config.method?.toUpperCase(), config.url);
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
    // Puedes procesar las respuestas exitosas aquí
    console.log('Respuesta exitosa:', response.status, response.config.url);
    return response;
  },
  (error) => {
    // Manejo de errores de respuesta
    if (error.response) {
      // El servidor respondió con un código de estado diferente de 2xx
      console.error('Error de respuesta:', error.response.status, error.response.data);
      console.error('URL que falló:', error.config.url);
      console.error('Método:', error.config.method?.toUpperCase());
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió respuesta
      console.error('No se recibió respuesta del servidor');
      console.error('URL que falló:', error.config.url);
      console.error('Método:', error.config.method?.toUpperCase());
      console.error('Timeout configurado:', error.config.timeout, 'ms');
    } else {
      // Algo ocurrió durante la configuración de la solicitud
      console.error('Error durante la configuración de la solicitud:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient; 