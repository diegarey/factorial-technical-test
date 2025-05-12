# API Cliente - Documentación

## Estructura

La integración con la API está organizada siguiendo estos principios:

- **Arquitectura modular**: Cada recurso de la API tiene su propio archivo de cliente.
- **Configuración centralizada**: La configuración como URLs y versiones está en `src/config/api.ts`.
- **Compatibilidad con versiones**: Todas las peticiones incluyen la versión de la API.

## Archivos principales

- `client.ts`: Cliente base de Axios con configuración e interceptores.
- `productsApi.ts`: Operaciones relacionadas con productos.
- `cartApi.ts`: Operaciones relacionadas con el carrito.
- `../config/api.ts`: Configuración centralizada.

## Versionado

El versionado de la API se implementa de la siguiente manera:

1. La versión actual de la API se define en `src/config/api.ts` como `API_VERSION`.
2. Todas las peticiones usan `getApiUrl()` para construir URLs con la versión correcta.
3. Se puede activar/desactivar el versionado explícito con `USE_VERSIONED_ENDPOINTS`.

## Ejemplos de uso

### Llamada básica a la API

```typescript
import { getApiUrl } from '../config/api';
import apiClient from './client';

// Ejemplo para obtener recursos
const getItems = async () => {
  // Genera: /api/v1/items
  const response = await apiClient.get(getApiUrl('items'));
  return response.data;
};

// Ejemplo con parámetros de consulta
const searchItems = async (query: string) => {
  const response = await apiClient.get(getApiUrl('items'), {
    params: { search: query }
  });
  return response.data;
};

// Ejemplo con ID en la URL
const getItemDetail = async (id: number) => {
  const response = await apiClient.get(getApiUrl(`items/${id}`));
  return response.data;
};
```

## Manejo de cambios de versión

Cuando la API introduce una nueva versión, solo necesitas actualizar `API_VERSION` en `config/api.ts`. Si se requieren cambios estructurales en las peticiones, puedes:

1. Mantener compatibilidad hacia atrás manteniendo los métodos actuales.
2. Añadir nuevos métodos con el sufijo `V2` para las nuevas características.
3. Adaptar los datos entre versiones en el cliente para minimizar cambios en componentes.

## Depuración

El cliente incluye logs detallados para solicitudes y respuestas. Estos logs están habilitados por defecto y muestran:

- URLs completas con versión
- Parámetros enviados
- Datos de respuesta
- Errores con detalles

Para deshabilitar logs en producción, configura interceptores condicionales en `client.ts`.