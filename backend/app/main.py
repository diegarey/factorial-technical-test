from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.v1 import products as products_v1
from app.api.routes.v1 import cart as cart_v1
from app.api.routes.v1 import admin as admin_v1
from app.db.database import create_tables, get_db
from app.db.init_db import create_initial_data

app = FastAPI(
    title="Marcus Bikes API",
    description="API para el e-commerce de bicicletas personalizables",
    version="1.0.0",
)

# Configurar CORS con orígenes específicos permitidos
origins = [
    "http://localhost:3000",  # Frontend en desarrollo local
    "http://127.0.0.1:3000",
    "http://frontend:3000",   # Nombre del servicio dentro de Docker
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Importante para permitir cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization", "X-Requested-With", "Origin"],
    expose_headers=["Content-Type", "Content-Length", "Set-Cookie"],  # Exponer el encabezado Set-Cookie
    max_age=86400,  # Caché preflight por 24 horas
)

# Incluir rutas versionadas v1
app.include_router(products_v1.router, prefix="/api/v1", tags=["products"])
app.include_router(cart_v1.router, prefix="/api/v1", tags=["cart"])
app.include_router(admin_v1.router, prefix="/api/v1", tags=["admin"])

@app.on_event("startup")
async def startup():
    # Crear tablas si no existen
    create_tables()
    
    # Inicializar datos de ejemplo
    db = next(get_db())
    create_initial_data(db)

@app.get("/")
async def root():
    return {"message": "Bienvenido a la API de Marcus Bikes"} 