# E-commerce de Bicicletas Personalizables

Sistema de e-commerce para Marcus que permite vender bicicletas altamente personalizables con:
- Frontend en Next.js
- Backend en FastAPI
- Base de datos PostgreSQL
- Todo dockerizado

## Características principales
- Personalización de bicicletas con verificación de compatibilidad
- Control de inventario
- Precios dinámicos según configuraciones
- Panel de administración
- Carrito de compras

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

2. Método 1: Iniciar con el script de configuración:
```bash
./scripts/setup.sh
```

3. Método 2: Iniciar manualmente con Docker Compose:
```bash
docker-compose up -d
```

4. Acceder a la aplicación:
   - Frontend: http://localhost:3000
   - API Backend: http://localhost:8000
   - API Documentación: http://localhost:8000/docs

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

## Desarrollo

### Desarrollo Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Desarrollo Frontend
```bash
cd frontend
npm install
npm run dev
```

## Casos de prueba incluidos

- Si se elige "Ruedas Fat Bike" → "Aro Rojo" no está disponible
- Si se elige "Mate" + "Cuadro Diamond" → 35€
- Si se elige "Mate" + "Cuadro Full-suspension" → 50€
- Si una opción está sin stock → no se puede seleccionar

## Contribución

1. Crea un fork del repositorio
2. Crea una rama para tu característica (`git checkout -b feature/nueva-caracteristica`)
3. Haz commit de tus cambios (`git commit -m 'Añadir nueva característica'`)
4. Haz push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request
