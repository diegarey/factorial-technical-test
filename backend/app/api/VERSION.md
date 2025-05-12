# Documentación de Versiones de la API

## Versión 1.0 (v1)

Fecha de lanzamiento: [Fecha actual]

### Endpoints

#### Productos
- `GET /api/v1/products/` - Listar productos
- `GET /api/v1/products/featured` - Listar productos destacados
- `GET /api/v1/products/{product_id}` - Detalle de un producto
- `GET /api/v1/products/{product_id}/options` - Opciones disponibles para un producto
- `POST /api/v1/products/validate-compatibility` - Validar compatibilidad de opciones
- `POST /api/v1/products/calculate-price` - Calcular precio de opciones seleccionadas

#### Carrito
- `GET /api/v1/cart` - Obtener o crear carrito
- `POST /api/v1/cart/items` - Añadir item al carrito
- `PUT /api/v1/cart/items/{cart_item_id}` - Actualizar cantidad de un item
- `DELETE /api/v1/cart/items/{cart_item_id}` - Eliminar item del carrito

#### Administración
- `POST /api/v1/admin/products` - Crear producto
- `POST /api/v1/admin/products/{product_id}/part-types` - Añadir tipo de parte
- `POST /api/v1/admin/part-types/{part_type_id}/options` - Añadir opción
- `POST /api/v1/admin/options/{option_id}/dependencies` - Añadir dependencia
- `POST /api/v1/admin/options/{option_id}/conditional-prices` - Añadir precio condicional
- `PUT /api/v1/admin/options/{option_id}/stock` - Actualizar stock

### Notas de Compatibilidad

La API mantiene compatibilidad hacia atrás con las aplicaciones existentes. Todas las peticiones a los endpoints sin versionar (`/api/...`) son automáticamente redirigidas a sus equivalentes en la versión 1 (`/api/v1/...`).

## Guía de Versionado

### Política de Versionado

La API sigue estas reglas para el versionado:

1. **Mayor (X.y.z)**: Cambios incompatibles con versiones anteriores
   - Eliminación de endpoints
   - Cambios estructurales en respuestas existentes
   - Cambios en comportamiento que puedan romper aplicaciones clientes

2. **Menor (x.Y.z)**: Adiciones compatibles con versiones anteriores
   - Nuevos endpoints
   - Campos opcionales adicionales en respuestas
   - Nuevas funcionalidades que no afectan el comportamiento existente

3. **Parche (x.y.Z)**: Correcciones de errores
   - Correcciones de errores que no afectan la interfaz
   - Optimizaciones internas

### Ciclo de Vida de las Versiones

Cada versión de la API tendrá un ciclo de vida establecido:

1. **Activa**: Versión actual, recibe nuevas funcionalidades y correcciones
2. **Mantenimiento**: Solo recibe correcciones de errores críticos (seguridad)
3. **Obsoleta**: Anunciada para eliminación (warning en respuestas)
4. **Retirada**: Eliminada del servicio

Las versiones obsoletas tendrán un período de gracia de al menos 6 meses antes de ser retiradas.

## Cambios Futuros Planeados

- Mejora en la validación de entradas
- Esquemas Pydantic para todas las solicitudes
- Eliminación de logs de depuración 