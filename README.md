# E-commerce de Bicicletas Personalizables

Sistema de e-commerce para Marcus que permite vender bicicletas altamente personalizables con:
- Frontend en Next.js
- Backend en FastAPI
- Base de datos PostgreSQL
- Todo dockerizado

## Descripción del proyecto

Este proyecto es una solución para la tienda de bicicletas de Marcus, permitiendo la venta online de bicicletas completamente personalizables. El sistema está diseñado con escalabilidad para permitir en el futuro la venta de otros artículos deportivos como esquís, tablas de surf, patines, etc.

### Funcionalidad clave
- Los clientes pueden personalizar completamente sus bicicletas eligiendo diferentes opciones para cada parte
- Algunas combinaciones están prohibidas por limitaciones físicas reales
- Control de inventario para marcar opciones como "temporalmente sin stock"
- Cálculo dinámico de precios basado en las opciones seleccionadas, incluyendo reglas especiales de precios para ciertas combinaciones

## Características principales
- Personalización de bicicletas con verificación de compatibilidad
- Control de inventario
- Precios dinámicos según configuraciones
- Panel de administración
- Carrito de compras

## Modelo de datos

El sistema utiliza un modelo de datos relacional optimizado para la personalización de productos:

### Entidades principales
- **Producto**: Tipos de bicicletas disponibles (y futuros productos como esquís, etc.)
- **Categoría de Parte**: Agrupaciones de partes (cuadro, ruedas, cadena, etc.)
- **Opción**: Opciones específicas para cada categoría (ej: tipos de cuadro: Full-suspension, Diamond, Step-through)
- **Regla de Compatibilidad**: Define combinaciones prohibidas entre opciones
- **Regla de Precio**: Define precios especiales para combinaciones específicas
- **Inventario**: Control de stock para cada opción
- **Carrito**: Almacena las selecciones del usuario
- **Pedido**: Registro de compras completadas

### Relaciones clave
- Producto -> Categoría de Parte (1:N)
- Categoría de Parte -> Opción (1:N)
- Opción <-> Regla de Compatibilidad (N:M)
- Opción <-> Regla de Precio (N:M)

## Arquitectura

### Backend (FastAPI)
- Rutas API REST para productos, partes, opciones y carrito
- Validación de compatibilidad de piezas
- Cálculo dinámico de precios según configuraciones
- Gestión de datos mediante SQLAlchemy

### Frontend (Next.js)
- Interfaces para explorar productos
- Configurador de bicicletas con validación en tiempo real
- Carrito de compras
- Diseño responsive con Tailwind CSS

### Base de datos (PostgreSQL)
- Almacenamiento relacional para productos, partes y dependencias
- Registro de carritos y pedidos

## Principales acciones de usuario

### 1. Explorar productos
- Navegación por catálogo de bicicletas
- Filtrado por tipo y características

### 2. Personalización de bicicleta
- Selección secuencial de opciones para cada parte
- Validación en tiempo real de compatibilidad
- Actualización dinámica de precio según selecciones
- Visualización de opciones disponibles/no disponibles

### 3. Gestión del carrito
- Añadir configuración al carrito
- Revisar y modificar elementos
- Proceso de pago

## Flujos de trabajo administrativos

### 1. Gestión de productos
- Creación de nuevos tipos de productos (bicicletas, esquís, etc.)
- Definición de las categorías de partes asociadas

### 2. Gestión de opciones
- Añadir nuevas opciones para cada categoría (ej: nuevos colores de aro)
- Configurar disponibilidad de stock

### 3. Configuración de reglas
- Definir reglas de compatibilidad entre opciones
- Establecer reglas de precios especiales para combinaciones específicas

### 4. Análisis de ventas
- Revisión de pedidos
- Estadísticas de configuraciones populares

## Casos de ejemplo incluidos

### Reglas de compatibilidad
- Si se elige "Ruedas Fat Bike" → "Aro Rojo" no está disponible
- Si se elige "Ruedas de montaña" → Solo el cuadro "Full-suspension" está disponible

### Reglas de precios especiales
- Si se elige "Mate" + "Cuadro Diamond" → 35€
- Si se elige "Mate" + "Cuadro Full-suspension" → 50€

### Control de inventario
- Si una opción está sin stock → no se puede seleccionar

## Requisitos previos
- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- Python 3.11+ (para desarrollo local)

## Instalación

1. Clonar el repositorio:
```bash
git clone [url-del-repositorio]
cd factorial-technical-test
```

2. Iniciar con Docker:
```bash
docker compose up -d
```

3. Acceder a la aplicación:
   - Frontend: http://localhost:3000
   - API Backend: http://localhost:8000
   - API Documentación: http://localhost:8000/docs

## Ejecución de tests

### Tests Backend
```bash
docker compose exec backend pytest
```

## Estructura del proyecto

```
/
├── backend/               # API FastAPI
│   ├── app/
│   │   ├── api/           # Rutas de la API
│   │   ├── models/        # Modelos de datos
│   │   ├── schemas/       # Esquemas Pydantic
│   │   ├── services/      # Lógica de negocio
│   │   └── main.py        # Punto de entrada
│   └── Dockerfile
├── frontend/              # Aplicación Next.js
│   ├── src/
│   │   ├── app/           # Páginas Next.js
│   │   ├── components/    # Componentes React
│   │   ├── api/           # Clientes de API
│   │   └── types/         # Tipos TypeScript
│   └── Dockerfile
├── docker-compose.yml     # Configuración de Docker
└── scripts/               # Scripts útiles
```


## Decisiones técnicas

### Elección de PostgreSQL
- La naturaleza relacional del modelo de datos requiere un sistema relacional robusto
- Las reglas de compatibilidad y precios especiales se implementan eficientemente mediante consultas SQL

### Separación Backend/Frontend
- Permite escalabilidad independiente
- Facilita el desarrollo paralelo del frontend y backend

### Dockerización
- Asegura consistencia entre entornos de desarrollo y producción
- Simplifica el despliegue
